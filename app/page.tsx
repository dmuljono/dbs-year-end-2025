"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!email || !employeeId) {
      setMsg("Please enter both email and employee ID.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, employee_id: employeeId })
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data?.error || "Login failed");
      } else {
        window.location.href = data.redirect || "/my";
      }
    } catch (err) {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-md bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-primary)" }}>
          {process.env.NEXT_PUBLIC_APP_NAME || "DBS Year End 2025 Microsite"}
        </h1>
        <p className="text-sm text-gray-600 mb-6">Please login with your email and employee ID</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input className="w-full border rounded px-3 py-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Employee ID</label>
            <input className="w-full border rounded px-3 py-2" type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded text-white font-medium"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          {msg && <p className="text-red-600 text-sm">{msg}</p>}
        </form>
      </div>
    </main>
  );
}