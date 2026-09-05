// ========== SERIES DATA ==========
export interface SeriesInfo {
  id: string;
  name: string;
  shortName: string;
  color: string;
  gradient: string;
  icon: string;
  description: string;
}

export const SERIES: SeriesInfo[] = [
  {
    id: "f1",
    name: "Formula 1",
    shortName: "F1",
    color: "#e10600",
    gradient: "linear-gradient(135deg, #e10600, #ff4444)",
    icon: "F1",
    description: "The pinnacle of open-wheel racing",
  },
  {
    id: "f2",
    name: "Formula 2",
    shortName: "F2",
    color: "#0090ff",
    gradient: "linear-gradient(135deg, #0090ff, #38bdf8)",
    icon: "F2",
    description: "The proving ground for future F1 stars",
  },
  {
    id: "f3",
    name: "Formula 3",
    shortName: "F3",
    color: "#00c853",
    gradient: "linear-gradient(135deg, #00c853, #4ade80)",
    icon: "F3",
    description: "Where the next generation begins their journey",
  },
  {
    id: "formula-e",
    name: "Formula E",
    shortName: "FE",
    color: "#14b8a6",
    gradient: "linear-gradient(135deg, #14b8a6, #06b6d4)",
    icon: "FE",
    description: "All-electric street racing at its best",
  },
  {
    id: "nascar",
    name: "NASCAR",
    shortName: "NAS",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
    icon: "NAS",
    description: "Stock car racing — America's motorsport",
  },
  {
    id: "gt-world-challenge",
    name: "GT World Challenge",
    shortName: "GTC",
    color: "#f97316",
    gradient: "linear-gradient(135deg, #f97316, #fb923c)",
    icon: "GTC",
    description: "GT sports car endurance and sprint racing",
  },
  {
    id: "top-fuel",
    name: "Top Fuel Dragster",
    shortName: "TF",
    color: "#a855f7",
    gradient: "linear-gradient(135deg, #a855f7, #c084fc)",
    icon: "TF",
    description: "10,000 HP machines conquering the quarter mile",
  },
  {
    id: "wec",
    name: "World Endurance Championship",
    shortName: "WEC",
    color: "#005a9c",
    gradient: "linear-gradient(135deg, #005a9c, #007bc4)",
    icon: "WEC",
    description: "The ultimate test of man and machine in endurance racing",
  },
];

// Sub-series that don't appear on the homepage but are valid dashboard routes
const NASCAR_SUB_SERIES: SeriesInfo[] = [
  {
    id: "nascar-cup",
    name: "NASCAR Cup Series",
    shortName: "CUP",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
    icon: "CUP",
    description: "The premier stock car racing series",
  },
  {
    id: "nascar-xfinity",
    name: "NASCAR Xfinity Series",
    shortName: "XFN",
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, #3b82f6, #60a5fa)",
    icon: "XFN",
    description: "The proving ground for future Cup stars",
  },
  {
    id: "nascar-trucks",
    name: "NASCAR Craftsman Truck Series",
    shortName: "TRKS",
    color: "#10b981",
    gradient: "linear-gradient(135deg, #10b981, #34d399)",
    icon: "TRKS",
    description: "Short-track mayhem with full-size trucks",
  },
];

export const SERIES_MAP: Record<string, SeriesInfo> = Object.fromEntries(
  [...SERIES, ...NASCAR_SUB_SERIES].map((s) => [s.id, s])
);

// NASCAR CDN series IDs: maps our internal route ID to NASCAR's integer
export const NASCAR_CDN_SERIES_ID: Record<string, number> = {
  'nascar-cup': 1,
  'nascar-xfinity': 2,
  'nascar-trucks': 3,
};

// ========== WATCH LINKS ==========
export const WATCH_LINKS: Record<
  string,
  Array<{ name: string; url: string; platform: string }>
> = {
  f1: [
    {
      name: "F1 TV Pro",
      url: "https://www.formula1.com/en/subscribe-to-f1-tv.html",
      platform: "Official",
    },
    {
      name: "ESPN / ESPN+",
      url: "https://www.espn.com/watch/",
      platform: "US",
    },
    {
      name: "Sky Sports F1",
      url: "https://www.skysports.com/f1",
      platform: "UK",
    },
    {
      name: "YouTube TV",
      url: "https://tv.youtube.com/",
      platform: "Streaming",
    },
  ],
  f2: [
    {
      name: "F1 TV Pro",
      url: "https://www.formula1.com/en/subscribe-to-f1-tv.html",
      platform: "Official",
    },
    {
      name: "FIA Formula 2",
      url: "https://www.fiaformula2.com/",
      platform: "Official",
    },
  ],
  f3: [
    {
      name: "F1 TV Pro",
      url: "https://www.formula1.com/en/subscribe-to-f1-tv.html",
      platform: "Official",
    },
    {
      name: "FIA Formula 3",
      url: "https://www.fiaformula3.com/",
      platform: "Official",
    },
  ],
  "formula-e": [
    {
      name: "Formula E YouTube",
      url: "https://www.youtube.com/@FIAFormulaE",
      platform: "Free",
    },
    {
      name: "CBS Sports",
      url: "https://www.cbssports.com/",
      platform: "US",
    },
    {
      name: "Formula E Official",
      url: "https://www.fiaformulae.com/",
      platform: "Official",
    },
  ],
  nascar: [
    {
      name: "NASCAR.com",
      url: "https://www.nascar.com/",
      platform: "Official",
    },
    {
      name: "FOX Sports",
      url: "https://www.foxsports.com/",
      platform: "US",
    },
    {
      name: "NBC Sports",
      url: "https://www.nbcsports.com/",
      platform: "US",
    },
    {
      name: "Peacock",
      url: "https://www.peacocktv.com/",
      platform: "Streaming",
    },
  ],
  "gt-world-challenge": [
    {
      name: "GT World YouTube",
      url: "https://www.youtube.com/@GTWorld",
      platform: "Free",
    },
    {
      name: "GT World Challenge",
      url: "https://www.gt-world-challenge.com/",
      platform: "Official",
    },
  ],
  "top-fuel": [
    {
      name: "NHRA.tv",
      url: "https://www.nhra.com/nhra-tv",
      platform: "Official",
    },
    {
      name: "FOX Sports",
      url: "https://www.foxsports.com/",
      platform: "US",
    },
    {
      name: "NHRA Official",
      url: "https://www.nhra.com/",
      platform: "Official",
    },
  ],
  wec: [
    {
      name: "FIA WEC TV",
      url: "https://fiawec.tv/",
      platform: "Official",
    },
    {
      name: "MotorTrend+",
      url: "https://www.motortrendondemand.com/",
      platform: "US",
    },
    {
      name: "Max / Eurosport",
      url: "https://www.eurosport.com/",
      platform: "Europe",
    }
  ],
};

// Alias NASCAR sub-series to the same watch links
WATCH_LINKS['nascar-cup'] = WATCH_LINKS['nascar'];
WATCH_LINKS['nascar-xfinity'] = WATCH_LINKS['nascar'];
WATCH_LINKS['nascar-trucks'] = WATCH_LINKS['nascar'];

// ========== TEAM HISTORY ==========
export interface TeamHistoryEntry {
  name: string;
  founded: string;
  country: string;
  achievements: string[];
  description: string;
}

export const TEAM_HISTORY: Record<string, TeamHistoryEntry[]> = {
  f1: [
    {
      name: "Scuderia Ferrari",
      founded: "1929",
      country: "Italy",
      achievements: [
        "16 Constructors' Championships",
        "15 Drivers' Championships",
        "Most wins in F1 history",
      ],
      description:
        "The most iconic and longest-running team in Formula 1 history. Ferrari has been a cornerstone of the sport since its inception.",
    },
    {
      name: "McLaren Racing",
      founded: "1963",
      country: "United Kingdom",
      achievements: [
        "8 Constructors' Championships",
        "12 Drivers' Championships",
      ],
      description:
        "Founded by Bruce McLaren, this legendary team has been home to champions like Senna, Prost, and Hamilton.",
    },
    {
      name: "Red Bull Racing",
      founded: "2005",
      country: "Austria",
      achievements: [
        "6 Constructors' Championships",
        "7 Drivers' Championships",
      ],
      description:
        "Originally Jaguar Racing, Red Bull transformed the team into a dominant force, especially in the Verstappen era.",
    },
    {
      name: "Mercedes-AMG Petronas",
      founded: "2010",
      country: "Germany",
      achievements: [
        "8 Constructors' Championships",
        "7 Drivers' Championships (Hamilton era)",
      ],
      description:
        "The Silver Arrows dominated the turbo-hybrid era with an unprecedented championship streak from 2014-2021.",
    },
  ],
  f2: [
    {
      name: "Prema Racing",
      founded: "1983",
      country: "Italy",
      achievements: [
        "Multiple F2 Team Championships",
        "Developed F1 drivers like Leclerc, Schwartzman",
      ],
      description:
        "Italy's premier feeder series team with an extraordinary track record of developing future grand prix winners.",
    },
    {
      name: "ART Grand Prix",
      founded: "2004",
      country: "France",
      achievements: [
        "Multiple GP2/F2 Championships",
        "Alumni include Hamilton, Rosberg, Russell",
      ],
      description:
        "A powerhouse in junior formula racing, ART has been the launching pad for numerous world champions.",
    },
  ],
  f3: [
    {
      name: "Prema Racing",
      founded: "1983",
      country: "Italy",
      achievements: [
        "Dominant in F3 competition",
        "Consistent championship contender",
      ],
      description:
        "The gold standard of junior formula racing, Prema's F3 program consistently produces top talent.",
    },
  ],
  "formula-e": [
    {
      name: "Jaguar TCS Racing",
      founded: "2016",
      country: "United Kingdom",
      achievements: ["Race winners", "Championship contender"],
      description:
        "Jaguar returned to top-level motorsport through Formula E, combining luxury brand heritage with electric innovation.",
    },
    {
      name: "DS Penske",
      founded: "2014",
      country: "France",
      achievements: [
        "Formula E Champions",
        "Multiple race winners",
      ],
      description:
        "A partnership between DS Automobiles and Team Penske, blending European engineering with American racing excellence.",
    },
  ],
  nascar: [
    {
      name: "Hendrick Motorsports",
      founded: "1984",
      country: "USA",
      achievements: [
        "14 Cup Series Championships",
        "Most wins in NASCAR history",
      ],
      description:
        "Rick Hendrick's powerhouse team has been home to legends like Jeff Gordon, Jimmie Johnson, and Chase Elliott.",
    },
    {
      name: "Joe Gibbs Racing",
      founded: "1992",
      country: "USA",
      achievements: [
        "5 Cup Series Championships",
        "Consistent championship contender",
      ],
      description:
        "Founded by NFL coaching legend Joe Gibbs, the team has become one of NASCAR's most successful organizations.",
    },
    {
      name: "Team Penske",
      founded: "1972",
      country: "USA",
      achievements: [
        "NASCAR, IndyCar, and IMSA Championships",
        "Cross-discipline powerhouse",
      ],
      description:
        'Roger Penske\'s racing empire is one of the most successful in all of motorsport, earning the nickname "The Captain."',
    },
  ],
  "gt-world-challenge": [
    {
      name: "WRT (W Racing Team)",
      founded: "2009",
      country: "Belgium",
      achievements: [
        "Multiple GT3 Championships",
        "24H Spa winners",
      ],
      description:
        "Belgian team WRT has become synonymous with GT racing excellence, particularly with Audi machinery.",
    },
  ],
  "top-fuel": [
    {
      name: "John Force Racing",
      founded: "1986",
      country: "USA",
      achievements: [
        "20+ NHRA Championships",
        "Winningest Funny Car team ever",
      ],
      description:
        "John Force is the most decorated driver in NHRA history, and his racing dynasty continues through his daughters.",
    },
    {
      name: "Don Schumacher Racing",
      founded: "1998",
      country: "USA",
      achievements: [
        "Multiple Top Fuel & Funny Car Championships",
        "Powerhouse multi-car team",
      ],
      description:
        "One of the largest multi-car teams in NHRA history, DSR has fielded championship-winning cars across categories.",
    },
    {
      name: "Kalitta Motorsports",
      founded: "1959",
      country: "USA",
      achievements: [
        "Top Fuel Championships",
        "Legacy of Connie Kalitta",
      ],
      description:
        "Founded by drag racing legend Connie 'The Bounty Hunter' Kalitta, this team carries decades of quarter-mile heritage.",
    },
  ],
  wec: [
    {
      name: "Toyota Gazoo Racing",
      founded: "2012",
      country: "Japan",
      achievements: [
        "Multiple Hypercar Championships",
        "Le Mans 24H Winners",
      ],
      description: "The dominant force in modern endurance racing, mastering the hybrid era.",
    },
    {
      name: "Ferrari AF Corse",
      founded: "2023",
      country: "Italy",
      achievements: [
        "Le Mans 24H Winners",
      ],
      description: "Ferrari's triumphant return to top-class sports car racing.",
    },
    {
      name: "Porsche Penske Motorsport",
      founded: "2023",
      country: "Germany/USA",
      achievements: [
        "WEC Race Winners",
        "IMSA Champions",
      ],
      description: "A powerhouse collaboration bringing Porsche's prototype legacy back to the world stage.",
    },
  ],
};

// Alias NASCAR sub-series to the same team history
TEAM_HISTORY['nascar-cup'] = TEAM_HISTORY['nascar'];
TEAM_HISTORY['nascar-xfinity'] = TEAM_HISTORY['nascar'];
TEAM_HISTORY['nascar-trucks'] = TEAM_HISTORY['nascar'];

// ========== MOCK NOTIFICATIONS ==========
export interface NotificationItem {
  id: string;
  type: "race" | "breaking" | "schedule" | "result";
  series: string;
  title: string;
  time: string;
}

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    type: "race",
    series: "f1",
    title: "F1 Australian GP — Race Day Sunday",
    time: "2h ago",
  },
  {
    id: "2",
    type: "breaking",
    series: "nascar",
    title: "NASCAR Bristol Night Race — Flag-to-flag action expected",
    time: "4h ago",
  },
  {
    id: "3",
    type: "result",
    series: "formula-e",
    title: "Formula E Tokyo E-Prix — Final results confirmed",
    time: "6h ago",
  },
  {
    id: "4",
    type: "schedule",
    series: "top-fuel",
    title: "NHRA Winternationals — Qualifying begins Friday",
    time: "8h ago",
  },
  {
    id: "5",
    type: "breaking",
    series: "f2",
    title: "F2 Championship — Title fight intensifies in Bahrain",
    time: "12h ago",
  },
  {
    id: "6",
    type: "race",
    series: "gt-world-challenge",
    title: "GT World Challenge Spa 24H — Entry list released",
    time: "1d ago",
  },
];

// ========== DRIVER ROSTERS (for Race Replay) ==========
import type { DriverInfo } from './replayTypes';

export const SERIES_DRIVERS: Record<string, DriverInfo[]> = {
  f1: [
    { code: 'VER', name: 'Max Verstappen', number: 1, team: 'Red Bull Racing', color: '#3671C6' },
    { code: 'PER', name: 'Sergio Perez', number: 11, team: 'Red Bull Racing', color: '#3671C6' },
    { code: 'HAM', name: 'Lewis Hamilton', number: 44, team: 'Ferrari', color: '#E8002D' },
    { code: 'LEC', name: 'Charles Leclerc', number: 16, team: 'Ferrari', color: '#E8002D' },
    { code: 'NOR', name: 'Lando Norris', number: 4, team: 'McLaren', color: '#FF8000' },
    { code: 'PIA', name: 'Oscar Piastri', number: 81, team: 'McLaren', color: '#FF8000' },
    { code: 'RUS', name: 'George Russell', number: 63, team: 'Mercedes', color: '#27F4D2' },
    { code: 'ANT', name: 'Kimi Antonelli', number: 12, team: 'Mercedes', color: '#27F4D2' },
    { code: 'ALO', name: 'Fernando Alonso', number: 14, team: 'Aston Martin', color: '#229971' },
    { code: 'STR', name: 'Lance Stroll', number: 18, team: 'Aston Martin', color: '#229971' },
    { code: 'GAS', name: 'Pierre Gasly', number: 10, team: 'Alpine', color: '#0093CC' },
    { code: 'DOO', name: 'Jack Doohan', number: 7, team: 'Alpine', color: '#0093CC' },
    { code: 'TSU', name: 'Yuki Tsunoda', number: 22, team: 'RB', color: '#6692FF' },
    { code: 'HAD', name: 'Isack Hadjar', number: 6, team: 'RB', color: '#6692FF' },
    { code: 'HUL', name: 'Nico Hulkenberg', number: 27, team: 'Kick Sauber', color: '#52E252' },
    { code: 'BOR', name: 'Gabriel Bortoleto', number: 5, team: 'Kick Sauber', color: '#52E252' },
    { code: 'ALB', name: 'Alexander Albon', number: 23, team: 'Williams', color: '#64C4FF' },
    { code: 'SAI', name: 'Carlos Sainz', number: 55, team: 'Williams', color: '#64C4FF' },
    { code: 'OCO', name: 'Esteban Ocon', number: 31, team: 'Haas', color: '#B6BABD' },
    { code: 'BEA', name: 'Oliver Bearman', number: 87, team: 'Haas', color: '#B6BABD' },
  ],
  f2: [
    { code: 'BOR', name: 'Gabriel Bortoleto', number: 1, team: 'Invicta Virtuosi', color: '#C92D22' },
    { code: 'HAD', name: 'Isack Hadjar', number: 2, team: 'Campos Racing', color: '#EF5350' },
    { code: 'MAL', name: 'Kush Maini', number: 5, team: 'Invicta Virtuosi', color: '#C92D22' },
    { code: 'ANT', name: 'Andrea Kimi Antonelli', number: 4, team: 'Prema Racing', color: '#E8002D' },
    { code: 'CRA', name: 'Jack Crawford', number: 8, team: 'DAMS', color: '#00629B' },
    { code: 'MAR', name: 'Pepe Marti', number: 14, team: 'Campos Racing', color: '#EF5350' },
    { code: 'DUR', name: 'Jak Crawford', number: 17, team: 'Hitech', color: '#B0B0B0' },
    { code: 'BEA', name: 'Oliver Bearman', number: 3, team: 'Prema Racing', color: '#E8002D' },
    { code: 'COL', name: 'Franco Colapinto', number: 7, team: 'MP Motorsport', color: '#FF6B00' },
    { code: 'COR', name: 'Zane Maloney', number: 10, team: 'Rodin Motorsport', color: '#FFD700' },
    { code: 'AIT', name: 'Amaury Cordeel', number: 21, team: 'Van Amersfoort', color: '#FF4500' },
    { code: 'VES', name: 'Frederik Vesti', number: 6, team: 'ART Grand Prix', color: '#CC0000' },
    { code: 'DUF', name: 'Enzo Fittipaldi', number: 11, team: 'Van Amersfoort', color: '#FF4500' },
    { code: 'IWA', name: 'Ritomo Miyata', number: 15, team: 'Rodin Motorsport', color: '#FFD700' },
    { code: 'ONG', name: 'Dennis Hauger', number: 9, team: 'MP Motorsport', color: '#FF6B00' },
    { code: 'BOS', name: 'Aron Canet', number: 18, team: 'DAMS', color: '#00629B' },
    { code: 'DRU', name: 'Victor Martins', number: 12, team: 'ART Grand Prix', color: '#CC0000' },
    { code: 'OBR', name: 'Richard Verschoor', number: 16, team: 'Trident', color: '#0055FF' },
    { code: 'SAR', name: 'Logan Sargeant', number: 19, team: 'Hitech', color: '#B0B0B0' },
    { code: 'TWI', name: 'Cian Shields', number: 20, team: 'Trident', color: '#0055FF' },
    { code: 'MAI', name: 'Taylor Barnard', number: 22, team: 'Jenzer', color: '#8B0000' },
    { code: 'FIT', name: 'Arthur Leclerc', number: 24, team: 'Jenzer', color: '#8B0000' },
  ],
  f3: Array.from({ length: 30 }, (_, i) => ({
    code: `D${String(i + 1).padStart(2, '0')}`,
    name: `Driver ${i + 1}`,
    number: i + 1,
    team: ['Prema', 'ART', 'Trident', 'MP', 'Hitech', 'Campos', 'Carlin', 'Jenzer', 'Van Amersfoort', 'DAMS'][i % 10],
    color: ['#E8002D', '#CC0000', '#0055FF', '#FF6B00', '#B0B0B0', '#EF5350', '#0080FF', '#8B0000', '#FF4500', '#00629B'][i % 10],
  })),
  'formula-e': [
    { code: 'VER', name: 'Jake Dennis', number: 27, team: 'Andretti Porsche', color: '#D5001F' },
    { code: 'EVA', name: 'Mitch Evans', number: 9, team: 'Jaguar TCS', color: '#006633' },
    { code: 'CAS', name: 'Nick Cassidy', number: 37, team: 'Jaguar TCS', color: '#006633' },
    { code: 'WEH', name: 'Pascal Wehrlein', number: 94, team: 'TAG Heuer Porsche', color: '#D5001F' },
    { code: 'VAN', name: 'Jean-Eric Vergne', number: 25, team: 'DS Penske', color: '#D4AF37' },
    { code: 'LOT', name: 'Stoffel Vandoorne', number: 5, team: 'DS Penske', color: '#D4AF37' },
    { code: 'DEV', name: 'Nyck de Vries', number: 17, team: 'Mahindra', color: '#DD052B' },
    { code: 'BUE', name: 'Sebastien Buemi', number: 16, team: 'Envision', color: '#00A550' },
    { code: 'ROW', name: 'Oliver Rowland', number: 22, team: 'Nissan', color: '#C3002F' },
    { code: 'NOR', name: 'Norman Nato', number: 18, team: 'Nissan', color: '#C3002F' },
    { code: 'MUL', name: 'Edoardo Mortara', number: 48, team: 'Mahindra', color: '#DD052B' },
    { code: 'DaCO', name: 'Antonio Felix da Costa', number: 13, team: 'TAG Heuer Porsche', color: '#D5001F' },
    { code: 'GUN', name: 'Maximilian Gunther', number: 7, team: 'Maserati MSG', color: '#003DA5' },
    { code: 'DIL', name: 'Lucas di Grassi', number: 11, team: 'ABT Cupra', color: '#97C93D' },
    { code: 'SEA', name: 'Dan Ticktum', number: 33, team: 'NIO 333', color: '#33CCCC' },
    { code: 'HUG', name: 'Jake Hughes', number: 29, team: 'McLaren', color: '#FF8000' },
    { code: 'FEN', name: 'Sam Bird', number: 3, team: 'McLaren', color: '#FF8000' },
    { code: 'DAR', name: 'Rene Rast', number: 45, team: 'ABT Cupra', color: '#97C93D' },
    { code: 'ABB', name: 'Robin Frijns', number: 4, team: 'Envision', color: '#00A550' },
    { code: 'BER', name: 'Sacha Fenestraz', number: 8, team: 'NIO 333', color: '#33CCCC' },
    { code: 'TUR', name: 'Jehan Daruvala', number: 21, team: 'Maserati MSG', color: '#003DA5' },
    { code: 'FON', name: 'Andre Lotterer', number: 36, team: 'Andretti Porsche', color: '#D5001F' },
  ],
  nascar: [
    { code: 'ELL', name: 'Chase Elliott', number: 9, team: 'Hendrick', color: '#3366CC' },
    { code: 'LAR', name: 'Kyle Larson', number: 5, team: 'Hendrick', color: '#3366CC' },
    { code: 'BYR', name: 'William Byron', number: 24, team: 'Hendrick', color: '#3366CC' },
    { code: 'BOW', name: 'Alex Bowman', number: 48, team: 'Hendrick', color: '#3366CC' },
    { code: 'HAM', name: 'Denny Hamlin', number: 11, team: 'Joe Gibbs Racing', color: '#CC0000' },
    { code: 'TRX', name: 'Martin Truex Jr', number: 19, team: 'Joe Gibbs Racing', color: '#CC0000' },
    { code: 'GIB', name: 'Ty Gibbs', number: 54, team: 'Joe Gibbs Racing', color: '#CC0000' },
    { code: 'BEL', name: 'Christopher Bell', number: 20, team: 'Joe Gibbs Racing', color: '#CC0000' },
    { code: 'LOG', name: 'Joey Logano', number: 22, team: 'Team Penske', color: '#FFD700' },
    { code: 'BLA', name: 'Ryan Blaney', number: 12, team: 'Team Penske', color: '#FFD700' },
    { code: 'CIN', name: 'Austin Cindric', number: 2, team: 'Team Penske', color: '#FFD700' },
    { code: 'HAR', name: 'Kevin Harvick', number: 4, team: 'Stewart-Haas', color: '#FFD700' },
    { code: 'BUS', name: 'Kyle Busch', number: 8, team: 'RCR', color: '#3333CC' },
    { code: 'DIL', name: 'Austin Dillon', number: 3, team: 'RCR', color: '#3333CC' },
    { code: 'WAL', name: 'Bubba Wallace', number: 23, team: '23XI Racing', color: '#000000' },
    { code: 'RED', name: 'Tyler Reddick', number: 45, team: '23XI Racing', color: '#000000' },
    { code: 'CHV', name: 'Ross Chastain', number: 1, team: 'Trackhouse', color: '#FF4500' },
    { code: 'SUA', name: 'Daniel Suarez', number: 99, team: 'Trackhouse', color: '#FF4500' },
    { code: 'BRO', name: 'Connor Zilisch', number: 21, team: 'Wood Brothers', color: '#8B4513' },
    { code: 'STE', name: 'Josh Berry', number: 4, team: 'Stewart-Haas', color: '#006400' },
    { code: 'KES', name: 'Brad Keselowski', number: 6, team: 'RFK Racing', color: '#0000CD' },
    { code: 'MCK', name: 'Chris Buescher', number: 17, team: 'RFK Racing', color: '#0000CD' },
    { code: 'ENJ', name: 'Erik Jones', number: 43, team: 'Legacy Motor Club', color: '#800080' },
    { code: 'BRB', name: 'Harrison Burton', number: 21, team: 'Wood Brothers', color: '#8B4513' },
    { code: 'PRE', name: 'Ryan Preece', number: 41, team: 'Stewart-Haas', color: '#006400' },
    { code: 'BRC', name: 'Michael McDowell', number: 34, team: 'Front Row', color: '#FF1493' },
    { code: 'GIL', name: 'Todd Gilliland', number: 38, team: 'Front Row', color: '#FF1493' },
    { code: 'STE2', name: 'Corey LaJoie', number: 7, team: 'Spire', color: '#808080' },
    { code: 'ALM', name: 'Aric Almirola', number: 15, team: 'Rick Ware', color: '#696969' },
    { code: 'NEM', name: 'John Hunter Nemechek', number: 42, team: 'Legacy Motor Club', color: '#800080' },
    { code: 'CAS', name: 'Noah Gragson', number: 10, team: 'Stewart-Haas', color: '#006400' },
    { code: 'GRA', name: 'Zane Smith', number: 71, team: 'Spire', color: '#808080' },
    { code: 'HEM', name: 'Daniel Hemric', number: 31, team: 'Kaulig', color: '#FF6347' },
    { code: 'STN', name: 'Chase Briscoe', number: 14, team: 'Stewart-Haas', color: '#006400' },
    { code: 'ALL', name: 'Justin Haley', number: 51, team: 'Rick Ware', color: '#696969' },
    { code: 'GRN', name: 'BJ McLeod', number: 78, team: 'Live Fast', color: '#BEBEBE' },
    { code: 'SMI', name: 'JJ Yeley', number: 15, team: 'Rick Ware', color: '#696969' },
    { code: 'BYN', name: 'Cody Ware', number: 51, team: 'Rick Ware', color: '#696969' },
    { code: 'HII', name: 'Ty Dillon', number: 16, team: 'Kaulig', color: '#FF6347' },
    { code: 'RIC', name: 'Ricky Stenhouse Jr', number: 47, team: 'JTG Daugherty', color: '#FFD700' },
  ],
  'gt-world-challenge': [
    { code: 'VAL', name: 'Valentino Rossi', number: 46, team: 'WRT BMW', color: '#0066B1' },
    { code: 'MAR', name: 'Dries Vanthoor', number: 32, team: 'WRT BMW', color: '#0066B1' },
    { code: 'ENG', name: 'Maro Engel', number: 4, team: 'Haupt AMG', color: '#00D2BE' },
    { code: 'MET', name: 'Jules Gounon', number: 89, team: 'AKKA ASP', color: '#CCCCCC' },
    { code: 'PEP', name: 'Raffaele Marciello', number: 88, team: 'AKKA ASP', color: '#CCCCCC' },
    { code: 'VAN', name: 'Kelvin van der Linde', number: 3, team: 'ABT Audi', color: '#FF0000' },
    { code: 'BAR', name: 'Mirko Bortolotti', number: 63, team: 'GRT Lambo', color: '#FFD700' },
    { code: 'TIM', name: 'Timur Boguslavskiy', number: 20, team: 'SPS AMG', color: '#006400' },
    { code: 'MAI', name: 'Christian Mamerow', number: 28, team: 'Montaplast Audi', color: '#00FF7F' },
    { code: 'CAL', name: 'Andrea Caldarelli', number: 19, team: 'GRT Lambo', color: '#FFD700' },
    { code: 'BER', name: 'Alessio Rovera', number: 51, team: 'AF Corse Ferrari', color: '#E8002D' },
    { code: 'PIE', name: 'Thomas Preining', number: 911, team: 'Manthey Porsche', color: '#FFFFFF' },
    { code: 'JAM', name: 'Nick Tandy', number: 911, team: 'Manthey Porsche', color: '#FFFFFF' },
    { code: 'SOR', name: 'Marco Sorensen', number: 7, team: 'Beechdean AMR', color: '#006633' },
    { code: 'PEE', name: 'Pepe Oriola', number: 69, team: 'Optimum McLaren', color: '#FF8000' },
    { code: 'WES', name: 'Sheldon van der Linde', number: 31, team: 'WRT BMW', color: '#0066B1' },
    { code: 'BOO', name: 'Marco Mapelli', number: 14, team: 'Emil Frey Lambo', color: '#FFFF00' },
    { code: 'FRO', name: 'Dennis Lind', number: 77, team: 'Barwell Lambo', color: '#32CD32' },
    { code: 'TAM', name: 'Mattia Drudi', number: 12, team: 'Tresor Audi', color: '#FF69B4' },
    { code: 'GRO', name: 'Maximilian Gotz', number: 100, team: 'GetSpeed AMG', color: '#4169E1' },
  ],
  'top-fuel': [
    { code: 'BFO', name: 'Brittany Force', number: 1, team: 'John Force Racing', color: '#FFD700' },
    { code: 'ANT', name: 'Antron Brown', number: 2, team: 'AB Motorsports', color: '#FF4500' },
  ],
  wec: [
    // ── Hypercar Class (Top Prototype Class) ──
    { code: 'BUE', name: 'Sébastien Buemi', number: 8, team: 'Toyota Gazoo Racing', color: '#E5001C' },
    { code: 'GIO', name: 'Antonio Giovinazzi', number: 51, team: 'Ferrari AF Corse', color: '#DC0000' },
    { code: 'EST', name: 'Kevin Estre', number: 6, team: 'Porsche Penske Motorsport', color: '#C0C0C0' },
    { code: 'BAM', name: 'Earl Bamber', number: 2, team: 'Cadillac Racing', color: '#FFCC00' },
    { code: 'VDS', name: 'Stoffel Vandoorne', number: 93, team: 'Peugeot TotalEnergies', color: '#00A3E0' },
    { code: 'HAB', name: 'Ferdinand Habsburg', number: 35, team: 'Alpine Endurance Team', color: '#0055A5' },
    { code: 'RAS', name: 'René Rast', number: 20, team: 'BMW M Team WRT', color: '#1B365D' },
    { code: 'BOR', name: 'Mirko Bortolotti', number: 63, team: 'Lamborghini Iron Lynx', color: '#009933' },
    // ── LMGT3 Class (Production GT3 Sports Cars) ──
    { code: 'BAC', name: 'Klaus Bachler', number: 92, team: 'Manthey PureRxcing (Porsche)', color: '#FF7F00' },
    { code: 'ROS', name: 'Valentino Rossi', number: 46, team: 'Team WRT (BMW M4)', color: '#FFFF00' },
    { code: 'AND', name: 'Rui Andrade', number: 81, team: 'TF Sport (Corvette Z06)', color: '#E8B923' },
    { code: 'GAT', name: 'Michelle Gatting', number: 85, team: 'Iron Dames (Lamborghini)', color: '#FF1493' },
    { code: 'COT', name: 'Charlie Eastwood', number: 59, team: 'United Autosports (McLaren)', color: '#FF8000' },
    { code: 'RIG', name: 'Davide Rigon', number: 54, team: 'Vista AF Corse (Ferrari 296)', color: '#B22222' },
    { code: 'BAR', name: 'Ben Barker', number: 77, team: 'Proton Competition (Ford Mustang)', color: '#002B49' },
    { code: 'MAN', name: 'Daniel Mancinelli', number: 27, team: 'Heart of Racing (Aston Martin)', color: '#00665E' },
  ],
};

// Alias NASCAR sub-series to share the Cup driver roster as a fallback for simulation
// The live CDN feed will provide the actual drivers dynamically
SERIES_DRIVERS['nascar-cup'] = SERIES_DRIVERS['nascar'];
SERIES_DRIVERS['nascar-xfinity'] = SERIES_DRIVERS['nascar'];
SERIES_DRIVERS['nascar-trucks'] = SERIES_DRIVERS['nascar'];

export function getDriverColor(series: string, code: string): string | undefined {
  const drivers = SERIES_DRIVERS[series];
  if (!drivers) return undefined;
  const driver = drivers.find(d => d.code === code);
  return driver?.color;
}
