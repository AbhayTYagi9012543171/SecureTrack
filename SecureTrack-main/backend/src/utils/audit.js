import AuditLog from '../models/AuditLog.js';

/**
 * Persist an audit event without allowing audit failures to break the request.
 * Pass the real Express request object. For unauthenticated auth endpoints,
 * pass the newly authenticated/created user as the sixth argument.
 */
export async function audit(
  req,
  action,
  resource,
  resourceId,
  metadata = {},
  userOverride = null,
) {
  try {
    const user = userOverride || req?.user || null;
    const userAgent = typeof req?.get === 'function'
      ? req.get('user-agent')
      : req?.headers?.['user-agent'];

    await AuditLog.create({
      ...(user?._id ? { user: user._id } : {}),
      action,
      resource,
      resourceId: String(resourceId || ''),
      ip: req?.ip || req?.socket?.remoteAddress || '',
      userAgent: String(userAgent || ''),
      metadata,
    });
  } catch (error) {
    console.error('Audit log failed:', error.message);
  }
}
