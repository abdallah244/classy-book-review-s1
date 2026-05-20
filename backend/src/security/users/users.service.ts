import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// Type alias for FilterQuery
type FilterQuery<T> = Record<string, any>;
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationService } from '../../common/pagination';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private paginationService: PaginationService,
  ) {}

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email.toLowerCase(),
    });

    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    return this.userModel.create({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      password: hashedPassword,
    });
  }

  /**
   * Get all users with pagination
   */
  async findAll(query: any) {
    const filter: FilterQuery<UserDocument> = { isDeleted: false };

    if (query.role) filter.role = query.role;
    if (query.isActive !== undefined) filter.isActive = query.isActive;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }

    return this.paginationService.paginateModel(this.userModel, filter, {
      page: query.page,
      limit: query.limit,
      sort: query.sort || '-createdAt',
    });
  }

  /**
   * Get user by ID
   */
  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Get user by email
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
    });
  }

  /**
   * Update user
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const user = await this.findById(id);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 12);
      (updateUserDto as any).passwordChangedAt = new Date();
    }

    Object.assign(user, updateUserDto);
    return user.save();
  }

  /**
   * Delete user (Soft Delete)
   */
  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(id) },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: new Types.ObjectId(deletedBy),
      },
    );
  }

  /**
   * Restore deleted user
   */
  async restore(id: string): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update permissions
   */
  async updatePermissions(
    id: string,
    permissions: string[],
  ): Promise<UserDocument> {
    const user = await this.findById(id);
    user.permissions = permissions;
    return user.save();
  }

  /**
   * Update role
   */
  async updateRole(id: string, role: string): Promise<UserDocument> {
    const user = await this.findById(id);
    user.role = role;
    return user.save();
  }

  /**
   * Activate/Deactivate account
   */
  async toggleActive(id: string): Promise<UserDocument> {
    const user = await this.findById(id);
    user.isActive = !user.isActive;
    return user.save();
  }
}
