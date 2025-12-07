import { NextResponse } from "next/server";
import { jobs } from "../../../../../lib/jobsData";

export async function GET() {
  return NextResponse.json({ jobs });
}
