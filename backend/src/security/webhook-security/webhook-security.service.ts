import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class WebhookSecurityService {
  constructor(private configService: ConfigService) {}

  /**
   * Verify Stripe signature
   */
  verifyStripeSignature(payload: string | Buffer, signature: string): boolean {
    const secret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) {
      throw new BadRequestException('Stripe webhook secret not configured');
    }

    try {
      const elements = signature.split(',');
      const signatureMap: Record<string, string> = {};

      for (const element of elements) {
        const [key, value] = element.split('=');
        signatureMap[key] = value;
      }

      const timestamp = signatureMap['t'];
      const expectedSig = signatureMap['v1'];

      if (!timestamp || !expectedSig) {
        return false;
      }

      // Verify request is not too old (5 minutes)
      const tolerance = 300;
      const timestampSeconds = parseInt(timestamp, 10);
      const currentTime = Math.floor(Date.now() / 1000);

      if (currentTime - timestampSeconds > tolerance) {
        return false;
      }

      const payloadString =
        typeof payload === 'string' ? payload : payload.toString('utf8');
      const signedPayload = `${timestamp}.${payloadString}`;

      const computedSig = crypto
        .createHmac('sha256', secret)
        .update(signedPayload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(computedSig),
        Buffer.from(expectedSig),
      );
    } catch {
      return false;
    }
  }

  /**
   * Verify Paymob signature
   */
  verifyPaymobSignature(payload: any, hmac: string): boolean {
    const secret = this.configService.get<string>('PAYMOB_HMAC_SECRET');
    if (!secret) {
      throw new BadRequestException('Paymob HMAC secret not configured');
    }

    try {
      // Order fields according to Paymob documentation
      const orderedFields = [
        'amount_cents',
        'created_at',
        'currency',
        'error_occured',
        'has_parent_transaction',
        'id',
        'integration_id',
        'is_3d_secure',
        'is_auth',
        'is_capture',
        'is_refunded',
        'is_standalone_payment',
        'is_voided',
        'order',
        'owner',
        'pending',
        'source_data.pan',
        'source_data.sub_type',
        'source_data.type',
        'success',
      ];

      let concatenated = '';
      for (const field of orderedFields) {
        const value = this.getNestedValue(payload, field);
        if (value !== undefined) {
          concatenated += value.toString();
        }
      }

      const computedHmac = crypto
        .createHmac('sha512', secret)
        .update(concatenated)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(computedHmac),
        Buffer.from(hmac),
      );
    } catch {
      return false;
    }
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  /**
   * Generate webhook signature for sending
   */
  generateWebhookSignature(payload: any, secret: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const payloadString = JSON.stringify(payload);
    const signedPayload = `${timestamp}.${payloadString}`;

    const signature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    return `t=${timestamp},v1=${signature}`;
  }

  /**
   * Verify generic signature (for other webhooks)
   */
  verifyGenericSignature(
    payload: string | Buffer,
    signature: string,
    secret: string,
    algorithm: 'sha256' | 'sha512' = 'sha256',
  ): boolean {
    try {
      const payloadString =
        typeof payload === 'string' ? payload : payload.toString('utf8');

      const computedSig = crypto
        .createHmac(algorithm, secret)
        .update(payloadString)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(computedSig),
        Buffer.from(signature),
      );
    } catch {
      return false;
    }
  }
}
