'use client'

import { useState } from 'react'
import { Trophy } from 'lucide-react'
import { getDriverColor } from '@/lib/data'

export interface DriverStanding {
  position: number
  points: number
  wins: number
  driverId: string
  driverNumber: string
  code: string
  firstName: string
  lastName: string
  constructorId: string
  constructorName: string
}

export interface ConstructorStanding {
  position: number
  points: number
  wins: number
  constructorId: string
  constructorName: string
}

interface Props {
  drivers: DriverStanding[]
  constructors: ConstructorStanding[]
  loading?: boolean
}

export default function ChampionshipStandings({ drivers, constructors, loading }: Props) {
  const [tab, setTab] = useState<'drivers' | 'constructors'>('drivers')

  if (loading) {
    return (
      <div className="championship">
        <div className="championship__header">
          <div className="championship__title">
            <div className="championship__icon"><Trophy size={16} /></div>
            Championship Standings
          </div>
        </div>
        <div className="championship__list" style={{ padding: '24px', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: '100%', height: '40px', borderRadius: '8px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '100%', height: '40px', borderRadius: '8px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '100%', height: '40px', borderRadius: '8px' }} />
        </div>
      </div>
    )
  }

  const maxDriverPoints = drivers[0]?.points || 1
  const maxConstructorPoints = constructors[0]?.points || 1

  return (
    <div className="championship">
      <div className="championship__header">
        <div className="championship__title">
          <div className="championship__icon"><Trophy size={16} /></div>
          Standings
        </div>
        <div className="championship__tabs">
          <button 
            className={`championship__tab ${tab === 'drivers' ? 'active' : ''}`}
            onClick={() => setTab('drivers')}
          >
            Drivers
          </button>
          <button 
            className={`championship__tab ${tab === 'constructors' ? 'active' : ''}`}
            onClick={() => setTab('constructors')}
          >
            Constructors
          </button>
        </div>
      </div>

      <div className="championship__list">
        {tab === 'drivers' && drivers.map(d => {
          // Attempt to map Jolpica constructor ID to our team colors
          const color = getDriverColor('f1', d.code) || '#94a3b8'
          
          return (
            <div key={d.driverId} className="championship__item">
              <span className={`championship__pos championship__pos--${d.position}`}>{d.position}</span>
              <div className="championship__color-bar" style={{ background: color }} />
              <div className="championship__driver-info">
                <span className="championship__name">{d.firstName} {d.lastName}</span>
                <span className="championship__team">{d.constructorName}</span>
              </div>
              <div className="championship__points-box">
                <span className="championship__points">{d.points}</span>
                <span className="championship__pts-label">PTS</span>
              </div>
            </div>
          )
        })}

        {tab === 'constructors' && constructors.map(c => {
          // Attempt to map Jolpica constructor ID to team colors by finding a driver on that team
          const driverOnTeam = drivers.find(d => d.constructorId === c.constructorId)
          const color = driverOnTeam ? getDriverColor('f1', driverOnTeam.code) : '#94a3b8'
          
          return (
            <div key={c.constructorId} className="championship__item">
              <span className={`championship__pos championship__pos--${c.position}`}>{c.position}</span>
              <div className="championship__color-bar" style={{ background: color }} />
              <div className="championship__driver-info">
                <span className="championship__name">{c.constructorName}</span>
                <span className="championship__team">{c.wins} Wins</span>
              </div>
              <div className="championship__points-box">
                <span className="championship__points">{c.points}</span>
                <span className="championship__pts-label">PTS</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
