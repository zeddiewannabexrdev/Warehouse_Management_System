import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/user-payload.interface';
import { UserRole } from '../../common/constants/roles.constants';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Danh sách người dùng có phân trang, tìm kiếm và lọc đa chi nhánh' })
  async listUsers(@Query() query: QueryUserDto) {
    return await this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Xem chi tiết tài khoản theo ID' })
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID [${id}]`);
    }
    const { passwordHash: _, ...safeUser } = user as any;
    return safeUser;
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo tài khoản người dùng mới và phân quyền chi nhánh (Chỉ Super Admin)' })
  @ApiResponse({ status: 201, description: 'Tài khoản được khởi tạo thành công' })
  async createUser(@Body() dto: CreateUserDto) {
    return await this.usersService.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cập nhật thông tin tài khoản, vai trò hoặc điều chuyển chi nhánh (Chỉ Super Admin)' })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return await this.usersService.update(id, dto);
  }

  @Patch(':id/toggle-status')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Khóa hoặc kích hoạt lại tài khoản người dùng (Chỉ Super Admin)' })
  async toggleStatus(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.usersService.toggleStatus(id, currentUser.id);
  }

  @Post(':id/reset-password')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đặt lại mật khẩu cho tài khoản người dùng (Chỉ Super Admin)' })
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return await this.usersService.resetPassword(id, dto.newPassword);
  }
}
