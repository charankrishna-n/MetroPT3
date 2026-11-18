import { Wifi, WifiOff } from 'lucide-react'
import { StatusBadge } from './ui/StatusBadge'

interface TopBarProps {
  status: string
  simStatus: string
  lastTimestamp: string | null
  wsConnected: boolean
}

export function TopBar({ status, simStatus, lastTimestamp, wsConnected }: TopBarProps) {
  return (
    <header className="h-12 bg-surface border-b border-border flex items-center justify-between px-5 shrink-0">
      <span className="text-sm font-semibold text-white">
        Deep Learning-Based Early Failure Detection — Metro Train APU
      </span>
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          {wsConnected
            ? <Wifi size={13} className="text-green-400" />
            : <WifiOff size={13} className="text-red-400" />}
          {wsConnected ? 'Live' : 'Disconnected'}
        </span>
        <StatusBadge status={status} />
        <StatusBadge status={simStatus} />
        {lastTimestamp && (
          <span className="text-slate-500 hidden lg:block">
            {new Date(lastTimestamp).toLocaleString()}
          </span>
        )}
      </div>
    </header>
  )
}
