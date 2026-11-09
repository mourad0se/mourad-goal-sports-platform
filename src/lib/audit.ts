import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import type { SessionPayload } from "@/lib/auth";

/**
 * Security audit trail for administrative actions.
 * Best-effort: logging failures must never break the request.
 */
export async function logAudit(input: {
  user: SessionPayload | null;
  action:
    | "login"
    | "login_failed"
    | "logout"
    | "create"
    | "update"
    | "delete"
    | "toggle"
    | "settings";
  entity: "auth" | "match" | "stream" | "news" | "ads" | "settings" | "contact";
  entityId?: string | number | null;
  meta?: Record<string, unknown>;
  ip?: string;
}) {
  try {
    await db.insert(auditLogs).values({
      userId: input.user?.sub ?? null,
      userEmail: input.user?.email ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId == null ? null : String(input.entityId),
      meta: input.meta ?? null,
      ip: input.ip ?? null,
    });
  } catch (err) {
    console.error("audit_log_failed", err);
  }
}
