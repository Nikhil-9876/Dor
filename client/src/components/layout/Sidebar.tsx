import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Mail, Settings, Zap, Users, ChevronLeft, ChevronRight, Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/templates', icon: FileText,         label: 'Templates' },
  { to: '/campaigns', icon: Mail,             label: 'Campaigns' },
  { to: '/contacts',  icon: Users,            label: 'Contacts' },
  { to: '/settings',  icon: Settings,         label: 'Settings' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <aside
      className={cn(
        'flex-shrink-0 h-full flex flex-col border-r border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface transition-all duration-200',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center border-b border-gray-100 dark:border-dark-border overflow-hidden',
          collapsed ? 'justify-center px-0 py-5' : 'gap-2.5 px-5 py-5'
        )}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md flex-shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-gray-900 dark:text-white text-base tracking-tight whitespace-nowrap">
            Dor
          </span>
        )}
      </div>

      {/* New Campaign quick button */}
      <div className={cn('px-3 pt-4 pb-2', collapsed && 'px-2')}>
        <button
          onClick={() => navigate('/campaigns/new')}
          title="New Campaign"
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-btn text-sm font-semibold transition-all duration-150',
            'bg-primary-500 hover:bg-primary-600 text-white shadow-sm',
            collapsed && 'justify-center px-0'
          )}
        >
          <Plus size={15} className="flex-shrink-0" />
          {!collapsed && <span>New Campaign</span>}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-btn text-sm font-medium transition-all duration-150',
                collapsed && 'justify-center px-0',
                active
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-elevated hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              <Icon size={16} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 py-3 border-t border-gray-100 dark:border-dark-border">
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-btn text-xs text-gray-400 dark:text-gray-600',
            'hover:bg-gray-100 dark:hover:bg-dark-elevated hover:text-gray-600 dark:hover:text-gray-400 transition-colors',
            collapsed && 'justify-center px-0'
          )}
        >
          {collapsed ? <ChevronRight size={15} /> : (
            <>
              <ChevronLeft size={15} />
              <span className="font-medium">Collapse</span>
            </>
          )}
        </button>
        {!collapsed && (
          <p className="text-[10px] text-gray-300 dark:text-gray-700 px-3 mt-1">Dor v1.0</p>
        )}
      </div>
    </aside>
  )
}
