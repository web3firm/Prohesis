export default function NotFound() {
  return (
    <main className="min-h-[50vh] grid place-items-center p-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
        <p className="text-gray-600">We couldn&#39;t find what you were looking for.</p>
        <a href="/" className="text-blue-600 hover:underline">Return home</a>
      </div>
    </main>
  );
}
