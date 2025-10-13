"use client";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<{ id: number; address: string; username?: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data.list || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="max-w-5xl mx-auto mt-12 space-y-8">
      <section className="card p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">👥 Users</h1>
        <p className="text-gray-500">Registered wallet addresses</p>
      </section>

      {users.length === 0 ? (
        <p className="text-center text-gray-500">No users yet.</p>
      ) : (
        <div className="card p-6 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-gray-500 text-sm">
              <tr>
                <th className="py-2">ID</th>
                <th>Address</th>
                <th>Name</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="py-2">{u.id}</td>
                  <td>{u.address}</td>
                  <td>{u.username || "-"}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
