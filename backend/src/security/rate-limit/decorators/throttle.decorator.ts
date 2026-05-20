import { SetMetadata } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

// Rate limit presets
export const ThrottleLogin = () =>
  Throttle({ short: { limit: 5, ttl: 60000 } }); // 5 attempts per minute
export const ThrottleRegister = () =>
  Throttle({ medium: { limit: 3, ttl: 300000 } }); // 3 in 5 minutes
export const ThrottleApi = () => Throttle({ long: { limit: 100, ttl: 60000 } }); // 100 per minute
export const ThrottleSearch = () =>
  Throttle({ medium: { limit: 30, ttl: 60000 } }); // 30 per minute
export const ThrottleUpload = () =>
  Throttle({ short: { limit: 10, ttl: 60000 } }); // 10 per minute
export const ThrottlePayment = () =>
  Throttle({ short: { limit: 3, ttl: 60000 } }); // 3 per minute

// Skip throttle for specific routes
export const SKIP_THROTTLE_KEY = 'skipThrottle';
export const SkipThrottle = () => SetMetadata(SKIP_THROTTLE_KEY, true);
