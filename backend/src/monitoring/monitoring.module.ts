import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  LoginAttempt,
  LoginAttemptSchema,
} from './schemas/login-attempt.schema';
import {
  Session,
  SessionSchema,
} from '../security/sessions/schemas/session.schema';
import {
  RefreshToken,
  RefreshTokenSchema,
} from '../security/auth/schemas/refresh-token.schema';
import { User, UserSchema } from '../security/users/schemas/user.schema';
import { BruteForceModule } from '../security/brute-force/brute-force.module';
import { RealtimeModule } from '../performance/realtime/realtime.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LoginAttempt.name, schema: LoginAttemptSchema },
      { name: Session.name, schema: SessionSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: User.name, schema: UserSchema },
    ]),
    BruteForceModule,
    RealtimeModule,
  ],
  controllers: [MonitoringController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
