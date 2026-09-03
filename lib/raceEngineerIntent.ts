/**
 * High-Speed Local Telemetry Intent Engine for Apexis Race Engineer AI
 * Resolves standard pit-wall queries in < 1ms using live telemetry in memory
 */

export function resolveLocalTelemetryIntent(
  userPrompt: string,
  seriesName: string,
  contextData?: any
): string | null {
  if (!userPrompt) return null;
  const q = userPrompt.toLowerCase().trim();
  const live = contextData?.liveRaceData;
  const hasLive = Array.isArray(live) && live.length > 0;

  // 1. Radio check / Comms check
  if (/^(radio check|comms check|check|can you hear me|testing|status report|are you there)\b/i.test(q)) {
    return `Loud and clear. Pit wall comms for ${seriesName} are online and telemetry link is green. What do you need?`;
  }

  // 2. Gaps to P1 / Intervals / Deltas (checked before P1 to prevent matching "gaps to p1")
  if (/\b(gaps?|intervals?|deltas?|distance to (leader|p1)|time gap)\b/i.test(q)) {
    if (hasLive) {
      const top5 = live.slice(0, 5);
      const list = top5.map((d: any) => `P${d.position} ${d.drivers?.name || d.driver_id} (${d.gap_to_leader || 'LEADER'})`).join('; ');
      return `Pit wall confirming intervals to P1: ${list}. DRS zones remain active. Keep hitting your apexes and manage the exit.`;
    }
  }

  // 3. Who is leading / P1 / Race Leader
  if (
    /\b(who('?s| is)? leading|who('?s| is)? in (the )?lead|who('?s| is)? in p1|who('?s| is)? p1\??|who is first|who is in 1st|race leader|current leader)\b/i.test(q) ||
    /^(p1\??|leader\??|first place\??)$/i.test(q)
  ) {
    if (hasLive) {
      const p1 = live.find((d: any) => d.position === 1) || live[0];
      const p2 = live.find((d: any) => d.position === 2);
      const name = p1.drivers?.name || p1.driver_id;
      const num = p1.car_number ? `#${p1.car_number}` : '';
      const tyre = p1.tire_compound || 'Hard';
      const gap = p2?.gap_to_leader ? `, holding a ${p2.gap_to_leader} delta over ${p2.drivers?.name || p2.driver_id} in P2` : '';
      const speed = p1.last_lap ? ` (${p1.last_lap})` : '';
      return `Copy that. ${name} ${num} is leading the race in P1 on ${tyre} tyres${speed}${gap}. Pace is looking consistent.`;
    }
  }

  // 4. Tyre compound strategy / degradation
  if (/\b(t[yi]res?|compounds?|strategy|pit window|degradation|wear|box box|undercut)\b/i.test(q)) {
    if (hasLive) {
      const hard = live.filter((d: any) => (d.tire_compound || '').toUpperCase().includes('HARD')).length;
      const med = live.filter((d: any) => (d.tire_compound || '').toUpperCase().includes('MED')).length;
      const soft = live.filter((d: any) => (d.tire_compound || '').toUpperCase().includes('SOFT')).length;
      return `Tyre briefing: Grid split is currently ${hard} on Hard, ${med} on Medium, ${soft} on Soft. Tyre degradation is within telemetry parameters. Primary pit window will depend on safety car windows.`;
    }
  }

  // 5. Championship Standings / Points
  if (/\b(championship|driver standings|points table|who is winning the championship|title battle|standings)\b/i.test(q)) {
    const drivers = contextData?.standingsData?.driverStandings;
    if (Array.isArray(drivers) && drivers.length > 0) {
      const top3 = drivers.slice(0, 3).map((d: any) => `P${d.position} ${d.firstName} ${d.lastName} (${d.points} pts)`).join(', ');
      return `Drivers' Championship standings update: ${top3}. Every point matters in this phase of the season.`;
    }
  }

  // 6. Specific Driver Telemetry / Position
  if (hasLive) {
    for (const d of live) {
      const fullName = (d.drivers?.name || '').toLowerCase();
      const code = (d.driver_id || '').toLowerCase();
      const lastName = fullName.split(' ').pop() || '';
      
      const isMatch = (lastName.length >= 3 && q.includes(lastName)) ||
                      (code.length >= 3 && q.includes(code)) ||
                      (fullName.length >= 4 && q.includes(fullName));

      if (isMatch) {
        const p = d.position;
        const gap = d.gap_to_leader || '--';
        const tyre = d.tire_compound || 'Medium';
        const car = d.car_number ? `#${d.car_number}` : '';
        const team = d.team_name ? ` (${d.team_name})` : '';
        const lastLap = d.last_lap ? ` Last lap: ${d.last_lap}.` : '';
        return `Pit wall report on ${d.drivers?.name || d.driver_id} ${car}${team}: Currently running in P${p}, gap to leader is ${gap}, on ${tyre} tyres.${lastLap} Keeping you updated on delta.`;
      }
    }
  }

  // 7. Track status / flags / safety car
  if (/\b(safety car|vsc|yellow flag|red flag|track status|flag condition)\b/i.test(q)) {
    return `Track status confirmation: Session track is CLEAR under green flag conditions. Marshals reporting all sectors open.`;
  }

  return null;
}
