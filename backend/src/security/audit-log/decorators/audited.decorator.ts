import { SetMetadata } from '@nestjs/common';
import { AUDIT_LOG_KEY, AuditLogOptions } from '../audit-log.interceptor';

export const Audited = (options: AuditLogOptions) =>
  SetMetadata(AUDIT_LOG_KEY, options);
