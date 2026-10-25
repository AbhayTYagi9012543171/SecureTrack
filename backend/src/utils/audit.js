import AuditLog from '../models/AuditLog.js';
export async function audit(req, action, resource, resourceId, metadata={}) { try { await AuditLog.create({ user:req.user?._id, action, resource, resourceId:String(resourceId||''), ip:req.ip, userAgent:req.get('user-agent')||'', metadata }); } catch(e){ console.error('Audit log failed:',e.message); } }
