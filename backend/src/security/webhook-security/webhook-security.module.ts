import { Module } from '@nestjs/common';
import { WebhookSecurityService } from './webhook-security.service';
import { WebhookController } from './webhook.controller';

@Module({
  providers: [WebhookSecurityService],
  controllers: [WebhookController],
  exports: [WebhookSecurityService],
})
export class WebhookSecurityModule {}
