'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from 'lucide-react';

const DECADES = [
  { label: '2020s (Ground Effect & Hybrid)', min: 2020, max: 2024 },
  { label: '2010s (Turbo-Hybrid Era)', min: 2010, max: 2019 },
  { label: '2000s (V10 & V8 Screamer Era)', min: 2000, max: 2009 },
  { label: '1990s (V10 & Active Tech)', min: 1990, max: 1999 },
  { label: '1980s (1.5L Turbo Boost Monsters)', min: 1980, max: 1989 },
  { label: '1970s (Ground Effect & Cosworth DFV)', min: 1970, max: 1979 },
  { label: '1960s (Cigar Cars & Wing Era)', min: 1960, max: 1969 },
  { label: '1950s (Golden Era of Front Engine)', min: 1950, max: 1959 },
];

const ALL_YEARS = Array.from({ length: 2024 - 1950 + 1 }, (_, i) => 2024 - i);

interface Props {
  currentYear: number;
}

export default function SeasonSwitcherDropdown({ currentYear }: Props) {
  const router = useRouter();

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const yr = e.target.value;
    if (yr && parseInt(yr, 10) !== currentYear) {
      router.push(`/history/seasons/${yr}`);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-[var(--surface-console)] border border-[var(--border-hairline)] p-2 rounded-none">
      <Calendar size={13} className="text-[var(--amber)] shrink-0" />
      <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase shrink-0">Switch Season:</span>
      <select
        value={currentYear}
        onChange={handleSeasonChange}
        className="bg-[var(--surface-elevated)] border border-[var(--border-hairline)] text-white text-xs font-mono font-bold p-1.5 rounded-none outline-none focus:border-[var(--amber)] cursor-pointer"
      >
        {DECADES.map((dec) => (
          <optgroup key={dec.label} label={dec.label}>
            {ALL_YEARS.filter(y => y >= dec.min && y <= dec.max).map((y) => (
              <option key={y} value={y}>
                {y} Season ({y === 2024 ? 'Latest' : `${2024 - y} years ago`})
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
