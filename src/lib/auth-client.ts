const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

type AuthUser = { id: string; email: string; roles: string[]; is_email_verified: boolean };
type AuthResult = { access_token: string; user: AuthUser };

async function request(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(`${API_URL}${path}`, { ...init, headers, signal: init.signal });
}

async function authRequest(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  return fetch(path, { ...init, headers, credentials: "same-origin", signal: init.signal });
}

async function readError(response: Response) {
  const body = await response.json().catch(() => null) as { message?: string } | null;
  return body?.message ?? `Yêu cầu thất bại (${response.status})`;
}

export const authClient = {
  async login(email: string, password: string, otp?: string): Promise<AuthResult> {
    const response = await authRequest("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password, ...(otp ? { otp } : {}) }) });
    if (!response.ok) throw new Error(await readError(response));
    const result = (await response.json()) as AuthResult;
    accessToken = result.access_token;
    return result;
  },
  async refresh() {
    if (!refreshPromise) refreshPromise = authRequest("/api/auth/refresh", { method: "POST" }).then(async (response) => {
      if (!response.ok) return null;
      const result = (await response.json()) as AuthResult;
      accessToken = result.access_token;
      return accessToken;
    }).catch(() => null).finally(() => { refreshPromise = null; });
    return refreshPromise;
  },
  async fetch(path: string, init: RequestInit = {}) {
    let response = await request(path, init);
    if (response.status === 401 && await this.refresh()) response = await request(path, init);
    return response;
  },
  async logout() {
    await authRequest("/api/auth/logout", { method: "POST" });
    accessToken = null;
  },
};
