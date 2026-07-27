/**
 * Data access layer for Kimi Code Dashboard.
 * Web: HTTP /api/* via Vite proxy or Node server.
 * Tauri: invoke Rust commands with the same camelCase payload shape.
 */

function detectTauri() {
  if (typeof window === "undefined") return false;
  return (
    "__TAURI_INTERNALS__" in window ||
    "__TAURI__" in window ||
    Boolean(window.__TAURI_METADATA__)
  );
}

let invokeFn = null;
let invokeReady = null;

async function getInvoke() {
  if (!detectTauri()) return null;
  if (invokeFn) return invokeFn;
  if (!invokeReady) {
    invokeReady = import("@tauri-apps/api/core")
      .then((mod) => {
        invokeFn = mod.invoke;
        return invokeFn;
      })
      .catch(() => {
        invokeFn = null;
        return null;
      });
  }
  return invokeReady;
}

async function httpJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || data.error || res.statusText || "request failed");
    err.data = data;
    err.status = res.status;
    throw err;
  }
  return data;
}

function withHome(params, home) {
  const qs = new URLSearchParams(params || {});
  if (home) qs.set("home", home);
  return qs;
}

/** GET /api/paths or invoke get_paths */
export async function fetchPaths() {
  const invoke = await getInvoke();
  if (invoke) return invoke("get_paths");
  return httpJson("/api/paths");
}

/** GET /api/prices or invoke get_prices */
export async function fetchPrices() {
  const invoke = await getInvoke();
  if (invoke) return invoke("get_prices");
  return httpJson("/api/prices");
}

/** GET /api/summary or invoke get_summary */
export async function fetchSummary(home, range = "30d", refresh = false) {
  const invoke = await getInvoke();
  if (invoke) {
    return invoke("get_summary", {
      homeOverride: home || null,
      range: range || "30d",
      refresh: Boolean(refresh),
    });
  }
  const qs = withHome({ range }, home);
  if (refresh) qs.set("refresh", "1");
  return httpJson(`/api/summary?${qs.toString()}`);
}

/** GET /api/sessions or invoke list_sessions */
export async function fetchSessions(home, status = "active", workspace = null) {
  const invoke = await getInvoke();
  if (invoke) {
    return invoke("list_sessions", {
      homeOverride: home || null,
      status: status || "active",
      workspace: workspace || null,
    });
  }
  const qs = withHome({ status }, home);
  if (workspace) qs.set("workspace", workspace);
  return httpJson(`/api/sessions?${qs.toString()}`);
}

async function sessionPost(webPath, command, home, body) {
  const invoke = await getInvoke();
  if (invoke) {
    return invoke(command, {
      homeOverride: home || null,
      ...body,
    });
  }
  const qs = withHome({}, home);
  return httpJson(`/api/sessions/${webPath}?${qs.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function archiveSession(home, workspaceId, sessionId) {
  return sessionPost("archive", "archive_session", home, {
    workspaceId,
    sessionId,
  });
}

export async function unarchiveSession(home, workspaceId, sessionId) {
  return sessionPost("unarchive", "unarchive_session", home, {
    workspaceId,
    sessionId,
  });
}

export async function deleteSession(home, workspaceId, sessionId, status) {
  return sessionPost("delete", "delete_session", home, {
    workspaceId,
    sessionId,
    status: status || null,
    confirm: true,
  });
}

export async function deleteWorkspace(home, workspaceId) {
  const invoke = await getInvoke();
  if (invoke) {
    return invoke("delete_workspace", {
      homeOverride: home || null,
      workspaceId,
      confirm: true,
      force: null,
    });
  }
  const qs = withHome({}, home);
  return httpJson(`/api/workspaces/delete?${qs.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId, confirm: true }),
  });
}

/** GET /api/sessions/preview or invoke get_session_preview */
export async function fetchSessionPreview(home, workspaceId, sessionId, status) {
  const invoke = await getInvoke();
  if (invoke) {
    return invoke("get_session_preview", {
      homeOverride: home || null,
      workspaceId,
      sessionId,
      status: status || null,
    });
  }
  const qs = withHome(
    {
      workspaceId,
      sessionId,
    },
    home
  );
  if (status) qs.set("status", status);
  return httpJson(`/api/sessions/preview?${qs.toString()}`);
}
