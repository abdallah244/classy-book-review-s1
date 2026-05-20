import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BruteForceService } from './brute-force.service';
import {
  LoginAttempt,
  LoginAttemptSchema,
} from './schemas/login-attempt.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LoginAttempt.name, schema: LoginAttemptSchema },
    ]),
  ],
  providers: [BruteForceService],
  exports: [BruteForceService],
})
export class BruteForceModule {}
