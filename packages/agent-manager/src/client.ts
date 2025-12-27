import type { AgentManagerConfig, JobKind, JobRecord } from "./types";

type Fetcher = typeof fetch;

export class AgentManagerClient {
  private baseUrl: string;
  private fetcher: Fetcher;
  private token?: string;

  constructor(baseUrl: string, opts?: { fetcher?: Fetcher; token?: string }) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.fetcher = opts?.fetcher ?? fetch;
    this.token = opts?.token;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await this.fetcher(`${this.baseUrl}${path}`, {
      headers: { "Content-Type": "application/json", ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) },
      ...init
    });
    if (!res.ok) {
      throw new Error(`AgentManager ${path} failed: ${res.status}`);
    }
    return (await res.json()) as T;
  }

  async register(manifest: Record<string, unknown>) {
    return this.request<{ ok: boolean; agentId: string }>("/register", {
      method: "POST",
      body: JSON.stringify({ manifest })
    });
  }

  async start(agentId: string) {
    return this.request<{ ok: boolean }>("/start", { method: "POST", body: JSON.stringify({ agentId }) });
  }

  async stop(agentId: string) {
    return this.request<{ ok: boolean }>("/stop", { method: "POST", body: JSON.stringify({ agentId }) });
  }

  async heartbeat(agentId: string) {
    return this.request<{ ok: boolean }>("/heartbeat", { method: "POST", body: JSON.stringify({ agentId }) });
  }

  async enqueueJob(agentId: string, kind: JobKind, payload?: Record<string, unknown>, options?: { action?: string }) {
    return this.request<{ jobId: string; status: string }>("/jobs", {
      method: "POST",
      body: JSON.stringify({ agentId, kind, action: options?.action, payload })
    });
  }

  async getJob(jobId: string) {
    return this.request<JobRecord>(`/jobs/${jobId}`, { method: "GET" });
  }

  async listAgents() {
    return this.request<{ agents: { id: string; status: string; capabilities: string[]; lastHeartbeat?: string }[] }>("/agents", {
      method: "GET"
    });
  }
}
