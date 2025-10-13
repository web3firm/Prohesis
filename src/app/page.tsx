"use client";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
      <h1 className="text-4xl font-bold mb-6">Welcome to Prohesis</h1>
      <p className="mb-8 text-gray-400 text-lg">Your Web3 Prediction Market</p>

      <Link
        href="/user"
        className="px-6 py-3 bg-blue-600 rounded-xl hover:bg-blue-700 transition"
      >
        Go to User Markets →
      </Link>
    </div>
  );
}
