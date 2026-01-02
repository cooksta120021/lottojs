const PROXY_BASE = import.meta.env.VITE_PROXY_BASE;

if (!PROXY_BASE) {
  // eslint-disable-next-line no-console
  console.warn("VITE_PROXY_BASE is not set; fetchDrawHtml will fail.");
}

export async function fetchDrawHtml(gameKey) {
  const url = `${PROXY_BASE}?game=${encodeURIComponent(gameKey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status}`);
  }
  return res.text();
}
