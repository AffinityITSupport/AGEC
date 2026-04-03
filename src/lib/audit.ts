import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { AuditLog } from "../types";

export async function logAudit(
  action: AuditLog["action"],
  entityType: AuditLog["entityType"],
  entityId: string,
  details: string,
  changes?: AuditLog["changes"]
) {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const auditData = {
      timestamp: serverTimestamp(),
      userId: user.uid,
      userEmail: user.email || "unknown",
      action,
      entityType,
      entityId,
      details,
      changes: changes || [],
    };

    await addDoc(collection(db, "audit_logs"), auditData);
  } catch (error) {
    console.error("Failed to log audit:", error);
  }
}
