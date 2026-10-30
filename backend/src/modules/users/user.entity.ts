import { ObjectId } from 'mongodb';
import { UserRole } from '../../common/constants/roles.constants';

export interface UserEntity {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  branch: 'HN' | 'HCM' | 'DN' | 'ALL';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
