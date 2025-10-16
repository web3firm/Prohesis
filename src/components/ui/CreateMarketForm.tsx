"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/Toaster";
import Modal from "./Modal";
import { useWriteContract } from "wagmi";
import { abi as factoryAbi } from "@/lib/onchain/abis/MarketFactory.json";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  factoryAddress: `0x${string}`;
}

export default function CreateMarketForm({ isOpen, onClose, factoryAddress }: Props) {
  const [title, setTitle] = useState("");
  const [endDate, setEndDate] = useState("");
  const [creating, setCreating] = useState(false);
  const { writeContractAsync } = useWriteContract();
  const { addToast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
  if (!title || !endDate) return addToast("Please fill in all fields", "error");

    try {
      setCreating(true);
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

      const tx = await writeContractAsync({
        address: factoryAddress,
        abi: factoryAbi,
        functionName: "createMarket",
        args: [title, BigInt(endTimestamp)],
        value: 0n,
      });

      console.log("tx:", tx);
      addToast("✅ Market created successfully!", "success");
      onClose();
    } catch (err) {
      console.error(err);
      addToast("❌ Failed to create market", "error");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Market">
      <form onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Will ETH reach $5k by next month?"
          className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
          End Date
        </label>
        <input
          type="datetime-local"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full mb-6 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex justify-between gap-3">
          <button
            type="button"
            className="btn-ghost flex-1"
            onClick={onClose}
            disabled={creating}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={creating}
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
