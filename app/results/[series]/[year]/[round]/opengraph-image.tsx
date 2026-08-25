import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Race Results - Apexis'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ series: string, year: string, round: string }> }) {
  const { series, year, round } = await params
  
  if (series !== 'f1') {
    return new ImageResponse(
      (
        <div style={{ background: 'black', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ color: 'white', fontSize: 64 }}>Apexis</h1>
        </div>
      )
    )
  }

  // Fetch results to dynamically build the image
  let raceName = 'Race'
  let circuitName = 'Circuit'
  let podium = []

  try {
    const res = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/${round}/results.json`)
    if (res.ok) {
      const data = await res.json()
      const race = data.MRData.RaceTable.Races[0]
      if (race) {
        raceName = race.raceName
        circuitName = race.Circuit.circuitName
        podium = race.Results.slice(0, 3)
      }
    }
  } catch (e) {
    console.error('Error fetching data for OG image', e)
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0a0a',
          color: 'white',
          padding: '64px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: 'linear-gradient(135deg, #e10600, #ff4444)' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: 'auto' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#06B6D4' }}>Apexis</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '64px' }}>
          <h1 style={{ fontSize: 72, fontWeight: 800, margin: '0 0 16px 0', lineHeight: 1.1 }}>
            {year} {raceName}
          </h1>
          <h2 style={{ fontSize: 36, color: '#a3a3a3', margin: 0, fontWeight: 500 }}>
            {circuitName} • Round {round}
          </h2>
        </div>

        {podium.length > 0 && (
          <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-end', height: '200px' }}>
            {/* P2 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%' }}>
              <div style={{ fontSize: 32, fontWeight: 700, marginBottom: '16px' }}>{podium[1].Driver.givenName} {podium[1].Driver.familyName}</div>
              <div style={{ width: '100%', height: '120px', background: 'rgba(229, 231, 235, 0.1)', borderTop: '4px solid #e5e7eb', display: 'flex', justifyContent: 'center', paddingTop: '16px' }}>
                <span style={{ fontSize: 48, fontWeight: 800, color: '#e5e7eb' }}>P2</span>
              </div>
            </div>
            
            {/* P1 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40%' }}>
              <div style={{ fontSize: 40, fontWeight: 800, marginBottom: '16px', color: '#fbbf24' }}>{podium[0].Driver.givenName} {podium[0].Driver.familyName}</div>
              <div style={{ width: '100%', height: '160px', background: 'rgba(251, 191, 36, 0.1)', borderTop: '4px solid #fbbf24', display: 'flex', justifyContent: 'center', paddingTop: '24px' }}>
                <span style={{ fontSize: 64, fontWeight: 800, color: '#fbbf24' }}>P1</span>
              </div>
            </div>

            {/* P3 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%' }}>
              <div style={{ fontSize: 32, fontWeight: 700, marginBottom: '16px' }}>{podium[2].Driver.givenName} {podium[2].Driver.familyName}</div>
              <div style={{ width: '100%', height: '100px', background: 'rgba(180, 83, 9, 0.1)', borderTop: '4px solid #b45309', display: 'flex', justifyContent: 'center', paddingTop: '16px' }}>
                <span style={{ fontSize: 48, fontWeight: 800, color: '#b45309' }}>P3</span>
              </div>
            </div>
          </div>
        )}
      </div>
    ),
    {
      ...size,
    }
  )
}
