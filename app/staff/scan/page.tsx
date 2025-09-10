"use client";

import { useEffect, useMemo, useState } from "react";

function useQueryItem(): "indomie" | "beer" {
  return useMemo(() => {
    if (typeof window === "undefined") return "indomie";
    const url = new URL(window.location.href);
    const item = url.searchParams.get("item");
    return (item === "beer" ? "beer" : "indomie");
  }, []);
}

export default function StaffScan() {
  const item = useQueryItem();
  const [employeeId, setEmployeeId] = useState("");
  const [boothId, setBoothId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const b = localStorage.getItem("booth_id");
    if (b) setBoothId(b);
  }, []);

  async function redeem(id: string) {
    setMsg(null);
    setOk(null);
    setLoading(true);
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: id, item, booth_id: boothId })
      });
      const data = await res.json();
      if (!res.ok) {
        setOk(false);
        setMsg(data?.error || "Failed");
      } else {
        setOk(true);
        setMsg(`Redeemed ${item} for ${id}. Remaining - indomie: ${data.quota_indomie}, beer: ${data.quota_beer}`);
        setEmployeeId("");
      }
    } catch (e: any) {
      setOk(false);
      setMsg(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>Scan / Redeem</h1>

      <div className="bg-white shadow rounded p-4 space-y-3">
        <p className="text-sm text-gray-600">Manual input (QR scanning can be added later if needed)</p>
        <div>
          <label className="block text-sm font-medium mb-1">Employee ID</label>
          <input className="border rounded px-3 py-2 w-full" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="Scan or type employee ID" />
        </div>
        <button
          onClick={() => employeeId && boothId && redeem(employeeId)}
          disabled={!employeeId || !boothId || loading}
          className="px-4 py-2 rounded text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {loading ? "Processing..." : `Redeem ${item}`}
        </button>
        <p className={ok ? "text-green-600" : ok === false ? "text-red-600" : "text-gray-700"}>{msg}</p>
      </div>
    </main>
  );
}