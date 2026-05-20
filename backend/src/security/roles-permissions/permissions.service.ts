import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission, PermissionDocument } from './schemas/permission.schema';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDocument>,
  ) {}

  async create(data: Partial<Permission>): Promise<PermissionDocument> {
    return this.permissionModel.create(data);
  }

  async findAll(): Promise<PermissionDocument[]> {
    return this.permissionModel.find().sort({ module: 1, action: 1 });
  }

  async findByModule(module: string): Promise<PermissionDocument[]> {
    return this.permissionModel.find({ module });
  }

  async findByCode(code: string): Promise<PermissionDocument | null> {
    return this.permissionModel.findOne({ code });
  }

  async seedDefaultPermissions(): Promise<void> {
    const modules = [
      'users',
      'courses',
      'lessons',
      'quizzes',
      'assignments',
      'content',
      'categories',
      'payments',
      'reports',
      'settings',
    ];

    const actions = ['create', 'read', 'update', 'delete', 'manage'];

    const permissions: Partial<Permission>[] = [];

    for (const module of modules) {
      for (const action of actions) {
        permissions.push({
          code: `${module}.${action}`,
          name: `${action} ${module}`,
          module,
          action: action as any,
          isActive: true,
        });
      }
    }

    // Add special permissions
    permissions.push(
      {
        code: 'dashboard.access',
        name: 'Dashboard Access',
        module: 'dashboard',
        action: 'read',
        isActive: true,
      },
      {
        code: 'analytics.view',
        name: 'View Analytics',
        module: 'analytics',
        action: 'read',
        isActive: true,
      },
    );

    for (const permission of permissions) {
      await this.permissionModel.updateOne(
        { code: permission.code },
        { $setOnInsert: permission },
        { upsert: true },
      );
    }
  }
}
