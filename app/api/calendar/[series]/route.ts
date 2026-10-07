import { NextRequest, NextResponse } from 'next/server'
import { getSeriesFallbackSchedule } from '@/lib/seriesSchedules'

export const maxDuration = 60;
export const revalidate = 86400; // Cache for 24 hours

function getScheduleUrl(origin: string, series: string) {
  const normalizedSeries = series === 'nascar' ? 'nascar-cup' : series
  if (normalizedSeries === 'f1') {
    return `${origin}/api/f1/schedule`
  }

  if (normalizedSeries === 'nascar' || normalizedSeries.startsWith('nascar-')) {
    const nSeries = normalizedSeries === 'nascar' ? 'nascar-cup' : normalizedSeries
    return `${origin}/api/nascar/schedule?series=${encodeURIComponent(nSeries)}`
  }

  return null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ series: string }> }
) {
  const { series } = await params;
  const scheduleUrl = getScheduleUrl(request.nextUrl.origin, series)

  try {
    let rounds: { name?: string, circuitName?: string, date?: string, time?: string, round?: number, country?: string, sessions?: { name: string, dateStart: string, dateEnd?: string }[] }[] = [];

    if (scheduleUrl) {
      try {
        const res = await fetch(scheduleUrl);
        if (res.ok) {
          const data = await res.json();
          rounds = data.rounds || [];
        }
      } catch {
        // Fallback to internal schedule
      }
    }

    if (!rounds || rounds.length === 0) {
      const fallback = getSeriesFallbackSchedule(series, new Date().getFullYear().toString());
      rounds = fallback?.rounds || [];
    }

    if (!rounds || rounds.length === 0) {
      return new NextResponse('Calendar feed is not supported for this series.', { status: 404 });
    }

    // Build the iCalendar string
    let ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Apexis//EN\r\nCALSCALE:GREGORIAN\r\nX-WR-CALNAME:${series.toUpperCase()} Schedule\r\n`;

    rounds.forEach((round: { name?: string, circuitName?: string, date?: string, time?: string, round?: number, country?: string, sessions?: { name: string, dateStart: string, dateEnd?: string }[] }) => {
      // If we have detailed OpenF1 sessions, create an event for each session
      if (round.sessions && round.sessions.length > 0) {
        round.sessions.forEach((session: { name: string, dateStart: string, dateEnd?: string }) => {
          const startDate = new Date(session.dateStart);
          // Default duration to 1 hour if we don't have end times
          const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
          
          ics += createIcsEvent(
            `${round.name} - ${session.name}`,
            startDate,
            endDate,
            `${round.circuitName}, ${round.country}`,
            `${session.name} session for the ${round.name}.`
          );
        });
      } else {
        // Fallback to the main race event if sessions aren't available
        const startDate = new Date(`${round.date}T${round.time || '00:00:00Z'}`);
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Assume 2 hour race
        
        ics += createIcsEvent(
          `${round.name} (Race)`,
          startDate,
          endDate,
          `${round.circuitName}, ${round.country}`,
          `Round ${round.round} of the ${series.toUpperCase()} championship.`
        );
      }
    });

    ics += `END:VCALENDAR\r\n`;

    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${series}_schedule.ics"`
      }
    });
  } catch (error) {
    console.error('Calendar generation error:', error);
    return new NextResponse('Failed to generate calendar', { status: 500 });
  }
}

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function createIcsEvent(summary: string, start: Date, end: Date, location: string, description: string): string {
  const dtStamp = formatIcsDate(new Date());
  const dtStart = formatIcsDate(start);
  const dtEnd = formatIcsDate(end);
  const uid = `${dtStart}-${summary.replace(/\s+/g, '')}@themotorsporthub.com`;
  
  const safeSummary = summary.replace(/[,;]/g, '\\$&');
  const safeLocation = location.replace(/[,;]/g, '\\$&');
  const safeDescription = description.replace(/[,;]/g, '\\$&');
  
  return `BEGIN:VEVENT\r\nUID:${uid}\r\nDTSTAMP:${dtStamp}\r\nDTSTART:${dtStart}\r\nDTEND:${dtEnd}\r\nSUMMARY:${safeSummary}\r\nLOCATION:${safeLocation}\r\nDESCRIPTION:${safeDescription}\r\nEND:VEVENT\r\n`;
}
