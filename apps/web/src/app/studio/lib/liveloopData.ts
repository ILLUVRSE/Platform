export type LiveLoopItem = {
  id: string;
  title: string;
  duration: string;
  status: "On Air" | "Next" | "Queued";
  proofSha: string;
  policyVerdict?: string;
  sha?: string;
};

export const playlist: LiveLoopItem[] = [
  {
    id: "beverly-hillbillies-marathon",
    title: "The Beverly Hillbillies · Seasons 1 & 2",
    duration: "All day",
    status: "On Air",
    proofSha: "bhills:2477...loop",
    policyVerdict: "SentinelNet PASS"
  },
  {
    id: "gilda-1946",
    title: "Gilda (6:00 PM)",
    duration: "01:50",
    status: "Next",
    proofSha: "gilda:1946...color",
    policyVerdict: "SentinelNet PASS"
  },
  {
    id: "royal-wedding",
    title: "The Royal Wedding (7:50 PM)",
    duration: "01:33",
    status: "Queued",
    proofSha: "royal:wedd...1951",
    policyVerdict: "SentinelNet PASS"
  },
  {
    id: "casablanca",
    title: "Casablanca (9:23 PM)",
    duration: "01:42",
    status: "Queued",
    proofSha: "casa:1942...color",
    policyVerdict: "SentinelNet PASS"
  },
  {
    id: "return-bev-hills",
    title: "Back to Beverly Hillbillies (Overnight)",
    duration: "Overnight loop",
    status: "Queued",
    proofSha: "bhills:return...loop",
    policyVerdict: "SentinelNet PASS"
  }
];
