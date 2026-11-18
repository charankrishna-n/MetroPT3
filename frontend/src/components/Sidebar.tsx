import {
  LayoutDashboard, Activity, AlertTriangle, Brain,
  Bell, Play, Info, Cpu
} from 'lucide-react'

const NAV = [
  { id: 'overview',     label: 'Overview',          icon: LayoutDashboard },
  { id: 'sensors',      label: 'Sensor Monitoring',  icon: Activity },
  { id: 'anomaly',      label: 'Anomaly Detection',  icon: AlertTriangle },
  { id: 'explainability', label: 'Explainable AI',   icon: Brain },
  { id: 'alerts',       label: 'Maintenance Alerts', icon: Bell },
  { id: 'simulation',   label: 'Simulation',         icon: Play },
  { id: 'models',       label: 'Model Information',  icon: Info },
]

interface SidebarProps {
  active: string
  onNavigate: (id: string) => void
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="w-56 shrink-0 bg-surface border-r border-border flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2 px-4 py-5 border-b border-border">
        <Cpu size={20} className="text-accent-light" />
        <span className="text-sm font-bold text-white leading-tight">MetroPT-3<br /><span className="text-accent-light font-normal text-xs">Predictive Maintenance</span></span>
      </div>
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
              ${active === id
                ? 'bg-accent/20 text-accent-light border-r-2 border-accent'
                : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-border text-xs text-slate-600">
        B.Tech Final Year Project<br />CSE (AI &amp; ML)
      </div>
    </aside>
  )
}
