// Shown instantly when moving between dashboard pages, while the next page's data loads.
// The sidebar stays in place; only the main area swaps to this placeholder.
export default function DashboardLoading() {
  return (
    <div
      className="mx-auto max-w-5xl px-4 py-6 md:px-10 md:py-9"
      role="status"
      aria-label="Loading"
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-44 rounded-lg bg-muted animate-pulse motion-reduce:animate-none" />
          <div className="h-4 w-64 rounded-md bg-muted animate-pulse motion-reduce:animate-none" />
        </div>
        <div className="h-10 w-32 rounded-[10px] bg-muted animate-pulse motion-reduce:animate-none" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="h-32 rounded-xl border border-border bg-card p-5"
          >
            <div className="h-3 w-24 rounded bg-muted animate-pulse motion-reduce:animate-none" />
            <div className="mt-3 h-8 w-20 rounded-md bg-muted animate-pulse motion-reduce:animate-none" />
            <div className="mt-3 h-3 w-32 rounded bg-muted animate-pulse motion-reduce:animate-none" />
          </div>
        ))}
      </div>
    </div>
  )
}
