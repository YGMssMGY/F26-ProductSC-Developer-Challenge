import { test, expect } from "@playwright/test";

const projectPath = "/F26-ProductSC-Developer-Challenge/";

test("Pages deep links reload and play media from the repository folder", async ({
  page,
}) => {
  await page.goto("./#/playlist/morning");
  await expect(
    page.getByRole("heading", { name: "A softer morning", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "A softer morning", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".playlist-hero img")).toHaveAttribute(
    "src",
    `${projectPath}art/morning.svg`,
  );
  await expect
    .poll(() =>
      page
        .locator(".playlist-hero img")
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "Play First Light", exact: true })
    .click();
  await expect
    .poll(() =>
      page
        .locator("audio")
        .evaluate(
          (audio: HTMLAudioElement) => !audio.paused && audio.currentTime > 0,
        ),
    )
    .toBe(true);
  await expect(page.locator("audio")).toHaveAttribute(
    "src",
    `${projectPath}audio/morning-1.wav`,
  );
  await page
    .getByRole("link", { name: "Open release for First Light" })
    .click();
  await expect(page).toHaveURL(
    /#\/release\/morning-sessions\?track=morning-1$/,
  );
  await expect
    .poll(() =>
      page
        .locator("audio")
        .evaluate((audio: HTMLAudioElement) => !audio.paused),
    )
    .toBe(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Morning sketches", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.locator("audio").evaluate((audio: HTMLAudioElement) => audio.paused),
    )
    .toBe(true);
});

test("Pages filters, search history, credits, and keyboard skip navigation work", async ({
  page,
}) => {
  await page.goto("./");
  const filters = page.getByRole("group", { name: "Home filters" });
  await filters.getByRole("button", { name: "Music", exact: true }).click();
  await expect(page).toHaveURL(/#\/\?facet=music$/);
  await page.reload();
  await expect(
    filters.getByRole("button", { name: "Music", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const search = page.getByRole("combobox", {
    name: "Search tracks, artists, and playlists",
  });
  await search.fill("First Light");
  await search.press("Enter");
  await expect(page).toHaveURL(/#\/search\?q=First%20Light$/);
  await expect(page.locator(".track-row")).toHaveCount(1);
  await page.reload();
  await expect(search).toHaveValue("First Light");
  await page.goBack();
  await expect(
    filters.getByRole("button", { name: "Music", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goForward();
  await expect(page.locator(".track-row")).toHaveCount(1);
  await page
    .getByRole("button", { name: "More options for First Light" })
    .click();
  await page
    .getByRole("menuitem", { name: "View details and credits" })
    .click();
  await expect(page).toHaveURL(/#\/track\/morning-1#credits$/);
  await expect(page.locator("#credits")).toBeInViewport();
  await page.reload();
  await expect(page.locator("#credits")).toBeInViewport();
  const url = page.url();
  await page.getByRole("link", { name: "Skip to content" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await expect(page).toHaveURL(url);
  await page.goto("./#/playlist/missing");
  await expect(page.getByText("This playlist doesn’t exist.")).toBeVisible();
});

test("Pages serves its favicon and static assets without depending on SPA fallbacks", async ({
  page,
  request,
}) => {
  await page.goto("./");
  const icons = [
    {
      selector: 'link[rel="icon"][type="image/x-icon"]',
      file: "favicon.ico",
      type: /image\/(x-icon|vnd.microsoft.icon)/,
    },
    {
      selector: 'link[rel="icon"][sizes="16x16"]',
      file: "favicon-16x16.png",
      type: /image\/png/,
    },
    {
      selector: 'link[rel="icon"][sizes="32x32"]',
      file: "favicon-32x32.png",
      type: /image\/png/,
    },
    {
      selector: 'link[rel="apple-touch-icon"]',
      file: "apple-touch-icon.png",
      type: /image\/png/,
    },
  ];
  for (const icon of icons) {
    await expect(page.locator(icon.selector)).toHaveAttribute(
      "href",
      `${projectPath}${icon.file}?v=2`,
    );
    const response = await request.get(`${projectPath}${icon.file}?v=2`);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toMatch(icon.type);
    const bytes = await response.body();
    if (icon.file.endsWith(".png")) {
      expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      const size = icon.file.includes("16x16")
        ? 16
        : icon.file.includes("32x32")
          ? 32
          : 180;
      expect(bytes.readUInt32BE(16)).toBe(size);
      expect(bytes.readUInt32BE(20)).toBe(size);
    } else {
      expect(bytes.readUInt16LE(2)).toBe(1);
      expect(bytes.readUInt16LE(4)).toBe(3);
    }
  }
  await expect
    .poll(() =>
      page
        .locator("main img")
        .evaluateAll(
          (images) =>
            images.length > 0 &&
            images.every(
              (img) =>
                (img as HTMLImageElement).complete &&
                (img as HTMLImageElement).naturalWidth > 0,
            ),
        ),
    )
    .toBe(true);
  expect((await request.get(`${projectPath}playlist/morning`)).status()).toBe(
    404,
  );
  await page.setViewportSize({ width: 64, height: 64 });
  await page.goto("./favicon.svg");
  await page.screenshot({ path: "docs/favicon-preview.png" });
});

test("Pages Liked Songs deep link retains saved songs after reload", async ({
  page,
}) => {
  await page.goto("./#/track/morning-1");
  await page
    .locator("main")
    .getByRole("button", { name: "Save First Light to Liked Songs" })
    .click();
  await page
    .getByRole("link", { name: "Liked Songs, 1 song", exact: true })
    .click();
  await expect(page).toHaveURL(/#\/collection\/tracks$/);
  await page.reload();
  await expect(page.locator(".track-row")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Play Liked Songs", exact: true })
    .click();
  await expect
    .poll(() =>
      page
        .locator("audio")
        .evaluate(
          (audio: HTMLAudioElement) => !audio.paused && audio.currentTime > 0,
        ),
    )
    .toBe(true);
  await expect(page.locator("audio")).toHaveAttribute(
    "src",
    `${projectPath}audio/morning-1.wav`,
  );
  await page.screenshot({ path: "docs/liked-songs-1440.png" });
});
