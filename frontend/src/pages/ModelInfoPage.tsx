import { useCallback } from 'react'
import { Card } from '../components/ui/Card'
import { usePolling } from '../hooks/usePolling'
import { getModels, getModelComparison } from '../services/api'

export function ModelInfoPage() {
  const modelsFetcher = useCallback(() => getModels(), [])
  const compFetcher = useCallback(() => getModelComparison(), [])
  const { data: modelsData } = usePolling<{ models: ModelInfo[]; active_model: string }>(modelsFetcher, 30000)
  const { data: compData } = usePolling<ComparisonData>(compFetcher, 30000)

  const models: ModelInfo[] = modelsData?.models ?? []
  const active = modelsData?.active_model

  return (
    <div className="p-5 space-y-4">
      <h1 className="text-lg font-bold text-white">Model Information</h1>

      <div className="p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-xl text-xs text-yellow-300">
        ⚠ This system was evaluated on 4 historical failure events from the MetroPT-3 dataset.
        It is an experimental predictive maintenance tool and is NOT a certified railway safety system.
      </div>

      <div className="space-y-3">
        {models.map((m: ModelInfo) => (
          <Card key={m.id}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{m.name}</h3>
                  {m.id === active && (
                    <span className="px-2 py-0.5 bg-accent/20 border border-accent/30 rounded-full text-xs text-accent-light">Active</span>
                  )}
                  {m.default && (
                    <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded-full text-xs text-green-400">Default</span>
                  )}
                  {!m.available && (
                    <span className="px-2 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded-full text-xs text-slate-400">Unavailable</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">{m.description}</p>
              </div>
            </div>

            {m.available && m.architecture && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <InfoTile label="Type" value={m.architecture.type} />
                <InfoTile label="Input Features" value={m.architecture.input_features} />
                <InfoTile label="Sequence Length" value={m.architecture.seq_len} />
                <InfoTile label="Threshold" value={m.threshold?.toFixed(6) ?? '—'} />
                <InfoTile label="Encoder" value={m.architecture.encoder_dims?.join(' → ')} />
                <InfoTile label="Decoder" value={m.architecture.decoder_dims?.join(' → ')} />
                <InfoTile label="Activation" value={m.architecture.activation} />
                <InfoTile label="Checkpoint" value={m.checkpoint} />
              </div>
            )}

            {m.available && m.training && (
              <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs border-t border-border pt-3">
                <InfoTile label="Fold" value={m.training.fold} />
                <InfoTile label="Eval Event" value={m.training.evaluation_event} />
                <InfoTile label="Cal Event" value={m.training.calibration_event} />
                <InfoTile label="Alarm Policy" value={m.training.alarm_policy} />
              </div>
            )}
          </Card>
        ))}
      </div>

      {compData && (
        <Card title="Model Comparison">
          <p className="text-xs text-slate-400 mb-3">{compData.note}</p>
          <div className="space-y-2">
            {compData.models.map((m: CompModel) => (
              <div key={m.name} className="flex items-center justify-between p-3 bg-bg rounded-lg border border-border text-sm">
                <div>
                  <span className="font-medium text-white">{m.name}</span>
                  {m.fold && <span className="ml-2 text-xs text-slate-400">({m.fold})</span>}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {m.available
                    ? <span className="text-green-400">✓ Available</span>
                    : <span className="text-slate-500">✗ {m.notes}</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="bg-bg rounded-lg p-2">
      <div className="text-slate-500 text-xs mb-0.5">{label}</div>
      <div className="text-white font-medium truncate">{String(value ?? '—')}</div>
    </div>
  )
}

interface ModelInfo {
  id: string; name: string; description: string; available: boolean
  default?: boolean; checkpoint?: string; threshold?: number
  architecture?: { type: string; input_features: number; seq_len: number; encoder_dims: number[]; decoder_dims: number[]; activation: string }
  training?: { fold: string; evaluation_event: string; calibration_event: string; alarm_policy: string }
}
interface CompModel { name: string; fold?: string; available: boolean; notes?: string }
interface ComparisonData { note: string; models: CompModel[] }
