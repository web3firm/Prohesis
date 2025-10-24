"use client";

export default function SkeletonCard() {
  return (
    <div className="card p-4 md:p-6 flex flex-col justify-between">
      <div className="animate-pulse">
        {/* Header with status badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 space-y-2">
            <div className="h-2 w-12 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-4/5 bg-gray-200 rounded" />
            <div className="h-3 w-32 bg-gray-200 rounded mt-2" />
          </div>
          <div className="space-y-2">
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
            <div className="h-4 w-16 bg-gray-200 rounded" />
          </div>
        </div>

        {/* Pool distribution bar */}
        <div className="space-y-2 mb-4">
          <div className="h-2 w-full bg-gray-200 rounded-full" />
          <div className="flex justify-between">
            <div className="h-3 w-16 bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <div className="h-9 flex-1 bg-gray-200 rounded-lg" />
          <div className="h-9 w-20 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
