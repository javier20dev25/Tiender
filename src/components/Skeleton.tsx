import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={`bg-zinc-800 animate-pulse rounded-md ${className}`} />
);

export const DashboardSkeleton: React.FC = () => (
  <div className="w-full space-y-8 animate-in fade-in duration-500">
    {/* Header Skeleton */}
    <div className="p-8 rounded-[40px] bg-zinc-900/50 border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="w-48 h-8" />
          <Skeleton className="w-32 h-4" />
        </div>
      </div>
      <Skeleton className="w-40 h-12 rounded-2xl" />
    </div>

    {/* Stats Grid Skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-6 rounded-[30px] bg-zinc-900/50 border border-white/5 space-y-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-16 h-8" />
        </div>
      ))}
    </div>

    {/* Main Content Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <Skeleton className="w-48 h-8 mb-6" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-3xl bg-zinc-900/50 border border-white/5 flex gap-4">
            <Skeleton className="w-20 h-20 rounded-2xl" />
            <div className="flex-grow space-y-2 py-2">
              <Skeleton className="w-1/2 h-6" />
              <Skeleton className="w-1/4 h-4" />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-6">
        <Skeleton className="w-48 h-8" />
        <div className="p-6 rounded-[30px] bg-zinc-900/50 border border-white/5 h-64">
           <Skeleton className="w-full h-full rounded-2xl" />
        </div>
      </div>
    </div>
  </div>
);
