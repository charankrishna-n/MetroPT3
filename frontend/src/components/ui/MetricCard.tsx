import React from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: React.ReactNode
  highlight?: 'normal' | 'warning' | 'anomaly'
}

const highlights = {
  normal: 'border-green-500/40',
  warning: 'border-yellow-400/40',
  anomaly: 'border-red-500/40',
}

export function MetricCard({ label, value, sub, icon, highlight }: MetricCardProps) {
  const border = highlight ? highlights[highlight] : 'border-border'
  return (
    <div className={`bg-surface border ${border} rounded-xl p-4 flex flex-col gap-1`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>
      <span className="text-2xl font-bold text-white">{value}</span>
      {sub && <span className="text-xs text-slate-500">{sub}</span>}
    </div>
  )
}
