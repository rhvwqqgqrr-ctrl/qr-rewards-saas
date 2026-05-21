import prisma from "./prisma";
import { ActorType, Prisma } from "@prisma/client";

interface AuditParams {
  restaurantId?: string;
  actorType: ActorType;
  actorId?: string;
  entityType: string;
  entityId: string;
  eventType: string;
  payload?: Record<string, unknown>;
}

export async function logAuditEvent(params: AuditParams): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        restaurantId: params.restaurantId,
        actorType: params.actorType,
        actorId: params.actorId,
        entityType: params.entityType,
        entityId: params.entityId,
        eventType: params.eventType,
        payloadJson: (params.payload as Prisma.InputJsonValue) ?? undefined,
      },
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
    // Non-blocking: audit failures should not break the main flow
  }
}
