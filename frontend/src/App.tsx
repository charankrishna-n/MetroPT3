import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { useSimulationWS } from './hooks/useSimulationWS'
import { OverviewPage } from './pages/OverviewPage'
import { SensorMonitoringPage } from './pages/SensorMonitoringPage'
import { AnomalyDetectionPage } from './pages/AnomalyDetectionPage'
import { ExplainabilityPage } from './pages/ExplainabilityPage'
import { MaintenanceAlertsPage } from './pages/MaintenanceAlertsPage'
import { SimulationPage } from './pages/SimulationPage'
import { ModelInfoPage } from './pages/ModelInfoPage'

type Page = 'overview' | 'sensors' | 'anomaly' | 'explainability' | 'alerts' | 'simulation' | 'models'

export default function App() {
  const [page, setPage] = useState<Page>('overview')
  const { frames, latest, connected, clearFrames } = useSimulationWS()

  const status = latest?.status ?? 'NORMAL'
  const simStatus = frames.length > 0
    ? (latest?.alarm_triggered ? 'ANOMALY' : latest?.is_anomaly ? 'WARNING' : 'running')
    : 'idle'

  const renderPage = () => {
    switch (page) {
      case 'overview':      return <OverviewPage frames={frames} />
      case 'sensors':       return <SensorMonitoringPage frames={frames} latest={latest} />
      case 'anomaly':       return <AnomalyDetectionPage frames={frames} latest={latest} />
      case 'explainability':return <ExplainabilityPage latest={latest} />
      case 'alerts':        return <MaintenanceAlertsPage />
      case 'simulation':    return <SimulationPage frames={frames} latest={latest} wsConnected={connected} onClear={clearFrames} />
      case 'models':        return <ModelInfoPage />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-white">
      <Sidebar active={page} onNavigate={(id) => setPage(id as Page)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          status={status}
          simStatus={simStatus}
          lastTimestamp={latest?.timestamp ?? null}
          wsConnected={connected}
        />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
