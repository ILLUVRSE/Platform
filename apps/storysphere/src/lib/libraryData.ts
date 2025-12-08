export type Episode = {
  id: string;
  title: string;
  duration: string;
  file?: string;
  synopsis?: string;
};

export type Season = {
  id: string;
  title: string;
  episodes: Episode[];
};

export type Series = {
  id: string;
  title: string;
  seasons: Season[];
};

export type Movie = {
  id: string;
  title: string;
  duration: string;
  file?: string;
  synopsis?: string;
};

const beverlySeason1Episodes: Episode[] = Array.from({ length: 36 }, (_, i) => {
  const episodeNumber = String(i + 1).padStart(2, "0");
  return {
    id: `s1e${episodeNumber}`,
    title: `Episode ${episodeNumber}`,
    duration: "00:25"
  };
});

export const seriesCatalog: Series[] = [
  {
    id: "beverly-hillbillies",
    title: "The Beverly Hillbillies",
    seasons: [
      {
        id: "season-1",
        title: "Season 1",
        episodes: beverlySeason1Episodes
      }
    ]
  }
];

export const moviesCatalog: Movie[] = [
  {
    id: "casablanca-color",
    title: "Casablanca (Color Edition)",
    duration: "01:42",
    file: "Casablanca 1942, in color, Humphrey Bogart, Ingrid Bergman, Paul Henreid, Claude Rains, Sydney Greenstreet, Peter Lorre, Dooley Wilson,.mp4"
  },
  { id: "royal-wedding", title: "Royal Wedding", duration: "01:33", file: "royal_wedding.mp4" },
  { id: "gilda-1946", title: "Gilda (Colorized)", duration: "01:50", file: "Gilda 1946.mp4" }
];
