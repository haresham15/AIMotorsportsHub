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
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { series, year, round } = await params
  
  if (series !== 'f1') {
    return { title: 'Results Not Found - Apexis' }
  }

  const race = await getRaceResults(year, round)
  
  if (!race) {
    return { title: 'Results Not Found - Apexis' }
  }

  const title = `${race.raceName} ${year} Results - Apexis`
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
    <div className={`min-h-screen relative series-${series}`}>
      {/* ===== NAVBAR ===== */}
      <nav className="glass-nav sticky top-0 z-50 px-6">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center h-[68px]">
          <div className="flex items-center gap-3">
            <Link href="/" className="logo no-underline text-[var(--text-primary)]">
              <span className="dot"></span>
              <span className="hide-mobile">APEXIS</span>
            </Link>
            <span className="text-[var(--text-muted)] text-xl font-extralight">/</span>
            <div className="flex items-center gap-2">
              <span className="text-lg">{seriesInfo.icon}</span>
              <span className="text-base font-semibold text-[var(--text-primary)] tracking-[-0.01em]">
                {seriesInfo.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href={`/dashboard/${series}`} className="btn-ghost flex items-center gap-1.5 no-underline">
              <ArrowLeft size={14} />
              <span className="hide-mobile">Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Series color accent bar */}
      <div 
        className="h-[2px] opacity-50"
        style={{ background: seriesInfo.gradient }} 
      />

      <main className="max-w-[1000px] mx-auto px-6 pt-10 pb-20">
        <div className="animate-fade-in-up">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="font-[family-name:var(--font-disp)] uppercase text-5xl font-extrabold tracking-[-0.01em] mb-3 leading-[1.1]">
                {race.raceName}
              </h1>
              <div className="flex gap-4 text-[var(--text-muted)] text-sm font-medium">
                <div className="flex items-center gap-1.5">
                  <Calendar size={16} />
                  {new Date(race.date).toLocaleDateString(undefined, { 
                    year: 'numeric', month: 'long', day: 'numeric' 
                  })}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} />
                  {race.Circuit.circuitName}, {race.Circuit.Location.country}
                </div>
                <div className="flex items-center gap-1.5">
                  <Flag size={16} />
                  Round {race.round}
                </div>
              </div>
            </div>
            
            {/* Podium Overview */}
            {results.length >= 3 && (
              <div className="glass hide-mobile px-6 py-4 rounded-[var(--radius-lg)] flex gap-6">
                {[1, 0, 2].map((podiumIndex) => {
                  const r = results[podiumIndex]
                  const isWinner = podiumIndex === 0
                  return (
                    <div key={r.position} className={`flex flex-col items-center transition-transform ${isWinner ? 'opacity-100 -translate-y-2' : 'opacity-80'}`}>
                      <div className={`font-extrabold ${isWinner ? 'text-2xl text-[#fbbf24]' : podiumIndex === 1 ? 'text-lg text-gray-200' : 'text-lg text-[#b45309]'}`}>
                        P{r.position}
                      </div>
                      <div className="text-sm font-semibold mt-1">
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
