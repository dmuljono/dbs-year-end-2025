// app/admin/attendees/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Attendee = {
  id: string;
  employee_id: string;
  email: string;
  name: string;
  role: "attendee" | "staff" | "admin";
  quota_indomie: number;
  quota_beer: number;
  checked_in: boolean;
  last_redeem_ts: string | null;
  created_at: string;
  updated_at: string;
};

type ListResponse = {
  data: Attendee[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    search: string | null;
  };
};

type EditableField =
  | "employee_id"
  | "email"
  | "name"
  | "role"
  | "quota_indomie"
  | "quota_beer"
  | "checked_in";

// Utility: safely parse JSON (avoids "Unexpected end of JSON input")
async function safeJson(res: Response): Promise<any | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Utility: don't coerce "" to 0
function parseNumberInput(v: string): number | undefined {
  if (v === "" || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

const PAGE_SIZE = 20;

export default function AdminAttendeesPage() {
  const [rows, setRows] = useState<Attendee[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));
    if (search.trim()) params.set("search", search.trim());

    const res = await fetch(`/api/admin/attendees?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const j = await safeJson(res);
      alert((j && j.error) || `Failed to load: ${res.status}`);
      setLoading(false);
      return;
    }
    const j = (await safeJson(res)) as ListResponse | null;
    if (!j) {
      alert("Unexpected response");
      setLoading(false);
      return;
    }
    setRows(j.data);
    setTotal(j.meta.total);
    setTotalPages(j.meta.totalPages);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // Draft edits keyed by attendee id
  const [draft, setDraft] = useState<Record<string, Partial<Record<EditableField, any>>>>({});

  const getValue = (id: string, key: EditableField) => {
    const d = draft[id]?.[key];
    if (d !== undefined) return d;
    const r = rows.find((x) => x.id === id);
    return r ? (r[key] as any) : undefined;
  };

  const setValue = (id: string, key: EditableField, val: any) =>
    setDraft((d) => ({ ...d, [id]: { ...(d[id] || {}), [key]: val } }));

  const saveRow = async (id: string) => {
    const body = draft[id] || {};
    // Only send meaningful fields
    const clean: Record<string, any> = {};
    (Object.keys(body) as EditableField[]).forEach((k) => {
      const v = body[k];
      if (v === undefined) return;
      if (typeof v === "number" && !Number.isFinite(v)) return;
      clean[k] = v;
    });
    if (Object.keys(clean).length === 0) return;

    setSavingId(id);
    const res = await fetch(`/api/admin/attendees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clean),
    });
    setSavingId(null);

    if (!res.ok) {
      const j = await safeJson(res);
      alert((j && j.error) || `Update failed: ${res.status}`);
      return;
    }

    setDraft((d) => {
      const nd = { ...d };
      delete nd[id];
      return nd;
    });
    fetchRows();
  };

  const removeRow = async (id: string) => {
    if (!confirm("Delete this attendee?")) return;
    const res = await fetch(`/api/admin/attendees/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await safeJson(res);
      alert((j && j.error) || `Delete failed: ${res.status}`);
      return;
    }
    fetchRows();
  };

  // Quick-add form
  const [newRow, setNewRow] = useState({
    employee_id: "",
    email: "",
    name: "",
    role: "attendee" as const,
    quota_indomie: 1,
    quota_beer: 0,
  });

  const addRow = async () => {
    const res = await fetch(`/api/admin/attendees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRow),
    });

    if (!res.ok) {
      const j = await safeJson(res);
      alert((j && j.error) || `Create failed: ${res.status}`);
      return;
    }

    setNewRow({
      employee_id: "",
      email: "",
      name: "",
      role: "attendee",
      quota_indomie: 1,
      quota_beer: 0,
    });
    setPage(1);
    fetchRows();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-4 border-b pb-3">
        <Link href="/admin" className="text-sm underline">
          Logs
        </Link>
        <span className="text-sm font-semibold">Attendees</span>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, employee_id"
          className="border rounded px-3 py-2 w-72"
        />
        <button
          onClick={() => {
            setPage(1);
            fetchRows();
          }}
          className="px-3 py-2 rounded bg-black text-white"
        >
          Search
        </button>
        <button
          onClick={() => {
            setSearch("");
            setPage(1);
            fetchRows();
          }}
          className="px-3 py-2 rounded border"
        >
          Clear
        </button>
        <div className="ml-auto text-sm text-gray-600">
          {loading ? "Loading..." : `${total} total`}
        </div>
      </div>

      {/* quick add */}
      <div className="grid grid-cols-7 gap-2 items-end border rounded p-3">
        <div>
          <label className="block text-xs mb-1">Employee ID</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={newRow.employee_id}
            onChange={(e) => setNewRow({ ...newRow, employee_id: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Email</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={newRow.email}
            onChange={(e) => setNewRow({ ...newRow, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Name</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={newRow.name}
            onChange={(e) => setNewRow({ ...newRow, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Role</label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={newRow.role}
            onChange={(e) => setNewRow({ ...newRow, role: e.target.value as any })}
          >
            <option value="attendee">attendee</option>
            <option value="staff">staff</option>
            <option value="admin">admin</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Indomie</label>
          <input
            type="number"
            className="border rounded px-2 py-1 w-full"
            value={newRow.quota_indomie}
            onChange={(e) => setNewRow({ ...newRow, quota_indomie: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Beer</label>
          <input
            type="number"
            className="border rounded px-2 py-1 w-full"
            value={newRow.quota_beer}
            onChange={(e) => setNewRow({ ...newRow, quota_beer: Number(e.target.value) })}
          />
        </div>
        <div>
          <button onClick={addRow} className="px-3 py-2 rounded bg-green-600 text-white w-full">
            Add Attendee
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Employee ID</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Indomie</th>
              <th className="text-left p-2">Beer</th>
              <th className="text-left p-2">Checked-in</th>
              <th className="text-left p-2 w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const indomieVal = getValue(r.id, "quota_indomie");
              const beerVal = getValue(r.id, "quota_beer");
              const checkedVal = getValue(r.id, "checked_in");

              return (
                <tr key={r.id} className="border-t">
                  <td className="p-2">
                    <input
                      className="border rounded px-2 py-1 w-36"
                      value={(getValue(r.id, "employee_id") as string) ?? ""}
                      onChange={(e) => setValue(r.id, "employee_id", e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className="border rounded px-2 py-1 w-56"
                      value={(getValue(r.id, "email") as string) ?? ""}
                      onChange={(e) => setValue(r.id, "email", e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className="border rounded px-2 py-1 w-48"
                      value={(getValue(r.id, "name") as string) ?? ""}
                      onChange={(e) => setValue(r.id, "name", e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <select
                      className="border rounded px-2 py-1"
                      value={(getValue(r.id, "role") as Attendee["role"]) ?? "attendee"}
                      onChange={(e) => setValue(r.id, "role", e.target.value)}
                    >
                      <option value="attendee">attendee</option>
                      <option value="staff">staff</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-20"
                      value={indomieVal ?? ""} // show blank if undefined while editing
                      onChange={(e) => setValue(r.id, "quota_indomie", parseNumberInput(e.target.value))}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-20"
                      value={beerVal ?? ""}
                      onChange={(e) => setValue(r.id, "quota_beer", parseNumberInput(e.target.value))}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={!!checkedVal}
                      onChange={(e) => setValue(r.id, "checked_in", e.target.checked)}
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveRow(r.id)}
                        disabled={savingId === r.id}
                        className="px-2 py-1 border rounded disabled:opacity-50"
                      >
                        {savingId === r.id ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => removeRow(r.id)}
                        className="px-2 py-1 border rounded text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && !loading && (
              <tr>
                <td className="p-4 text-gray-500" colSpan={8}>
                  No attendees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-3 py-2 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        <div className="text-sm text-gray-600">
          Page {page} / {totalPages}
        </div>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="px-3 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
