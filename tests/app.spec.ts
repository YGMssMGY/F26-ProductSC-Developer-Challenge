import { test, expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
const footer = (page: Page) =>
  page.getByRole("contentinfo", { name: "Music player" });
async function playing(page: Page, file?: string) {
  await expect
    .poll(() =>
      page
        .locator("audio")
        .evaluate(
          (a: HTMLAudioElement, expected) =>
            !a.paused &&
            a.currentTime > 0 &&
            a.readyState >= 2 &&
            (!expected || a.currentSrc.endsWith(expected)),
          file,
        ),
    )
    .toBe(true);
}
async function finish(page: Page) {
  await playing(page);
  await page.locator("audio").evaluate((a: HTMLAudioElement) => {
    a.currentTime = a.duration - 0.1;
  });
}
async function song(page: Page, name: string) {
  await expect(footer(page).locator(".now-playing strong")).toHaveText(name);
}
async function seek(page: Page, seconds: string) {
  await footer(page)
    .getByRole("slider", { name: "Seek", exact: true })
    .fill(seconds);
}
async function paused(page: Page) {
  await expect
    .poll(() =>
      page.locator("audio").evaluate((a: HTMLAudioElement) => a.paused),
    )
    .toBe(true);
}
async function start(page: Page) {
  await page.goto("/playlist/morning");
  await page
    .getByRole("button", { name: "Play First Light", exact: true })
    .click();
  await playing(page, "morning-1.wav");
}

test("card navigation and playback are separate; playlist play resumes its source", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Open A softer morning", exact: true })
    .click();
  await expect(page).toHaveURL(/playlist\/morning$/);
  expect(
    await page.locator("audio").evaluate((a: HTMLAudioElement) => a.paused),
  ).toBe(true);
  await page.goto("/");
  await page
    .locator(".cards")
    .getByRole("button", { name: "Play A softer morning", exact: true })
    .click();
  await expect(page).toHaveURL("/");
  await playing(page, "morning-1.wav");
  await expect(
    page.getByRole("complementary", { name: "Now Playing panel" }),
  ).toBeVisible();
  await seek(page, "9");
  await page
    .locator(".cards")
    .getByRole("button", { name: "Pause A softer morning", exact: true })
    .click();
  await paused(page);
  await page
    .locator(".cards")
    .getByRole("button", { name: "Play A softer morning", exact: true })
    .click();
  await expect
    .poll(() =>
      page.locator("audio").evaluate((a: HTMLAudioElement) => a.currentTime),
    )
    .toBeGreaterThan(8);
  await page.getByRole("button", { name: "Close panel" }).click();
  await footer(page).getByRole("button", { name: "Next track" }).click();
  await playing(page, "morning-2.wav");
  await expect(
    page.getByRole("complementary", { name: "Now Playing panel" }),
  ).toHaveCount(0);
});
test("header search preserves focus, URL history and empty results", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("combobox", {
    name: "Search tracks, artists, and playlists",
  });
  await input.pressSequentially("Paloma");
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("listbox", { name: "Search suggestions" }),
  ).toBeVisible();
  await input.press("Enter");
  await expect(page).toHaveURL(/search\?q=Paloma$/);
  await expect(input).toBeFocused();
  await expect(page.locator(".track-row")).toHaveCount(3);
  await page.getByRole("link", { name: "View Golden Hour details" }).click();
  await page.goBack();
  await expect(input).toHaveValue("Paloma");
  await expect(page.locator(".track-row")).toHaveCount(3);
  await page.goBack();
  await expect(page).toHaveURL("/");
  await page.goForward();
  await expect(input).toHaveValue("Paloma");
  await input.fill("not-a-track");
  await input.press("Enter");
  await expect(page.getByText("No results for")).toBeVisible();
  await page.getByRole("button", { name: "Clear results" }).click();
  await expect(page.locator(".track-row")).toHaveCount(12);
});
test("bottom artwork toggles the panel; title reveals its collection without resetting audio", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: "Close panel" }).click();
  await seek(page, "8");
  await page.locator("main").evaluate((el) => {
    el.scrollTop = 60;
  });
  const scroll = await page.locator("main").evaluate((el) => el.scrollTop);
  const url = page.url();
  await footer(page)
    .getByRole("button", { name: "Open now playing", exact: true })
    .click();
  await expect(page).toHaveURL(url);
  expect(await page.locator("main").evaluate((el) => el.scrollTop)).toBe(
    scroll,
  );
  await expect
    .poll(() =>
      page
        .locator("audio")
        .evaluate((a: HTMLAudioElement) => !a.paused && a.currentTime > 7),
    )
    .toBe(true);
  await footer(page).getByRole("button", { name: "Next track" }).click();
  await expect(
    page
      .getByRole("complementary", { name: "Now Playing panel" })
      .getByRole("heading", { name: "Slow Bloom", exact: true }),
  ).toBeVisible();
  await footer(page)
    .getByRole("link", { name: "Open release for Slow Bloom" })
    .click();
  await expect(page).toHaveURL(/release\/morning-sessions\?track=morning-2$/);
  await expect(page.locator('[data-track-id="morning-2"]')).toHaveClass(
    /highlighted/,
  );
  await expect(page.locator('[data-track-id="morning-2"]')).toBeInViewport();
  await playing(page, "morning-2.wav");
  await page.goto("/search?q=First%20Light");
  await page
    .getByRole("button", { name: "Play First Light", exact: true })
    .click();
  await playing(page);
  await footer(page)
    .getByRole("link", { name: "Open release for First Light" })
    .click();
  await expect(page).toHaveURL(/release\/morning-sessions\?track=morning-1$/);
  await page
    .getByRole("button", { name: "Play Morning sketches", exact: true })
    .click();
  await footer(page).getByRole("button", { name: "Next track" }).click();
  await song(page, "Slow Bloom");
});
test("queue selection, shuffle and all repeat modes preserve playback semantics", async ({
  page,
}) => {
  await start(page);
  await seek(page, "6");
  await footer(page).getByRole("button", { name: "Enable shuffle" }).click();
  await expect
    .poll(() =>
      page.locator("audio").evaluate((a: HTMLAudioElement) => a.currentTime),
    )
    .toBeGreaterThan(5);
  await footer(page)
    .getByRole("button", { name: "Queue", exact: true })
    .click();
  const queue = page.getByRole("complementary", { name: "Play queue" });
  await expect(queue).toBeVisible();
  await expect(queue.getByRole("button", { name: /Play queued/ })).toHaveCount(
    3,
  );
  await footer(page).getByRole("button", { name: "Disable shuffle" }).click();
  await expect(
    queue.getByRole("button", { name: /Play queued/ }).first(),
  ).toHaveAccessibleName("Play queued Slow Bloom");
  await queue
    .getByRole("button", { name: "Play queued Sunday Windows", exact: true })
    .click();
  await playing(page, "morning-3.wav");
  await finish(page);
  await song(page, "First Light");
  await playing(page, "morning-1.wav");
  await footer(page).getByRole("button", { name: "Previous track" }).click();
  await song(page, "Sunday Windows");
  await footer(page).getByRole("button", { name: "Next track" }).click();
  await song(page, "First Light");
  await footer(page)
    .getByRole("button", { name: "Repeat: queue", exact: true })
    .click();
  await finish(page);
  await expect
    .poll(() =>
      page
        .locator("audio")
        .evaluate(
          (a: HTMLAudioElement) =>
            !a.paused && a.currentTime > 0 && a.currentTime < 5,
        ),
    )
    .toBe(true);
  await song(page, "First Light");
  await footer(page)
    .getByRole("button", { name: "Repeat: song", exact: true })
    .click();
  await footer(page).getByRole("button", { name: "Previous track" }).click();
  await playing(page, "morning-3.wav");
  await finish(page);
  await paused(page);
  await song(page, "Sunday Windows");
  await footer(page).getByRole("button", { name: "Next track" }).click();
  await playing(page, "morning-1.wav");
});
test("single-song search queues repeat; empty player and unknown pages recover", async ({
  page,
}) => {
  await page.goto("/now-playing");
  await expect(page.getByText("Choose a song to get started.")).toBeVisible();
  await expect(
    footer(page).getByRole("button", { name: "Next track" }),
  ).toBeDisabled();
  await page.goto("/search?q=First%20Light");
  await page
    .getByRole("button", { name: "Play First Light", exact: true })
    .click();
  await playing(page);
  for (const name of ["Next track", "Previous track"]) {
    await seek(page, "12");
    await footer(page).getByRole("button", { name }).click();
    await playing(page);
    await expect
      .poll(() =>
        page.locator("audio").evaluate((a: HTMLAudioElement) => a.currentTime),
      )
      .toBeLessThan(5);
  }
  await finish(page);
  await expect
    .poll(() =>
      page
        .locator("audio")
        .evaluate(
          (a: HTMLAudioElement) =>
            !a.paused && a.currentTime > 0 && a.currentTime < 5,
        ),
    )
    .toBe(true);
  await page.goto("/playlist/missing");
  await expect(page.getByText("This playlist doesn’t exist.")).toBeVisible();
  await page.goto("/track/missing");
  await expect(page.getByText("This song doesn’t exist.")).toBeVisible();
});
test("profile menu supports keyboard, dismissals, dialogs and persistent shared settings", async ({
  page,
}) => {
  await start(page);
  const avatar = page.getByRole("button", { name: "Profile menu" });
  await avatar.click();
  const menu = page.getByRole("menu", { name: "Profile", exact: true });
  await expect(
    menu.getByRole("menuitem", { name: "Profile", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(
    menu.getByRole("menuitem", { name: "Settings", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(avatar).toBeFocused();
  await avatar.click();
  await page.locator("main h1").click();
  await expect(menu).toHaveCount(0);
  await expect(avatar).toBeFocused();
  await avatar.click();
  await page.getByRole("menuitem", { name: "Settings", exact: true }).click();
  await expect(page).toHaveURL("/settings");
  const dialog = page.locator("main");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("slider", { name: "Settings volume" }).fill("0.3");
  await expect(
    footer(page).getByRole("slider", { name: "Volume", exact: true }),
  ).toHaveValue("0.3");
  await dialog.getByRole("switch", { name: "Settings shuffle" }).check();
  await dialog
    .getByRole("combobox", { name: "Settings repeat" })
    .selectOption("song");
  await expect(
    footer(page).getByRole("button", { name: "Disable shuffle" }),
  ).toBeVisible();
  await expect(
    footer(page).getByRole("button", { name: "Repeat: song" }),
  ).toBeVisible();
  await playing(page);
  await footer(page).getByRole("button", { name: "Mute", exact: true }).click();
  expect(
    await page.locator("audio").evaluate((a: HTMLAudioElement) => a.muted),
  ).toBe(true);
  await footer(page)
    .getByRole("button", { name: "Unmute", exact: true })
    .click();
  await page.reload();
  await expect(
    footer(page).getByRole("slider", { name: "Volume", exact: true }),
  ).toHaveValue("0.3");
  await expect(
    footer(page).getByRole("button", { name: "Repeat: song" }),
  ).toBeVisible();
  await paused(page);
  await avatar.click();
  await page.getByRole("menuitem", { name: "About this demo" }).click();
  await expect(
    page.getByRole("dialog", { name: "About this demo" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(avatar).toBeFocused();
});
test("guest profile and library share saved playlists", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Profile menu" }).click();
  await page.getByRole("menuitem", { name: "Profile", exact: true }).click();
  await expect(page).toHaveURL("/profile");
  await expect(
    page.getByRole("heading", { name: "Guest", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Your favorites belong here.")).toBeVisible();
  await page.goto("/playlist/focus");
  await page
    .getByRole("button", { name: "Save Deep focus to library" })
    .click();
  await page.goto("/profile");
  await expect(
    page.getByText("1 saved playlist · On this device"),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("1 saved playlist · On this device"),
  ).toBeVisible();
  await page.goto("/playlist/focus");
  await page
    .getByRole("button", { name: "Remove Deep focus from library" })
    .click();
  await page.goto("/library");
  await expect(page.getByText("Your favorites belong here.")).toBeVisible();
});
test("song descriptions, lyrics, and failed audio retry", async ({ page }) => {
  await page.route("**/audio/**", (route) => route.abort());
  await page.goto("/track/morning-1");
  await expect(
    page.getByRole("heading", { name: "About this track" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Play First Light", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Retry playback" }),
  ).toBeVisible();
  await page.unroute("**/audio/**");
  await page.getByRole("button", { name: "Retry playback" }).click();
  await playing(page);
  await footer(page).getByRole("link", { name: "Lyrics", exact: true }).click();
  await expect(page).toHaveURL("/lyrics");
  await expect(
    page
      .locator("main")
      .getByText(
        "This is an instrumental track. There are no lyrics to display.",
      ),
  ).toBeVisible();
  await playing(page);
});
test("responsive layout and visual captures at desktop, tablet and mobile", async ({
  page,
}) => {
  for (const width of [1440, 1024, 760, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto("/");
    await page.getByRole("heading", { name: "Songs to try" }).waitFor();
    await page.screenshot({ path: `docs/home-${width}.png`, fullPage: true });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Profile menu" }).click();
    await page.screenshot({
      path: `docs/profile-menu-${width}.png`,
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await page.goto("/playlist/morning");
    await page
      .getByRole("button", { name: "Play First Light", exact: true })
      .click();
    await playing(page);
    if (width >= 700) {
      await expect(
        page.getByRole("complementary", { name: "Now Playing panel" }),
      ).toBeVisible();
      await page.screenshot({
        path: `docs/now-playing-${width === 1440 ? "desktop" : width}.png`,
        fullPage: true,
      });
    } else {
      await footer(page)
        .getByRole("button", { name: "Open now playing", exact: true })
        .click();
      await expect(page).toHaveURL("/now-playing");
      await expect(
        page
          .locator("main")
          .getByRole("heading", { name: "First Light", exact: true }),
      ).toBeVisible();
      await page.screenshot({
        path: `docs/now-playing-${width}.png`,
        fullPage: true,
      });
      await page
        .locator("main")
        .getByRole("link", { name: "Queue", exact: true })
        .click();
      await expect(page).toHaveURL("/queue");
      await page
        .getByRole("button", { name: "Play queued Slow Bloom" })
        .click();
      await playing(page, "morning-2.wav");
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("core listening flow works using only the keyboard", async ({ page }) => {
  async function tabTo(target: Locator) {
    for (let i = 0; i < 80; i++) {
      await page.keyboard.press("Tab");
      if (
        await target.evaluate((element) => element === document.activeElement)
      )
        return;
    }
    throw new Error("Control was not reachable with Tab");
  }
  await page.goto("/");
  await page.getByRole("heading", { name: "Songs to try" }).waitFor();
  await tabTo(
    page
      .locator(".quick-pick")
      .getByRole("link", { name: "A softer morning", exact: true }),
  );
  await page.keyboard.press("Enter");
  await expect(page.locator("main h1")).toHaveText("A softer morning");
  await tabTo(
    page.getByRole("button", { name: "Play First Light", exact: true }),
  );
  await page.keyboard.press("Enter");
  await playing(page, "morning-1.wav");
  await tabTo(footer(page).getByRole("button", { name: "Pause", exact: true }));
  await page.keyboard.press("Enter");
  await paused(page);
  await page.keyboard.press("Enter");
  await playing(page);
  await tabTo(footer(page).getByRole("slider", { name: "Seek", exact: true }));
  const before = await footer(page)
    .getByRole("slider", { name: "Seek" })
    .inputValue();
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(async () =>
      Number(
        await footer(page).getByRole("slider", { name: "Seek" }).inputValue(),
      ),
    )
    .toBeGreaterThan(Number(before));
  await tabTo(footer(page).getByRole("button", { name: "Queue", exact: true }));
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("complementary", { name: "Play queue" }),
  ).toBeVisible();
  await playing(page);
});

test("Repeat One exits on skip, keeps upcoming songs, and Previous restarts", async ({
  page,
}) => {
  await start(page);
  await footer(page).getByRole("button", { name: "Repeat: queue" }).click();
  await expect(
    footer(page).getByRole("button", { name: "Repeat: song" }),
  ).toHaveAttribute("title", "Disable repeat");
  await footer(page)
    .getByRole("button", { name: "Queue", exact: true })
    .click();
  const queue = page.getByRole("complementary", { name: "Play queue" });
  await expect(
    queue.getByRole("button", { name: /Play queued/ }).first(),
  ).toHaveAccessibleName("Play queued Slow Bloom");
  await footer(page).getByRole("button", { name: "Next track" }).click();
  await song(page, "Slow Bloom");
  await expect(
    footer(page).getByRole("button", { name: "Repeat: queue" }),
  ).toBeVisible();
  await seek(page, "10");
  await footer(page).getByRole("button", { name: "Previous track" }).click();
  await song(page, "Slow Bloom");
  await expect
    .poll(() =>
      page.locator("audio").evaluate((a: HTMLAudioElement) => a.currentTime),
    )
    .toBeLessThan(3);
  await footer(page).getByRole("button", { name: "Previous track" }).click();
  await song(page, "First Light");
  await seek(page, "8");
  await footer(page)
    .getByRole("button", { name: "Pause", exact: true })
    .click();
  await footer(page).getByRole("button", { name: "Previous track" }).click();
  await paused(page);
  await song(page, "First Light");
  await expect(footer(page).getByRole("slider", { name: "Seek" })).toHaveValue(
    "0",
  );
});

test("expanded player preserves browsing, playback, and keyboard focus", async ({
  page,
}) => {
  await start(page);
  await page
    .locator("header")
    .getByRole("link", { name: "Browse music", exact: true })
    .click();
  await expect(page.locator("main .track-row")).toHaveCount(12);
  for (const width of [1440, 760]) {
    await page.setViewportSize({ width, height: 1000 });
    if (width === 760)
      await expect(page.locator(".workspace")).toHaveClass(/compact-library/);
    const main = page.locator("main");
    await main.evaluate((el) => {
      el.scrollTop = 80;
    });
    const scroll = await main.evaluate((el) => el.scrollTop);
    const url = page.url();
    const expand = page.getByRole("button", {
      name: "Expand Now Playing",
      exact: true,
    });
    await expand.click();
    const expanded = page.getByRole("region", { name: "Expanded Now Playing" });
    await expect(expanded).toBeVisible();
    await expect(page).toHaveURL(url);
    await expect(main).toHaveAttribute("inert", "");
    await expect(
      page.getByRole("button", { name: "Minimize Now Playing" }),
    ).toBeFocused();
    await playing(page);
    await page.screenshot({ path: `docs/expanded-${width}.png` });
    await page.keyboard.press("Escape");
    await expect(expanded).toHaveCount(0);
    await expect(expand).toBeFocused();
    expect(await main.evaluate((el) => el.scrollTop)).toBe(scroll);
    await expect(page).toHaveURL(url);
    for (const label of ["Next track", "Repeat: queue", "Queue", "Mute"]) {
      const box = await footer(page)
        .getByRole("button", { name: label, exact: true })
        .boundingBox();
      expect(box).toBeTruthy();
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    }
  }
  await page
    .getByRole("button", { name: "Expand Now Playing", exact: true })
    .click();
  await page
    .getByRole("region", { name: "Expanded Now Playing" })
    .getByRole("link", { name: "The Daylight Studio", exact: true })
    .click();
  await expect(page).toHaveURL("/artist/morning");
  await expect(
    page.getByRole("region", { name: "Expanded Now Playing" }),
  ).toHaveCount(0);
  await playing(page);
});

test("song actions add duplicate tracks in order, navigate, and record recents", async ({
  page,
}) => {
  await page.goto("/playlist/morning");
  const more = page
    .locator("main")
    .getByRole("button", { name: "More options for First Light" });
  await more.click();
  await expect(
    page.getByRole("menuitem", { name: "Add to queue" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(more).toBeFocused();
  await more.click();
  await page.getByRole("menuitem", { name: "Add to queue" }).click();
  await expect(page.locator(".player-notice")).toHaveText(
    "Added First Light to queue",
  );
  await paused(page);
  await footer(page).getByRole("button", { name: "Play", exact: true }).click();
  await playing(page);
  for (let i = 0; i < 2; i++) {
    await page
      .locator("main")
      .getByRole("button", { name: "More options for Sunday Windows" })
      .click();
    await page.getByRole("menuitem", { name: "Add to queue" }).click();
  }
  await footer(page).getByRole("button", { name: "Next track" }).click();
  await song(page, "Sunday Windows");
  await seek(page, "7");
  await footer(page).getByRole("button", { name: "Next track" }).click();
  await song(page, "Sunday Windows");
  await expect
    .poll(() =>
      page.locator("audio").evaluate((a: HTMLAudioElement) => a.currentTime),
    )
    .toBeLessThan(3);
  await page.getByRole("button", { name: "Profile menu" }).click();
  await page.getByRole("menuitem", { name: "Recents", exact: true }).click();
  await expect(page).toHaveURL("/recents");
  await expect(page.locator("main .track-row")).toHaveCount(2);
  await page.reload();
  await expect(page.locator("main .track-row")).toHaveCount(2);
  await paused(page);
  await page
    .locator("main")
    .getByRole("button", { name: "More options for Sunday Windows" })
    .click();
  await page
    .getByRole("menuitem", { name: "View details and credits" })
    .click();
  await expect(page).toHaveURL("/track/morning-3#credits");
  await expect(page.locator("#credits")).toBeInViewport();
  await page.goto("/release/missing");
  await expect(page.getByText("This release doesn’t exist.")).toBeVisible();
});

test("search suggestions support keyboard selection, dismissal, and result filters", async ({
  page,
}) => {
  await page.goto("/");
  const search = page.getByRole("combobox", {
    name: "Search tracks, artists, and playlists",
  });
  await search.fill("First Light");
  await expect(page.getByRole("option", { name: /First Light/ })).toBeVisible();
  await expect(page).toHaveURL("/");
  await search.press("ArrowDown");
  await expect(search).toHaveAttribute(
    "aria-activedescendant",
    "suggestion-song-morning-1",
  );
  await search.press("Enter");
  await expect(page).toHaveURL("/track/morning-1");
  await paused(page);
  await search.fill("morning");
  await expect(page.getByRole("listbox")).toBeVisible();
  await search.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await search.press("Enter");
  await expect(page).toHaveURL("/search?q=morning");
  await page
    .locator("main")
    .getByRole("button", { name: "Playlists", exact: true })
    .click();
  await expect(page).toHaveURL(/type=playlists/);
  await expect(page.locator(".track-row")).toHaveCount(0);
  await expect(page.locator("main .playlist-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Songs", exact: true }).click();
  await expect(
    page.getByText("No songs match this search.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  await expect(page).toHaveURL("/search");
  await expect(page.locator(".track-row")).toHaveCount(12);
  await search.fill("Paloma");
  await expect(page.getByRole("option")).toHaveCount(3);
  await search.press("ArrowUp");
  await expect(search).toHaveAttribute(
    "aria-activedescendant",
    "suggestion-song-good-days-3",
  );
  await search.press("Escape");
  await search.press("ArrowDown");
  await page.screenshot({ path: "docs/search-suggestions.png" });
  await page
    .getByRole("button", { name: "View all results for “Paloma”" })
    .click();
  await expect(page.getByRole("heading", { name: "Top result" })).toBeVisible();
  await page.screenshot({ path: "docs/search-results.png" });
});

test("Home chips filter in place, preserve controls and playback, and restore with history", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".quick-picks")
    .getByRole("button", { name: "Play A softer morning", exact: true })
    .click();
  await playing(page);
  const audioSource = await page.locator("audio").getAttribute("src");
  const filters = page.getByRole("group", { name: "Home filters" });
  await filters.getByRole("button", { name: "Music", exact: true }).click();
  await expect(page).toHaveURL("/?facet=music");
  await expect(
    filters.getByRole("button", { name: "Music", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("heading", { name: "Music for your day" }),
  ).toBeVisible();
  await filters
    .getByRole("button", { name: "Your playlists", exact: true })
    .click();
  await expect(page).toHaveURL("/?facet=playlists");
  await expect(filters.getByRole("button")).toHaveCount(3);
  await expect(
    page.getByRole("heading", { name: "Your favorites start here" }),
  ).toBeVisible();
  await expect(page.locator("main .quick-pick")).toHaveCount(0);
  await playing(page);
  await expect(page.locator("audio")).toHaveAttribute("src", audioSource!);
  await page.goBack();
  await expect(
    filters.getByRole("button", { name: "Music", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(
    filters.getByRole("button", { name: "Music", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await paused(page);
  await filters.getByRole("button", { name: "All", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("heading", { name: "Your daily soundtrack" }),
  ).toBeVisible();
});

test("library filters, search, sorting and expanded view preserve the browsing page", async ({
  page,
}) => {
  await page.goto("/playlist/morning");
  await page
    .getByRole("button", { name: "Save A softer morning to library" })
    .click();
  await page.goto("/playlist/midnight");
  await page
    .getByRole("button", { name: "Save Midnight drive to library" })
    .click();
  const sidebar = page.getByRole("complementary", {
    name: "Your library",
    exact: true,
  });
  const links = sidebar.getByRole("link", { name: /Open saved playlist/ });
  await expect(links).toHaveCount(2);
  await expect(links.first()).toHaveAttribute(
    "aria-label",
    "Open saved playlist Midnight drive",
  );
  await sidebar.getByRole("button", { name: "Playlists", exact: true }).click();
  await expect(page).toHaveURL("/playlist/midnight");
  await expect(
    sidebar.getByRole("button", { name: "Playlists", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await sidebar.getByRole("button", { name: "Clear library filters" }).click();
  await sidebar
    .getByRole("button", { name: "Search in Your Library", exact: true })
    .click();
  const search = sidebar.getByRole("textbox", {
    name: "Search in Your Library",
  });
  await search.fill("morning");
  await expect(links).toHaveCount(1);
  await search.fill("missing");
  await expect(
    sidebar.getByText("No matches in Your Library", { exact: true }),
  ).toBeVisible();
  await search.press("Escape");
  await expect(
    sidebar.getByRole("button", {
      name: "Search in Your Library",
      exact: true,
    }),
  ).toBeFocused();
  await expect(links).toHaveCount(2);
  await sidebar.getByRole("button", { name: "Sort and view library" }).click();
  await sidebar.getByRole("menuitemradio", { name: "Alphabetical" }).click();
  await expect(links.first()).toHaveAttribute(
    "aria-label",
    "Open saved playlist A softer morning",
  );
  await sidebar.getByRole("button", { name: "Sort and view library" }).click();
  await sidebar
    .getByRole("menuitemradio", { name: "Grid", exact: true })
    .click();
  await expect(sidebar.locator(".library-grid")).toBeVisible();
  await sidebar.getByRole("button", { name: "Sort and view library" }).click();
  await sidebar
    .getByRole("menuitemradio", { name: "List", exact: true })
    .click();
  await sidebar
    .getByRole("button", {
      name: "Play saved playlist A softer morning",
      exact: true,
    })
    .click();
  await playing(page, "morning-1.wav");
  await expect(page).toHaveURL("/playlist/midnight");
  await sidebar
    .getByRole("button", { name: "Collapse Your Library", exact: true })
    .click();
  await expect(
    sidebar.getByRole("button", { name: "Open Your Library", exact: true }),
  ).toBeVisible();
  await expect(links).toHaveCount(2);
  await sidebar
    .getByRole("button", { name: "Open Your Library", exact: true })
    .click();
  await sidebar
    .getByRole("button", { name: "Expand Your Library", exact: true })
    .click();
  await expect(
    sidebar.getByRole("button", { name: "Minimize Your Library", exact: true }),
  ).toBeFocused();
  await expect(page).toHaveURL("/playlist/midnight");
  await expect(page.locator("main")).toHaveAttribute("inert", "");
  await playing(page, "morning-1.wav");
  await page.screenshot({ path: "docs/library-expanded.png" });
  await sidebar
    .getByRole("button", { name: "Minimize Your Library", exact: true })
    .press("Escape");
  await expect(
    sidebar.getByRole("button", { name: "Expand Your Library", exact: true }),
  ).toBeFocused();
  await expect(page.locator("main")).not.toHaveAttribute("inert", "");
  await page.screenshot({ path: "docs/library-sidebar.png" });
  await links.first().click();
  await expect(page).toHaveURL("/playlist/morning");
  await expect(links.first()).toHaveAttribute("aria-current", "page");
  await page.goto("/?facet=playlists");
  await expect(page.locator("main .playlist-card")).toHaveCount(2);
  await page.reload();
  await expect(page.locator("main .playlist-card")).toHaveCount(2);
});

test("Home filters and independent library controls fit tablet and phone layouts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 760, height: 900 });
  await page.goto("/");
  const sidebar = page.getByRole("complementary", {
    name: "Your library",
    exact: true,
  });
  await sidebar
    .getByRole("button", { name: "Open Your Library", exact: true })
    .click();
  await expect(
    sidebar.getByRole("button", {
      name: "Search in Your Library",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("group", { name: "Home filters" })
    .getByRole("button", { name: "Your playlists", exact: true })
    .click();
  await expect(page).toHaveURL("/?facet=playlists");
  await page.screenshot({ path: "docs/home-filters-760.png" });
  await sidebar
    .getByRole("button", { name: "Expand Your Library", exact: true })
    .click();
  await page.screenshot({ path: "docs/library-expanded-760.png" });
  await sidebar
    .getByRole("button", { name: "Minimize Your Library", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(sidebar).not.toBeVisible();
  await page
    .getByRole("group", { name: "Home filters" })
    .getByRole("button", { name: "Music", exact: true })
    .click();
  await expect(page).toHaveURL("/?facet=music");
  await expect(
    page.getByRole("group", { name: "Home filters" }).getByRole("button"),
  ).toHaveCount(3);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("heading", { name: "Music for your day" }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/home-filters-390.png" });
});

test("song saves synchronize across controls, persist, and play as a collection", async ({
  page,
}) => {
  await start(page);
  await footer(page)
    .getByRole("button", { name: "Save First Light to Liked Songs" })
    .click();
  await expect(
    page
      .locator("main")
      .getByRole("button", { name: "Remove First Light from Liked Songs" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page
      .getByRole("complementary", { name: "Now Playing panel" })
      .getByRole("button", { name: "Remove First Light from Liked Songs" }),
  ).toBeVisible();
  await page
    .locator("main")
    .getByRole("button", { name: "More options for First Light" })
    .click();
  await page.getByRole("menuitem", { name: "Remove from Liked Songs" }).click();
  await expect(
    footer(page).getByRole("button", {
      name: "Save First Light to Liked Songs",
    }),
  ).toHaveAttribute("aria-pressed", "false");
  const save = page
    .locator("main")
    .getByRole("button", { name: "Save First Light to Liked Songs" });
  await save.focus();
  await page.keyboard.press("Enter");
  await page
    .locator("main")
    .getByRole("button", { name: "Save Slow Bloom to Liked Songs" })
    .click();
  await page.getByRole("button", { name: "Close panel" }).click();
  await page
    .getByRole("link", { name: "Liked Songs, 2 songs", exact: true })
    .click();
  await expect(page).toHaveURL(/collection\/tracks$/);
  await playing(page, "morning-1.wav");
  await expect(page.locator(".track-row").first()).toContainText("Slow Bloom");
  await page.reload();
  await expect(page.locator(".track-row")).toHaveCount(2);
  await paused(page);
  await page
    .getByRole("button", { name: "Play Liked Songs", exact: true })
    .click();
  await playing(page, "morning-2.wav");
  await footer(page).getByRole("button", { name: "Next track" }).click();
  await playing(page, "morning-1.wav");
  await page
    .locator("main")
    .getByRole("button", { name: "Remove First Light from Liked Songs" })
    .click();
  await page
    .locator("main")
    .getByRole("button", { name: "Remove Slow Bloom from Liked Songs" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Songs you like belong here" }),
  ).toBeVisible();
  await playing(page, "morning-1.wav");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Songs you like belong here" }),
  ).toBeVisible();
});

test("mobile song saving and Liked Songs remain accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/track/morning-1");
  const save = page
    .locator("main")
    .getByRole("button", { name: "Save First Light to Liked Songs" });
  await save.click();
  await expect(
    page
      .locator("main")
      .getByRole("button", { name: "Remove First Light from Liked Songs" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Library" })
    .click();
  await page
    .locator("main")
    .getByRole("link", { name: "Liked Songs, 1 song", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Play Liked Songs", exact: true })
    .click();
  await playing(page, "morning-1.wav");
  await expect(
    footer(page).getByRole("button", {
      name: "Remove First Light from Liked Songs",
    }),
  ).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "docs/liked-songs-390.png" });
});
