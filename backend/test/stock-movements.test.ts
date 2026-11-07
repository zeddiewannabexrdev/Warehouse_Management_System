import 'reflect-metadata';
import * as assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { randomBytes } from 'node:crypto';
import {
  GoodsIssuesController,
  GoodsReceiptsController,
} from '../src/modules/stock-movements/stock-movements.controller';
import { JwtStrategy } from '../src/modules/auth/jwt.strategy';
import { UsersService } from '../src/modules/users/users.service';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { ConfigService } from '@nestjs/config';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { Document } from 'mongodb';
import { DatabaseService } from '../src/database/database.service';
import { StockMovementsService } from '../src/modules/stock-movements/stock-movements.service';
import {
  CreateIssueDto,
  CreateReceiptDto,
  MovementBranchDto,
  MovementQueryDto,
} from '../src/modules/stock-movements/dto/stock-movements.dto';
import { AuthenticatedUser } from '../src/common/interfaces/user-payload.interface';

const manager: AuthenticatedUser = {
  id: 'test',
  email: 'manager@example.test',
  role: 'MANAGER_HN',
  branch: 'HN',
  fullName: 'Test manager',
};
const auditor = { ...manager, role: 'AUDITOR', branch: 'ALL' };
const admin = { ...manager, role: 'SUPER_ADMIN', branch: 'ALL' };
const receipt = (overrides: Partial<CreateReceiptDto> = {}): CreateReceiptDto => ({
  receipt_code: 'GR-TEST-001',
  warehouse_branch: 'HN',
  warehouse_code: 'WH-HN-01',
  receipt_date: '2026-11-07T09:00:00.000Z',
  items: [{ material_code: 'STEEL', quantity: 10, unit_price: 123.45 }],
  ...overrides,
});
const issue = (overrides: Partial<CreateIssueDto> = {}): CreateIssueDto => ({
  issue_code: 'GI-TEST-001',
  warehouse_branch: 'HN',
  warehouse_code: 'WH-HN-01',
  issue_date: '2026-11-07T10:00:00.000Z',
  material_code: 'STEEL',
  quantity: 5,
  purpose: 'Công trình A',
  ...overrides,
});
const names = [
  'materials',
  'warehouses',
  'suppliers',
  'inventory_stocks',
  'goods_receipts',
  'goods_issues',
  'material_audit_logs',
];
let repl: MongoMemoryReplSet;
let db: DatabaseService;
let service: StockMovementsService;
let auditValidator: Document;
let app: INestApplication;
let baseUrl: string;
let jwt: JwtService;
const stock = (branch = 'HN') =>
  db
    .getCollection('inventory_stocks')
    .findOne({ warehouse_branch: branch, material_code: 'STEEL' });

before(
  async () => {
    repl = await MongoMemoryReplSet.create({
      binary: { version: '6.0.18' },
      replSet: { count: 1, storageEngine: 'wiredTiger' },
    });
    db = new DatabaseService(
      new ConfigService({ mongodb: { uri: repl.getUri(), databaseName: 'a56_test' } }),
    );
    await db.ensureConnected();
    const schemas: { name: string; options: Document }[] = [];
    const indexes: { name: string; keys: Document; options: Document }[] = [];
    const fakeDb = new Proxy(
      {
        getCollectionNames: () => [],
        createCollection: (name: string, options: Document) => schemas.push({ name, options }),
      } as Record<string, unknown>,
      {
        get(target, property: string) {
          return (
            target[property] || {
              createIndex: (keys: Document, options = {}) =>
                indexes.push({ name: property, keys, options }),
            }
          );
        },
      },
    );
    runInNewContext(
      readFileSync(resolve(__dirname, '../../scripts/01_init_schema_and_indexes.js'), 'utf8'),
      {
        db: { getSiblingDB: () => fakeDb },
        print: () => {},
      },
    );
    for (const schema of schemas.filter((entry) => names.includes(entry.name))) {
      await db.getDb().createCollection(schema.name, schema.options);
      if (schema.name === 'material_audit_logs') auditValidator = schema.options.validator;
    }
    for (const index of indexes.filter((entry) => names.includes(entry.name))) {
      await db.getCollection(index.name).createIndex(index.keys, index.options);
    }
    const secret = randomBytes(32).toString('hex');
    app = await NestFactory.create(
      {
        module: class MovementTestModule {},
        imports: [
          PassportModule.register({ defaultStrategy: 'jwt' }),
          JwtModule.register({ secret }),
        ],
        controllers: [GoodsReceiptsController, GoodsIssuesController],
        providers: [
          StockMovementsService,
          JwtStrategy,
          { provide: DatabaseService, useValue: db },
          { provide: ConfigService, useValue: new ConfigService({ jwt: { secret } }) },
          {
            provide: UsersService,
            useValue: {
              findById: async (id: string) => {
                const user = id === 'auditor' ? auditor : id === 'manager' ? manager : null;
                return user ? { ...user, _id: id, isActive: true } : null;
              },
            },
          },
        ],
      },
      { logger: false },
    );
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.listen(0, '127.0.0.1');
    baseUrl = `${await app.getUrl()}/api/v1`;
    service = app.get(StockMovementsService);
    jwt = app.get(JwtService);
  },
  { timeout: 240000 },
);

after(async () => {
  if (app) await app.close();
  if (db) await db.disconnect();
  if (repl) await repl.stop();
});

beforeEach(async () => {
  await db.getDb().command({ collMod: 'material_audit_logs', validator: auditValidator });
  for (const name of names) await db.getCollection(name).deleteMany({});
  await db.getCollection('materials').insertMany([
    {
      material_code: 'STEEL',
      name: 'Thép',
      category_code: 'CAT',
      unit: 'Tấn',
      specifications: {},
      standard_price: 100,
    },
    {
      material_code: 'CEMENT',
      name: 'Xi măng',
      category_code: 'CAT',
      unit: 'Bao',
      specifications: {},
      standard_price: 20,
    },
    {
      material_code: 'OLD',
      name: 'Ngừng sử dụng',
      category_code: 'CAT',
      unit: 'Bao',
      specifications: {},
      is_active: false,
    },
  ]);
  await db.getCollection('warehouses').insertMany([
    { warehouse_code: 'WH-HN-01', name: 'HN1', branch: 'HN', address: 'HN', manager: 'M' },
    { warehouse_code: 'WH-HN-02', name: 'HN2', branch: 'HN', address: 'HN', manager: 'M' },
    { warehouse_code: 'WH-HCM-01', name: 'HCM', branch: 'HCM', address: 'HCM', manager: 'M' },
  ]);
  await db.getCollection('inventory_stocks').insertMany([
    {
      warehouse_branch: 'HN',
      warehouse_code: 'WH-HN-01',
      material_code: 'STEEL',
      quantity: 100,
      available_quantity: 60,
      allocated_quantity: 40,
      min_threshold: 10,
      unit: 'Tấn',
    },
    {
      warehouse_branch: 'HCM',
      warehouse_code: 'WH-HCM-01',
      material_code: 'STEEL',
      quantity: 50,
      available_quantity: 50,
      allocated_quantity: 0,
      min_threshold: 10,
      unit: 'Tấn',
    },
  ]);
});

test('receipt updates both quantities, calculates amounts and records RECEIVE audit', async () => {
  const result = await service.createReceipt(
    receipt({
      items: [
        { material_code: 'STEEL', quantity: 10, unit_price: 123.45 },
        { material_code: 'CEMENT', quantity: 3, unit_price: 20 },
      ],
    }),
    manager,
  );
  assert.equal(result.total_amount, 1294.5);
  assert.equal(result.items[0].amount, 1234.5);
  assert.equal(result.status, 'COMPLETED');
  const updated = await stock();
  assert.equal(updated?.quantity, 110);
  assert.equal(updated?.available_quantity, 70);
  assert.equal(updated?.allocated_quantity, 40);
  assert.equal((await stock('HCM'))?.quantity, 50);
  const newStock = await db.getCollection('inventory_stocks').findOne({ material_code: 'CEMENT' });
  assert.equal(newStock?.quantity, 3);
  assert.equal(newStock?.available_quantity, 3);
  assert.equal(newStock?.min_threshold, 0);
  assert.equal(newStock?.allocated_quantity, 0);
  assert.equal(newStock?.unit, 'Bao');
  const audit = await db
    .getCollection('material_audit_logs')
    .findOne({ document_id: result.receipt_code });
  assert.equal(audit?.action, 'RECEIVE');
  assert.equal(audit?.actor, manager.email);
  assert.equal(audit?.details.warehouse_code, 'WH-HN-01');
});

test('receipt rounds decimal quantity amounts correctly and accepts zero unit price', async () => {
  const result = await service.createReceipt(
    receipt({
      items: [
        { material_code: 'STEEL', quantity: 1.005, unit_price: 1 },
        { material_code: 'CEMENT', quantity: 3, unit_price: 0 },
      ],
    }),
    manager,
  );
  assert.equal(result.items[0].amount, 1.01);
  assert.equal(result.items[1].amount, 0);
  assert.equal(result.total_amount, 1.01);
});

test('decimal quantities can be fully issued after partial issues', async () => {
  await service.createReceipt(
    receipt({ items: [{ material_code: 'CEMENT', quantity: 0.3, unit_price: 1 }] }),
    manager,
  );
  await service.createIssue(
    issue({ issue_code: 'GI-DEC-1', material_code: 'CEMENT', quantity: 0.1 }),
    manager,
  );
  const partial = await db.getCollection('inventory_stocks').findOne({ material_code: 'CEMENT' });
  assert.equal(partial?.quantity, 0.2);
  assert.equal(partial?.available_quantity, 0.2);
  await service.createIssue(
    issue({ issue_code: 'GI-DEC-2', material_code: 'CEMENT', quantity: 0.2 }),
    manager,
  );
  const empty = await db.getCollection('inventory_stocks').findOne({ material_code: 'CEMENT' });
  assert.equal(empty?.quantity, 0);
  assert.equal(empty?.available_quantity, 0);
  assert.equal(await db.getCollection('goods_issues').countDocuments(), 2);
  assert.equal(await db.getCollection('material_audit_logs').countDocuments(), 3);
});

test('decimal receipt additions do not leave phantom stock after a full issue', async () => {
  await service.createReceipt(
    receipt({
      receipt_code: 'GR-DEC-1',
      items: [{ material_code: 'CEMENT', quantity: 0.1, unit_price: 1 }],
    }),
    manager,
  );
  await service.createReceipt(
    receipt({
      receipt_code: 'GR-DEC-2',
      items: [{ material_code: 'CEMENT', quantity: 0.2, unit_price: 1 }],
    }),
    manager,
  );
  const received = await db.getCollection('inventory_stocks').findOne({ material_code: 'CEMENT' });
  assert.equal(received?.quantity, 0.3);
  assert.equal(received?.available_quantity, 0.3);
  await service.createIssue(issue({ material_code: 'CEMENT', quantity: 0.3 }), manager);
  const empty = await db.getCollection('inventory_stocks').findOne({ material_code: 'CEMENT' });
  assert.equal(empty?.quantity, 0);
  assert.equal(empty?.available_quantity, 0);
});

test('concurrent decimal issues consume the exact available quantity without touching allocations', async () => {
  await db
    .getCollection('inventory_stocks')
    .updateOne(
      { warehouse_branch: 'HN', material_code: 'STEEL' },
      { $set: { quantity: 0.6, available_quantity: 0.3, allocated_quantity: 0.3 } },
    );
  await Promise.all([
    service.createIssue(issue({ issue_code: 'GI-DEC-A', quantity: 0.1 }), manager),
    service.createIssue(issue({ issue_code: 'GI-DEC-B', quantity: 0.2 }), manager),
  ]);
  assert.equal((await stock())?.quantity, 0.3);
  assert.equal((await stock())?.available_quantity, 0);
  assert.equal((await stock())?.allocated_quantity, 0.3);
  assert.equal(await db.getCollection('goods_issues').countDocuments(), 2);
  assert.equal(await db.getCollection('material_audit_logs').countDocuments(), 2);
});

test('decimal conversion preserves safe integers and rejects a genuine fractional shortage', async () => {
  const initial = Number.MAX_SAFE_INTEGER - 1;
  await db
    .getCollection('inventory_stocks')
    .updateOne(
      { warehouse_branch: 'HN', material_code: 'STEEL' },
      { $set: { quantity: initial, available_quantity: initial, allocated_quantity: 0 } },
    );
  await service.createReceipt(
    receipt({ items: [{ material_code: 'STEEL', quantity: 1, unit_price: 0 }] }),
    manager,
  );
  assert.equal((await stock())?.quantity, Number.MAX_SAFE_INTEGER);
  await service.createIssue(issue({ quantity: 1 }), manager);
  assert.equal((await stock())?.quantity, initial);
  assert.equal((await stock())?.available_quantity, initial);

  await service.createReceipt(
    receipt({
      receipt_code: 'GR-SHORT',
      items: [{ material_code: 'CEMENT', quantity: 0.29999999999999993, unit_price: 0 }],
    }),
    manager,
  );
  await assert.rejects(
    service.createIssue(
      issue({ issue_code: 'GI-SHORT', material_code: 'CEMENT', quantity: 0.3 }),
      manager,
    ),
    BadRequestException,
  );
  assert.equal(
    await db.getCollection('goods_issues').countDocuments({ issue_code: 'GI-SHORT' }),
    0,
  );
  assert.equal(
    await db.getCollection('material_audit_logs').countDocuments({ document_id: 'GI-SHORT' }),
    0,
  );
});

test('concurrent receipts with different codes add to a newly created stock exactly once each', async () => {
  const items = [{ material_code: 'CEMENT', quantity: 3, unit_price: 20 }];
  await Promise.all([
    service.createReceipt(receipt({ receipt_code: 'GR-A', items }), manager),
    service.createReceipt(receipt({ receipt_code: 'GR-B', items }), manager),
  ]);
  const cement = await db.getCollection('inventory_stocks').findOne({ material_code: 'CEMENT' });
  assert.equal(cement?.quantity, 6);
  assert.equal(cement?.available_quantity, 6);
  assert.equal(await db.getCollection('goods_receipts').countDocuments(), 2);
});

test('a duplicate receipt is rejected without a second stock change', async () => {
  await service.createReceipt(receipt(), manager);
  await assert.rejects(service.createReceipt(receipt(), manager), ConflictException);
  assert.equal((await stock())?.quantity, 110);
  assert.equal(await db.getCollection('goods_receipts').countDocuments(), 1);
  assert.equal(await db.getCollection('material_audit_logs').countDocuments(), 1);
});

test('concurrent duplicate receipts apply once', async () => {
  const results = await Promise.allSettled([
    service.createReceipt(receipt(), manager),
    service.createReceipt(receipt(), manager),
  ]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal((await stock())?.quantity, 110);
  assert.equal(await db.getCollection('material_audit_logs').countDocuments(), 1);
});

test('receipt codes may repeat in another branch but never within the same branch', async () => {
  await service.createReceipt(receipt(), manager);
  await service.createReceipt(
    receipt({ warehouse_branch: 'HCM', warehouse_code: 'WH-HCM-01' }),
    admin,
  );
  assert.equal(await db.getCollection('goods_receipts').countDocuments(), 2);
});

test('receipt rejects nonexistent material, duplicate lines and wrong warehouse without writes', async () => {
  await assert.rejects(
    service.createReceipt(
      receipt({
        items: [receipt().items[0], { material_code: 'UNKNOWN', quantity: 1, unit_price: 1 }],
      }),
      manager,
    ),
    BadRequestException,
  );
  await assert.rejects(
    service.createReceipt(receipt({ items: [receipt().items[0], receipt().items[0]] }), manager),
    BadRequestException,
  );
  await assert.rejects(
    service.createReceipt(receipt({ warehouse_code: 'WH-HCM-01' }), manager),
    BadRequestException,
  );
  await assert.rejects(
    service.createReceipt(
      receipt({ items: [{ material_code: 'OLD', quantity: 1, unit_price: 1 }] }),
      manager,
    ),
    BadRequestException,
  );
  assert.equal((await stock())?.quantity, 100);
  assert.equal(await db.getCollection('goods_receipts').countDocuments(), 0);
  assert.equal(await db.getCollection('material_audit_logs').countDocuments(), 0);
});

test('receipt preserves A4 compatibility and rolls back earlier lines on another-warehouse conflict', async () => {
  await assert.rejects(
    service.createReceipt(
      receipt({
        warehouse_code: 'WH-HN-02',
        items: [{ material_code: 'CEMENT', quantity: 3, unit_price: 20 }, receipt().items[0]],
      }),
      manager,
    ),
    ConflictException,
  );
  assert.equal(
    await db.getCollection('inventory_stocks').countDocuments({ material_code: 'CEMENT' }),
    0,
  );
  assert.equal((await stock())?.quantity, 100);
  assert.equal(await db.getCollection('goods_receipts').countDocuments(), 0);
});

test('issue atomically reduces both quantities and records a schema-valid document', async () => {
  const result = await service.createIssue(issue(), manager);
  assert.equal(result.status, 'DELIVERED');
  assert.ok(result.issue_date instanceof Date);
  assert.deepEqual(result.items, [{ material_code: 'STEEL', quantity: 5 }]);
  assert.equal((await stock())?.quantity, 95);
  assert.equal((await stock())?.available_quantity, 55);
  assert.equal((await stock())?.allocated_quantity, 40);
  assert.equal((await stock('HCM'))?.quantity, 50);
  assert.equal(
    (await db.getCollection('material_audit_logs').findOne({ document_id: result.issue_code }))
      ?.action,
    'ISSUE',
  );
});

test('quantities below stored-number precision cannot produce a movement without a stock change', async () => {
  await assert.rejects(
    service.createReceipt(
      receipt({ items: [{ material_code: 'STEEL', quantity: 1e-100, unit_price: 1 }] }),
      manager,
    ),
    BadRequestException,
  );
  await assert.rejects(
    service.createIssue(issue({ quantity: 1e-100 }), manager),
    BadRequestException,
  );
  assert.equal((await stock())?.quantity, 100);
  assert.equal(await db.getCollection('goods_receipts').countDocuments(), 0);
  assert.equal(await db.getCollection('goods_issues').countDocuments(), 0);
  assert.equal(await db.getCollection('material_audit_logs').countDocuments(), 0);
});

test('overdraw and wrong-warehouse issues leave stock, documents and audit unchanged', async () => {
  await assert.rejects(
    service.createIssue(issue({ quantity: 9999 }), manager),
    BadRequestException,
  );
  await assert.rejects(
    service.createIssue(issue({ warehouse_code: 'WH-HN-02' }), manager),
    BadRequestException,
  );
  assert.equal((await stock())?.quantity, 100);
  assert.equal(await db.getCollection('goods_issues').countDocuments(), 0);
  assert.equal(await db.getCollection('material_audit_logs').countDocuments(), 0);
});

test('concurrent issues cannot overdraw available stock', async () => {
  const results = await Promise.allSettled([
    service.createIssue(issue({ issue_code: 'GI-A', quantity: 40 }), manager),
    service.createIssue(issue({ issue_code: 'GI-B', quantity: 40 }), manager),
  ]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal((await stock())?.quantity, 60);
  assert.equal((await stock())?.available_quantity, 20);
  assert.equal(await db.getCollection('goods_issues').countDocuments(), 1);
  assert.equal(await db.getCollection('material_audit_logs').countDocuments(), 1);
});

test('duplicate issue cannot subtract stock twice', async () => {
  await service.createIssue(issue(), manager);
  await assert.rejects(service.createIssue(issue(), manager), ConflictException);
  assert.equal((await stock())?.available_quantity, 55);
  assert.equal(await db.getCollection('material_audit_logs').countDocuments(), 1);
});

for (const kind of ['receipt', 'issue'] as const) {
  test(`${kind} rolls back stock and document after a real audit write failure`, async () => {
    await db.getDb().command({
      collMod: 'material_audit_logs',
      validator: { action: 'IMPOSSIBLE' },
      validationLevel: 'strict',
    });
    const operation =
      kind === 'receipt'
        ? service.createReceipt(receipt(), manager)
        : service.createIssue(issue(), manager);
    await assert.rejects(operation, (error: { code?: number }) => error.code === 121);
    assert.equal((await stock())?.quantity, 100);
    assert.equal((await stock())?.available_quantity, 60);
    assert.equal(
      await db
        .getCollection(`goods_${kind === 'receipt' ? 'receipts' : 'issues'}`)
        .countDocuments(),
      0,
    );
    assert.equal(await db.getCollection('material_audit_logs').countDocuments(), 0);
  });
}

test('manager scope and auditor read-only permissions apply to creation, options, list and detail', async () => {
  await assert.rejects(
    service.createReceipt(
      receipt({ warehouse_branch: 'HCM', warehouse_code: 'WH-HCM-01' }),
      manager,
    ),
    ForbiddenException,
  );
  await assert.rejects(service.createIssue(issue(), auditor), ForbiddenException);
  await assert.rejects(service.createReceipt(receipt(), auditor), ForbiddenException);
  await assert.rejects(
    service.list('issues', Object.assign(new MovementQueryDto(), { branch: 'HCM' }), manager),
    ForbiddenException,
  );
  await assert.rejects(service.detail('issues', 'HCM', 'GI-OTHER', manager), ForbiddenException);
  const options = await service.getOptions(new MovementQueryDto(), manager);
  assert.ok(options.warehouses.every((warehouse) => warehouse.branch === 'HN'));
  assert.ok(options.materials.every((material) => material.material_code !== 'OLD'));
  await assert.rejects(
    service.getOptions(new MovementQueryDto(), { ...manager, role: 'QC_INSPECTOR' }),
    ForbiddenException,
  );
});

test('list filters, pagination, inclusive end date and scoped details', async () => {
  await service.createIssue(
    issue({ issue_code: 'GI-1', issue_date: '2026-11-07T23:59:59.000Z', purpose: 'Dự án (A)' }),
    manager,
  );
  await service.createIssue(
    issue({ issue_code: 'GI-2', issue_date: '2026-11-08T00:00:00.000Z' }),
    manager,
  );
  const result = await service.list(
    'issues',
    Object.assign(new MovementQueryDto(), {
      branch: 'HN',
      from: '2026-11-07',
      to: '2026-11-07',
      material_code: 'STEEL',
      purpose: '(A)',
      limit: 1,
    }),
    auditor,
  );
  assert.equal(result.total, 1);
  assert.equal(result.items[0].issue_code, 'GI-1');
  const page2 = await service.list(
    'issues',
    Object.assign(new MovementQueryDto(), { limit: 1, page: 2 }),
    manager,
  );
  assert.equal(page2.total, 2);
  assert.equal(page2.items[0].issue_code, 'GI-1');
  assert.equal((await service.detail('issues', 'HN', 'GI-1', auditor)).items[0].quantity, 5);
  await assert.rejects(
    service.list(
      'issues',
      Object.assign(new MovementQueryDto(), { from: '2026-11-08', to: '2026-11-07' }),
      auditor,
    ),
    BadRequestException,
  );
});

test('reconciliation: opening plus receipts minus issues equals closing stock', async () => {
  await service.createReceipt(receipt(), manager);
  await service.createIssue(issue({ quantity: 7 }), manager);
  assert.equal((await stock())?.quantity, 100 + 10 - 7);
  assert.equal((await stock())?.available_quantity, 60 + 10 - 7);
});

test('HTTP routes enforce JWT/RBAC and return receipt/issue details through the production envelope', async () => {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${jwt.sign({ sub: 'manager' })}`,
  };
  assert.equal((await fetch(`${baseUrl}/goods-receipts`)).status, 401);
  const created = await fetch(`${baseUrl}/goods-receipts`, {
    method: 'POST',
    headers,
    body: JSON.stringify(receipt()),
  });
  assert.equal(created.status, 201);
  assert.equal(((await created.json()) as { data: Document }).data.total_amount, 1234.5);
  const detail = await fetch(`${baseUrl}/goods-receipts/HN/GR-TEST-001`, { headers });
  assert.equal(detail.status, 200);
  assert.equal(((await detail.json()) as { data: Document }).data.receipt_code, 'GR-TEST-001');
  const list = await fetch(`${baseUrl}/goods-receipts?branch=ALL&page=1&limit=20`, { headers });
  assert.equal(((await list.json()) as { data: Document }).data.total, 1);
  const options = await fetch(`${baseUrl}/goods-issues/options?branch=HN`, { headers });
  assert.equal(options.status, 200);
  const issued = await fetch(`${baseUrl}/goods-issues`, {
    method: 'POST',
    headers,
    body: JSON.stringify(issue()),
  });
  assert.equal(issued.status, 201);
  assert.equal((await fetch(`${baseUrl}/goods-issues/HN/GI-TEST-001`, { headers })).status, 200);
  assert.equal((await fetch(`${baseUrl}/goods-issues/HCM/GI-TEST-001`, { headers })).status, 403);
  assert.equal(
    (
      await fetch(`${baseUrl}/goods-issues`, {
        method: 'POST',
        headers: { ...headers, Authorization: `Bearer ${jwt.sign({ sub: 'auditor' })}` },
        body: JSON.stringify(issue()),
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(`${baseUrl}/goods-receipts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...receipt(), total_amount: 0 }),
      })
    ).status,
    400,
  );
});

test('unparseable dates are rejected by both APIs without stock, document or audit writes', async () => {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${jwt.sign({ sub: 'manager' })}`,
  };
  for (const date of ['20261107', '2026-W45-6', '2026-311', 'not-a-date', '2026-02-30']) {
    for (const kind of ['receipts', 'issues']) {
      const body =
        kind === 'receipts' ? receipt({ receipt_date: date }) : issue({ issue_date: date });
      const response = await fetch(`${baseUrl}/goods-${kind}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      assert.equal(response.status, 400, `${kind} must reject ${date}`);
    }
  }
  assert.equal((await stock())?.quantity, 100);
  assert.equal((await stock())?.available_quantity, 60);
  assert.equal(await db.getCollection('goods_receipts').countDocuments(), 0);
  assert.equal(await db.getCollection('goods_issues').countDocuments(), 0);
  assert.equal(await db.getCollection('material_audit_logs').countDocuments(), 0);
});

test('valid date-only and timezone-offset dates retain their exact instants through both APIs', async () => {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${jwt.sign({ sub: 'manager' })}`,
  };
  for (const kind of ['receipts', 'issues']) {
    for (const [index, date] of ['2024-02-29', '2026-11-07T07:30:00+07:00'].entries()) {
      const code = `DATE-VALID-${index}`;
      const body =
        kind === 'receipts'
          ? receipt({ receipt_code: code, receipt_date: date })
          : issue({ issue_code: code, issue_date: date });
      const response = await fetch(`${baseUrl}/goods-${kind}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      assert.equal(response.status, 201);
      const field = kind === 'receipts' ? 'receipt_date' : 'issue_date';
      const expected = new Date(date).toISOString();
      assert.equal(((await response.json()) as { data: Document }).data[field], expected);
      const stored = await db
        .getCollection(`goods_${kind}`)
        .findOne({ [kind === 'receipts' ? 'receipt_code' : 'issue_code']: code });
      assert.equal(stored?.[field].toISOString(), expected);
    }
  }
});

test('unparseable dates are rejected before either service opens a transaction', async () => {
  const noDatabaseCalls = new Proxy({} as DatabaseService, {
    get() {
      throw new Error('Date validation must precede database access');
    },
  });
  const movements = new StockMovementsService(noDatabaseCalls);
  for (const date of ['20261107', '2026-W45-6', 'not-a-date', '2026-02-30']) {
    await assert.rejects(
      movements.createReceipt(receipt({ receipt_date: date }), manager),
      BadRequestException,
    );
    await assert.rejects(
      movements.createIssue(issue({ issue_date: date }), manager),
      BadRequestException,
    );
  }
});

test('Swagger describes receipt and issue request fields', () => {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().setTitle('A5/A6').build(),
  );
  const schemas = document.components?.schemas as Record<
    string,
    { properties?: Record<string, unknown> }
  >;
  assert.ok(schemas.CreateReceiptDto.properties?.warehouse_branch);
  assert.ok(schemas.CreateReceiptDto.properties?.items);
  assert.ok(schemas.ReceiptItemDto.properties?.unit_price);
  assert.ok(schemas.CreateIssueDto.properties?.purpose);
});

test('DTO validation rejects malformed requests and preserves route and query defaults', async () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
  for (const body of [
    receipt({ items: [] }),
    receipt({ items: [{ material_code: 'STEEL', quantity: 0, unit_price: 1 }] }),
    { ...receipt(), total_amount: 1 },
    receipt({ receipt_date: '2026-02-30' }),
    receipt({ items: [{ material_code: 'STEEL', quantity: 1, unit_price: -1 }] }),
  ]) {
    await assert.rejects(
      pipe.transform(body, { type: 'body', metatype: CreateReceiptDto }),
      BadRequestException,
    );
  }
  for (const body of [
    issue({ purpose: '   ' }),
    issue({ quantity: -1 }),
    issue({ quantity: Infinity }),
  ]) {
    await assert.rejects(
      pipe.transform(body, { type: 'body', metatype: CreateIssueDto }),
      BadRequestException,
    );
  }
  const params = await pipe.transform(
    { branch: 'HN', code: 'GI-1' },
    { type: 'param', metatype: MovementBranchDto },
  );
  assert.equal(params.code, 'GI-1');
  const query = await pipe.transform({ page: '2' }, { type: 'query', metatype: MovementQueryDto });
  assert.equal(query.page, 2);
  assert.equal(query.limit, 20);
  await assert.rejects(
    pipe.transform({ limit: '101' }, { type: 'query', metatype: MovementQueryDto }),
    BadRequestException,
  );
  await assert.rejects(
    pipe.transform({ branch: ['HN', 'HCM'] }, { type: 'query', metatype: MovementQueryDto }),
    BadRequestException,
  );
});
