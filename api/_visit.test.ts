// The underscore keeps Vercel from deploying this file as a function.
import { test } from "node:test";
import assert from "node:assert/strict";
import { POST, describe, deviceOf, sourceOf } from "./visit.ts";

const iphoneLinkedIn =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [LinkedInApp]";
const macChrome =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

const seen = {
  ua: macChrome,
  ip: "203.0.113.7",
  org: "AS20057 Citigroup Inc.",
  city: "Toronto",
  region: "ON",
  country: "CA",
  lat: "43.65",
  lon: "-79.38",
};

test("names the place, the network and the source", () => {
  const { subject, html } = describe(
    { url: "https://raj-rathod-portfolio.vercel.app/#work", referrer: "https://www.linkedin.com/", visits: 1 },
    seen
  );
  assert.equal(subject, "Visitor from Toronto, ON, Canada · via linkedin.com");
  assert.match(html, /Citigroup/);
  assert.match(html, /Chrome on Mac/);
  assert.match(html, /\/#work/);
  assert.match(html, /First visit from this browser/);
});

test("escapes everything the visitor controls", () => {
  const { html } = describe(
    { url: "https://x.test/?q=<script>", referrer: "https://evil.test/\"><img src=x onerror=alert(1)>", language: "<b>" },
    { ...seen, ua: "<script>alert(1)</script>" }
  );
  assert.doesNotMatch(html, /<script|<img|<b>/);
});

test("a tagged link beats the referrer, and the LinkedIn app is recognised without one", () => {
  assert.equal(sourceOf({ url: "https://x.test/?utm_source=resume", referrer: "https://google.com/" }, macChrome), "resume");
  assert.equal(sourceOf({}, iphoneLinkedIn), "LinkedIn app");
  assert.equal(sourceOf({}, macChrome), "direct");
  assert.equal(deviceOf(iphoneLinkedIn), "LinkedIn app on iPhone");
});

test("bad input from the page never throws", () => {
  assert.doesNotThrow(() =>
    describe({ timezone: "Not/AZone", url: "not a url", visits: Number.NaN }, { ...seen, country: "??", lat: "x", lon: "" })
  );
});

// The handler, with the network stubbed: what reaches Resend, and what never does.
const site = "https://raj-rathod-portfolio.vercel.app";
const post = (headers: Record<string, string>, body = "{}") =>
  POST(new Request(`${site}/api/visit`, { method: "POST", headers, body }));

test("only the site itself, a real browser, and a configured key produce an email", async () => {
  const sent: string[] = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL | Request) => {
    sent.push(String(url));
    return new Response(JSON.stringify({ org: "AS20057 Citigroup Inc." }), { status: 200 });
  }) as typeof fetch;
  try {
    process.env.RESEND_API_KEY = "test";
    const browser = { origin: site, "user-agent": macChrome, "x-vercel-ip-city": "S%C3%A3o%20Paulo" };

    assert.equal((await post({ ...browser, origin: "https://elsewhere.test" })).status, 403);
    assert.equal((await post({ ...browser, "user-agent": "LinkedInBot/1.0" })).status, 204);
    assert.equal((await post(browser, "x".repeat(5000))).status, 413);
    assert.equal((await post(browser, "not json")).status, 400);
    assert.equal(sent.length, 0, "nothing is sent for rejected requests");

    assert.equal((await post(browser, JSON.stringify({ url: `${site}/` }))).status, 204);
    assert.ok(sent.includes("https://api.resend.com/emails"), "a real visit is emailed");

    sent.length = 0;
    delete process.env.RESEND_API_KEY;
    assert.equal((await post(browser)).status, 204);
    assert.equal(sent.length, 0, "without a key, the visit is dropped quietly");
  } finally {
    globalThis.fetch = realFetch;
  }
});
