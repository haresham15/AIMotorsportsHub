import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60; // Allow more time for large fetches

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionKey: string }> }
) {
  const { sessionKey } = await params;
  const { searchParams } = new URL(request.url)
  const driver = searchParams.get('driver_number')
  const dateGte = searchParams.get('date>=' ) || searchParams.get('date_gte')
  const dateLt = searchParams.get('date<') || searchParams.get('date_lt')
  const downsample = parseInt(searchParams.get('downsample') || '1')

  try {
    let url = `https://api.openf1.org/v1/location?session_key=${sessionKey}`
    if (driver) url += `&driver_number=${driver}`
    if (dateGte) url += `&date>=${dateGte}`
    if (dateLt) url += `&date<${dateLt}`

    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch from OpenF1')
    
    let data = await response.json()

    // Downsample if requested (to avoid huge payloads)
    if (downsample > 1 && Array.isArray(data)) {
      data = data.filter((_: unknown, index: number) => index % downsample === 0)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching OpenF1 positions:', error)
    return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 })
  }
}
