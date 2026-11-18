import { Activity, AlertTriangle, BarChart2, Clock, Cpu, TrendingUp } from 'lucide-react'
import { useCallback } from 'react'
import { getOverview } from '../services/api'
import { usePolling } from '../hooks/usePolling'
import { MetricCard } from '../components/ui/MetricCard'
import { Card } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/StatusBadge'
import type { OverviewData } from '../types'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import type { SimulationFrame } from '../types'

interface OverviewPageProps { frames: SimulationFrame[] }

export function OverviewPage({ frames }: OverviewPageProps) {
  const fetcher = useCallback(() => getOverview(), [])
  const { data } = usePolling<OverviewData>(fetcher, 2000)

  const chartData = frames.slice(-100).map(f => ({
    t: f.timestamp.slice(11, 19),
    score: +f.anomaly_score.toFixed(5),
    threshold: +f.threshold.toFixed(5),
  }))

  const status = data?.current_status ?? 'NORMAL'
  const highlight = status === 'ANOMALY' ? 'anomaly' : status === 'WARNING' ? 'warning' : 'normal'

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">System Overview</h1>
        <StatusBadge status={status} size="md" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Readings Processed"
          value={data?.total_readings?.toLocaleString() ?? '—'}
          icon={<BarChart2 size={16} />}
        />
        <MetricCard
          label="Anomaly Score"
          value={data?.current_anomaly_score != null ? data.current_anomaly_score.toFixed(5) : '—'}
          sub={`Threshold: ${data?.threshold?.toFixed(5) ?? '—'}`}
          icon={<TrendingUp size={16} />}
          highlight={highlight}
        />
        <MetricCard
          label="Total Alerts"
          value={data?.total_alerts ?? 0}
          icon={<AlertTriangle size={16} />}
          highlight={data?.total_alerts ? 'warning' : 'normal'}
        />
        <MetricCard
          label="Simulation"
          value={data?.simulation_status ?? 'idle'}
          icon={<Activity size={16} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2" title="Anomaly Score Timeline">
          {chartData.length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center">Start simulation to see data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" tick={{ fill: '#64748b', fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} width={55} />
                <Tooltip
                  contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <ReferenceLine y={chartData[0]?.threshold} stroke="#ef4444" strokeDasharray="4 2" label={{ value: 'Threshold', fill: '#ef4444', fontSize: 10 }} />
                <Area type="monotone" dataKey="score" stroke="#7c3aed" fill="url(#scoreGrad)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="System Info">
          <div className="space-y-3 text-sm">
            <Row label="Model" value={data?.model_name ?? '—'} />
            <Row label="Status" value={<StatusBadge status={status} />} />
            <Row label="Sim Status" value={<StatusBadge status={data?.simulation_status ?? 'idle'} />} />
            <Row label="Last Update" value={data?.last_timestamp ? new Date(data.last_timestamp).toLocaleTimeString() : '—'} />
            <Row label="Threshold" value={data?.threshold?.toFixed(5) ?? '—'} />
          </div>
          <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-lg text-xs text-slate-400">
            <Cpu size={12} className="inline mr-1 text-accent-light" />
            Experimental system evaluated on 4 historical failure events. Not a certified railway safety system.
          </div>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center border-b border-border pb-2">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  )
}
