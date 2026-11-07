import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ClientSession, Decimal128, Document, ObjectId } from 'mongodb';
import { isDateString } from 'class-validator';
import { DatabaseService } from '../../database/database.service';
import { AuthenticatedUser } from '../../common/interfaces/user-payload.interface';
import { UserRole } from '../../common/constants/roles.constants';
import { CreateIssueDto, CreateReceiptDto, MovementQueryDto } from './dto/stock-movements.dto';

type MovementKind = 'receipts' | 'issues';
const BRANCHES = ['HN', 'HCM', 'DN'];
const MANAGER_BRANCH: Record<string, string> = { MANAGER_HN: 'HN', MANAGER_HCM: 'HCM' };
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@Injectable()
export class StockMovementsService implements OnModuleInit {
  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.db.ensureConnected();
    // MongoDB 6 supports a named unique index alongside an existing non-unique index.
    await this.db
      .getCollection('goods_receipts')
      .createIndex(
        { warehouse_branch: 1, receipt_code: 1 },
        { unique: true, name: 'uq_receipt_branch_code' },
      );
    await this.db
      .getCollection('goods_issues')
      .createIndex(
        { warehouse_branch: 1, issue_code: 1 },
        { unique: true, name: 'uq_issue_branch_code' },
      );
    await this.db
      .getCollection('material_audit_logs')
      .createIndex({ log_code: 1 }, { unique: true, name: 'uq_audit_log_code' });
    await this.db
      .getCollection('inventory_stocks')
      .createIndex({ warehouse_branch: 1, material_code: 1 }, { unique: true });
  }

  private scope(user: AuthenticatedUser, requested?: string, write = false): string {
    const managerBranch = MANAGER_BRANCH[user.role];
    const canReadAll =
      user.role === UserRole.SUPER_ADMIN ||
      (!write && (user.role === UserRole.AUDITOR || user.role === UserRole.QC_INSPECTOR));
    if (!managerBranch && !canReadAll) {
      throw new ForbiddenException('Tài khoản không có quyền thực hiện nghiệp vụ nhập/xuất kho');
    }
    if (requested && ![...BRANCHES, 'ALL'].includes(requested)) {
      throw new BadRequestException('Chi nhánh không hợp lệ');
    }
    if (write && (!requested || requested === 'ALL')) {
      throw new BadRequestException('Phiếu phải thuộc một chi nhánh cụ thể');
    }
    if (managerBranch) {
      if (requested && requested !== 'ALL' && requested !== managerBranch) {
        throw new ForbiddenException('Không được truy cập chi nhánh khác');
      }
      return managerBranch;
    }
    return requested || 'ALL';
  }

  async getOptions(query: MovementQueryDto, user: AuthenticatedUser) {
    const branch = this.scope(user, query.branch);
    const [materials, warehouses] = await Promise.all([
      this.db
        .getCollection('materials')
        .find(
          { is_active: { $ne: false } },
          { projection: { _id: 0, material_code: 1, name: 1, unit: 1, standard_price: 1 } },
        )
        .sort({ material_code: 1 })
        .toArray(),
      this.db
        .getCollection('warehouses')
        .find(
          { is_active: { $ne: false }, ...(branch === 'ALL' ? {} : { branch }) },
          { projection: { _id: 0, warehouse_code: 1, name: 1, branch: 1 } },
        )
        .sort({ branch: 1, warehouse_code: 1 })
        .toArray(),
    ]);
    return { materials, warehouses };
  }

  async list(kind: MovementKind, query: MovementQueryDto, user: AuthenticatedUser) {
    const branch = this.scope(user, query.branch);
    const filter: Document = branch === 'ALL' ? {} : { warehouse_branch: branch };
    if (query.warehouse_code) filter.warehouse_code = query.warehouse_code;
    if (query.material_code) filter['items.material_code'] = query.material_code;
    if (kind === 'issues' && query.purpose)
      filter.purpose = { $regex: escapeRegex(query.purpose), $options: 'i' };
    const dateField = kind === 'receipts' ? 'receipt_date' : 'issue_date';
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    if ((from && !Number.isFinite(from.getTime())) || (to && !Number.isFinite(to.getTime()))) {
      throw new BadRequestException('Ngày lọc không hợp lệ');
    }
    if (to && query.to?.length === 10) to.setUTCDate(to.getUTCDate() + 1);
    if (from && to && (query.to?.length === 10 ? from >= to : from > to)) {
      throw new BadRequestException('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc');
    }
    if (from || to) {
      filter[dateField] = {
        ...(from ? { $gte: from } : {}),
        ...(to ? { [query.to?.length === 10 ? '$lt' : '$lte']: to } : {}),
      };
    }
    const collection = this.db.getCollection(`goods_${kind}`);
    const [items, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ [dateField]: -1, _id: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);
    return { items, total, page: query.page, limit: query.limit };
  }

  async detail(kind: MovementKind, branch: string, code: string, user: AuthenticatedUser) {
    this.scope(user, branch);
    const field = kind === 'receipts' ? 'receipt_code' : 'issue_code';
    const result = await this.db
      .getCollection(`goods_${kind}`)
      .findOne({ warehouse_branch: branch, [field]: code });
    if (!result) throw new NotFoundException('Không tìm thấy phiếu');
    return result;
  }

  private async warehouse(branch: string, code: string, session: ClientSession) {
    const warehouse = await this.db
      .getCollection('warehouses')
      .findOne({ warehouse_code: code, branch, is_active: { $ne: false } }, { session });
    if (!warehouse)
      throw new BadRequestException(
        'Kho không tồn tại, đã ngừng hoạt động hoặc không thuộc chi nhánh đã chọn',
      );
  }

  private async material(code: string, session: ClientSession) {
    const material = await this.db
      .getCollection('materials')
      .findOne({ material_code: code, is_active: { $ne: false } }, { session });
    if (!material)
      throw new BadRequestException(`Vật tư ${code} không tồn tại hoặc đã ngừng hoạt động`);
    return material;
  }

  private positiveQuantity(quantity: number) {
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > Number.MAX_SAFE_INTEGER) {
      throw new BadRequestException('Số lượng phải là số dương trong phạm vi an toàn');
    }
  }

  private movementDate(value: string): Date {
    const date = new Date(value);
    if (!isDateString(value, { strict: true }) || !Number.isFinite(date.getTime())) {
      throw new BadRequestException(
        'Ngày lập phiếu phải là ngày ISO hợp lệ và có thể phân tích được',
      );
    }
    return date;
  }

  private quantityAfter(field: '$quantity' | '$available_quantity', change: number): Document {
    // Convert through the shortest decimal string to preserve the stored double's precision.
    // Decimal arithmetic stays inside the atomic update; storage remains compatible with A4.
    return {
      $toDouble: {
        $add: [
          { $toDecimal: { $toString: { $ifNull: [field, 0] } } },
          Decimal128.fromString(change.toString()),
        ],
      },
    };
  }

  private async audit(
    kind: MovementKind,
    document: Document,
    user: AuthenticatedUser,
    session: ClientSession,
  ) {
    const code = kind === 'receipts' ? document.receipt_code : document.issue_code;
    await this.db.getCollection('material_audit_logs').insertOne(
      {
        log_code: `AUD-${randomUUID()}`,
        action: kind === 'receipts' ? 'RECEIVE' : 'ISSUE',
        actor: user.email,
        collection_name: `goods_${kind}`,
        document_id: code,
        warehouse_branch: document.warehouse_branch,
        details: {
          warehouse_branch: document.warehouse_branch,
          warehouse_code: document.warehouse_code,
          items: document.items,
        },
        timestamp: new Date(),
      },
      { session },
    );
  }

  private async transact<T>(operation: (session: ClientSession) => Promise<T>): Promise<T> {
    try {
      return await this.db.withTransaction(operation);
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
        throw new ConflictException(
          'Mã phiếu đã tồn tại trong chi nhánh hoặc vật tư đã có tồn ở kho khác. Hãy kiểm tra lại phiếu và kho trước khi gửi lại.',
        );
      }
      throw error;
    }
  }

  private lineAmountCents(quantity: number, unitPrice: number): number {
    const priceCents = Math.round(unitPrice * 100);
    if (!Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isSafeInteger(priceCents)) {
      throw new BadRequestException('Đơn giá vượt phạm vi hợp lệ');
    }
    // Round decimal quantities in integer cents, avoiding cases such as 1.005 -> 1.00.
    const [coefficient, exponent = '0'] = quantity.toString().split('e');
    const decimals = coefficient.split('.')[1]?.length || 0;
    const shift = Number(exponent) - decimals;
    const product = BigInt(coefficient.replace('.', '')) * BigInt(priceCents);
    const divisor = 10n ** BigInt(Math.max(0, -shift));
    const cents = shift >= 0 ? product * 10n ** BigInt(shift) : (product + divisor / 2n) / divisor;
    if (cents > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new BadRequestException('Thành tiền vượt phạm vi hợp lệ');
    }
    return Number(cents);
  }

  async createReceipt(dto: CreateReceiptDto, user: AuthenticatedUser) {
    this.scope(user, dto.warehouse_branch, true);
    const receiptDate = this.movementDate(dto.receipt_date);
    if (new Set(dto.items.map((item) => item.material_code)).size !== dto.items.length) {
      throw new BadRequestException('Mỗi vật tư chỉ được xuất hiện một lần trong phiếu nhập');
    }
    let totalCents = 0;
    const items = dto.items.map((item) => {
      this.positiveQuantity(item.quantity);
      const cents = this.lineAmountCents(item.quantity, item.unit_price);
      totalCents += cents;
      return { ...item, amount: cents / 100 };
    });
    if (!Number.isSafeInteger(totalCents))
      throw new BadRequestException('Tổng tiền vượt phạm vi hợp lệ');
    return this.transact(async (session) => {
      await this.warehouse(dto.warehouse_branch, dto.warehouse_code, session);
      if (
        dto.supplier_id &&
        !(await this.db
          .getCollection('suppliers')
          .findOne({ _id: new ObjectId(dto.supplier_id) }, { session }))
      ) {
        throw new BadRequestException('Nhà cung cấp không tồn tại');
      }
      const materials: Document[] = [];
      for (const item of items) materials.push(await this.material(item.material_code, session));
      const document: Document = {
        receipt_code: dto.receipt_code,
        warehouse_branch: dto.warehouse_branch,
        warehouse_code: dto.warehouse_code,
        receipt_date: receiptDate,
        supplier_id: dto.supplier_id ? new ObjectId(dto.supplier_id) : null,
        items,
        total_amount: totalCents / 100,
        receiver: user.email,
        status: 'COMPLETED',
      };
      await this.db.getCollection('goods_receipts').insertOne(document, { session });
      for (const [index, item] of items.entries()) {
        const key = { warehouse_branch: dto.warehouse_branch, material_code: item.material_code };
        const stock = await this.db.getCollection('inventory_stocks').findOne(key, { session });
        if (stock && stock.warehouse_code !== dto.warehouse_code) {
          throw new ConflictException(
            `Vật tư ${item.material_code} đã có tồn tại kho ${stock.warehouse_code}. Phiên bản hiện tại chưa hỗ trợ cùng vật tư ở hai kho trong một chi nhánh.`,
          );
        }
        if (
          stock &&
          [stock.quantity, stock.available_quantity].some(
            (value) =>
              typeof value !== 'number' ||
              !Number.isFinite(value) ||
              value < 0 ||
              value + item.quantity === value ||
              value + item.quantity > Number.MAX_SAFE_INTEGER,
          )
        ) {
          throw new BadRequestException(
            `Tồn của ${item.material_code} thiếu/sai số lượng hoặc vượt phạm vi an toàn; cần đối soát trước khi nhập`,
          );
        }
        if (stock && stock.available_quantity > stock.quantity) {
          throw new BadRequestException(
            `Tồn khả dụng của ${item.material_code} vượt tổng tồn; cần đối soát trước khi nhập`,
          );
        }
        await this.db.getCollection('inventory_stocks').updateOne(
          { ...key, warehouse_code: dto.warehouse_code },
          [
            {
              $set: {
                quantity: this.quantityAfter('$quantity', item.quantity),
                available_quantity: this.quantityAfter('$available_quantity', item.quantity),
                last_updated: new Date(),
                ...(stock
                  ? {}
                  : {
                      min_threshold: 0,
                      allocated_quantity: 0,
                      unit: { $literal: materials[index].unit },
                    }),
              },
            },
          ],
          { upsert: true, session },
        );
      }
      await this.audit('receipts', document, user, session);
      return document;
    });
  }

  async createIssue(dto: CreateIssueDto, user: AuthenticatedUser) {
    this.scope(user, dto.warehouse_branch, true);
    this.positiveQuantity(dto.quantity);
    const issueDate = this.movementDate(dto.issue_date);
    const quantityAfter = this.quantityAfter('$quantity', -dto.quantity);
    const availableAfter = this.quantityAfter('$available_quantity', -dto.quantity);
    return this.transact(async (session) => {
      await this.warehouse(dto.warehouse_branch, dto.warehouse_code, session);
      await this.material(dto.material_code, session);
      const document: Document = {
        issue_code: dto.issue_code,
        warehouse_branch: dto.warehouse_branch,
        warehouse_code: dto.warehouse_code,
        issue_date: issueDate,
        items: [{ material_code: dto.material_code, quantity: dto.quantity }],
        purpose: dto.purpose,
        issuer: user.email,
        status: 'DELIVERED',
      };
      await this.db.getCollection('goods_issues').insertOne(document, { session });
      const result = await this.db.getCollection('inventory_stocks').updateOne(
        {
          warehouse_branch: dto.warehouse_branch,
          warehouse_code: dto.warehouse_code,
          material_code: dto.material_code,
          quantity: { $gte: dto.quantity, $lte: Number.MAX_SAFE_INTEGER },
          available_quantity: { $gte: dto.quantity, $lte: Number.MAX_SAFE_INTEGER },
          $expr: {
            $and: [
              { $lte: ['$available_quantity', '$quantity'] },
              { $lt: [quantityAfter, '$quantity'] },
              { $lt: [availableAfter, '$available_quantity'] },
            ],
          },
        },
        [
          {
            $set: {
              quantity: quantityAfter,
              available_quantity: availableAfter,
              last_updated: new Date(),
            },
          },
        ],
        { session },
      );
      if (result.modifiedCount !== 1) {
        throw new BadRequestException(
          'Không đủ tồn khả dụng, tồn chưa hợp lệ hoặc vật tư không có tại kho đã chọn',
        );
      }
      await this.audit('issues', document, user, session);
      return document;
    });
  }
}
