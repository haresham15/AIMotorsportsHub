import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Calendar, MapPin, Flag } from 'lucide-react'
import RaceResultTable from '@/components/results/RaceResultTable'
import { SERIES_MAP } from '@/lib/data'

export const revalidate = 86400 // Cache for 24 hours

interface PageProps {
  params: Promise<{
    series: string
    year: string
    round: string
  }>
}

async function getRaceResults(year: string, round: string) {
  try {
    const res = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/${round}/results.json`, {
      next: { revalidate: 86400 } // ISR cache
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.MRData.RaceTable.Races[0]
  } catch (error) {
    console.error('Error fetching race results:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { series, year, round } = await params
  
  if (series !== 'f1') {
    return { title: 'Results Not Found - Motorsports Hub' }
  }

  const race = await getRaceResults(year, round)
  
  if (!race) {
    return { title: 'Results Not Found - Motorsports Hub' }
  }

  const title = `${race.raceName} ${year} Results - Motorsports Hub`
  const description = `Full race results, points, and fastest laps for the ${year} ${race.raceName} at ${race.Circuit.circuitName}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  }
}

// Generate static pages for the first 15 races of the 2024 season (as an example)
export async function generateStaticParams() {
  const params = []
  
  // Statically generate the first 14 rounds of 2024 for F1 as a demo of SSG
  for (let round = 1; round <= 14; round++) {
    params.push({
      series: 'f1',
      year: '2024',
      round: round.toString()
    })
  }

  return params
}

export default async function RaceResultPage({ params }: PageProps) {
  const { series, year, round } = await params
  
  if (series !== 'f1') {
    // We only support F1 historical results via Jolpica right now
    notFound()
  }

  const seriesInfo = SERIES_MAP[series]
  const race = await getRaceResults(year, round)

  if (!race) {
    notFound()
  }

  const results = race.Results

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }} className={`series-${series}`}>
      {/* ===== NAVBAR ===== */}
      <nav className="glass-nav" style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '0 24px',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '64px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/" className="gradient-text" style={{
              fontSize: '18px',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ fontSize: '20px' }}>🏎️</span>
              <span className="hide-mobile">Motorsport Hub</span>
            </Link>
            <span style={{
              color: 'var(--text-muted)',
              fontSize: '20px',
              fontWeight: 200,
            }}>/</span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ fontSize: '18px' }}>{seriesInfo.icon}</span>
              <span style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}>
                {seriesInfo.name}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link href={`/dashboard/${series}`} className="btn-ghost" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
            }}>
              <ArrowLeft size={14} />
              <span className="hide-mobile">Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Series color accent bar */}
      <div style={{
        height: '2px',
        background: seriesInfo.gradient,
        opacity: 0.5,
      }} />

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <div className="animate-fade-in-up">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '32px'
          }}>
            <div>
              <h1 style={{ 
                fontSize: '36px', 
                fontWeight: 800, 
                marginBottom: '12px',
                lineHeight: 1.1
              }}>
                {race.raceName}
              </h1>
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                color: 'var(--text-muted)',
                fontSize: '14px',
                fontWeight: 500
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={16} />
                  {new Date(race.date).toLocaleDateString(undefined, { 
                    year: 'numeric', month: 'long', day: 'numeric' 
                  })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} />
                  {race.Circuit.circuitName}, {race.Circuit.Location.country}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Flag size={16} />
                  Round {race.round}
                </div>
              </div>
            </div>
            
            {/* Podium Overview */}
            {results.length >= 3 && (
              <div className="glass hide-mobile" style={{
                padding: '16px 24px',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                gap: '24px',
              }}>
                {[1, 0, 2].map((podiumIndex) => {
                  const r = results[podiumIndex]
                  const isWinner = podiumIndex === 0
                  return (
                    <div key={r.position} style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      opacity: isWinner ? 1 : 0.8,
                      transform: isWinner ? 'translateY(-8px)' : 'none',
                    }}>
                      <div style={{ 
                        fontSize: isWinner ? '24px' : '18px',
                        fontWeight: 800,
                        color: isWinner ? '#fbbf24' : podiumIndex === 1 ? '#e5e7eb' : '#b45309'
                      }}>
                        P{r.position}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>
                        {r.Driver.code}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <RaceResultTable series={series} results={results} />
        </div>
      </main>
    </div>
  )
}
