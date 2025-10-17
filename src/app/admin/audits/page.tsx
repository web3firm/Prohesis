import { PrismaClient } from "@prisma/client";
import React from "react";

const prisma = new PrismaClient();

export default async function AuditsPage() {
  const audits = await prisma.audit.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  await prisma.$disconnect();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Audit Log</h1>
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
            {audits.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-2 align-top">{new Date(a.createdAt).toLocaleString()}</td>
                <td className="p-2 align-top">{a.action}</td>
                <td className="p-2 align-top">{a.actor ?? '-'}</td>
                <td className="p-2 align-top monospace text-sm break-words max-w-xl">{JSON.stringify(a.metadata)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
