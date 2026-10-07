// Emails the site owner when someone visits: where from, on what, and through
// which link. The page calls it once per browser session (src/lib/visit.ts).
//
// Needs RESEND_API_KEY in the Vercel project's environment. Until it is set,
// visits are accepted and dropped, so a visitor never sees an error.

const SITE = "https://raj-rathod-portfolio.vercel.app";
const TO = process.env.NOTIFY_EMAIL ?? "rajrathod2323@gmail.com";
// Resend's shared sender: it only delivers to the address that owns the Resend account.
const FROM = process.env.NOTIFY_FROM ?? "Portfolio visits <onboarding@resend.dev>";
const BOTS = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|embedly|whatsapp|vercel/i;

/** What the page reports about itself; everything else comes from request headers. */
export interface Visit {
  url?: string;
  referrer?: string;
  screen?: string;
  viewport?: string;
  language?: string;
  timezone?: string;
  visits?: number;
  firstSeen?: string;
  touch?: boolean;
}

/** What only the server can see. */
export interface Seen {
  ua: string;
  ip: string;
  org: string;
  city: string;
  region: string;
  country: string;
  lat: string;
  lon: string;
}

export async function POST(request: Request): Promise<Response> {
  // ponytail: the origin check stops other websites, not scripts. Add a per-IP
  // rate limit (e.g. Upstash) if anyone ever floods the inbox.
  if (request.headers.get("origin") !== SITE) return new Response(null, { status: 403 });
  const ua = request.headers.get("user-agent") ?? "";
  if (BOTS.test(ua)) return new Response(null, { status: 204 });

  const raw = await request.text();
  if (raw.length > 4096) return new Response(null, { status: 413 });
  let visit: Visit;
  try {
    visit = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("visit: RESEND_API_KEY is not set, so this visit was not emailed");
    return new Response(null, { status: 204 });
  }

  // Vercel's edge geolocates every request; city names arrive URL-encoded.
  const header = (name: string) => {
    const value = request.headers.get(name) ?? "";
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const { subject, html } = describe(visit, {
    ua,
    ip,
    org: await networkOf(ip),
    city: header("x-vercel-ip-city"),
    region: header("x-vercel-ip-country-region"),
    country: header("x-vercel-ip-country"),
    lat: header("x-vercel-ip-latitude"),
    lon: header("x-vercel-ip-longitude"),
  });

  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [TO], subject, html }),
  });
  if (!sent.ok) console.error("visit: Resend refused the email", sent.status, await sent.text());
  return new Response(null, { status: 204 });
}

/** Who owns the IP, e.g. "AS20057 Citigroup Inc.": the nearest thing to "who visited". */
async function networkOf(ip: string): Promise<string> {
  if (!ip) return "";
  const token = process.env.IPINFO_TOKEN ? `?token=${process.env.IPINFO_TOKEN}` : "";
  try {
    const res = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}/json${token}`, {
      signal: AbortSignal.timeout(1500),
    });
    return res.ok ? String((await res.json()).org ?? "") : "";
  } catch {
    return "";
  }
}

const escape = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function deviceOf(ua: string): string {
  const app = /LinkedInApp/i.test(ua)
    ? "LinkedIn app"
    : /Instagram/.test(ua)
      ? "Instagram app"
      : /FBAN|FBAV/.test(ua)
        ? "Facebook app"
        : "";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Firefox\/|FxiOS/.test(ua)
        ? "Firefox"
        : /Chrome\/|CriOS/.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Unknown browser";
  const os = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Mac OS X/.test(ua)
          ? "Mac"
          : /Windows/.test(ua)
            ? "Windows"
            : /CrOS/.test(ua)
              ? "ChromeOS"
              : /Linux/.test(ua)
                ? "Linux"
                : "unknown OS";
  return `${app || browser} on ${os}`;
}

/** Where the visitor came from: a tagged link, the referring site, an in-app browser, or nowhere. */
export function sourceOf(visit: Visit, ua: string): string {
  try {
    const tagged = new URL(visit.url ?? "").searchParams.get("utm_source");
    if (tagged) return tagged;
  } catch {
    /* no URL */
  }
  try {
    const host = new URL(visit.referrer ?? "").hostname.replace(/^www\./, "");
    if (host && host !== new URL(SITE).hostname) return host;
  } catch {
    /* no referrer */
  }
  return /LinkedInApp/i.test(ua) ? "LinkedIn app" : "direct";
}

export function describe(visit: Visit, seen: Seen): { subject: string; html: string } {
  let country = seen.country;
  try {
    country = new Intl.DisplayNames(["en"], { type: "region" }).of(seen.country) ?? seen.country;
  } catch {
    /* not a region code */
  }
  const place = [seen.city, seen.region, country].filter(Boolean).join(", ") || "an unknown location";
  const source = sourceOf(visit, seen.ua);

  let theirTime = "";
  try {
    theirTime = new Date().toLocaleString("en-US", {
      timeZone: visit.timezone,
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    /* unknown time zone */
  }

  const lat = Number(seen.lat);
  const lon = Number(seen.lon);
  const map =
    seen.lat && seen.lon && Number.isFinite(lat) && Number.isFinite(lon)
      ? ` · <a href="https://www.google.com/maps?q=${lat},${lon}">map</a>`
      : "";

  let path = "";
  try {
    const url = new URL(visit.url ?? "");
    path = url.pathname + url.search + url.hash;
  } catch {
    /* no URL */
  }

  const visits = Number(visit.visits) || 1;
  const returning =
    visits > 1
      ? `Visit ${visits} from this browser, first seen ${escape(String(visit.firstSeen ?? "").slice(0, 10))}`
      : "First visit from this browser";

  // Values are escaped; only the map link and the labels are trusted markup.
  const rows: [string, string][] = [
    ["Where", escape(place) + map],
    ["Network", escape([seen.org, seen.ip].filter(Boolean).join(" · ") || "unknown")],
    ["Came from", escape(source) + (visit.referrer ? ` (${escape(visit.referrer)})` : "")],
    ["Landed on", escape(path || "/")],
    ["Device", escape(deviceOf(seen.ua)) + (visit.touch ? " · touch" : "")],
    ["Screen", escape(`${visit.screen ?? "?"} screen, ${visit.viewport ?? "?"} window`)],
    ["Language", escape(visit.language ?? "")],
    ["Their time", escape([theirTime, visit.timezone].filter(Boolean).join(" · "))],
    ["History", returning],
    ["User agent", `<span style="color:#888">${escape(seen.ua)}</span>`],
  ];

  const html = `<table style="font:14px/1.5 -apple-system,Segoe UI,sans-serif;border-collapse:collapse">${rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#888;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:4px 0">${value}</td></tr>`
    )
    .join("")}</table>`;

  return { subject: `Visitor from ${place} · via ${source}`, html };
}
