import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-white/70 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-600">
        <div className="flex items-center gap-3">
          <Link href="/about" className="hover:underline">About</Link>
          <Link href="/docs" className="hover:underline">Docs</Link>
          <Link href="/status" className="hover:underline">Status</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
        </div>
        <div className="flex items-center gap-3">
          <a href="https://twitter.com/prohesis" target="_blank" rel="noreferrer" className="hover:underline">Twitter</a>
          <a href="https://discord.gg/prohesis" target="_blank" rel="noreferrer" className="hover:underline">Discord</a>
        </div>
      </div>
    </footer>
  );
}
