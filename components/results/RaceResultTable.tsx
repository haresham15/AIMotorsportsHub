import React from 'react'
import { getDriverColor } from '@/lib/data'

interface RaceResult {
  position: string
  points: string
  Driver: {
    givenName: string
    familyName: string
    code: string
    permanentNumber?: string
    nationality: string
  }
  Constructor: {
    name: string
    nationality: string
  }
  grid: string
  laps: string
  status: string
  Time?: {
    millis: string
    time: string
  }
  FastestLap?: {
    rank: string
    lap: string
    Time: {
      time: string
    }
    AverageSpeed: {
      units: string
      speed: string
    }
  }
}

interface RaceResultTableProps {
  series: string
  results: RaceResult[]
}

export default function RaceResultTable({ series, results }: RaceResultTableProps) {
  return (
    <div className="glass" style={{
      borderRadius: 'var(--radius-xl)',
      padding: '24px',
      overflowX: 'auto',
    }}>
      <table style={{
        width: '100%',
        minWidth: '800px',
        borderCollapse: 'separate',
        borderSpacing: '0 8px',
      }}>
        <thead>
          <tr style={{
            color: 'var(--text-muted)',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            textAlign: 'left',
          }}>
            <th style={{ padding: '0 16px 8px' }}>Pos</th>
            <th style={{ padding: '0 16px 8px' }}>Driver</th>
            <th style={{ padding: '0 16px 8px' }}>Team</th>
            <th style={{ padding: '0 16px 8px' }}>Grid</th>
            <th style={{ padding: '0 16px 8px' }}>Time/Status</th>
            <th style={{ padding: '0 16px 8px' }}>Pts</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => {
            const driverColor = getDriverColor(series, result.Driver.code) || 'var(--text-muted)'
            
            return (
              <tr key={result.position} style={{
                background: 'rgba(255,255,255,0.02)',
                transition: 'background 0.2s',
              }}>
                <td style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
                  fontWeight: 800,
                  fontSize: '18px',
                  fontFamily: 'var(--font-mono)',
                  color: result.position === '1' ? '#fbbf24' : 
                         result.position === '2' ? '#e5e7eb' : 
                         result.position === '3' ? '#b45309' : 'var(--text-primary)',
                }}>
                  {result.position}
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '4px',
                      height: '24px',
                      background: driverColor,
                      borderRadius: '2px',
                    }} />
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 600 }}>
                        {result.Driver.givenName} <span style={{ textTransform: 'uppercase' }}>{result.Driver.familyName}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {result.Driver.code} {result.Driver.permanentNumber ? `• #${result.Driver.permanentNumber}` : ''} • {result.Driver.nationality}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{result.Constructor.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{result.Constructor.nationality}</div>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                    P{result.grid}
                  </div>
                  {parseInt(result.grid) > parseInt(result.position) && parseInt(result.grid) > 0 && (
                    <div style={{ fontSize: '11px', color: '#4ade80', marginTop: '2px', fontWeight: 600 }}>
                      ▲ {parseInt(result.grid) - parseInt(result.position)}
                    </div>
                  )}
                  {parseInt(result.grid) < parseInt(result.position) && parseInt(result.grid) > 0 && (
                    <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '2px', fontWeight: 600 }}>
                      ▼ {parseInt(result.position) - parseInt(result.grid)}
                    </div>
                  )}
                </td>
                <td style={{ padding: '16px', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
                  {result.Time ? result.Time.time : result.status}
                  {result.FastestLap?.rank === '1' && (
                    <div style={{ 
                      fontSize: '10px', 
                      color: '#a855f7', 
                      marginTop: '4px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <span style={{ fontSize: '12px' }}>⏱️</span> Fastest Lap
                    </div>
                  )}
                </td>
                <td style={{ 
                  padding: '16px', 
                  borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                  fontWeight: 700,
                  fontSize: '16px',
                  color: parseInt(result.points) > 0 ? '#4ade80' : 'var(--text-muted)'
                }}>
                  {result.points}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
