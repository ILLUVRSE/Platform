import Image from 'next/image';
import Link from 'next/link';
import { Prisma } from '@illuvrse/db';
import prisma from '@news/lib/prisma';
import { TagChip } from '@news/components/ui';
import { getSportsSchedule, sportsAthletes, sportsLeagues, sportsTeams } from '@news/lib/sports-data';
import type { SportsGame, SportsLeague, SportsTeam } from '@news/lib/sports-data';

export const revalidate = 60;
const pageSize = 12;
const days = (n: number) => n * 24 * 60 * 60 * 1000;
const NOW = Date.now();

const formatDate = (date: Date | null) =>
  date ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date) : 'New';

const extractTags = (videos: { tags: string | null }[]) =>
  Array.from(
    new Set(
      videos
        .flatMap((video) => (video.tags ? video.tags.split(',') : []))
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );

const parseTags = (value: string | null) =>
  value
    ? value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

const matchesTag = (tags: string[], target: string) => {
  const normalizedTarget = target.toLowerCase();
  return tags.some((tag) => {
    const normalized = tag.toLowerCase();
    return normalized === normalizedTarget || normalized.includes(normalizedTarget);
  });
};

const formatGameTime = (value: string) =>
  new Intl.DateTimeFormat('en', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));

const formatGameShortTime = (value: string) =>
  new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));

const claytonColumnLead = {
  title: "Why Can't the Cardinals Win?",
  summary:
    'St. Louis has the depth to contend, but the margin keeps slipping on defense, on-base consistency, and late-inning execution.',
  readTime: '7 min read',
  tag: 'MLB | Cardinals',
  dateLabel: 'Today',
  href: '/news/columns/claytons-corner/why-cant-the-cardinals-win',
  image: 'https://images.unsplash.com/photo-1508804185872-c9573e5334f3?auto=format&fit=crop&w=1400&q=80',
  imageAlt: 'Baseball field under stadium lights',
};

const claytonQuickReads = [
  {
    title: 'Tempo without chaos',
    tag: 'NBA',
    readTime: '4 min read',
  },
  {
    title: 'Touchline tells',
    tag: 'Premier League',
    readTime: '3 min read',
  },
  {
    title: 'Bullpen leverage map',
    tag: 'MLB',
    readTime: '5 min read',
  },
];

const claytonWatchList = [
  { matchup: 'Lakers vs. Celtics', note: 'late-game execution' },
  { matchup: 'Arsenal vs. Man City', note: 'midfield control' },
  { matchup: 'Yankees vs. Dodgers', note: 'bullpen depth' },
];

const claytonDeskNote = "Next column drops Friday morning. Send story tips to the desk.";

export default async function VideosPage({
  searchParams,
}: {
  searchParams?: Promise<{
    tag?: string;
    range?: string;
    page?: string;
    region?: string;
    league?: string;
    team?: string;
    athlete?: string;
  }>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const tagFilter = resolved?.tag ? decodeURIComponent(resolved.tag) : undefined;
  const leagueParam = resolved?.league ? decodeURIComponent(resolved.league) : undefined;
  const teamParam = resolved?.team ? decodeURIComponent(resolved.team) : undefined;
  const athleteParam = resolved?.athlete ? decodeURIComponent(resolved.athlete) : undefined;
  const rangeDays = resolved?.range ? Number(resolved.range) || undefined : undefined;
  const page = Math.max(1, resolved?.page ? Number(resolved.page) || 1 : 1);
  const skip = (page - 1) * pageSize;
  const now = NOW;
  const regionParam = resolved?.region?.toUpperCase() || 'WORLD';

  const leagueLookup = new Map(sportsLeagues.map((league) => [league.id, league]));
  const teamLookup = new Map(sportsTeams.map((team) => [team.id, team]));
  const athleteLookup = new Map(sportsAthletes.map((athlete) => [athlete.id, athlete]));

  const selectedAthlete = athleteParam ? athleteLookup.get(athleteParam) : undefined;
  const selectedTeam = teamParam ? teamLookup.get(teamParam) : undefined;
  const resolvedTeam = selectedTeam ?? (selectedAthlete ? teamLookup.get(selectedAthlete.teamId) : undefined);
  const selectedLeague = leagueParam ? leagueLookup.get(leagueParam) : undefined;
  const resolvedLeague =
    selectedLeague ??
    (resolvedTeam ? leagueLookup.get(resolvedTeam.leagueId) : undefined) ??
    (selectedAthlete ? leagueLookup.get(selectedAthlete.leagueId) : undefined);
  const sportsFiltersActive = Boolean(leagueParam || teamParam || athleteParam);

  const tagFilters = [tagFilter, resolvedLeague?.tag, resolvedTeam?.tag, selectedAthlete?.tag].filter(
    Boolean,
  ) as string[];
  const tagClauses = tagFilters.map((tag) => ({ tags: { contains: tag, mode: 'insensitive' as const } }));

  const baseVodWhere: Prisma.VideoWhereInput = {
    live: false,
    published: true,
    ...(tagClauses.length ? { AND: tagClauses } : {}),
    ...(rangeDays
      ? {
          publishedAt: {
            gte: new Date(now - days(rangeDays)),
          },
        }
      : {}),
  };

  const recentCutoff = new Date(now - days(45));
  const recentWhere: Prisma.VideoWhereInput = {
    ...baseVodWhere,
    ...(baseVodWhere.publishedAt ? { publishedAt: baseVodWhere.publishedAt } : { publishedAt: { gte: recentCutoff } }),
  };

  const [live, vods, totalVodCount, recentCount, tagUniverse] = await Promise.all([
    prisma.video.findMany({
      where: {
        live: true,
        published: true,
        ...(regionParam && regionParam !== 'WORLD' ? { countryCode: regionParam } : {}),
        ...(tagClauses.length ? { AND: tagClauses } : {}),
      },
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.video.findMany({
      where: baseVodWhere,
      orderBy: { publishedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.video.count({ where: baseVodWhere }),
    prisma.video.count({ where: recentWhere }),
    prisma.video.findMany({ where: { published: true }, select: { tags: true }, take: 200 }),
  ]);

  const tagSets = tagUniverse.map((video) => parseTags(video.tags));
  const countMatches = (match: string) =>
    tagSets.reduce((count, tags) => (matchesTag(tags, match) ? count + 1 : count), 0);

  const leaguesWithCounts = sportsLeagues.map((league) => ({
    ...league,
    count: countMatches(league.tag),
  }));
  const teamsWithCounts = sportsTeams.map((team) => ({
    ...team,
    count: countMatches(team.tag),
  }));
  const athletesWithCounts = sportsAthletes.map((athlete) => ({
    ...athlete,
    count: countMatches(athlete.tag),
  }));

  const pickWithFallback = <T extends { count: number }>(items: T[], limit: number) => {
    const ordered = [...items].sort((a, b) => b.count - a.count);
    const nonZero = ordered.filter((item) => item.count > 0);
    return (nonZero.length > 0 ? nonZero : ordered).slice(0, limit);
  };

  const tags = extractTags(tagUniverse).slice(0, 12);
  const totalVideos = live.length + totalVodCount;
  const totalPages = Math.max(1, Math.ceil(totalVodCount / pageSize));
  const featuredVod = vods[0];
  const onDemand = featuredVod ? vods.slice(1) : vods;

  const schedule = getSportsSchedule();
  const filteredSchedule = schedule.filter((game) => {
    if (resolvedLeague && game.leagueId !== resolvedLeague.id) return false;
    if (resolvedTeam && game.homeTeamId !== resolvedTeam.id && game.awayTeamId !== resolvedTeam.id) return false;
    return true;
  });
  const scheduleSource = sportsFiltersActive ? filteredSchedule : schedule;
  const liveGames = scheduleSource.filter((game) => game.status === 'live');
  const finalGames = scheduleSource.filter((game) => game.status === 'final');
  const upcomingGames = scheduleSource.filter((game) => game.status === 'upcoming');
  const topGames = scheduleSource.filter((game) => game.spotlight).slice(0, 3);
  const topGamesFallback = topGames.length > 0 ? topGames : scheduleSource.slice(0, 3);
  const activeFilterLabel = [resolvedLeague?.name, resolvedTeam?.shortName ?? resolvedTeam?.name, selectedAthlete?.name]
    .filter(Boolean)
    .join(' • ');
  const visibleTeams = pickWithFallback(teamsWithCounts, 8);
  const visibleAthletes = pickWithFallback(athletesWithCounts, 8);

  const currentSearch = new URLSearchParams();
  if (tagFilter) currentSearch.set('tag', tagFilter);
  if (rangeDays) currentSearch.set('range', String(rangeDays));
  if (page > 1) currentSearch.set('page', String(page));
  if (regionParam) currentSearch.set('region', regionParam);
  if (leagueParam) currentSearch.set('league', leagueParam);
  if (teamParam) currentSearch.set('team', teamParam);
  if (athleteParam) currentSearch.set('athlete', athleteParam);

  const buildQuery = (
    next: Partial<{
      tag: string | undefined;
      range: number | undefined;
      page: number | undefined;
      league: string | undefined;
      team: string | undefined;
      athlete: string | undefined;
    }>,
  ) => {
    const params = new URLSearchParams(currentSearch);
    if (next.tag !== undefined) {
      if (next.tag) {
        params.set('tag', next.tag);
      } else {
        params.delete('tag');
      }
    }
    if (next.range !== undefined) {
      if (next.range) {
        params.set('range', String(next.range));
      } else {
        params.delete('range');
      }
    }
    if (next.page !== undefined) {
      if (next.page > 1) {
        params.set('page', String(next.page));
      } else {
        params.delete('page');
      }
    } else {
      params.delete('page');
    }
    if (next.league !== undefined) {
      if (next.league) {
        params.set('league', next.league);
      } else {
        params.delete('league');
      }
    }
    if (next.team !== undefined) {
      if (next.team) {
        params.set('team', next.team);
      } else {
        params.delete('team');
      }
    }
    if (next.athlete !== undefined) {
      if (next.athlete) {
        params.set('athlete', next.athlete);
      } else {
        params.delete('athlete');
      }
    }
    const query = params.toString();
    return query ? `?${query}` : '';
  };

  return (
    <main
      className="mx-auto min-h-screen max-w-6xl px-4 py-12"
      style={{ background: 'var(--cream)', color: 'var(--text)' }}
    >
      <section
        className="relative overflow-hidden rounded-3xl border px-6 py-8 shadow-sm md:px-10"
        style={{
          borderColor: 'var(--border)',
          background: 'linear-gradient(135deg, #f7f3eb 0%, #e8f0ea 38%, #fce7de 100%)',
          color: 'var(--forest)',
          boxShadow: '0 18px 48px -28px rgba(62,95,80,0.35)',
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="absolute -left-16 -top-32 h-72 w-72 rounded-full bg-[#5b8f7b]/20 blur-3xl" />
          <div className="absolute right-[-120px] bottom-[-140px] h-80 w-80 rounded-full bg-[#ec5a48]/16 blur-3xl" />
        </div>
        <div className="relative grid gap-8 md:grid-cols-[2fr,1.1fr] md:items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.6)' }}>
              <span style={{ color: 'var(--forest)' }}>Sports Desk</span>
              <span className="rounded-full bg-[#ec5a48] px-2 py-[2px] text-white">Live & Replays</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-black leading-tight tracking-tight md:text-5xl" style={{ color: 'var(--forest)' }}>
                ILLUVRSE Sports
              </h1>
              <p className="max-w-2xl text-base md:text-lg" style={{ color: 'var(--text)' }}>
                Live matchups, highlight reels, player interviews, and post-game analysis captured for replay.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/news/live"
                className="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition hover:-translate-y-[2px]"
                style={{ borderColor: 'var(--forest)', background: 'rgba(62,95,80,0.1)', color: 'var(--forest)', boxShadow: '0 14px 38px -26px rgba(62,95,80,0.4)' }}
              >
                Open Live Stream
              </Link>
              <span className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em]" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.65)', color: 'var(--muted)' }}>
                Archive ready • {totalVideos} replays
              </span>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                <span className="font-semibold" style={{ color: 'var(--forest)' }}>
                  Tags in rotation:
                </span>
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/news/videos${buildQuery({ tag, page: 1 })}`}
                    className="rounded-full border px-3 py-1 transition hover:-translate-y-0.5"
                    style={
                      tagFilter === tag
                        ? { borderColor: 'var(--sage)', background: 'rgba(91,143,123,0.12)', color: 'var(--forest)' }
                        : { borderColor: 'var(--border)', background: 'rgba(255,255,255,0.65)', color: 'var(--text)' }
                    }
                  >
                    {tag}
                  </Link>
                ))}
                {(tagFilter || rangeDays || regionParam !== 'WORLD' || sportsFiltersActive) && (
                  <Link
                    href="/news/videos"
                    className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                    style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.65)', color: 'var(--muted)' }}
                  >
                    Clear all filters
                  </Link>
                )}
              </div>
            )}
          </div>
          <div className="grid gap-3 rounded-2xl border bg-white/50 p-4 backdrop-blur" style={{ borderColor: 'var(--border)' }}>
            <StatBlock label="Live right now" value={live.length} accent="#ec5a48" />
            <div className="grid gap-3 sm:grid-cols-2">
              <StatBlock label="Highlights" value={totalVodCount} accent="#3e5f50" subtle />
              <StatBlock label="New this month" value={recentCount} accent="#5b8f7b" subtle />
            </div>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3 text-xs uppercase tracking-[0.2em]" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
              <span>Archive</span>
              <span className="rounded-full bg-[#3e5f50] px-3 py-1 text-white">
                {totalVideos} replays
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        className="mt-6 rounded-3xl border bg-white/60 px-5 py-5"
        style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em]" style={{ color: 'var(--muted)' }}>
              Sports taxonomy
            </p>
            <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--forest)' }}>
              Leagues, teams, athletes
            </h2>
          </div>
          {sportsFiltersActive && (
            <Link
              href={`/news/videos${buildQuery({ league: undefined, team: undefined, athlete: undefined, page: 1 })}`}
              className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.7)', color: 'var(--muted)' }}
            >
              Clear sports filters
            </Link>
          )}
        </div>
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
              Leagues
            </span>
            {leaguesWithCounts.map((league) => (
              <TagChip
                key={league.id}
                label={league.name}
                count={league.count}
                hideCount={league.count === 0}
                href={`/news/videos${buildQuery({ league: league.id, team: undefined, athlete: undefined, page: 1 })}`}
                active={league.id === resolvedLeague?.id}
                muted={league.count === 0}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
              Teams
            </span>
            {visibleTeams.map((team) => (
              <TagChip
                key={team.id}
                label={team.shortName}
                count={team.count}
                hideCount={team.count === 0}
                href={`/news/videos${buildQuery({ team: team.id, league: team.leagueId, athlete: undefined, page: 1 })}`}
                active={team.id === resolvedTeam?.id}
                muted={team.count === 0}
                icon={<TeamLogo team={team} size={18} />}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
              Athletes
            </span>
            {visibleAthletes.map((athlete) => (
              <TagChip
                key={athlete.id}
                label={athlete.name}
                count={athlete.count}
                hideCount={athlete.count === 0}
                href={`/news/videos${buildQuery({ athlete: athlete.id, team: athlete.teamId, league: athlete.leagueId, page: 1 })}`}
                active={athlete.id === selectedAthlete?.id}
                muted={athlete.count === 0}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div
          className="rounded-3xl border bg-white/70 p-5 shadow-sm"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em]" style={{ color: 'var(--muted)' }}>
                Scoreboard
              </p>
              <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--forest)' }}>
                Live scoreboard
              </h2>
            </div>
            {activeFilterLabel && (
              <span
                className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.7)', color: 'var(--forest)' }}
              >
                {activeFilterLabel}
              </span>
            )}
          </div>
          <div className="mt-4 space-y-4">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                Live
              </p>
              {liveGames.length > 0 ? (
                <div className="grid gap-3">
                  {liveGames.map((game) => {
                    const league = leagueLookup.get(game.leagueId);
                    const homeTeam = teamLookup.get(game.homeTeamId);
                    const awayTeam = teamLookup.get(game.awayTeamId);
                    if (!league || !homeTeam || !awayTeam) return null;
                    return (
                      <ScoreboardGameCard
                        key={game.id}
                        game={game}
                        league={league}
                        homeTeam={homeTeam}
                        awayTeam={awayTeam}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  No live games in this filter. Check upcoming matchups.
                </p>
              )}
            </div>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                Finals
              </p>
              {finalGames.length > 0 ? (
                <div className="grid gap-3">
                  {finalGames.map((game) => {
                    const league = leagueLookup.get(game.leagueId);
                    const homeTeam = teamLookup.get(game.homeTeamId);
                    const awayTeam = teamLookup.get(game.awayTeamId);
                    if (!league || !homeTeam || !awayTeam) return null;
                    return (
                      <ScoreboardGameCard
                        key={game.id}
                        game={game}
                        league={league}
                        homeTeam={homeTeam}
                        awayTeam={awayTeam}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  No final results yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <div
          className="rounded-3xl border bg-white/70 p-5 shadow-sm"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em]" style={{ color: 'var(--muted)' }}>
                Schedule
              </p>
              <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--forest)' }}>
                Upcoming
              </h2>
            </div>
            <span
              className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.7)', color: 'var(--muted)' }}
            >
              {upcomingGames.length} games
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {upcomingGames.length > 0 ? (
              upcomingGames.map((game) => {
                const league = leagueLookup.get(game.leagueId);
                const homeTeam = teamLookup.get(game.homeTeamId);
                const awayTeam = teamLookup.get(game.awayTeamId);
                if (!league || !homeTeam || !awayTeam) return null;
                return (
                  <ScheduleGameRow
                    key={game.id}
                    game={game}
                    league={league}
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                  />
                );
              })
            ) : (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                No upcoming games match the current filter.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.45fr,0.55fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em]" style={{ color: 'var(--muted)' }}>
                Spotlight
              </p>
              <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--forest)' }}>
                Top games
              </h2>
            </div>
            <span className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
              Updated hourly
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {topGamesFallback.length > 0 ? (
              topGamesFallback.map((game) => {
                const league = leagueLookup.get(game.leagueId);
                const homeTeam = teamLookup.get(game.homeTeamId);
                const awayTeam = teamLookup.get(game.awayTeamId);
                if (!league || !homeTeam || !awayTeam) return null;
                return (
                  <TopGameCard
                    key={game.id}
                    game={game}
                    league={league}
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                  />
                );
              })
            ) : (
              <div
                className="rounded-2xl border p-4 text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--panel)', color: 'var(--muted)' }}
              >
                No top games available for this filter.
              </div>
            )}
          </div>
        </div>
        <ClaytonsCorner />
      </section>

      <section className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border bg-white/60 px-4 py-3 text-xs uppercase tracking-[0.2em]" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
        <span className="font-semibold" style={{ color: 'var(--forest)' }}>
          Filter:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <span>Date</span>
          {[30, 90, 365].map((range) => (
            <Link
              key={range}
              href={`/news/videos${buildQuery({ range, page: 1 })}`}
              className="rounded-full border px-3 py-1 transition"
              style={
                rangeDays === range
                  ? { borderColor: 'var(--sage)', background: 'rgba(91,143,123,0.12)', color: 'var(--forest)' }
                  : { borderColor: 'var(--border)', color: 'var(--text)' }
              }
            >
              Last {range}d
            </Link>
          ))}
          <Link
            href={`/news/videos${buildQuery({ range: undefined, page: 1 })}`}
            className="rounded-full border px-3 py-1 transition"
            style={
              !rangeDays
                ? { borderColor: 'var(--sage)', background: 'rgba(91,143,123,0.12)', color: 'var(--forest)' }
                : { borderColor: 'var(--border)', color: 'var(--text)' }
            }
          >
            All time
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--forest)' }}>
          <span>Page {page}</span>
          <span style={{ color: 'var(--muted)' }}>/ {totalPages}</span>
        </div>
      </section>

      <section className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
        <form action="/news/videos" method="GET" className="flex flex-wrap items-center gap-3">
          {tagFilter && <input type="hidden" name="tag" value={tagFilter} />}
          {rangeDays && <input type="hidden" name="range" value={rangeDays} />}
          {leagueParam && <input type="hidden" name="league" value={leagueParam} />}
          {teamParam && <input type="hidden" name="team" value={teamParam} />}
          {athleteParam && <input type="hidden" name="athlete" value={athleteParam} />}
          <input type="hidden" name="page" value="1" />
          <label className="flex items-center gap-2">
            <span>Region</span>
            <select
              defaultValue={regionParam}
              name="region"
              className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
              style={{ borderColor: 'var(--border)', background: 'var(--panel)', color: 'var(--forest)' }}
            >
              <option value="WORLD">World</option>
              <option value="NA">North America</option>
              <option value="EU">Europe</option>
              <option value="AS">Asia</option>
              <option value="AF">Africa</option>
              <option value="SA">South America</option>
              <option value="OC">Oceania</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:-translate-y-[1px]"
            style={{ borderColor: 'var(--forest)', color: 'var(--forest)', background: 'rgba(62,95,80,0.08)' }}
          >
            Apply
          </button>
        </form>
      </section>

      <section className="mt-10 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em]" style={{ color: 'var(--muted)' }}>
              Matchday
            </p>
            <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--forest)' }}>
              Live Now
            </h2>
          </div>
          <span className="hidden items-center gap-2 rounded-full bg-[#ec5a48] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white sm:inline-flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            Streaming
          </span>
        </div>
        {live.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {live.map((video) => (
              <Link
                key={video.id}
                href={`/news/videos/${video.slug}`}
                className="group relative overflow-hidden rounded-2xl border shadow-sm transition duration-200 hover:-translate-y-[3px] hover:shadow-lg"
                style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
              >
                {video.thumbnail && (
                  <div className="relative h-56 w-full overflow-hidden border-b" style={{ borderColor: 'var(--border)' }}>
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                      priority
                    />
                    <span className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-[#ec5a48] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-sm">
                      <span className="h-[6px] w-[6px] animate-pulse rounded-full bg-white" />
                      Live
                    </span>
                  </div>
                )}
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                    <span>Live coverage</span>
                    <span className="rounded-full bg-[#ec5a48]/10 px-2 py-[3px] font-semibold" style={{ color: '#b42318' }}>
                      Tap to watch
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold" style={{ color: 'var(--forest)' }}>
                    {video.title}
                  </h3>
                  <p className="text-sm leading-6 line-clamp-2" style={{ color: 'var(--text)' }}>
                    {video.description || 'Live game in progress.'}
                  </p>
                  {video.tags && (
                    <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                      {video.tags}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border p-6 text-sm shadow-sm md:flex md:items-center md:justify-between" style={{ borderColor: 'var(--border)', background: 'var(--panel)', color: 'var(--muted)' }}>
            <div className="space-y-1">
              <p className="text-base font-semibold" style={{ color: 'var(--forest)' }}>
                No live games right now.
              </p>
              <p>Check back soon or head to Live Stream for continuous feeds.</p>
            </div>
            <Link
              href="/news/live"
              className="mt-3 inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition hover:-translate-y-[2px] md:mt-0"
              style={{ borderColor: 'var(--forest)', color: 'var(--forest)', background: 'rgba(62,95,80,0.08)' }}
            >
              Go to Live Stream →
            </Link>
          </div>
        )}
      </section>

      <section id="on-demand" className="mt-12 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em]" style={{ color: 'var(--muted)' }}>
              Replays
            </p>
            <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--forest)' }}>
              Highlights
            </h2>
          </div>
          <span className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
            {totalVodCount} ready to watch
          </span>
        </div>

        {featuredVod && (
          <Link
            href={`/news/videos/${featuredVod.slug}`}
            className="group relative grid overflow-hidden rounded-3xl border shadow-sm transition duration-200 hover:-translate-y-[3px] hover:shadow-lg lg:grid-cols-[1.1fr,0.9fr]"
            style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
          >
            {featuredVod.thumbnail && (
              <div className="relative h-64 w-full overflow-hidden border-b lg:h-full lg:border-b-0 lg:border-r" style={{ borderColor: 'var(--border)' }}>
                <Image
                  src={featuredVod.thumbnail}
                  alt={featuredVod.title}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--forest)' }}>
                  <span className="h-2 w-2 rounded-full bg-[#3e5f50]" />
                  Featured replay
                </div>
              </div>
            )}
            <div className="flex flex-col justify-center space-y-3 px-6 py-5">
              <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                <span>Latest replay</span>
                {featuredVod.publishedAt && (
                  <span className="rounded-full bg-white px-3 py-[3px] font-semibold" style={{ border: '1px solid var(--border)', color: 'var(--forest)' }}>
                    {formatDate(featuredVod.publishedAt)}
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-semibold leading-tight group-hover:opacity-85" style={{ color: 'var(--forest)' }}>
                {featuredVod.title}
              </h3>
              <p className="text-sm leading-7 line-clamp-3" style={{ color: 'var(--text)' }}>
                {featuredVod.description || 'Watch the replay.'}
              </p>
              {featuredVod.tags && (
                <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                  {featuredVod.tags}
                </p>
              )}
            </div>
          </Link>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {onDemand.map((video) => (
            <Link
              key={video.id}
              href={`/news/videos/${video.slug}`}
              className="group overflow-hidden rounded-2xl border shadow-sm transition duration-200 hover:-translate-y-[2px] hover:shadow-md"
              style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
            >
              {video.thumbnail && (
                <div className="relative h-44 w-full overflow-hidden border-b" style={{ borderColor: 'var(--border)' }}>
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                  {video.publishedAt && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--forest)', border: '1px solid var(--border)' }}>
                      {formatDate(video.publishedAt)}
                    </span>
                  )}
                </div>
              )}
              <div className="p-4 space-y-2">
                <h3 className="text-lg font-semibold group-hover:opacity-80" style={{ color: 'var(--forest)' }}>
                  {video.title}
                </h3>
                <p className="text-sm leading-6 line-clamp-2" style={{ color: 'var(--text)' }}>
                  {video.description || 'Watch the replay.'}
                </p>
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                  <span>{video.tags || 'ILLUVRSE Sports'}</span>
                  <span className="rounded-full bg-white px-2 py-[3px]" style={{ border: '1px solid var(--border)', color: 'var(--forest)' }}>
                    Play
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {onDemand.length === 0 && (
            <div
              className="rounded-2xl border p-6 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--panel)', color: 'var(--muted)' }}
            >
              No sports replays yet. Add some in Admin → Videos or clear filters.
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between rounded-2xl border bg-white/60 px-4 py-3 text-xs uppercase tracking-[0.2em]" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
            <Link
              aria-disabled={page === 1}
              href={`/news/videos${buildQuery({ page: Math.max(1, page - 1) })}`}
              className="rounded-full border px-4 py-2 font-semibold transition disabled:opacity-40"
              style={{ borderColor: 'var(--border)', color: 'var(--forest)', pointerEvents: page === 1 ? 'none' : 'auto', opacity: page === 1 ? 0.4 : 1 }}
            >
              ← Prev
            </Link>
            <span>
              Page {page} of {totalPages}
            </span>
            <Link
              aria-disabled={page >= totalPages}
              href={`/news/videos${buildQuery({ page: Math.min(totalPages, page + 1) })}`}
              className="rounded-full border px-4 py-2 font-semibold transition disabled:opacity-40"
              style={{ borderColor: 'var(--border)', color: 'var(--forest)', pointerEvents: page >= totalPages ? 'none' : 'auto', opacity: page >= totalPages ? 0.4 : 1 }}
            >
              Next →
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

function ClaytonsCorner() {
  return (
    <aside
      className="rounded-3xl border bg-white/70 p-5 shadow-sm"
      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
      aria-label="Clayton's Corner columnist panel"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em]" style={{ color: 'var(--muted)' }}>
            Columnist
          </p>
          <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--forest)' }}>
            Clayton's Corner
          </h2>
        </div>
        <span className="rounded-full bg-[#3e5f50] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
          Weekly
        </span>
      </div>

      <div className="mt-4 rounded-2xl border bg-white/70 p-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ background: 'rgba(236,90,72,0.12)', color: '#b42318' }}
          >
            CC
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--forest)' }}>
              Clayton
            </p>
            <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
              Sports columnist
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-6" style={{ color: 'var(--text)' }}>
          Unfiltered reads on strategy, momentum, and the small swings that decide the scoreboard.
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
          <span>Latest column</span>
          <span>{claytonColumnLead.dateLabel}</span>
        </div>
        <Link
          href={claytonColumnLead.href}
          className="group block overflow-hidden rounded-2xl border transition hover:-translate-y-[2px] hover:shadow-md"
          style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
        >
          <div className="relative h-36 w-full overflow-hidden border-b" style={{ borderColor: 'var(--border)' }}>
            <Image
              src={claytonColumnLead.image}
              alt={claytonColumnLead.imageAlt}
              fill
              sizes="(min-width: 1024px) 22vw, 90vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
            <span className="absolute bottom-2 left-2 rounded-full bg-white/85 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--forest)' }}>
              Clayton's Corner
            </span>
          </div>
          <div className="p-4">
            <p className="text-lg font-semibold" style={{ color: 'var(--forest)' }}>
              {claytonColumnLead.title}
            </p>
            <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text)' }}>
              {claytonColumnLead.summary}
            </p>
            <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
              <span>{claytonColumnLead.tag}</span>
              <span>{claytonColumnLead.readTime}</span>
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
          Quick reads
        </p>
        <div className="space-y-2">
          {claytonQuickReads.map((column) => (
            <div
              key={column.title}
              className="rounded-xl border px-3 py-2"
              style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.85)' }}
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--forest)' }}>
                {column.title}
              </p>
              <div
                className="mt-1 flex items-center justify-between text-[11px] uppercase tracking-[0.18em]"
                style={{ color: 'var(--muted)' }}
              >
                <span>{column.tag}</span>
                <span>{column.readTime}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
          <span>Tonight's watch</span>
          <span>{claytonWatchList.length} games</span>
        </div>
        <div className="mt-3 space-y-2">
          {claytonWatchList.map((game) => (
            <div key={game.matchup} className="flex items-center justify-between text-sm" style={{ color: 'var(--text)' }}>
              <span className="font-semibold" style={{ color: 'var(--forest)' }}>
                {game.matchup}
              </span>
              <span className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                {game.note}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="mt-4 rounded-2xl border p-3 text-sm"
        style={{ borderColor: 'var(--border)', background: 'rgba(62,95,80,0.08)', color: 'var(--forest)' }}
      >
        {claytonDeskNote}
      </div>
    </aside>
  );
}

function StatBlock({ label, value, accent, subtle }: { label: string; value: number; accent: string; subtle?: boolean }) {
  return (
    <div
      className="flex items-center justify-between rounded-xl border px-4 py-3"
      style={{
        borderColor: 'var(--border)',
        background: subtle ? 'rgba(255,255,255,0.8)' : 'rgba(236,90,72,0.08)',
        color: 'var(--text)',
      }}
    >
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
          {label}
        </p>
        <p className="text-xl font-semibold" style={{ color: 'var(--forest)' }}>
          {value}
        </p>
      </div>
      <span className="h-9 w-9 rounded-full" style={{ background: accent, boxShadow: '0 12px 26px -18px rgba(62,95,80,0.8)' }} />
    </div>
  );
}

function ScoreboardGameCard({
  game,
  league,
  homeTeam,
  awayTeam,
}: {
  game: SportsGame;
  league: SportsLeague;
  homeTeam: SportsTeam;
  awayTeam: SportsTeam;
}) {
  const homeLead =
    typeof game.homeScore === 'number' &&
    typeof game.awayScore === 'number' &&
    game.homeScore > game.awayScore;
  const awayLead =
    typeof game.homeScore === 'number' &&
    typeof game.awayScore === 'number' &&
    game.awayScore > game.homeScore;
  const statusLabel =
    game.status === 'live' ? game.period || 'Live' : game.status === 'final' ? 'Final' : formatGameShortTime(game.startTime);

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
        <span>{league.name}</span>
        <span>{statusLabel}</span>
      </div>
      <div className="mt-3 space-y-2">
        <TeamScoreRow team={awayTeam} score={game.awayScore} leading={awayLead} />
        <TeamScoreRow team={homeTeam} score={game.homeScore} leading={homeLead} />
      </div>
      {(game.venue || game.broadcast) && (
        <div className="mt-2 text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
          {[game.venue, game.broadcast].filter(Boolean).join(' • ')}
        </div>
      )}
    </div>
  );
}

function TeamLogo({ team, size }: { team: SportsTeam; size: number }) {
  if (!team.logoUrl) {
    return (
      <span
        className="inline-flex shrink-0 rounded-full"
        style={{ width: size, height: size, background: team.accent }}
        aria-hidden
      />
    );
  }

  return (
    <span
      className="relative inline-flex shrink-0 overflow-hidden rounded-full border"
      style={{ width: size, height: size, borderColor: 'var(--border)', background: 'var(--panel)' }}
    >
      <Image src={team.logoUrl} alt={`${team.name} logo`} fill sizes={`${size}px`} className="object-contain" />
    </span>
  );
}

function TeamScoreRow({ team, score, leading }: { team: SportsTeam; score?: number; leading?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <TeamLogo team={team} size={18} />
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: leading ? 'var(--forest)' : 'var(--text)' }}>
            {team.shortName}
          </span>
          <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
            {team.abbr}
          </span>
        </div>
      </div>
      <span className="text-lg font-semibold" style={{ color: leading ? 'var(--forest)' : 'var(--text)' }}>
        {typeof score === 'number' ? score : '—'}
      </span>
    </div>
  );
}

function ScheduleGameRow({
  game,
  league,
  homeTeam,
  awayTeam,
}: {
  game: SportsGame;
  league: SportsLeague;
  homeTeam: SportsTeam;
  awayTeam: SportsTeam;
}) {
  return (
    <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
        <span>{league.name}</span>
        <span>{formatGameTime(game.startTime)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-sm font-semibold" style={{ color: 'var(--forest)' }}>
        <div className="flex items-center gap-2">
          <TeamLogo team={awayTeam} size={16} />
          <span>{awayTeam.shortName}</span>
        </div>
        <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
          at
        </span>
        <div className="flex items-center gap-2">
          <TeamLogo team={homeTeam} size={16} />
          <span>{homeTeam.shortName}</span>
        </div>
      </div>
      {(game.venue || game.broadcast) && (
        <div className="mt-2 text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
          {[game.venue, game.broadcast].filter(Boolean).join(' • ')}
        </div>
      )}
    </div>
  );
}

function TopGameCard({
  game,
  league,
  homeTeam,
  awayTeam,
}: {
  game: SportsGame;
  league: SportsLeague;
  homeTeam: SportsTeam;
  awayTeam: SportsTeam;
}) {
  const statusLabel =
    game.status === 'live' ? game.period || 'Live' : game.status === 'final' ? 'Final' : formatGameShortTime(game.startTime);
  const homeLead =
    typeof game.homeScore === 'number' &&
    typeof game.awayScore === 'number' &&
    game.homeScore > game.awayScore;
  const awayLead =
    typeof game.homeScore === 'number' &&
    typeof game.awayScore === 'number' &&
    game.awayScore > game.homeScore;

  return (
    <div className="rounded-2xl border p-4 shadow-sm" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
        <span>{league.name}</span>
        <span className="rounded-full bg-white px-2 py-[3px]" style={{ border: '1px solid var(--border)', color: 'var(--forest)' }}>
          {statusLabel}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        <TeamScoreRow team={awayTeam} score={game.awayScore} leading={awayLead} />
        <TeamScoreRow team={homeTeam} score={game.homeScore} leading={homeLead} />
      </div>
      {(game.venue || game.broadcast) && (
        <div className="mt-3 text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
          {[game.venue, game.broadcast].filter(Boolean).join(' • ')}
        </div>
      )}
    </div>
  );
}
