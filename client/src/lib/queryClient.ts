import { QueryClient, QueryFunction } from "@tanstack/react-query";

// The deployment proxy rewrites the "__PORT_5000__" token to a path fragment
// like "port/5000". Force it to be a root-absolute path ("/port/5000") so that
// request URLs never depend on the page's current path during relative
// resolution. When unset (local/dev) the token is left intact and we use "".
function resolveApiBase(): string {
  const token = "__PORT_5000__";
  if (token.startsWith("__")) return "";
  if (typeof window !== "undefined" && window.location.hostname === "sites.pplx.app") {
    return token.replace(/^\/+/, "");
  }
  return token.startsWith("/") ? token : `/${token}`;
}

const API_BASE = resolveApiBase();

/** GitHub Pages / static build: no Express API. */
export const IS_STATIC = String(import.meta.env.VITE_STATIC ?? "") === "true";

function staticReportUrl(): string {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}data/report.json`;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  extraHeaders?: Record<string, string>,
): Promise<Response> {
  if (IS_STATIC) {
    throw new Error("靜態預覽唔支援寫入（GitHub Pages）");
  }
  const headers: Record<string, string> = { ...(extraHeaders || {}) };
  if (data) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = queryKey.join("/");

    // Static Pages: always read bundled report JSON for /api/report
    if (path === "/api/report" || path === "api/report") {
      if (IS_STATIC) {
        const res = await fetch(staticReportUrl());
        await throwIfResNotOk(res);
        return await res.json();
      }
      try {
        const res = await fetch(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`);
        if (res.ok) return await res.json();
      } catch {
        // fall through to static snapshot (useful for offline / misconfigured API)
      }
      const res = await fetch(staticReportUrl());
      await throwIfResNotOk(res);
      return await res.json();
    }

    const res = await fetch(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
