import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Dynamic params
    const p1 = searchParams.get('p1')?.toUpperCase() || 'VER'
    const p2 = searchParams.get('p2')?.toUpperCase() || 'NOR'
    const p3 = searchParams.get('p3')?.toUpperCase() || 'LEC'
    const username = searchParams.get('user') || 'A Fan'

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a',
            backgroundImage: 'radial-gradient(circle at 25px 25px, #333 2%, transparent 0%), radial-gradient(circle at 75px 75px, #333 2%, transparent 0%)',
            backgroundSize: '100px 100px',
            color: 'white',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: '60px',
              borderRadius: '24px',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
            }}
          >
            <h1
              style={{
                fontSize: '60px',
                fontWeight: 900,
                margin: '0 0 20px 0',
                background: 'linear-gradient(to right, #4ade80, #3b82f6)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Apexis
            </h1>
            
            <p style={{ fontSize: '32px', color: '#9ca3af', margin: '0 0 60px 0' }}>
              {username}'s Podium Prediction
            </p>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '40px', height: '300px' }}>
              {/* P2 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '48px', fontWeight: 800, marginBottom: '20px' }}>{p2}</span>
                <div style={{ width: '140px', height: '180px', background: 'linear-gradient(to top, #374151, #4b5563)', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '20px' }}>
                  <span style={{ fontSize: '40px', fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>2</span>
                </div>
              </div>

              {/* P1 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '64px', fontWeight: 900, marginBottom: '20px', color: '#fbbf24' }}>{p1}</span>
                <div style={{ width: '160px', height: '240px', background: 'linear-gradient(to top, #fbbf24, #f59e0b)', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '20px' }}>
                  <span style={{ fontSize: '60px', fontWeight: 900, color: 'rgba(0,0,0,0.5)' }}>1</span>
                </div>
              </div>

              {/* P3 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '48px', fontWeight: 800, marginBottom: '20px', color: '#d97706' }}>{p3}</span>
                <div style={{ width: '140px', height: '140px', background: 'linear-gradient(to top, #d97706, #b45309)', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '20px' }}>
                  <span style={{ fontSize: '40px', fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.error(e)
    return new Response('Failed to generate image', { status: 500 })
  }
}
