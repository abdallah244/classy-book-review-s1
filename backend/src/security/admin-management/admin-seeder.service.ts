import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AdminSeederService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeederService.name);

  // بيانات الأدمن الأساسي - لا يمكن حذفه
  private readonly PRIMARY_ADMIN = {
    email: 'admin@classybook.com',
    password: '12345678',
    name: 'Primary Admin',
    role: 'super_admin' as const,
    isPrimaryAdmin: true,
  };

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async onModuleInit() {
    await this.seedPrimaryAdmin();
  }

  /**
   * إنشاء الأدمن الأساسي إذا لم يكن موجوداً
   */
  async seedPrimaryAdmin(): Promise<void> {
    try {
      // التحقق من وجود الأدمن الأساسي
      const existingAdmin = await this.userModel.findOne({
        email: this.PRIMARY_ADMIN.email.toLowerCase(),
      });

      if (existingAdmin) {
        this.logger.log('✅ Primary admin already exists');

        // التأكد من أنه super_admin ومحمي
        if (
          existingAdmin.role !== 'super_admin' ||
          !existingAdmin.get('isPrimaryAdmin')
        ) {
          await this.userModel.updateOne(
            { _id: existingAdmin._id },
            {
              role: 'super_admin',
              isPrimaryAdmin: true,
              isActive: true,
              isLocked: false,
            },
          );
          this.logger.log('🔧 Updated primary admin permissions');
        }
        return;
      }

      // إنشاء الأدمن الأساسي
      const hashedPassword = await bcrypt.hash(this.PRIMARY_ADMIN.password, 12);

      await this.userModel.create({
        email: this.PRIMARY_ADMIN.email.toLowerCase(),
        password: hashedPassword,
        name: this.PRIMARY_ADMIN.name,
        role: this.PRIMARY_ADMIN.role,
        isPrimaryAdmin: true,
        isEmailVerified: true,
        isActive: true,
        permissions: ['*'], // جميع الصلاحيات
      });

      this.logger.log('🎉 Primary admin created successfully');
      this.logger.log(`   📧 Email: ${this.PRIMARY_ADMIN.email}`);
      this.logger.log(`   🔑 Password: ${this.PRIMARY_ADMIN.password}`);
    } catch (error) {
      this.logger.error('❌ Failed to seed primary admin:', error);
    }
  }

  /**
   * إنشاء أدمن جديد
   */
  async createAdmin(data: {
    email: string;
    password: string;
    name: string;
    role?: 'admin' | 'super_admin';
    permissions?: string[];
  }): Promise<UserDocument> {
    const hashedPassword = await bcrypt.hash(data.password, 12);

    return this.userModel.create({
      email: data.email.toLowerCase(),
      password: hashedPassword,
      name: data.name,
      role: data.role || 'admin',
      isPrimaryAdmin: false, // ليس أدمن أساسي
      isEmailVerified: true,
      isActive: true,
      permissions: data.permissions || [],
    });
  }

  /**
   * التحقق من إمكانية حذف الأدمن
   */
  async canDeleteAdmin(adminId: string): Promise<boolean> {
    const admin = await this.userModel.findById(adminId);
    if (!admin) return false;

    // لا يمكن حذف الأدمن الأساسي
    return !admin.get('isPrimaryAdmin');
  }
}
