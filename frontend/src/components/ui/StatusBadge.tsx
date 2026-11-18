interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

const colours: Record<string, string> = {
  NORMAL: 'bg-green-500/20 text-green-400 border-green-500/30',
  WARNING: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30',
  ANOMALY: 'bg-red-500/20 text-red-400 border-red-500/30',
  running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  paused: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30',
  stopped: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  idle: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  HIGH: 'bg-red-500/20 text-red-400 border-red-500/30',
  MEDIUM: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30',
  LOW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const cls = colours[status] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  return (
    <span className={`inline-flex items-center border rounded-full font-medium ${pad} ${cls}`}>
      {status}
    </span>
  )
}
