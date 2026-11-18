import { useState } from 'react'
import { Card } from '../components/ui/Card'
import type { SimulationFrame } from '../types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const SENSORS = [
  'TP2','TP3','H1','DV_pressure','Reservoirs',
  'Oil_temperature','Motor_current','COMP','DV_eletric',
  'Towers','MPG','LPS','Pressure_switch','Oil_level','Caudal_impulses'
]

interface Props { frames: SimulationFrame[]; latest: SimulationFrame | null }

export function SensorMonitoringPage({ frames, latest }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  const visible = SENSORS.filter(s => s.toLowerCase().includes(filter.toLowerCase()))

  const chartData = frames.slice(-80).map(f => ({
    t: f.timestamp.slice(11, 19),
    ...Object.fromEntries(SENSORS.map(s => [s, +(f.sensor_values[s] ?? 0).toFixed(4)]))
  }))

  const getStats = (sensor: string) => {
    const vals = frames.map(f => f.sensor_values[sensor] ?? 0)
    if (!vals.length) return { min: '—', max: '—', avg: '—' }
    return {
      min: Math.min(...vals).toFixed(4),
      max: Math.max(...vals).toFixed(4),
      avg: (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(4),
    }
  }

  const isAbnormal = (sensor: string) =>
    !!(latest?.top5_sensors?.some(s => s.name === sensor) && latest?.is_anomaly)

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Sensor Monitoring</h1>
        <input
          className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent"
          placeholder="Filter sensors…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {visible.map(sensor => {
          const val = latest?.sensor_values[sensor]
          const abnormal = isAbnormal(sensor)
          return (
            <button
              key={sensor}
              onClick={() => setSelected(selected === sensor ? null : sensor)}
              className={`text-left p-3 rounded-xl border transition-all
                ${selected === sensor
                  ? 'border-accent bg-accent/10'
                  : abnormal
                  ? 'border-red-500/50 bg-red-500/5'
                  : 'border-border bg-surface hover:border-slate-500'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-300 truncate">{sensor}</span>
                {abnormal && <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />}
              </div>
              <div className="text-lg font-bold text-white">
                {val != null ? val.toFixed(3) : '—'}
              </div>
            </button>
          )
        })}
      </div>

      {selected ? (
        <Card title={`${selected} — Time Series`}>
          <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
            {Object.entries(getStats(selected)).map(([k, v]) => (
              <div key={k} className="bg-bg rounded-lg p-2 text-center">
                <div className="text-slate-400 uppercase">{k}</div>
                <div className="text-white font-bold">{v}</div>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <XAxis dataKey="t" tick={{ fill: '#64748b', fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} width={60} />
              <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 8 }} />
              <Line type="monotone" dataKey={selected} stroke="#7c3aed" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      ) : (
        <p className="text-slate-500 text-sm text-center py-4">Click a sensor card to view its time-series chart</p>
      )}
    </div>
  )
}
