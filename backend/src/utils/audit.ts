import { prisma } from '../index';

export const writeAudit = async (input: { userId?: number; action: string; entity: string; entityId?: string; metadata?: unknown }) => {
  try { await prisma.auditLog.create({ data: { ...input, metadata: input.metadata as any } }); }
  catch (error) { console.error('Audit log unavailable.', error); }
};
