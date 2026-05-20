import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from './users.service';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    const email = this.configService.get<string>('ADMIN_EMAIL');
    const password = this.configService.get<string>('ADMIN_PASSWORD');
    const name = this.configService.get<string>('ADMIN_NAME') || 'Admin';

    if (!email || !password) {
      this.logger.warn(
        'Admin seed skipped: ADMIN_EMAIL or ADMIN_PASSWORD is missing.',
      );
      return;
    }

    const existing = await this.usersService.findByEmail(email);

    if (!existing) {
      const created = await this.usersService.create({
        name,
        email,
        password,
        role: 'super_admin',
        permissions: ['*'],
      });

      await this.userModel.updateOne(
        { _id: created._id },
        {
          isActive: true,
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
        },
      );

      this.logger.log(`✅ Admin seeded: ${email}`);
      return;
    }

    await this.usersService.update(existing._id.toString(), {
      name,
      password,
      role: 'super_admin',
      permissions: ['*'],
    });

    await this.userModel.updateOne(
      { _id: existing._id },
      {
        isActive: true,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    );

    this.logger.log(`✅ Admin updated from .env: ${email}`);
  }
}
