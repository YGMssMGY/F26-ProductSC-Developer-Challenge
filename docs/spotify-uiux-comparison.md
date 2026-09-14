# Spotify web player: interaction and UI/UX comparison

This review uses the signed-in Spotify tab opened by the user in the Codex browser, compared with the running local demo. It replaces the earlier assumption based only on the public, signed-out site. Findings describe this observed Spotify session; features and layouts can vary by account and release.

The main conclusion: the demo has a working listening flow, but some of its interaction rules differ from Spotify. Passing tests proved that it followed our plan, not that the plan accurately captured Spotify.

## Implementation update — September 13, 2026

The comparison below records the **before** state. The implementation now includes the observed Repeat One skip transition, upcoming-list visibility, restart-current behavior, action tooltips, separate source/release/artist navigation, an expanded Now Playing view that preserves route and focus, search suggestions and filters, song menus with queue additions, local Recents, a full Settings page, and a compact library rail with full transport at medium widths.

Previous restarts after more than three seconds in the demo. This is an explicit UX choice: the reference session confirmed restart behavior but did not establish Spotify’s exact boundary. Queue additions support duplicate entries and insertion order, but Spotify’s drag/reorder and recommendation rules remain outside this pass. Sidebar collapse is implemented; freely resizing panels is not.

Regression tests cover these interactions, with screenshots linked in the README. The app keeps its original twelve instrumental tracks and honest guest settings; account management, billing, commercial streaming, and fabricated lyrics were not added.

## Confirmed interaction differences

| Area                     | Observed Spotify behavior                                                                                                                              | Current demo                                                                            | Recommended change                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Repeat One + Next        | Next changes the song and returns Repeat One to queue repeat. The control changed from “Disable repeat” to “Enable repeat one.”                        | Next changes the song but leaves Repeat Song enabled.                                   | Match the observed state transition and add a browser regression test.                                       |
| Repeat One queue display | Upcoming songs remain visible while the current song repeats.                                                                                          | Upcoming songs are replaced by a single entry for the current song.                     | Separate automatic playback behavior from the displayed upcoming queue.                                      |
| Repeat feedback          | The control labels describe the next action; an active state and the numeral 1 distinguish queue and single-song repeat.                               | The icon changes, but the tooltip only reports “Repeat: queue/song/off.”                | Use action-oriented tooltips with accessible current-mode feedback.                                          |
| Previous                 | Pressing Previous after the song had played for a while restarted that song at 0:00.                                                                   | Previous always switches tracks, even far into a song.                                  | Add restart-current behavior. Check Spotify’s exact time threshold before specifying the boundary.           |
| Bottom song title        | Opens the song’s album. For example, a song playing from a Daily Mix opened its single/album page.                                                     | Opens the playback-source playlist, or the owning playlist for catalog/search playback. | Distinguish the track’s release from the source playlist. This requires a small domain/navigation extension. |
| Panel collection title   | Opens the playlist that supplied playback.                                                                                                             | Shares the same destination as the bottom song title.                                   | Keep source navigation separate from release navigation.                                                     |
| Expanded Now Playing     | Can expand into a large artwork-focused view and minimize again while retaining the browsing URL.                                                      | Has a fixed desktop panel or a separate `/now-playing` route; no expand/minimize state. | Add an expanded view that preserves route, scrolling, and audio.                                             |
| Search typing            | Typing from an album opened a suggestion dropdown while the album URL remained unchanged. “View all results” opened `/search/Bruno%20Mars`.            | The first character immediately navigates to `/search?q=…`.                             | Add an accessible suggestion layer; submit or View all opens the full results page.                          |
| Search results           | Prominent artist result, content-type filters, a horizontal related-content shelf, and mixed result rows.                                              | Songs and playlists in two groups, without type filters or a leading match.             | Use a leading result, All/Songs/Playlists filters, and richer compact rows using the existing catalog.       |
| Song actions             | The song menu exposes Add to playlist, Add to queue, song radio, artist/album navigation, credits, and sharing.                                        | Primarily play, detail navigation, and playlist saving.                                 | Start with functional Add to queue and View details/credits. Add only actions supported by the demo’s data.  |
| Profile and Settings     | Profile menu includes Profile, Recents, Settings, account/support/download destinations, and logout. Settings is a full page with sections and search. | Guest Profile, Settings dialog, and About dialog.                                       | Keep honest guest actions; add local Recents and a settings page if closer navigation fidelity is desired.   |

## Visual and usability findings

### Layout and responsive behavior

At the browser’s actual width of roughly 760px, Spotify retained a compact artwork library rail, central browsing panel, right-hand listening/queue panel, and a complete bottom transport. Our demo used its phone layout: no library rail, bottom navigation, and hidden shuffle/repeat/queue/volume controls until Now Playing was opened.

This is a major reason the two apps feel different in this browser. It is also a tradeoff: some of Spotify’s right-edge controls were clipped at this narrow width. We should preserve browsing context with a compact rail and a dismissible listening panel at medium widths, while keeping genuinely small phone layouts usable. Copying the clipped layout would not be an improvement.

Spotify exposes sidebar-resize controls. Our sidebar and listening panel have fixed widths. A requested resize value was rejected during this review, so the full resize behavior is not verified.

### Density and hierarchy

Spotify uses compact shortcuts, small cover images, short metadata lines, restrained section headings, and horizontal shelves. Its album artwork and title sit alongside each other even in the narrow desktop layout. Our phone-style centered playlist hero consumes much more vertical space at the same width.

Keep the demo’s dark palette and original artwork. Tighten the medium-width hero, retain horizontal playlist shelves, and ensure opening a panel does not turn the remaining cards into oversized tiles. Search should emphasize the strongest match before presenting long lists.

### Now Playing content and navigation

Spotify’s panel includes distinct song and artist destinations, artist information, credits, related content, and the next queued song. It also has clear expand, minimize, and close actions. Our panel supplies a useful song description and instrumental notice, but the artist is plain text and the expanded interaction is missing.

Prioritize navigation and panel behavior over filling the screen with imitation content. Artist biographies, credits, and related tracks should come from explicit metadata. The twelve demo tracks are instrumental; fabricated lyrics, listener counts, commercial videos, or tour information would be inappropriate.

### Feedback and keyboard access

Both interfaces have working menu dismissal and labeled controls. Spotify’s transport communicates the action that the next click will perform. Our Repeat label communicates only the current state. A queue that shows only the current track in Repeat Song further obscures what Next will do.

Retain the demo’s visible focus and dialog focus loop. Extend keyboard coverage to search suggestions and future song menus. Expanded Now Playing should have a clear return action and restore focus to the control that opened it.

## What worked and what remains unverified

- Spotify’s natural Repeat One completion returned the same song to 0:00. Manual Next also visibly exited Repeat One to queue repeat.
- Spotify’s Queue and Lyrics could remain open together; Lyrics changed the central route while Queue stayed at the side. Album and search navigation retained the current player.
- The demo’s separate artwork/title actions and guest dropdown work, but their destinations/layout and playback semantics need the changes above.
- A local audio failure occurred during the comparison. Investigation found no preview server listening on port 5173. Restarting Vite restored playable audio. This was an unavailable-preview issue, not evidence of a repeat-engine defect; the preview server is now running.
- This review did not establish Spotify’s exact Previous threshold, repeat-off boundary/autoplay behavior, queue drag/reorder rules, or behavior on a true phone viewport. These must be observed before claiming exact parity.
- Spotify indicated playback on a connected Safari web player. Playback-state observations are therefore based on the visible Spotify controls and timeline, not an assertion that audio was decoded inside the embedded reference tab.
- No playlists, likes, account settings, or subscriptions were changed. Playback/navigation and temporary player/view controls were exercised.

## Recommended implementation order

1. **Playback correctness:** Next exits Repeat One; Previous can restart the current song; Repeat One preserves the upcoming list. Add tests for observed behavior rather than the old assumptions.
2. **Listening UI:** Separate release/source navigation, add expand/minimize, and improve medium-width panel/rail behavior while preserving route, focus, and playback.
3. **Discovery and actions:** Search suggestions, result filters, a leading match, and useful track menus with Add to queue.
4. **Polish:** Denser playlist heroes and shelves, action tooltips, local Recents, and guest settings navigation.

Authentication, commercial streaming, music videos, recommendations from a backend, billing, and Spotify Connect remain separate product work. They are visible differences, not prerequisites for a strong challenge demo.

## Reference pages inspected

- [Spotify web player](https://open.spotify.com/)
- [Album reached from the bottom song title](https://open.spotify.com/album/18pR217SWwBjODSRWFBw0I)
- [Search results](https://open.spotify.com/search/Bruno%20Mars)
- [Lyrics view](https://open.spotify.com/lyrics)
- The signed-in profile dropdown, Settings page, Queue, Now Playing, and expanded Now Playing were inspected directly within that session.

## Follow-up: Home facets and independent library controls

A second hands-on review of the signed-in reference confirmed that Music changes the Home facet (`/home?facet=music-chip`) and selected-chip styling while retaining the Home feed. The reference can reveal a contextual Following chip. The demo now retains its three catalog-appropriate chips—All, Music, Your playlists—and applies filters within Home, with query/history restoration. Podcasts, audiobooks, and Following were not invented for the small instrumental catalog.

The reference library’s playlist filter, clear action, inline search, and sort/view menu act independently of the central route. Clicking its heading collapses to an artwork rail; the separate expand control opens a full library grid while retaining the Home URL. The recreation now follows those interaction patterns, with independent saved-playlist filtering/search, Recents/Recently added/Alphabetical ordering, list/grid views, current collection and playback feedback, and a full expanded library with focus restoration. It omits unsupported creation and non-playlist library types. The compact rail contains saved artwork instead of unrelated Home/Recents navigation.

Browser regressions verify stable Home chips, matching saved results, history and refresh, empty states, independent library controls, correct song playback from the sidebar, and preserved browsing/audio during library expansion. Desktop, tablet, and phone layouts were visually reviewed.
