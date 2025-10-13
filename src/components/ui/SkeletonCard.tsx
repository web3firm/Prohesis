"use client";

export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl bg-white/60 backdrop-blur border p-4 shadow-sm">
      <div className="h-4 w-2/3 bg-gray-200 rounded mb-3" />
      <div className="h-3 w-1/2 bg-gray-200 rounded mb-6" />
      <div className="h-24 bg-gray-100 rounded mb-4" />
      <div className="flex gap-2">
        <div className="h-6 w-20 bg-gray-200 rounded" />
        <div className="h-6 w-20 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
