export type LiveLoopItem = {
  id: string;
  title: string;
  duration: string;
  status: "On Air" | "Next" | "Queued";
  sha: string;
};

export const playlist: LiveLoopItem[] = [
  {
    id: "beverly-hillbillies-marathon",
    title: "The Beverly Hillbillies · Seasons 1 & 2",
    duration: "All day",
    status: "On Air",
    sha: "bhills:2477...loop"
  },
  {
    id: "gilda-1946",
    title: "Gilda (6:00 PM)",
    duration: "01:50",
    status: "Next",
    sha: "gilda:1946...color"
  },
  {
    id: "royal-wedding",
    title: "The Royal Wedding (7:50 PM)",
    duration: "01:33",
    status: "Queued",
    sha: "royal:wedd...1951"
  },
  {
    id: "casablanca",
    title: "Casablanca (9:23 PM)",
    duration: "01:42",
    status: "Queued",
    sha: "casa:1942...color"
  },
  {
    id: "return-bev-hills",
    title: "Back to Beverly Hillbillies (Overnight)",
    duration: "Overnight loop",
    status: "Queued",
    sha: "bhills:return...loop"
  }
];
