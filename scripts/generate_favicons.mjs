// Render the original SVG into browser-compatible icons. No external artwork is used.
import { chromium } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
const publicDir = new URL("../public/", import.meta.url);
const svg = await readFile(new URL("favicon.svg", publicDir), "utf8");
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
});
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const frames = [];
  for (const size of [16, 32, 48, 180]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<style>html,body{margin:0;width:100%;height:100%;background:transparent}svg{display:block;width:100%;height:100%}</style>${svg}`,
    );
    const png = await page.screenshot({ omitBackground: true });
    if (size !== 48) {
      await writeFile(
        new URL(
          size === 180 ? "apple-touch-icon.png" : `favicon-${size}x${size}.png`,
          publicDir,
        ),
        png,
      );
    }
    if (size < 180) frames.push({ size, png });
  }
  // ICO directory containing PNG frames for 16, 32 and 48 pixel displays.
  const header = Buffer.alloc(6 + 16 * frames.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);
  let offset = header.length;
  frames.forEach(({ size, png }, index) => {
    const entry = 6 + index * 16;
    header[entry] = header[entry + 1] = size;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  await writeFile(
    new URL("favicon.ico", publicDir),
    Buffer.concat([header, ...frames.map((frame) => frame.png)]),
  );
} finally {
  await browser.close();
}
