export default function AdminPage() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Admin</h1>
      <p className="mb-2">Use the tabs below:</p>
      <ul className="list-disc pl-6">
        <li><a className="text-blue-600 underline" href="/admin">Attendees (TBD)</a></li>
        <li><a className="text-blue-600 underline" href="/admin/logs">Logs</a></li>
      </ul>
      <p className="mt-4 text-gray-600">This is a placeholder; a richer UI can be added next.</p>
    </main>
  );
}