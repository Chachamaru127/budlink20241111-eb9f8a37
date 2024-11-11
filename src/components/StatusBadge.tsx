"use client"

import React from 'react'

interface StatusBadgeProps {
  status: string
  type: 'success' | 'warning' | 'error'
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type }) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <span
      data-testid="status-badge"
      className={`${getBackgroundColor()} px-2 py-1 rounded-full text-white text-sm font-medium inline-block`}
    >
      {status}
    </span>
  )
}

export default StatusBadge