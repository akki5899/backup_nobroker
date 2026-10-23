export default function PropertyCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl h-full overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-slate-800 animate-pulse flex flex-col relative w-full">
      <div className="h-52 sm:h-60 md:h-64 bg-slate-200 dark:bg-slate-800 w-full" />
      <div className="p-5 flex-1 flex flex-col">
        <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg mb-2.5 w-1/3" />
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg mb-2 w-3/4" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2 mb-4" />
        <div className="flex gap-4 border-y border-slate-100 dark:border-slate-850 py-3 mb-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12" />
        </div>
        <div className="flex justify-between items-center mt-auto pt-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-16" />
          </div>
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}
