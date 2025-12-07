type UpstreamOptions = {
  baseUrl?: string;
  path: string;
  method?: string;
  body?: unknown;
  tokenEnv?: string;
  headers?: Record<string, string>;
};

export async function callUpstream<T>({
  baseUrl,
  path,
  method = "GET",
  body,
  tokenEnv
}: UpstreamOptions): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  if (!baseUrl) return { ok: false, error: "missing upstream" };
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json", ...(options.headers ?? {}) };
    const token = tokenEnv ? process.env[tokenEnv] : undefined;
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
      return { ok: false, error: `upstream ${res.status}` };
    }
    const json = (await res.json()) as T;
    return { ok: true, data: json };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
