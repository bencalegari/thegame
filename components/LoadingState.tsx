export default function LoadingState() {
  return (
    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm animate-pulse">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-6 w-20 rounded-full bg-white/10" />
        <div className="h-6 w-16 rounded-full bg-white/10" />
      </div>
      <div className="mb-4 space-y-3 text-center">
        <div className="mx-auto h-4 w-24 rounded bg-white/10" />
        <div className="flex items-center justify-center gap-4">
          <div className="flex-1 space-y-1 flex flex-col items-end">
            <div className="h-5 w-32 rounded bg-white/10" />
            <div className="h-3 w-12 rounded bg-white/10" />
          </div>
          <div className="h-8 w-16 rounded bg-white/10" />
          <div className="flex-1 space-y-1">
            <div className="h-5 w-32 rounded bg-white/10" />
            <div className="h-3 w-12 rounded bg-white/10" />
          </div>
        </div>
      </div>
      <div className="mb-4 h-12 rounded-xl bg-white/5" />
      <div className="h-16 rounded-xl bg-white/5" />
      <div className="mt-4 mx-auto h-3 w-32 rounded bg-white/10" />
    </div>
  );
}
