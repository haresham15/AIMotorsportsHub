'use client'

import { useState } from 'react'
import { Star, UserPlus } from 'lucide-react'

interface MySupportedProps {
  series: string
}

interface FollowedDriver {
  driver_id: string
  drivers: {
    name: string
    team_id: string
    teams?: {
      name: string
    }
  }
}

export default function MySupported({ series }: MySupportedProps) {
  // Authentication and driver following feature coming in v2
  const followed: FollowedDriver[] = []

  return (
    <div className="glass" style={{
      borderRadius: 'var(--radius-xl)',
      padding: '24px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(251,191,36,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbbf24',
          }}>
            <Star size={16} />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>My Supported</h2>
        </div>
      </div>

      <div style={{
        textAlign: 'center',
        padding: '32px 16px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border-subtle)',
      }}>
        <UserPlus size={28} style={{
          color: 'var(--text-muted)',
          marginBottom: '12px',
        }} />
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '13px',
          lineHeight: 1.5,
        }}>
          User authentication and driver following features are coming in v2!
        </p>
      </div>
    </div>
  )
}
