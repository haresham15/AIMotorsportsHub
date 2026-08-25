import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const maxDuration = 60;
export const revalidate = 60; // Cache for 1 minute for v1 API

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ series: string }> }
) {
  const { series } = await params;
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized. Please provide an API key in the Authorization header: Bearer YOUR_API_KEY' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  
  // Validate API key against Supabase
  const { data: keyData, error: keyError } = await supabase
    .from('api_keys')
    .select('*')
    .eq('api_key', token)
    .eq('is_active', true)
    .single();

  if (keyError || !keyData) {
    return NextResponse.json({ error: 'Invalid or inactive API Key' }, { status: 403 })
  }

  // We reuse the internal route logic by making a local fetch, or we could extract it to a shared lib.
  // For V1, we fetch the internal route and pass it along to avoid duplicating Jolpica/OpenF1 logic.
  try {
    const origin = request.nextUrl.origin;
    const internalRes = await fetch(`${origin}/api/${series}/standings`);
    
    if (!internalRes.ok) {
      if (internalRes.status === 404) {
        return NextResponse.json({ error: `Standings not found for series: ${series}` }, { status: 404 })
      }
      throw new Error('Internal API error')
    }

    const data = await internalRes.json()
    
    // Wrap the response in a standard v1 envelope
    return NextResponse.json({
      object: 'list',
      series: series,
      data: data
    })
  } catch (error) {
    console.error('V1 API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
