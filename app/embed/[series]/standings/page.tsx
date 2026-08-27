import { Metadata } from 'next'
import LiveStandings from '@/components/dashboard/LiveStandings'

interface EmbedProps {
  params: Promise<{
    series: string
  }>
}

export async function generateMetadata({ params }: EmbedProps): Promise<Metadata> {
  const { series } = await params
  
  return {
    title: `${series.toUpperCase()} Live Standings Embed`,
    description: `Embeddable live standings widget for ${series.toUpperCase()}`,
  }
}

export default async function EmbedStandingsPage({ params }: EmbedProps) {
  const { series } = await params

  return (
    <div className="w-full h-screen m-0 p-2 overflow-hidden bg-transparent">
      <div className="h-[calc(100%-24px)]">
        <LiveStandings 
          series={series} 
          dataSource={series === 'f1' ? 'live' : 'mock'} 
        />
      </div>
      <div className="text-center pt-2 text-[11px] text-[var(--text-muted)]">
        <a 
          href={`/dashboard/${series}`}
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[var(--accent)] no-underline inline-flex items-center gap-1"
        >
          Powered by Apexis &rarr;
        </a>
      </div>
    </div>
  )
}
