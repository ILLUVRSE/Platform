"use client";

import { useEffect, useState } from "react";

type TraceNode = { id: string; type: string; message: string; timestamp: number };

export function TraceViewer() {
  const [nodes, setNodes] = useState<TraceNode[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reasoning/demo-trace")
      .then((res) => res.json())
      .then((data) => setNodes(data.nodes ?? []))
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error) return <div className="text-sm text-rose-600">Error: {error}</div>;

  return (
    <div className="space-y-2 text-sm text-slate-700">
      {nodes.map((node) => (
        <div key={node.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-slate-700">
            {node.type}
          </span>
          <span>{node.message}</span>
          <span className="text-[11px] text-slate-500">{new Date(node.timestamp).toLocaleTimeString()}</span>
        </div>
      ))}
    </div>
  );
}
