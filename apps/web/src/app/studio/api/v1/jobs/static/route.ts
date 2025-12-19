import { NextResponse } from "next/server";
import { jobs } from "@studio/lib/jobsData";

export async function GET() {
  return NextResponse.json({ jobs });
}
