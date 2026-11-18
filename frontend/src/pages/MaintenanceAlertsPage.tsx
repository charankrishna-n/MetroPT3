import { useCallback, useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/StatusBadge'
import { usePolling } from '../hooks/usePolling'
import { getAlerts, acknowledgeAlert, resolveAlert } from '../services/api'
import type { Alert } from '../types'

export function MaintenanceAlertsPage() {
  const [filter, setFilter] = useState<'all' | 'unack' | 'resolved'>('all')
  const fetcher = useCallback(() => getAlerts(), [])
  const { data, refetch } = usePolling<{ alerts: Alert[]; count: number }>(fetcher, 3000)

  const alerts: Alert[] = data?.alerts ?? []

  const visible = alerts.filter(a => {
    if (filter === 'unack') return !a.acknowledged
    if (filter === 'resolved') return a.resolved
    return true
  })

  const handleAck = async (id: string) => {
    await acknowledgeAlert(id)
    refetch()
  }

  const handleResolve = async (id: string) => {
    await resolveAlert(id)
    refetch()
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Maintenance Alerts</h1>
        <div className="flex gap-2">
          {(['all', 'unack', 'resolved'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors
                ${filter === f ? 'bg-accent text-white' : 'bg-surface border border-border text-slate-400 hover:text-white'}`}
            >
              {f === 'all' ? 'All' : f === 'unack' ? 'Unacknowledged' : 'Resolved'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-white">{alerts.length}</div>
          <div className="text-xs text-slate-400">Total Alerts</div>
        </div>
        <div className="bg-surface border border-yellow-400/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{alerts.filter(a => !a.acknowledged).length}</div>
          <div className="text-xs text-slate-400">Unacknowledged</div>
        </div>
        <div className="bg-surface border border-green-500/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{alerts.filter(a => a.resolved).length}</div>
          <div className="text-xs text-slate-400">Resolved</div>
        </div>
      </div>

      {visible.length === 0 ? (
        <Card>
          <p className="text-slate-500 text-sm text-center py-8">
            {alerts.length === 0 ? 'No alerts generated yet. Start the simulation.' : 'No alerts match the current filter.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {visible.slice().reverse().map(alert => (
            <div
              key={alert.id}
              className={`bg-surface border rounded-xl p-4 transition-all
                ${alert.resolved ? 'border-green-500/20 opacity-60' : alert.acknowledged ? 'border-border' : 'border-red-500/40'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className={alert.severity === 'HIGH' ? 'text-red-400' : 'text-yellow-400'} />
                  <span className="text-sm font-semibold text-white">Alert #{alert.alert_number}</span>
                  <StatusBadge status={alert.severity} />
                  {alert.acknowledged && <span className="text-xs text-green-400">✓ Acknowledged</span>}
                  {alert.resolved && <span className="text-xs text-blue-400">✓ Resolved</span>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {!alert.acknowledged && (
                    <button
                      onClick={() => handleAck(alert.id)}
                      className="flex items-center gap-1 px-2 py-1 bg-yellow-400/10 border border-yellow-400/30 rounded-lg text-xs text-yellow-400 hover:bg-yellow-400/20 transition-colors"
                    >
                      <CheckCircle size={12} /> Acknowledge
                    </button>
                  )}
                  {!alert.resolved && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-green-400 hover:bg-green-500/20 transition-colors"
                    >
                      <XCircle size={12} /> Resolve
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-slate-400">
                <span><span className="text-slate-500">Time:</span> {new Date(alert.timestamp).toLocaleString()}</span>
                <span><span className="text-slate-500">Score:</span> {alert.anomaly_score.toFixed(5)}</span>
                <span><span className="text-slate-500">Threshold:</span> {alert.threshold.toFixed(5)}</span>
                <span><span className="text-slate-500">Sensors:</span> {alert.top_sensors.join(', ')}</span>
              </div>
              <p className="mt-2 text-xs text-slate-400 border-t border-border pt-2">{alert.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
