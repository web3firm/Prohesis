// File: src/lib/offchain/api/bets.ts
export async function recordBet(params: { txHash: `0x${string}`; userId: string }) {
  const res = await fetch("/api/bets/place", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }
  return json;
}
