"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Flag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Ranking {
  driverId: number;
  name: string;
  peakElo: number;
  currentElo: number;
  races: number;
  wins: number;
  championships: number;
  era: string;
}

export default function GoatDebatePage() {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterActive, setFilterActive] = useState(false);

  useEffect(() => {
    async function fetchRankings() {
      setLoading(true);
      try {
        const res = await fetch(`/api/rankings?active=${filterActive}`);
        const data = await res.json();
        if (data.rankings) {
          setRankings(data.rankings);
        }
      } catch (err) {
        console.error("Failed to load rankings", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRankings();
  }, [filterActive]);

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 rounded-full mb-2">
          <Trophy className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-orange-600 bg-clip-text text-transparent">
          The GOAT Debate
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          A mathematically rigorous, dual-Elo rating system evaluating every race since 1950. 
          This model isolates driver skill from car dominance by heavily weighting performance against teammates.
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-muted p-1 rounded-md">
          <button
            onClick={() => setFilterActive(false)}
            className={cn(
              "px-4 py-2 rounded-sm text-sm font-medium transition-colors",
              !filterActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/50"
            )}
          >
            All-Time Greats
          </button>
          <button
            onClick={() => setFilterActive(true)}
            className={cn(
              "px-4 py-2 rounded-sm text-sm font-medium transition-colors",
              filterActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/50"
            )}
          >
            Active Drivers
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-amber-500" />
          <p>Crunching the numbers across 70+ years of racing...</p>
        </div>
      ) : (
        <div className="grid gap-4 max-w-4xl mx-auto">
          {rankings.map((driver, index) => (
            <Card 
              key={driver.driverId} 
              className={cn(
                "overflow-hidden transition-all duration-300 hover:shadow-md border-l-4",
                index === 0 ? "border-l-amber-400 bg-gradient-to-r from-amber-500/10 to-transparent" :
                index === 1 ? "border-l-slate-300 bg-gradient-to-r from-slate-500/10 to-transparent" :
                index === 2 ? "border-l-amber-700 bg-gradient-to-r from-amber-700/10 to-transparent" :
                "border-l-transparent hover:border-l-primary/50"
              )}
            >
              <CardContent className="p-0">
                <div className="flex items-center p-4 sm:p-6">
                  {/* Rank & Medal */}
                  <div className="w-16 flex-shrink-0 flex flex-col items-center justify-center">
                    {index === 0 && <Medal className="w-8 h-8 text-amber-400 mb-1" />}
                    {index === 1 && <Medal className="w-7 h-7 text-slate-300 mb-1" />}
                    {index === 2 && <Medal className="w-6 h-6 text-amber-700 mb-1" />}
                    {index > 2 && <div className="text-2xl font-bold text-muted-foreground/50">#{index + 1}</div>}
                  </div>

                  {/* Details */}
                  <div className="flex-grow pl-4 sm:pl-6 border-l border-border/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                          {driver.name}
                        </h2>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Flag className="w-3.5 h-3.5" /> {driver.races} starts
                          </span>
                          <span>•</span>
                          <span>{driver.wins} wins ({Math.round(driver.wins / driver.races * 100)}%)</span>
                          <span>•</span>
                          <Badge variant="outline" className="font-normal text-xs">{driver.era}</Badge>
                        </div>
                      </div>

                      {/* Elo Score */}
                      <div className="flex flex-col items-end shrink-0">
                        <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold text-[10px]">Peak Rating</div>
                        <div className={cn(
                          "text-3xl font-black tabular-nums tracking-tighter",
                          index === 0 ? "text-amber-500" :
                          index === 1 ? "text-slate-400" :
                          index === 2 ? "text-amber-700" :
                          "text-foreground"
                        )}>
                          {driver.peakElo.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
