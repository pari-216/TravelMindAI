import React from "react";

export function SkeletonCircle({ size = "w-10 h-10" }) {
  return (
    <div className={`${size} rounded-full bg-white animate-pulse`} />
  );
}

export function SkeletonLine({ width = "w-full", height = "h-4", className = "" }) {
  return (
    <div className={`${width} ${height} rounded bg-white animate-pulse ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-sky-100 rounded-3xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <SkeletonCircle size="w-12 h-12" />
        <div className="space-y-2 flex-1">
          <SkeletonLine width="w-2/3" height="h-5" />
          <SkeletonLine width="w-1/3" height="h-3" />
        </div>
      </div>
      <SkeletonLine width="w-full" height="h-16" />
      <div className="flex gap-2 justify-end">
        <SkeletonLine width="w-20" height="h-8" />
        <SkeletonLine width="w-20" height="h-8" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white border border-sky-100 rounded-2xl p-5 space-y-3">
          <SkeletonCircle size="w-8 h-8 mx-auto" />
          <SkeletonLine width="w-1/2 mx-auto" height="h-6" />
          <SkeletonLine width="w-2/3 mx-auto" height="h-3" />
        </div>
      ))}
    </div>
  );
}
