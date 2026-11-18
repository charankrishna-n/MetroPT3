export interface SensorDetail {
  name: string
  actual: number
  reconstructed: number
  error: number
  contribution_pct: number
}

export interface SimulationFrame {
  timestamp: string
  index: number
  anomaly_score: number
  threshold: number
  is_anomaly: boolean
  alarm_triggered: boolean
  status: 'NORMAL' | 'WARNING' | 'ANOMALY'
  sensor_values: Record<string, number>
  sensor_details: SensorDetail[]
  top5_sensors: SensorDetail[]
  explanation: string
}

export interface Alert {
  id: string
  alert_number: number
  timestamp: string
  anomaly_score: number
  threshold: number
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  top_sensors: string[]
  description: string
  acknowledged: boolean
  resolved: boolean
}

export interface SimStatus {
  status: 'idle' | 'running' | 'paused' | 'stopped' | 'completed'
  speed: number
  current_index: number
  total_rows: number
  readings_processed: number
  progress_pct: number
  alert_count: number
}

export interface OverviewData {
  total_readings: number
  current_anomaly_score: number | null
  current_status: string
  total_alerts: number
  threshold: number
  simulation_status: string
  last_timestamp: string | null
  model_name: string
}
