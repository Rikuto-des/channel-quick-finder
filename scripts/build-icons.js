// Builds icons/icon{16,32,48,128}.png from an inline SVG using sharp.
// Run: node scripts/build-icons.js

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0F766E"/>
      <stop offset="1" stop-color="#14B8A6"/>
    </linearGradient>
  </defs>
  <rect x="6" y="6" width="116" height="116" rx="26" fill="url(#g)"/>
  <circle cx="52" cy="52" r="26" fill="none" stroke="white" stroke-width="9"/>
  <text x="52" y="54" font-family="-apple-system, Helvetica, sans-serif"
        font-size="32" font-weight="800" text-anchor="middle"
        dominant-baseline="central" fill="white">#</text>
  <line x1="74" y1="74" x2="104" y2="104"
        stroke="white" stroke-width="11" stroke-linecap="round"/>
</svg>`;

const sizes = [16, 32, 48, 128];
const outDir = path.join(__dirname, "..", "icons");
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  for (const size of sizes) {
    const outPath = path.join(outDir, `icon${size}.png`);
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log("wrote", outPath);
  }
  fs.writeFileSync(path.join(outDir, "icon.svg"), svg.trim() + "\n");
  console.log("wrote", path.join(outDir, "icon.svg"));
})();
