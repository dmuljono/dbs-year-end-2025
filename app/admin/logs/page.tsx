"use client";

import { useEffect, useState } from "react";

type LogRow = {
  ts: string;
  employee_id: string;
  item: string;
  delta: number;
  booth_id: string;
  scanned_by: string;
  name: string;
  email: string;
};

export default function AdminLogs() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [item, setItem] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  async function load() {
    const params = new URLSearchParams();
    if (item) params.set("item", item);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/admin/logs?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setRows(data);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Redemption Logs</h1>
      <div className="bg-white p-4 rounded shadow space-y-3 mb-4">
        <div className="flex gap-2 flex-wrap">
          <select className="border rounded px-3 py-2" value={item} onChange={(e) => setItem(e.target.value)}>
            <option value="">All Items</option>
            <option value="indomie">Indomie</option>
            <option value="beer">Beer</option>
          </select>
          <input className="border rounded px-3 py-2" type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input className="border rounded px-3 py-2" type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
          <button className="px-4 py-2 rounded text-white" style={{ backgroundColor: "var(--color-primary)" }} onClick={load}>Filter</button>
          <a className="px-4 py-2 rounded border" href={`/api/admin/logs?${new URLSearchParams({ item, from, to, format: "csv" }).toString()}`}>Export CSV</a>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="text-left">
              <th className="p-2">ts</th>
              <th className="p-2">employee_id</th>
              <th className="p-2">item</th>
              <th className="p-2">delta</th>
              <th className="p-2">booth_id</th>
              <th className="p-2">scanned_by</th>
              <th className="p-2">name</th>
              <th className="p-2">email</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{new Date(r.ts).toLocaleString()}</td>
                <td className="p-2">{r.employee_id}</td>
                <td className="p-2">{r.item}</td>
                <td className="p-2">{r.delta}</td>
                <td className="p-2">{r.booth_id}</td>
                <td className="p-2">{r.scanned_by}</td>
                <td className="p-2">{r.name}</td>
                <td className="p-2">{r.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}