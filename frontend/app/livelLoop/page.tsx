import { loadYuGiOhSeasonsWithDurations } from "@/lib/ygo";
import LiveLoopClient from "./live-loop-client";

export default function LiveLoopPage() {
  const seasons = loadYuGiOhSeasonsWithDurations();
  return <LiveLoopClient seasons={seasons} />;
}
