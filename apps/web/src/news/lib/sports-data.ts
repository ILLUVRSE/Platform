export type SportsLeague = {
  id: string;
  name: string;
  tag: string;
  accent: string;
};

export type SportsTeam = {
  id: string;
  name: string;
  shortName: string;
  abbr: string;
  leagueId: string;
  tag: string;
  logoUrl?: string;
  accent: string;
};

export type SportsAthlete = {
  id: string;
  name: string;
  teamId: string;
  leagueId: string;
  tag: string;
  position?: string;
};

export type SportsGameStatus = "live" | "final" | "upcoming";

export type SportsGame = {
  id: string;
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  startTime: string;
  status: SportsGameStatus;
  homeScore?: number;
  awayScore?: number;
  period?: string;
  venue?: string;
  broadcast?: string;
  spotlight?: boolean;
};

export const sportsLeagues: SportsLeague[] = [
  { id: "nba", name: "NBA", tag: "NBA", accent: "#1d4ed8" },
  { id: "wnba", name: "WNBA", tag: "WNBA", accent: "#f97316" },
  { id: "nfl", name: "NFL", tag: "NFL", accent: "#111827" },
  { id: "mlb", name: "MLB", tag: "MLB", accent: "#dc2626" },
  { id: "epl", name: "Premier League", tag: "Premier League", accent: "#047857" },
];

const buildTeamLogoUrl = (abbr: string, accent: string) => {
  const color = accent.replace("#", "");
  return `https://placehold.co/96x96/${color}/ffffff.png?text=${encodeURIComponent(abbr)}`;
};

export const sportsTeams: SportsTeam[] = [
  { id: "lakers", name: "Los Angeles Lakers", shortName: "Lakers", abbr: "LAL", leagueId: "nba", tag: "Lakers", accent: "#552583", logoUrl: buildTeamLogoUrl("LAL", "#552583") },
  { id: "celtics", name: "Boston Celtics", shortName: "Celtics", abbr: "BOS", leagueId: "nba", tag: "Celtics", accent: "#007a33", logoUrl: buildTeamLogoUrl("BOS", "#007a33") },
  { id: "aces", name: "Las Vegas Aces", shortName: "Aces", abbr: "LVA", leagueId: "wnba", tag: "Aces", accent: "#111111", logoUrl: buildTeamLogoUrl("LVA", "#111111") },
  { id: "liberty", name: "New York Liberty", shortName: "Liberty", abbr: "NYL", leagueId: "wnba", tag: "Liberty", accent: "#00a9a5", logoUrl: buildTeamLogoUrl("NYL", "#00a9a5") },
  { id: "chiefs", name: "Kansas City Chiefs", shortName: "Chiefs", abbr: "KC", leagueId: "nfl", tag: "Chiefs", accent: "#e31837", logoUrl: buildTeamLogoUrl("KC", "#e31837") },
  { id: "niners", name: "San Francisco 49ers", shortName: "49ers", abbr: "SF", leagueId: "nfl", tag: "49ers", accent: "#aa0000", logoUrl: buildTeamLogoUrl("SF", "#aa0000") },
  { id: "yankees", name: "New York Yankees", shortName: "Yankees", abbr: "NYY", leagueId: "mlb", tag: "Yankees", accent: "#1b2d5c", logoUrl: buildTeamLogoUrl("NYY", "#1b2d5c") },
  { id: "dodgers", name: "Los Angeles Dodgers", shortName: "Dodgers", abbr: "LAD", leagueId: "mlb", tag: "Dodgers", accent: "#005a9c", logoUrl: buildTeamLogoUrl("LAD", "#005a9c") },
  { id: "arsenal", name: "Arsenal FC", shortName: "Arsenal", abbr: "ARS", leagueId: "epl", tag: "Arsenal", accent: "#ef4444", logoUrl: buildTeamLogoUrl("ARS", "#ef4444") },
  { id: "man-city", name: "Manchester City", shortName: "Man City", abbr: "MCI", leagueId: "epl", tag: "Man City", accent: "#38bdf8", logoUrl: buildTeamLogoUrl("MCI", "#38bdf8") },
];

export const sportsAthletes: SportsAthlete[] = [
  { id: "lebron-james", name: "LeBron James", teamId: "lakers", leagueId: "nba", tag: "LeBron James", position: "F" },
  { id: "jayson-tatum", name: "Jayson Tatum", teamId: "celtics", leagueId: "nba", tag: "Jayson Tatum", position: "F" },
  { id: "aja-wilson", name: "Aja Wilson", teamId: "aces", leagueId: "wnba", tag: "Aja Wilson", position: "F" },
  { id: "breanna-stewart", name: "Breanna Stewart", teamId: "liberty", leagueId: "wnba", tag: "Breanna Stewart", position: "F" },
  { id: "patrick-mahomes", name: "Patrick Mahomes", teamId: "chiefs", leagueId: "nfl", tag: "Patrick Mahomes", position: "QB" },
  { id: "christian-mccaffrey", name: "Christian McCaffrey", teamId: "niners", leagueId: "nfl", tag: "Christian McCaffrey", position: "RB" },
  { id: "aaron-judge", name: "Aaron Judge", teamId: "yankees", leagueId: "mlb", tag: "Aaron Judge", position: "OF" },
  { id: "mookie-betts", name: "Mookie Betts", teamId: "dodgers", leagueId: "mlb", tag: "Mookie Betts", position: "OF" },
  { id: "bukayo-saka", name: "Bukayo Saka", teamId: "arsenal", leagueId: "epl", tag: "Bukayo Saka", position: "RW" },
  { id: "erling-haaland", name: "Erling Haaland", teamId: "man-city", leagueId: "epl", tag: "Erling Haaland", position: "ST" },
];

const hours = (value: number) => value * 60 * 60 * 1000;

export function getSportsSchedule(now: Date = new Date()): SportsGame[] {
  const base = now.getTime();

  return [
    {
      id: "nba-lal-bos-live",
      leagueId: "nba",
      homeTeamId: "celtics",
      awayTeamId: "lakers",
      startTime: new Date(base - hours(1)).toISOString(),
      status: "live",
      homeScore: 88,
      awayScore: 82,
      period: "Q3 04:12",
      venue: "TD Garden",
      broadcast: "ILLUVRSE Sports Live",
      spotlight: true,
    },
    {
      id: "epl-ars-mci-live",
      leagueId: "epl",
      homeTeamId: "arsenal",
      awayTeamId: "man-city",
      startTime: new Date(base - hours(0.5)).toISOString(),
      status: "live",
      homeScore: 1,
      awayScore: 2,
      period: "75'",
      venue: "Emirates Stadium",
      broadcast: "Global Matchday",
      spotlight: true,
    },
    {
      id: "wnba-nyl-lva-final",
      leagueId: "wnba",
      homeTeamId: "liberty",
      awayTeamId: "aces",
      startTime: new Date(base - hours(6)).toISOString(),
      status: "final",
      homeScore: 79,
      awayScore: 83,
      period: "Final",
      venue: "Barclays Center",
      broadcast: "ILLUVRSE Sports",
    },
    {
      id: "nfl-kc-sf-final",
      leagueId: "nfl",
      homeTeamId: "chiefs",
      awayTeamId: "niners",
      startTime: new Date(base - hours(8)).toISOString(),
      status: "final",
      homeScore: 27,
      awayScore: 24,
      period: "Final",
      venue: "Arrowhead Stadium",
      broadcast: "Prime Game",
    },
    {
      id: "mlb-nyy-lad-upcoming",
      leagueId: "mlb",
      homeTeamId: "yankees",
      awayTeamId: "dodgers",
      startTime: new Date(base + hours(4)).toISOString(),
      status: "upcoming",
      venue: "Yankee Stadium",
      broadcast: "ILLUVRSE Sports",
      spotlight: true,
    },
    {
      id: "wnba-lva-nyl-upcoming",
      leagueId: "wnba",
      homeTeamId: "aces",
      awayTeamId: "liberty",
      startTime: new Date(base + hours(6)).toISOString(),
      status: "upcoming",
      venue: "Michelob ULTRA Arena",
      broadcast: "West Coast",
    },
  ];
}
