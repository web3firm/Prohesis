export const dynamic = "force-dynamic";
import { PrismaClient } from "@prisma/client";
import React from "react";
import { getToken } from "next-auth/jwt";

const prisma = new PrismaClient();

type AuditRow = {
  id: number;
  action: string;
  actor?: string | null;
  metadata?: any;
  createdAt: string | Date;
};

export default async function AuditsPage(req: any) {
  // server-side auth guard: require admin claim on token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!(token as any)?.isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Audit Log</h1>
        <div className="text-red-600">Unauthorized — admin access only</div>
      </div>
    );
  }

  const audits = (await prisma.audit.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })) as AuditRow[];
  await prisma.$disconnect();

  return (
    <div className="p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Audit Log</h1>
      <p className="text-sm text-gray-600">Why audits? They help trace backend actions like factory syncs, resolutions, payout validations, and settings changes — invaluable for debugging and compliance.</p>
      <div className="overflow-auto bg-white rounded shadow">
        <table className="w-full table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Time</th>
              <th className="p-2 text-left">Action</th>
              <th className="p-2 text-left">Actor</th>
              <th className="p-2 text-left">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {audits.map((a: AuditRow) => (
              <tr key={a.id} className="border-t">
                <td className="p-2 align-top">{new Date(a.createdAt).toLocaleString()}</td>
                <td className="p-2 align-top">{a.action}</td>
                <td className="p-2 align-top">{a.actor ?? '-'}</td>
                <td className="p-2 align-top font-mono text-xs break-words max-w-xl">{JSON.stringify(a.metadata, null, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
