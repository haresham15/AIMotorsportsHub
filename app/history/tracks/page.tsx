import Link from 'next/link';
import { getTrackRecords } from '@/lib/db';
import HistoryNav from '@/components/history/HistoryNav';
import TracksExplorer from '@/components/history/TracksExplorer';

export const metadata = {
  title: 'Track Records & Circuit Directory - Historical Archive',
  description: 'Explore 70+ years of Formula 1 circuit records, host countries, and Grand Prix race counts.',
};

export default function TracksPage() {
  const tracks = getTrackRecords() as { circuitId: number; name: string; country: string; racesHosted: number }[];

  return (
    <main className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10">
      {/* Historical Sub-Navigation */}
      <HistoryNav activeTab="tracks" />

      <div className="eyebrow mt-6">Historical Archive</div>
      <h1 className="text-3xl md:text-5xl font-black mt-2 mb-3 tracking-tight font-[family-name:var(--font-disp)] uppercase">
        Circuit Records &amp; Directory
      </h1>
      <p className="text-[var(--text-secondary)] text-sm md:text-base max-w-[700px] mb-8 leading-[1.6]">
        A comprehensive catalog of every circuit to host an official Formula 1 World Championship Grand Prix since 1950, featuring race counts, host nations, and venue pedigree.
      </p>

      {/* Interactive Explorer with Organized Dropdowns & Search */}
      <TracksExplorer tracks={tracks} />
    </main>
  );
}

