import { test, expect } from "@playwright/test";
test("complete listening flow, navigation, seeking and queue boundaries", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Open A softer morning" }).click();
  await page
    .getByRole("button", { name: "Play First Light", exact: true })
    .click();
  const audio = page.locator("audio");
  await expect
    .poll(() =>
      audio.evaluate((a: HTMLAudioElement) => !a.paused && a.currentTime > 0),
    )
    .toBe(true);
  await expect(
    page.getByRole("button", { name: "Previous track" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect
    .poll(() => audio.evaluate((a: HTMLAudioElement) => a.paused))
    .toBe(true);
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByRole("slider", { name: "Seek", exact: true }).fill("12");
  await expect
    .poll(() => audio.evaluate((a: HTMLAudioElement) => a.currentTime))
    .toBeGreaterThan(11);
  await page.getByRole("link", { name: "Back to your music" }).click();
  await expect
    .poll(() =>
      audio.evaluate((a: HTMLAudioElement) => !a.paused && a.currentTime > 11),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Next track" }).click();
  await expect(page.locator(".now-playing strong")).toHaveText("Slow Bloom");
  await expect
    .poll(() => audio.evaluate((a: HTMLAudioElement) => !a.paused))
    .toBe(true);
  await audio.evaluate((a: HTMLAudioElement) => {
    a.currentTime = 31.9;
  });
  await expect(page.locator(".now-playing strong")).toHaveText(
    "Sunday Windows",
  );
  await expect(page.getByRole("button", { name: "Next track" })).toBeDisabled();
  await audio.evaluate((a: HTMLAudioElement) => {
    a.currentTime = 31.9;
  });
  await expect
    .poll(() => audio.evaluate((a: HTMLAudioElement) => a.paused))
    .toBe(true);
});
test("search, empty state, direct routes and saved library persist", async ({
  page,
}) => {
  await page.goto("/search?q=PALOMA");
  await expect(page.locator(".track-row")).toHaveCount(3);
  await page.getByRole("textbox").fill("not-a-track");
  await expect(page.getByText("No results for")).toBeVisible();
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  await expect(page.locator(".track-row")).toHaveCount(12);
  await page.goto("/playlist/focus");
  await page
    .getByRole("button", { name: "Save Deep focus to library" })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Remove Deep focus from library" }),
  ).toBeVisible();
  await page.goto("/library");
  await expect(
    page.getByRole("link", { name: "Open Deep focus" }),
  ).toBeVisible();
  await page.goto("/playlist/focus");
  await page
    .getByRole("button", { name: "Remove Deep focus from library" })
    .click();
  await page.goto("/library");
  await expect(page.getByText("Your favorites belong here.")).toBeVisible();
  await page.goto("/playlist/missing");
  await expect(page.getByText("This playlist doesn’t exist.")).toBeVisible();
});
test("playback failure can be retried", async ({ page }) => {
  await page.route("**/audio/**", (route) => route.abort());
  await page.goto("/playlist/morning");
  await page
    .getByRole("button", { name: "Play playlist", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Retry playback" }),
  ).toBeVisible();
  await page.unroute("**/audio/**");
  await page.getByRole("button", { name: "Retry playback" }).click();
  await expect
    .poll(() =>
      page
        .locator("audio")
        .evaluate((a: HTMLAudioElement) => !a.paused && a.currentTime > 0),
    )
    .toBe(true);
});
test("keyboard navigation and history preserve page state", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Open Midnight drive" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/playlist\/midnight/);
  await page
    .getByRole("button", { name: "Play After Hours", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect
    .poll(() =>
      page.locator("audio").evaluate((a: HTMLAudioElement) => !a.paused),
    )
    .toBe(true);
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Make yourself at home." }),
  ).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole("heading", { name: "Midnight drive" }),
  ).toBeVisible();
});
test("desktop and mobile visual checks", async ({ page }) => {
  await page.goto("/");
  await page.locator(".playlist-card").last().waitFor();
  await page.screenshot({ path: "docs/home-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "docs/home-mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Search" })
    .click();
  await page.getByRole("textbox").fill("First Light");
  await page
    .getByRole("button", { name: "Play First Light", exact: true })
    .click();
  await expect
    .poll(() =>
      page.locator("audio").evaluate((a: HTMLAudioElement) => !a.paused),
    )
    .toBe(true);
  await page.goto("/playlist/morning");
  await page.screenshot({ path: "docs/playlist-mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
