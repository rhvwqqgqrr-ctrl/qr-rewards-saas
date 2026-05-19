export async function platformFetch(url: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("platform_token") : null;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const json = await res.json();
  if (!json.success) {
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("platform_token");
      window.location.href = "/platform/login";
    }
    throw new Error(json.error?.message || "Erreur API");
  }
  return json.data;
}
