"use client";

import { useEffect, useState } from "react";
import { Address, parseEther } from "viem";
import { useWriteContract } from "wagmi";
import { FACTORY_ADDRESS, MARKET_FACTORY_ABI } from "@/lib/onchain/contract";
import { readAllMarkets, MarketSummary } from "@/lib/onchain/readFunctions";
import { Spinner } from "@/components/ui/Spinner";
import { format } from "date-fns";

export default function AdminMarketsPage() {
  const [markets, setMarkets] = useState<MarketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [txMsg, setTxMsg] = useState<string | null>(null);

  // form
  const [question, setQuestion] = useState("");
  const [endTime, setEndTime] = useState("");
  const [initialLiquidity, setInitialLiquidity] = useState("");

  const createTx = useWriteContract();
  const resolveTx = useWriteContract();

  useEffect(() => {
    (async () => {
      setMarkets(await readAllMarkets());
      setLoading(false);
    })();
  }, []);

  async function handleCreate() {
    if (!question || !endTime || !initialLiquidity) {
      setTxMsg("Please fill all fields");
      return;
    }
    try {
      setTxMsg("Creating market...");
      const tx = await createTx.writeContract({
        address: FACTORY_ADDRESS,
        abi: MARKET_FACTORY_ABI,
        functionName: "createMarket",
        args: [question, BigInt(Math.floor(new Date(endTime).getTime() / 1000))],
        value: parseEther(initialLiquidity),
      });
      await tx.wait();
      setTxMsg("✅ Market created");
      setMarkets(await readAllMarkets());
      setQuestion(""); setEndTime(""); setInitialLiquidity("");
    } catch (e: any) {
      setTxMsg("❌ " + (e.shortMessage || e.message));
    }
  }

  async function handleResolve(addr: Address, winning: 1 | 2) {
    try {
      setTxMsg("Resolving market...");
      const tx = await resolveTx.writeContract({
        address: addr,
        abi: [{ type: "function", name: "resolve", inputs: [{ type: "uint8" }], outputs: [], stateMutability: "nonpayable" }],
        functionName: "resolve",
        args: [winning],
      });
      await tx.wait();
      setTxMsg("✅ Resolved");
      setMarkets(await readAllMarkets());
    } catch (e: any) {
      setTxMsg("❌ " + (e.shortMessage || e.message));
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="max-w-5xl mx-auto mt-12 space-y-10">
      <section className="card p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Admin: Markets</h1>
        <p className="text-gray-500">Create & resolve markets on-chain</p>
      </section>

      <section className="card p-8 space-y-3">
        <h2 className="text-xl font-semibold text-gray-800">Create Market</h2>
        <input className="w-full border rounded-lg px-4 py-2" placeholder="Question"
               value={question} onChange={e=>setQuestion(e.target.value)} />
        <input className="w-full border rounded-lg px-4 py-2" type="datetime-local"
               value={endTime} onChange={e=>setEndTime(e.target.value)} />
        <input className="w-full border rounded-lg px-4 py-2" type="number" step="0.0001"
               placeholder="Initial Liquidity (ETH)" value={initialLiquidity}
               onChange={e=>setInitialLiquidity(e.target.value)} />
        <button onClick={handleCreate} className="btn-primary w-full">
          {createTx.isPending ? "Creating..." : "Create Market"}
        </button>
        {txMsg && <p className="text-sm text-center text-gray-600">{txMsg}</p>}
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">All Markets</h2>
        {markets.length === 0 ? (
          <p className="text-gray-500">No markets found.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {markets.map(m => {
              const yes = Number(m.totalYes), no = Number(m.totalNo);
              const total = yes + no || 1, y = (yes/total)*100, n = 100 - y;
              return (
                <div key={m.address} className="card p-6 space-y-3">
                  <h3 className="font-semibold text-gray-900">{m.question}</h3>
                  <div className="text-sm text-gray-500">
                    <p>Address: {m.address}</p>
                    <p>Ends: {format(new Date(m.endTime*1000), "PP")}</p>
                    <p>Volume: <span className="font-medium">{m.volumeEth} ETH</span></p>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                    <div className="bg-blue-500" style={{width:`${y}%`}} />
                    <div className="bg-red-400" style={{width:`${n}%`}} />
                  </div>
                  {!m.resolved ? (
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <button className="btn-ghost" onClick={()=>handleResolve(m.address, 1)}>Resolve Yes</button>
                      <button className="btn-ghost" onClick={()=>handleResolve(m.address, 2)}>Resolve No</button>
                    </div>
                  ) : (
                    <p className="text-green-600 text-sm font-medium">✅ Resolved ({m.outcome===1?'Yes':'No'})</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
