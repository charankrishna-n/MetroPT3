import { Card } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/StatusBadge'
import { MetricCard } from '../components/ui/MetricCard'
import type { SimulationFrame } from '../types'
import {
  ComposedChart, Line, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'

interface Props { frames: SimulationFrame[]; latest: SimulationFrame | null }

export function AnomalyDetectionPage({ frames, latest }: Props) {
  const chartData = frames.slice(-150).map(f => ({
    t: f.timestamp.slice(11, 19),
    score: +f.anomaly_score.toFixed(5),
    threshold: +f.threshold.toFixed(5),
    anomaly: f.is_anomaly ? f.anomaly_score : null,
  }))

  const anomalyCount = frames.filter(f => f.is_anomaly).length
  const alarmCount = frames.filter(f => f.alarm_triggered).length
  const maxScore = frames.length ? Math.max(...frames.map(f => f.anomaly_score)) : 0

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Anomaly Detection</h1>
        <StatusBadge status={latest?.status ?? 'NORMAL'} size="md" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Current Score" value={latest?.anomaly_score?.toFixed(5) ?? '—'} />
        <MetricCard label="Threshold" value={latest?.threshold?.toFixed(5) ?? '—'} />
        <MetricCard
          label="Anomaly Steps"
          value={anomalyCount}
          highlight={anomalyCount > 0 ? 'warning' : 'normal'}
        />
        <MetricCard
          label="Alarm Triggers"
          value={alarmCount}
          highlight={alarmCount > 0 ? 'anomaly' : 'normal'}
        />
      </div>

      <Card title="Reconstruction Error Timeline">
        {chartData.length === 0 ? (
          <p className="text-slate-500 text-sm py-8 text-center">Start simulation to see anomaly scores</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" tick={{ fill: '#64748b', fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} width={60} />
              <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <ReferenceLine y={latest?.threshold} stroke="#ef4444" strokeDasharray="4 2" />
              <Area type="monotone" dataKey="score" fill="url(#areaGrad)" stroke="#7c3aed" strokeWidth={1.5} dot={false} name="Score" />
              <Line type="monotone" dataKey="threshold" stroke="#ef4444" strokeWidth={1} dot={false} strokeDasharray="4 2" name="Threshold" />
              <Line type="monotone" dataKey="anomaly" stroke="#f87171" strokeWidth={0} dot={{ r: 3, fill: '#f87171' }} name="Anomaly" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Current Reading">
          {latest ? (
            <div className="space-y-2 text-sm">
              <Row label="Timestamp" value={latest.timestamp} />
              <Row label="Score" value={latest.anomaly_score.toFixed(6)} />
              <Row label="Threshold" value={latest.threshold.toFixed(6)} />
              <Row label="Exceeds Threshold" value={latest.is_anomaly ? '⚠ YES' : '✓ NO'} />
              <Row label="Alarm (3-of-5)" value={latest.alarm_triggered ? '🔴 TRIGGERED' : '—'} />
              <Row label="Status" value={<StatusBadge status={latest.status} />} />
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No data yet</p>
          )}
        </Card>

        <Card title="Session Statistics">
          <div className="space-y-2 text-sm">
            <Row label="Total Frames" value={frames.length} />
            <Row label="Anomaly Frames" value={anomalyCount} />
            <Row label="Alarm Triggers" value={alarmCount} />
            <Row label="Max Score" value={maxScore.toFixed(6)} />
            <Row label="Anomaly Rate" value={frames.length ? `${(anomalyCount / frames.length * 100).toFixed(1)}%` : '—'} />
          </div>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center border-b border-border pb-1.5">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  )
}
