import Link from "next/link";

export const dynamic = "force-static";

export default function DocsLanding() {
  return (
    <main className="max-w-4xl mx-auto p-6 prose prose-blue">
      <h1>Documentation</h1>
      <p>
        Welcome to Prohesis. This page links out to developer and product documentation.
      </p>

      <h2>Quick links</h2>
      <ul>
        <li>
          <Link href="/app">Explore markets</Link>
        </li>
        <li>
          <Link href="/leaderboard">Leaderboard</Link>
        </li>
        <li>
          <Link href="/admin">Admin</Link>
        </li>
      </ul>

      <h2>Repository docs</h2>
      <ul>
        <li>
          <Link href="/docs/PROHESIS">Project overview (embedded)</Link>
        </li>
        <li>
          <a href="https://github.com/web3firm/Prohesis" target="_blank" rel="noreferrer">
            GitHub repository
          </a>
        </li>
      </ul>

      <p className="text-sm text-gray-500">Looking for something else? Open an issue on GitHub.</p>
    </main>
  );
}
