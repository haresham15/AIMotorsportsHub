import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60;
export const revalidate = 86400; // Cache for 24 hours

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ series: string }> }
) {
  const { series } = await params;
  
  if (series !== 'f1') {
    return new NextResponse('Only F1 calendar is supported currently.', { status: 400 });
  }

  try {
    const origin = request.nextUrl.origin;
    const res = await fetch(`${origin}/api/f1/schedule`);
    if (!res.ok) throw new Error('Failed to fetch schedule');
    
    const data = await res.json();
    const rounds = data.rounds || [];

    // Build the iCalendar string
    let ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//The Motorsport Hub//EN\r\nCALSCALE:GREGORIAN\r\nX-WR-CALNAME:${series.toUpperCase()} Schedule\r\n`;

    rounds.forEach((round: any) => {
      // If we have detailed OpenF1 sessions, create an event for each session
      if (round.sessions && round.sessions.length > 0) {
        round.sessions.forEach((session: any) => {
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
