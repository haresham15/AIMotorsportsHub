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
    <div style={{
      width: '100%',
      height: '100vh',
      margin: 0,
      padding: '8px',
      overflow: 'hidden',
      backgroundColor: 'transparent', // Allow host site background to show through if iframe is transparent
    }}>
      <div style={{ height: 'calc(100% - 24px)' }}>
        <LiveStandings 
          series={series} 
          dataSource="live" 
        />
      </div>
      <div style={{
        textAlign: 'center',
        paddingTop: '8px',
        fontSize: '11px',
        color: 'var(--text-muted)'
      }}>
        <a 
          href={`/dashboard/${series}`}
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            color: 'var(--accent)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          Powered by The Motorsport Hub &rarr;
        </a>
      </div>
    </div>
  )
}
