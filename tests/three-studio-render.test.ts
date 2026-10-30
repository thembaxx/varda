import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("decorative Varda WebGL studio pauses in background tabs and cleans up the listener", () => {
  const source = readFileSync("components/ThreeStudioViewport.tsx", "utf8");
  for (const expected of [
    "if (document.hidden) return;",
    'document.addEventListener("visibilitychange", onVisibilityChange)',
    'document.removeEventListener("visibilitychange", onVisibilityChange)',
    'powerPreference: lowPower ? "low-power" : "high-performance"',
    "renderer.shadowMap.enabled = !isHeadless && !lowPower",
    "lowPower ? 1 : 2",
    'qualityMedia.addEventListener("change", refreshQuality)',
    'qualityMedia.removeEventListener("change", refreshQuality)',
  ]) {
    assert.ok(source.includes(expected), expected);
  }
});

test("Varda decorative garden caps mobile rendering quality and tears down its media listener", () => {
  const source = readFileSync("components/ThreeGarden.tsx", "utf8");
  for (const expected of [
    '"(max-width: 760px), (pointer: coarse)"',
    "qualityMedia.matches ? 1 : 1.5",
    'qualityMedia.addEventListener("change", onQualityChange)',
    'qualityMedia.removeEventListener("change", onQualityChange)',
    'document.removeEventListener("visibilitychange", start)',
  ]) {
    assert.ok(source.includes(expected), expected);
  }
});
