import { Card } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/StatusBadge'
import type { SimulationFrame } from '../types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts'

interface Props { latest: SimulationFrame | null }

const COLOURS = ['#7c3aed','#6d28d9','#5b21b6','#4c1d95','#3b0764']
const BAR_COLOURS = ['#7c3aed','#3b82f6','#06b6d4','#10b981','#f59e0b',
  '#ef4444','#ec4899','#8b5cf6','#14b8a6','#f97316',
  '#84cc16','#6366f1','#a855f7','#22d3ee','#fb923c']

export function ExplainabilityPage({ latest }: Props) {
  if (!latest) {
    return (
      <div className="p-5">
        <h1 className="text-lg font-bold text-white mb-4">Explainable AI</h1>
        <p className="text-slate-500 text-sm">Start the simulation to see sensor contribution analysis.</p>
      </div>
    )
  }

  const contribData = latest.sensor_details
    .map((s, i) => ({ name: s.name, contribution: +s.contribution_pct.toFixed(2), fill: BAR_COLOURS[i % BAR_COLOURS.length] }))
    .sort((a, b) => b.contribution - a.contribution)

  const top5 = latest.top5_sensors

  const actualVsRecon = top5.map(s => ({
    name: s.name,
    actual: +s.actual.toFixed(4),
    reconstructed: +s.reconstructed.toFixed(4),
  }))

  const radarData = top5.map(s => ({
    sensor: s.name,
    error: +s.error.toFixed(6),
  }))

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Explainable AI</h1>
        <StatusBadge status={latest.status} size="md" />
      </div>

      {/* Explanation banner */}
      <div className={`p-4 rounded-xl border text-sm ${latest.is_anomaly ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-green-500/10 border-green-500/30 text-green-300'}`}>
        <p className="font-medium mb-1">{latest.is_anomaly ? '⚠ Anomaly Detected' : '✓ Normal Operation'}</p>
        <p className="text-slate-300">{latest.explanation}</p>
        <p className="text-xs text-slate-500 mt-2">
          Note: Sensor contribution reflects reconstruction error magnitude, not physical causation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Contribution bar chart */}
        <Card title="Sensor Contribution (%)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={contribData} layout="vertical">
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={100} />
              <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 8 }} formatter={(v: number) => [`${v.toFixed(2)}%`, 'Contribution']} />
              <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                {contribData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Actual vs Reconstructed */}
        <Card title="Top 5 — Actual vs Reconstructed">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={actualVsRecon}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} width={60} />
              <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Bar dataKey="actual" fill="#3b82f6" name="Actual" radius={[4, 4, 0, 0]} />
              <Bar dataKey="reconstructed" fill="#7c3aed" name="Reconstructed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top 5 table */}
      <Card title="Top 5 Contributing Sensors">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase border-b border-border">
                <th className="text-left py-2 pr-4">Rank</th>
                <th className="text-left py-2 pr-4">Sensor</th>
                <th className="text-right py-2 pr-4">Actual</th>
                <th className="text-right py-2 pr-4">Reconstructed</th>
                <th className="text-right py-2 pr-4">Error</th>
                <th className="text-right py-2">Contribution</th>
              </tr>
            </thead>
            <tbody>
              {top5.map((s, i) => (
                <tr key={s.name} className="border-b border-border/50 hover:bg-white/5">
                  <td className="py-2 pr-4">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: COLOURS[i] }}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-2 pr-4 font-medium text-white">{s.name}</td>
                  <td className="py-2 pr-4 text-right text-slate-300">{s.actual.toFixed(4)}</td>
                  <td className="py-2 pr-4 text-right text-slate-300">{s.reconstructed.toFixed(4)}</td>
                  <td className="py-2 pr-4 text-right text-red-400">{s.error.toFixed(6)}</td>
                  <td className="py-2 text-right text-accent-light font-medium">{s.contribution_pct.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
