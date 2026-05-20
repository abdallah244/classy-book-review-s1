import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { WebhookSecurityService } from './webhook-security.service';

@Controller('webhooks')
@Public()
export class WebhookController {
  constructor(private webhookSecurityService: WebhookSecurityService) {}

  @Post('stripe')
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('No raw body found');
    }

    const isValid = this.webhookSecurityService.verifyStripeSignature(
      rawBody,
      signature,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid signature');
    }

    const payload = JSON.parse(rawBody.toString());

    // Process events
    switch (payload.type) {
      case 'checkout.session.completed':
        // Process checkout completion
        break;
      case 'invoice.payment_succeeded':
        // Process invoice payment success
        break;
      case 'customer.subscription.updated':
        // Process subscription update
        break;
      case 'customer.subscription.deleted':
        // Process subscription cancellation
        break;
      default:
        console.log(`Unhandled Stripe event: ${payload.type}`);
    }

    return { received: true };
  }

  @Post('paymob')
  @HttpCode(200)
  async handlePaymobWebhook(
    @Body() body: any,
    @Headers('x-hmac') hmac: string,
  ) {
    const isValid = this.webhookSecurityService.verifyPaymobSignature(
      body.obj,
      hmac,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid HMAC signature');
    }

    const transaction = body.obj;

    if (transaction.success) {
      // Process successful payment
      console.log('Paymob payment successful:', transaction.id);
    } else {
      // Process failed payment
      console.log('Paymob payment failed:', transaction.id);
    }

    return { received: true };
  }
}
