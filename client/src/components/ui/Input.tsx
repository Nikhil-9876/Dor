import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, id, className, ...props }: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  const helperId = inputId ? `${inputId}-helper` : undefined

  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="label">{label}</label>}
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={helperId}
        className={cn(
          'input focus-visible:ring-2 focus-visible:ring-primary-500 focus:outline-none',
          error && 'border-red-500 focus-visible:ring-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p id={helperId} className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={helperId} className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export function Textarea({ label, error, hint, id, className, ...props }: TextareaProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  const helperId = inputId ? `${inputId}-helper` : undefined

  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="label">{label}</label>}
      <textarea
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={helperId}
        className={cn(
          'input resize-none focus-visible:ring-2 focus-visible:ring-primary-500 focus:outline-none',
          error && 'border-red-500 focus-visible:ring-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p id={helperId} className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={helperId} className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}
    </div>
  )
}
