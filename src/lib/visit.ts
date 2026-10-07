/**
 * Tells the site owner someone stopped by (api/visit.ts emails it): once per
 * browser session, never from localhost, and never from a browser marked as
 * the owner's. Open the site once with `?me` to mark your own browser.
 */
export function reportVisit() {
  try {
    if (["localhost", "127.0.0.1"].includes(location.hostname)) return;
    if (new URLSearchParams(location.search).has("me")) localStorage.setItem("visit:me", "1");
    if (localStorage.getItem("visit:me") || sessionStorage.getItem("visit:sent")) return;
    // A browser-level "do not sell or share my data" signal.
    if ((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
    sessionStorage.setItem("visit:sent", "1");

    const visits = Number(localStorage.getItem("visit:count") ?? 0) + 1;
    const firstSeen = localStorage.getItem("visit:first") ?? new Date().toISOString();
    localStorage.setItem("visit:count", String(visits));
    localStorage.setItem("visit:first", firstSeen);

    fetch("/api/visit", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: location.href,
        referrer: document.referrer,
        screen: `${screen.width}×${screen.height}`,
        viewport: `${innerWidth}×${innerHeight}`,
        language: navigator.languages?.join(", ") || navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        visits,
        firstSeen,
        touch: navigator.maxTouchPoints > 0,
      }),
    }).catch(() => {});
  } catch {
    // Storage blocked (private mode): skip quietly rather than report every page view.
  }
}
