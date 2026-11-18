import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  badge?: React.ReactNode
}

export function Card({ children, className = '', title, badge }: CardProps) {
  return (
    <div className={`bg-surface border border-border rounded-xl p-4 ${className}`}>
      {(title || badge) && (
        <div className="flex items-center justify-between mb-3">
          {title && <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{title}</h3>}
          {badge}
        </div>
      )}
      {children}
    </div>
  )
}
