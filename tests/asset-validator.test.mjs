import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateAssetSource } from "../lib/asset-validator.mjs";

test("asset validator resolves structured HTML references and reports broken URLs", async (t) => {
  const server = http.createServer((request, response) => {
    const available = new Set(["/assets/ok.png", "/assets/wide.png", "/bg.jpg"]);
    response.statusCode = available.has(request.url) ? 200 : 404;
    response.setHeader("content-type", "image/png");
    response.end(request.method === "HEAD" ? undefined : "x");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}/assets/`;
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "website-assets-test-"));
  t.after(() => fs.rmSync(outputDir, { recursive: true, force: true }));
  const htmlPath = path.join(outputDir, "replica.html");
  fs.writeFileSync(
    htmlPath,
    `<!doctype html>
      <base href="${baseUrl}">
      <style>.hero { background-image: url('../bg.jpg'); }</style>
      <picture>
        <source srcset="wide.png 2x, /shared/missing.png 1x">
        <img src="ok.png" alt="Test">
      </picture>
      <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" alt="Inline">`
  );

  const report = await validateAssetSource(htmlPath, { timeoutMs: 2000, concurrency: 2 });
  assert.equal(report.passed, false);
  assert.equal(report.summary.uniqueUrlCount, 4);
  assert.equal(report.summary.ok, 3);
  assert.equal(report.summary.failed, 1);
  assert.equal(report.summary.skipped, 1);
  assert.match(report.results.find((item) => !item.ok).url, /shared\/missing\.png$/);
});
