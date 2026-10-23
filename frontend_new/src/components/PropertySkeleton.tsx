"use client";

export default function PropertySkeleton() {
    return (
        <div className="bg-card rounded-[2rem] h-full overflow-hidden shadow-lg border border-border animate-pulse flex flex-col relative w-full">
            <div className="h-56 sm:h-64 bg-slate-200 dark:bg-slate-800 w-full" />
            <div className="p-6 sm:p-7 flex-1">
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg mb-2 w-3/4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2 mb-6" />
                <div className="grid grid-cols-3 gap-4 border-y border-gray-100 dark:border-slate-700 py-4 mb-5">
                    <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                    <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                    <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                </div>
                <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-16" />
                    </div>
                    <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-24" />
                </div>
            </div>
        </div>
    );
}

export function PropertySkeletonGrid({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {Array.from({ length: count }).map((_, i) => (
                <PropertySkeleton key={i} />
            ))}
        </div>
    );
}
