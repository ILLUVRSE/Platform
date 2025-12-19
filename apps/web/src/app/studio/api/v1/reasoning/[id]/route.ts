import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  return NextResponse.json({
    id,
    nodes: [
      { id: "input", type: "input", message: "Promotion requested", timestamp: Date.now() - 2000 },
      { id: "policy", type: "policy", message: "SentinelNet PASS v0.9.2", timestamp: Date.now() - 1500 },
      { id: "sign", type: "sign", message: "Kernel multisig signature", timestamp: Date.now() - 1000 },
      { id: "emit", type: "emit", message: "Audit event emitted", timestamp: Date.now() - 500 }
    ]
  });
}
