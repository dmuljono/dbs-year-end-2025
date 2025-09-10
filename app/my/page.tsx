"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Me = {
  id: string;
  employee_id: string;
  email: string;
  name: string;
  role: string;
  quota_indomie: number;
  quota_beer: number;
  checked_in: boolean;
  last_redeem_ts?: string | null;
};

export default function MyPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function load() {
    setError(null);
    try {
      const res = await fetch("/api/me", {
        cache: "no-store",
        credentials: "include", // ensure cookies are sent
        headers: { Accept: "application/json" },
      });

      if (res.status === 401) {
        // not logged in → back to login
        router.replace("/");
        return;
      }

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Failed to load");
      }

      const data = await res.json();
      // handle either { attendee: {...} } or {...}
      const payload: Me | null = (data?.attendee ?? data) || null;
      if (!payload) throw new Error("Invalid response");
      setMe(payload);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--color-primary)" }}>
        My Pass
      </h1>

      {error && <p className="text-red-600">{error}</p>}

      {!me ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          <div className="bg-white shadow rounded p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{me.name}</p>
                <p className="text-sm text-gray-600">{me.email}</p>
                <p className="text-sm text-gray-600">Employee ID: {me.employee_id}</p>
                <p className="text-sm">Checked In: {me.checked_in ? "Yes" : "No"}</p>
              </div>
              <img src="/api/me/qr" alt="QR" className="w-32 h-32" />
            </div>
          </div>

          <div className="bg-white shadow rounded p-4">
            <p className="font-semibold mb-2">Quotas</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded p-3">
                <p className="text-sm text-gray-600">Indomie</p>
                <p className="text-xl font-bold">{me.quota_indomie}</p>
              </div>
              <div className="border rounded p-3">
                <p className="text-sm text-gray-600">Beer</p>
                <p className="text-xl font-bold">{me.quota_beer}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
              onClick={load}
            >
              Refresh
            </button>
            {me.role.toUpperCase() === "STAFF" || me.role.toUpperCase() === "ADMIN" ? (
              <a className="px-4 py-2 rounded border" href="/staff">
                Go to Staff
              </a>
            ) : null}
          </div>
        </div>
      )}
    </main>
  );
}
