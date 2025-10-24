export default function AdminForbiddenPublic() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow border p-8 text-center">
        <div className="text-4xl mb-2">🚫</div>
        <h1 className="text-xl font-semibold mb-2">Access denied</h1>
        <p className="text-gray-600 text-sm mb-6">
          You don&apos;t have permission to view this page. Please sign in with an admin account.
        </p>
        <a
          href="/admin/auth/login"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Go to admin login
        </a>
      </div>
    </div>
  );
}
