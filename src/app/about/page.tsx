import Link from "next/link";

export const dynamic = "force-static";

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto p-6 prose">
      <h1>About Prohesis</h1>
      <p>
        Prohesis is a web3 prediction market platform. Create markets, stake on outcomes, and track leaderboards, all with on-chain transparency.
      </p>
      <h2>Learn more</h2>
      <ul>
        <li><Link href="/docs">Docs</Link></li>
        <li><Link href="/leaderboard">Leaderboard</Link></li>
        <li><Link href="/app">Explore Markets</Link></li>
      </ul>
    </main>
  );
}
