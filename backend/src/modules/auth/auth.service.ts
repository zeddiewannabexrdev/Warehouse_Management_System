import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from '../../common/interfaces/user-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Thông tin tài khoản hoặc mật khẩu không chính xác');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản của bạn đã bị vô hiệu hóa bởi quản trị viên');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Thông tin tài khoản hoặc mật khẩu không chính xác');
    }

    const payload: JwtPayload = {
      sub: user._id!.toString(),
      email: user.email,
      role: user.role,
      branch: user.branch,
      fullName: user.fullName,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user._id!.toString(),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        branch: user.branch,
      },
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return {
      id: user._id!.toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      branch: user.branch,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
