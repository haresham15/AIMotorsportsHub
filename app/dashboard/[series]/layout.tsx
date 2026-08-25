import { Metadata } from 'next'
import { SERIES_MAP } from '@/lib/data'

type Props = {
  params: Promise<{ series: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { series } = await params
  const seriesInfo = SERIES_MAP[series]

  if (!seriesInfo) {
    return {
      title: 'Series Not Found | Apexis',
    }
  }

  return {
    title: `${seriesInfo.name} Live Dashboard | Apexis`,
    description: `Live telemetry, standings, and AI insights for the ${seriesInfo.name} on Apexis.`,
    openGraph: {
      title: `${seriesInfo.name} Live Dashboard | Apexis`,
      description: `Live telemetry, standings, and AI insights for the ${seriesInfo.name} on Apexis.`,
    }
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
