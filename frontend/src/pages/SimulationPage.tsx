import { useState, useCallback } from 'react'
import { Play, Pause, Square, RotateCcw, Wifi, WifiOff } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/StatusBadge'
import { MetricCard } from '../components/ui/MetricCard'
import {
  startSimulation, pauseSimulation, resumeSimulation,
  stopSimulation, resetSimulation
} from '../services/api'
import { usePolling } from '../hooks/usePolling'
import { getSimulationStatus } from '../services/api'
import type { SimulationFrame, SimStatus } from '../types'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface Props {
  frames: SimulationFrame[]
  latest: SimulationFrame | null
  wsConnected: boolean
  onClear: () => void
}

const SPEEDS = [1, 2, 5, 10, 50, 100, 500] as const
type Speed = typeof SPEEDS[number]

export function SimulationPage({ frames, latest, wsConnected, onClear }: Props) {
  const [speed, setSpeed] = useState<Speed>(1)
  const [loading, setLoading] = useState(false)

  const fetcher = useCallback(() => getSimulationStatus(), [])
  const { data: simStatus, refetch } = usePolling<SimStatus>(fetcher, 1000)

  const status = simStatus?.status ?? 'idle'
  const isRunning = status === 'running'
  const isPaused = status === 'paused'

  const act = async (fn: () => Promise<unknown>) => {
    setLoading(true)
    try { await fn() } finally { setLoading(false); refetch() }
  }

  const chartData = frames.slice(-120).map(f => ({
    t: f.timestamp.slice(11, 19),
    score: +f.anomaly_score.toFixed(5),
    threshold: +f.threshold.toFixed(5),
  }))

  const progress = simStatus?.progress_pct ?? 0
  const rowsLeft = (simStatus?.total_rows ?? 0) - (simStatus?.readings_processed ?? 0)
  const rowsPerSec = speed
  const etaSec = rowsPerSec > 0 && rowsLeft > 0 ? Math.ceil(rowsLeft / rowsPerSec) : null
  const etaStr = etaSec == null ? null
    : etaSec < 60 ? `${etaSec}s`
    : etaSec < 3600 ? `${Math.ceil(etaSec / 60)}m`
    : `${(etaSec / 3600).toFixed(1)}h`

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Historical Data Simulation</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Replaying MetroPT-3 dataset chronologically — not live physical sensor data
          </p>
        </div>
        <div className="flex items-center gap-2">
          {wsConnected
            ? <span className="flex items-center gap-1 text-xs text-green-400"><Wifi size={12} /> Live</span>
            : <span className="flex items-center gap-1 text-xs text-red-400"><WifiOff size={12} /> Disconnected</span>}
          <StatusBadge status={status} size="md" />
        </div>
      </div>

      {/* HISTORICAL DATA SIMULATION label */}
      <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-2 text-center">
        <span className="text-accent-light font-bold tracking-widest text-sm uppercase">
          ⏱ Historical Data Simulation
        </span>
      </div>

      {/* Controls */}
      <Card title="Simulation Controls">
        <div className="flex flex-wrap items-center gap-3">
          {/* Speed selector */}
          <div className="flex items-center gap-1 bg-bg rounded-lg p-1">
            {SPEEDS.map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                disabled={isRunning}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors
                  ${speed === s ? 'bg-accent text-white' : 'text-slate-400 hover:text-white disabled:opacity-40'}`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Action buttons */}
          {!isRunning && !isPaused && (
            <button
              onClick={() => act(() => startSimulation(speed))}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Play size={14} /> Start
            </button>
          )}
          {isRunning && (
            <button
              onClick={() => act(pauseSimulation)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 rounded-lg text-sm font-medium hover:bg-yellow-500/30 transition-colors"
            >
              <Pause size={14} /> Pause
            </button>
          )}
          {isPaused && (
            <button
              onClick={() => act(resumeSimulation)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/40 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors"
            >
              <Play size={14} /> Resume
            </button>
          )}
          {(isRunning || isPaused) && (
            <button
              onClick={() => act(stopSimulation)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
            >
              <Square size={14} /> Stop
            </button>
          )}
          <button
            onClick={() => { act(resetSimulation); onClear() }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-slate-400 rounded-lg text-sm font-medium hover:text-white transition-colors"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>
              {simStatus?.readings_processed?.toLocaleString() ?? 0} / {simStatus?.total_rows?.toLocaleString() ?? '—'} readings
              {isRunning && etaStr && <span className="ml-2 text-slate-500">· ETA {etaStr}</span>}
            </span>
            <span className="flex items-center gap-2">
              {isRunning && <span className="text-accent-light font-medium">{speed}x</span>}
              {progress.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Current Timestamp" value={latest?.timestamp?.slice(11, 19) ?? '—'} sub={latest?.timestamp?.slice(0, 10)} />
        <MetricCard label="Anomaly Score" value={latest?.anomaly_score?.toFixed(5) ?? '—'} highlight={latest?.is_anomaly ? 'anomaly' : 'normal'} />
        <MetricCard label="Status" value={latest?.status ?? 'NORMAL'} highlight={latest?.status === 'ANOMALY' ? 'anomaly' : latest?.status === 'WARNING' ? 'warning' : 'normal'} />
        <MetricCard label="Alarm (3-of-5)" value={latest?.alarm_triggered ? 'TRIGGERED' : 'Clear'} highlight={latest?.alarm_triggered ? 'anomaly' : 'normal'} />
      </div>

      {/* Live chart */}
      <Card title="Live Anomaly Score">
        {chartData.length === 0 ? (
          <p className="text-slate-500 text-sm py-8 text-center">Start simulation to see live data</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" tick={{ fill: '#64748b', fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} width={60} />
              <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 8 }} />
              <ReferenceLine y={latest?.threshold} stroke="#ef4444" strokeDasharray="4 2" />
              <Area type="monotone" dataKey="score" stroke="#7c3aed" fill="url(#simGrad)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Current explanation */}
      {latest && (
        <Card title="Current Sensor Explanation">
          <p className="text-sm text-slate-300">{latest.explanation}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {latest.top5_sensors.map(s => (
              <span key={s.name} className="px-2 py-1 bg-accent/10 border border-accent/20 rounded-lg text-xs text-accent-light">
                {s.name}: {s.contribution_pct.toFixed(1)}%
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
