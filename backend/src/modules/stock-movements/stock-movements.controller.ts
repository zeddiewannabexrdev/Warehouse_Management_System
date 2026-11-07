import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/constants/roles.constants';
import { AuthenticatedUser } from '../../common/interfaces/user-payload.interface';
import {
  CreateIssueDto,
  CreateReceiptDto,
  MovementBranchDto,
  MovementQueryDto,
} from './dto/stock-movements.dto';
import { StockMovementsService } from './stock-movements.service';

const READERS = [
  UserRole.SUPER_ADMIN,
  UserRole.MANAGER_HN,
  UserRole.MANAGER_HCM,
  UserRole.AUDITOR,
  UserRole.QC_INSPECTOR,
];
const WRITERS = [UserRole.SUPER_ADMIN, UserRole.MANAGER_HN, UserRole.MANAGER_HCM];

@ApiTags('Goods receipts — A5')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...READERS)
@Controller('goods-receipts')
export class GoodsReceiptsController {
  constructor(private readonly movements: StockMovementsService) {}

  @Get('options')
  @ApiOperation({ summary: 'Danh mục vật tư và kho cho phiếu nhập' })
  options(@Query() query: MovementQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.movements.getOptions(query, user);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách phiếu nhập có phân trang và bộ lọc' })
  list(@Query() query: MovementQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.movements.list('receipts', query, user);
  }

  @Get(':branch/:code')
  @ApiOperation({ summary: 'Chi tiết phiếu nhập theo chi nhánh và mã phiếu' })
  detail(
    @Param() params: MovementBranchDto,
    @Param('code') code: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.movements.detail('receipts', params.branch, code, user);
  }

  @Post()
  @Roles(...WRITERS)
  @ApiOperation({ summary: 'Nhập kho, tạo phiếu và audit trong một transaction' })
  create(@Body() dto: CreateReceiptDto, @CurrentUser() user: AuthenticatedUser) {
    return this.movements.createReceipt(dto, user);
  }
}

@ApiTags('Goods issues — A6')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...READERS)
@Controller('goods-issues')
export class GoodsIssuesController {
  constructor(private readonly movements: StockMovementsService) {}

  @Get('options')
  @ApiOperation({ summary: 'Danh mục vật tư và kho cho phiếu xuất' })
  options(@Query() query: MovementQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.movements.getOptions(query, user);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách phiếu xuất có phân trang và bộ lọc' })
  list(@Query() query: MovementQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.movements.list('issues', query, user);
  }

  @Get(':branch/:code')
  @ApiOperation({ summary: 'Chi tiết phiếu xuất theo chi nhánh và mã phiếu' })
  detail(
    @Param() params: MovementBranchDto,
    @Param('code') code: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.movements.detail('issues', params.branch, code, user);
  }

  @Post()
  @Roles(...WRITERS)
  @ApiOperation({ summary: 'Xuất kho có điều kiện, tạo phiếu và audit trong một transaction' })
  create(@Body() dto: CreateIssueDto, @CurrentUser() user: AuthenticatedUser) {
    return this.movements.createIssue(dto, user);
  }
}
