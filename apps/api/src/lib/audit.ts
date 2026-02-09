import { pool } from '../db';

export type AuditAction =
    | 'order.create'
    | 'order.status_update'
    | 'order.cancel'
    | 'payment.create'
    | 'auth.login'
    | 'auth.logout'
    | 'auth.failed_login';

export async function auditLog(params: {
    action: AuditAction;
    entityType: string;
    entityId?: string;
    actorId?: number;
    actorEmail?: string;
    metadata?: Record<string, unknown>;
    ip?: string;
}): Promise<void> {
    try {
        await pool.query(
            `INSERT INTO audit_logs (action, entity_type, entity_id, actor_id, actor_email, metadata, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                params.action,
                params.entityType,
                params.entityId ?? null,
                params.actorId ?? null,
                params.actorEmail ?? null,
                params.metadata ? JSON.stringify(params.metadata) : null,
                params.ip ?? null,
            ]
        );
    } catch (err) {
        console.error('Audit log failed:', err);
    }
}
