import React, { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  const toggle = () => {
    setCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem('sidebar_collapsed', String(next)) } catch {}
      return next
    })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-dark-bg">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
