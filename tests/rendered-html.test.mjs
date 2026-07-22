import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the complete CONTRARIA decision room", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>CONTRARIA — Decision Intelligence OS<\/title>/i);
  assert.match(html, /Should Helix launch NovaCell in Germany by Q1 2027\?/);
  assert.match(html, /CONDITIONAL GO/);
  assert.match(html, /WHAT WOULD PROVE US WRONG\?/);
  assert.match(html, /SCENARIO FRONTIER/);
  assert.match(html, /Interrogate all evidence/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("metadata communicates the product thesis", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /The epistemic operating system that tries to prove your strategy wrong before reality does\./);
  assert.match(html, /theme-color[^>]+#070908/i);
  assert.match(html, /Decision Intelligence OS/);
});
