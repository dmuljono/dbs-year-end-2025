"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function StaffHome() {
  const [item, setItem] = useState<"indomie" | "beer">("indomie");
  const [boothId, setBoothId] = useState("");

  useEffect(() => {
    const b = localStorage.getItem("booth_id");
    if (b) setBoothId(b);
  }, []);

  function persistBooth(v: string) {
    setBoothId(v);
    localStorage.setItem("booth_id", v);
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>Staff Tools</h1>
      <div className="bg-white shadow rounded p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Item</label>
          <select className="border rounded px-3 py-2" value={item} onChange={(e) => setItem(e.target.value as any)}>
            <option value="indomie">Indomie</option>
            <option value="beer">Beer</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Booth ID</label>
          <input className="border rounded px-3 py-2 w-full" value={boothId} onChange={(e) => persistBooth(e.target.value)} placeholder="e.g., BOOTH-A" />
        </div>
        <Link
          href={`/staff/scan?item=${item}`}
          className="inline-block px-4 py-2 rounded text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Go to Scan
        </Link>
      </div>
    </main>
  );
}