import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role.name) private roleModel: Model<RoleDocument>) {}

  async create(data: Partial<Role>): Promise<RoleDocument> {
    const existing = await this.roleModel.findOne({ name: data.name });
    if (existing) {
      throw new ConflictException('Role already exists');
    }
    return this.roleModel.create(data);
  }

  async findAll(): Promise<RoleDocument[]> {
    return this.roleModel.find().sort({ level: -1 });
  }

  async findByName(name: string): Promise<RoleDocument | null> {
    return this.roleModel.findOne({ name });
  }

  async findById(id: string): Promise<RoleDocument> {
    const role = await this.roleModel.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async update(id: string, data: Partial<Role>): Promise<RoleDocument> {
    const role = await this.findById(id);

    if (role.isSystem && data.name && data.name !== role.name) {
      throw new ConflictException('Cannot change system role name');
    }

    Object.assign(role, data);
    return role.save();
  }

  async delete(id: string): Promise<void> {
    const role = await this.findById(id);

    if (role.isSystem) {
      throw new ConflictException('Cannot delete system role');
    }

    await this.roleModel.deleteOne({ _id: id });
  }

  async addPermissions(
    id: string,
    permissions: string[],
  ): Promise<RoleDocument> {
    const role = await this.findById(id);
    const uniquePermissions = [
      ...new Set([...role.permissions, ...permissions]),
    ];
    role.permissions = uniquePermissions;
    return role.save();
  }

  async removePermissions(
    id: string,
    permissions: string[],
  ): Promise<RoleDocument> {
    const role = await this.findById(id);
    role.permissions = role.permissions.filter((p) => !permissions.includes(p));
    return role.save();
  }

  async seedDefaultRoles(): Promise<void> {
    const defaultRoles = [
      {
        name: 'super_admin',
        displayName: 'System Administrator',
        description: 'Full system permissions',
        permissions: ['*'],
        isSystem: true,
        level: 100,
      },
      {
        name: 'admin',
        displayName: 'Administrator',
        description: 'Manage users and content',
        permissions: [
          'users.read',
          'users.create',
          'users.update',
          'courses.manage',
          'content.manage',
        ],
        isSystem: true,
        level: 80,
      },
      {
        name: 'teacher',
        displayName: 'Teacher',
        description: 'Create and manage courses',
        permissions: [
          'courses.create',
          'courses.read',
          'courses.update',
          'lessons.manage',
          'students.view',
        ],
        isSystem: true,
        level: 50,
      },
      {
        name: 'student',
        displayName: 'Student',
        description: 'Access courses and educational content',
        permissions: ['courses.read', 'lessons.read', 'profile.manage'],
        isSystem: true,
        level: 10,
      },
    ];

    for (const role of defaultRoles) {
      await this.roleModel.updateOne(
        { name: role.name },
        { $setOnInsert: role },
        { upsert: true },
      );
    }
  }
}
