export function AVenir({ titre, etape, children }: { titre: string; etape: string; children: React.ReactNode }) {
  return (
    <div className="max-w-2xl space-y-3 rounded-2xl border border-ligne bg-carte p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-doux">{etape} — à venir</p>
      <h1 className="text-2xl font-bold">{titre}</h1>
      <div className="space-y-2 text-doux">{children}</div>
    </div>
  )
}
