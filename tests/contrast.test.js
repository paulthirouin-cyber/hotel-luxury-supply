#!/usr/bin/env node
// Brand palette contrast guard: WCAG 2.x ratios for every text-role token on every light ground,
// light text on the dark grounds, and the solid-button label on its fills. Reads css/styles.css :root.
const fs = require("fs");
const path = require("path");
const css = fs.readFileSync(path.join(__dirname, "..", "css", "styles.css"), "utf8");
const root = css.match(/:root\s*{([\s\S]*?)}/)[1];
const tok = {};
for (const m of root.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)) tok[m[1]] = m[2];

function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function ratio(a, b) { const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x); return (l1 + 0.05) / (l2 + 0.05); }

let fails = 0, n = 0;
function check(fgName, fg, bgName, bg, min = 4.5) {
  n++;
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${fgName} ${fg} on ${bgName} ${bg}: ${r.toFixed(2)}:1 (min ${min})`);
}

for (const t of ["navy", "navy-soft", "ink", "green", "terracotta-text", "chrome-text"]) {
  if (!tok[t]) { console.log("FAIL missing token --" + t); fails++; continue; }
  check("--" + t, tok[t], "--ivory", tok.ivory);
  check("--" + t, tok[t], "--cream", tok.cream);
}
check("--ivory", tok.ivory, "--navy", tok.navy);
check("--ivory", tok.ivory, "--green", tok.green);
check("btn label", "#0A1020", "clementine fill", "#EE5E22");
check("btn label", "#0A1020", "clementine hover", "#D9521A");

console.log(fails ? `\nCONTRAST SUITE: ${fails}/${n} FAILED` : `\nCONTRAST SUITE: ALL PASSED (${n} pairs)`);
process.exit(fails ? 1 : 0);
