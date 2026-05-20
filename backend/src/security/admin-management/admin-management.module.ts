import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminManagementService } from './admin-management.service';
import { AdminManagementController } from './admin-management.controller';
import { AdminSeederService } from './admin-seeder.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  IPBlacklist,
  IPBlacklistSchema,
} from '../brute-force/schemas/ip-blacklist.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: IPBlacklist.name, schema: IPBlacklistSchema },
    ]),
  ],
  controllers: [AdminManagementController],
  providers: [AdminManagementService, AdminSeederService],
  exports: [AdminManagementService, AdminSeederService],
})
export class AdminManagementModule {}
