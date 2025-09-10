"use client";

import { useEffect, useState } from "react";

type Attendee = {
  id: string; employee_id: string; email: string; name: string; role: "attendee"|"staff"|"admin";
  quota_indomie: number; quota_beer: number; checked_in: boolean; last_redeem_ts?: string|null;
};

export default function AdminAttendeesPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Attendee[]>([]);
  const [nextCursor, setNextCursor] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createData, setCreateData] = useState({ employee_id:"", email:"", name:"", role:"attendee", quota_indomie:1, quota_beer:3 });

  async function load(cursor?: string) {
    setLoading(true);
    const url = new URL("/api/admin/attendees", window.location.origin);
    if (q) url.searchParams.set("q", q);
    url.searchParams.set("take", "25");
    if (cursor) url.searchParams.set("cursor", cursor);
    const res = await fetch(url.toString(), { cache:"no-store" });
    if (res.ok) {
      const data = await res.json();
      if (cursor) {
        setItems(prev => [...prev, ...data.items]);
      } else {
        setItems(data.items);
      }
      setNextCursor(data.nextCursor);
    }
    setLoading(false);
  }

  useEffect(() => { load(); /* on mount */ }, []);
  useEffect(() => { const t = setTimeout(()=>load(), 300); return ()=>clearTimeout(t); }, [q]);

  async function saveRow(id: string, patch: Partial<Attendee>) {
    const res = await fetch(`/api/admin/attendees/${id}`, {
      method:"PATCH",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const updated = await res.json();
      setItems(list => list.map(x => x.id===id? updated : x));
    } else {
      alert("Update failed");
    }
  }

  async function delRow(id: string) {
    if (!confirm("Delete this attendee?")) return;
    const res = await fetch(`/api/admin/attendees/${id}`, { method:"DELETE" });
    if (res.ok) setItems(list => list.filter(x => x.id !== id));
    else alert("Delete failed");
  }

  async function create() {
    setCreating(true);
    const res = await fetch(`/api/admin/attendees`, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(createData) });
    setCreating(false);
    if (res.ok) { setCreateData({ employee_id:"", email:"", name:"", role:"attendee", quota_indomie:1, quota_beer:3 }); load(); }
    else alert("Create failed");
  }

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Attendees</h1>

      <div className="flex gap-2 mb-4">
        <input
          value={q} onChange={e=>setQ(e.target.value)}
          placeholder="Search name/email/employee_id"
          className="border rounded px-3 py-2 w-full"
        />
        <button onClick={()=>load()} className="px-4 py-2 rounded text-white" style={{ backgroundColor:"var(--color-primary)" }}>
          Search
        </button>
      </div>

      {/* Create new */}
      <div className="border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Add attendee</h2>
        <div className="grid grid-cols-6 gap-2">
          <input className="border rounded px-2 py-1" placeholder="employee_id" value={createData.employee_id} onChange={e=>setCreateData(d=>({...d, employee_id:e.target.value}))}/>
          <input className="border rounded px-2 py-1" placeholder="email" value={createData.email} onChange={e=>setCreateData(d=>({...d, email:e.target.value}))}/>
          <input className="border rounded px-2 py-1" placeholder="name" value={createData.name} onChange={e=>setCreateData(d=>({...d, name:e.target.value}))}/>
          <select className="border rounded px-2 py-1" value={createData.role} onChange={e=>setCreateData(d=>({...d, role:e.target.value}))}>
            <option value="attendee">attendee</option>
            <option value="staff">staff</option>
            <option value="admin">admin</option>
          </select>
          <input className="border rounded px-2 py-1" type="number" placeholder="indomie" value={createData.quota_indomie} onChange={e=>setCreateData(d=>({...d, quota_indomie:+e.target.value}))}/>
          <input className="border rounded px-2 py-1" type="number" placeholder="beer" value={createData.quota_beer} onChange={e=>setCreateData(d=>({...d, quota_beer:+e.target.value}))}/>
        </div>
        <div className="mt-2">
          <button disabled={creating} onClick={create} className="px-4 py-2 rounded text-white" style={{ backgroundColor:"var(--color-primary)" }}>
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Employee ID</th>
              <th className="p-2">Role</th>
              <th className="p-2">Indomie</th>
              <th className="p-2">Beer</th>
              <th className="p-2">Checked In</th>
              <th className="p-2 w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(a => (
              <tr key={a.id} className="border-b">
                <td className="p-2">
                  <input className="border rounded px-2 py-1 w-48" defaultValue={a.name} onBlur={e=>saveRow(a.id, { name: e.target.value })}/>
                </td>
                <td className="p-2">
                  <input className="border rounded px-2 py-1 w-56" defaultValue={a.email} onBlur={e=>saveRow(a.id, { email: e.target.value })}/>
                </td>
                <td className="p-2">
                  <input className="border rounded px-2 py-1 w-36" defaultValue={a.employee_id} onBlur={e=>saveRow(a.id, { employee_id: e.target.value })}/>
                </td>
                <td className="p-2">
                  <select className="border rounded px-2 py-1" defaultValue={a.role} onChange={e=>saveRow(a.id, { role: e.target.value as any })}>
                    <option value="attendee">attendee</option>
                    <option value="staff">staff</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="p-2">
                  <input className="border rounded px-2 py-1 w-20" type="number" defaultValue={a.quota_indomie} onBlur={e=>saveRow(a.id, { quota_indomie: +e.target.value })}/>
                </td>
                <td className="p-2">
                  <input className="border rounded px-2 py-1 w-20" type="number" defaultValue={a.quota_beer} onBlur={e=>saveRow(a.id, { quota_beer: +e.target.value })}/>
                </td>
                <td className="p-2">
                  <input type="checkbox" defaultChecked={a.checked_in} onChange={e=>saveRow(a.id, { checked_in: e.target.checked })}/>
                </td>
                <td className="p-2">
                  <button className="px-2 py-1 border rounded mr-2" onClick={()=>saveRow(a.id, {})}>Save</button>
                  <button className="px-2 py-1 border rounded" onClick={()=>delRow(a.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {nextCursor && (
          <div className="mt-3">
            <button className="px-4 py-2 rounded border" onClick={()=>load(nextCursor!)}>Load more</button>
          </div>
        )}
      </div>

      {loading && <p className="mt-3 text-gray-500">Loading…</p>}
    </main>
  );
}
