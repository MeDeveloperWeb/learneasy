# Mobile App-Style Navigation — Design

Date: 2026-06-18
Status: Approved pending user review

## Goal

Make the app feel like a native mobile app on phones, while leaving the desktop
experience almost untouched.

- **Mobile (`< md`)**: hide the top `Header`. Add a fixed **contextual bottom bar**
  (app tab-bar style) plus a slide-up **Menu sheet** for global controls.
- **Desktop (`>= md`)**: keep the current top `Header` (visually almost the same).
- One shared set of providers/actions feeds both shells, so behavior stays in sync.

## Design decisions (locked with user)

1. Desktop keeps the top header. Only mobile switches to a bottom bar.
2. The mobile bottom bar is **contextual** — its middle slots change per page.
3. On a topic page the bar shows **Prev · + · Next** directly as bar buttons.
4. Global controls (theme, split view, search, user, admin) live in the **Menu sheet**.

## The mobile bottom bar

A fixed bar pinned to the bottom, full width, respecting iOS safe-area inset
(`env(safe-area-inset-bottom)`). Five evenly-spaced slots.

- **Slot 1 (left anchor): Home** — always present. Active/highlighted on `/`.
- **Slot 5 (right anchor): Menu** — always present. Opens the Menu sheet.
- **Slots 2–4 (middle): contextual**, supplied by the current page.

### Per-page bar states

| Page | Slot 1 | Slot 2 | Slot 3 | Slot 4 | Slot 5 |
|------|--------|--------|--------|--------|--------|
| `/` (home) | Home* | Search | — | — | Menu |
| `/paper/[id]` | Home | Search | + Add topic† | — | Menu |
| `/topic/[id]` | Home | ⟵ Prev‡ | + Add resource | Next ⟶‡ | Menu |
| `/search` | Home | — | — | — | Menu |

\* active state. † only when the paper has a custom unit (mirrors current
`AddTopicButton` rule). ‡ Prev/Next render only when a sibling topic exists; the
slot collapses (renders an empty spacer to keep spacing) when absent.

- The center **+** on the topic page is the visual emphasis (slightly raised /
  gradient pill) — it inherits the role of today's add-resource FAB.
- **Search** lives in the Menu sheet always, and is *also* promoted to a bar slot
  on pages that have a free middle slot (home, paper). On the topic page the
  middle is full, so search is reached via the Menu.

## The Menu sheet

A bottom sheet that slides up from the bar when **Menu** is tapped. Backdrop dims
the page; tap-outside / swipe-down / Esc closes it. Reuses the existing slide/fade
animations and focus-trap pattern already in `MobileDrawer.tsx`.

Contents (all driven by existing providers):

- 🔍 Search → opens `GlobalSearch` modal.
- 🌙 Dark mode → `ThemeProvider.toggleTheme` (switch control).
- ⬓ Split view → `SplitScreenProvider.setSplitScreenEnabled` (switch control).
- 👤 User block → username (set/change/clear) via `UserProvider`; admin
  login/logout via `AdminProvider`. Same actions as today's header user dropdown.

## Architecture

Single source of truth for *contextual* actions; existing providers for *global*
actions. Two presentational shells rendered responsively.

```
NavProvider (new, client)         <- holds contextual actions + sheet open state
 ├─ Header (desktop only, md:flex) <- existing, lightly trimmed
 └─ BottomBar (mobile only)        <- new; reads NavProvider + pathname
      └─ MobileMenuSheet (new)     <- globals via existing providers

Per page (server) renders a tiny client config component:
  TopicPage  -> <TopicNavConfig prev next topicId/>  (sets Prev/Next + Add action)
  PaperPage  -> <PaperNavConfig addTopicUnitId?/>     (sets Add-topic action)
```

### NavProvider

New client context. Exposes:

- `context: { prev?, next?, primaryAction? }` and `setContext(...)`.
- `prev` / `next`: `{ id, title }` for sibling topics (used to build `/topic/[id]` links).
- `primaryAction`: `{ label, icon, onClick }` — what the **+** does on this page
  (open add-resource modal, open add-topic modal). `undefined` ⇒ no + shown.
- Menu sheet open/close state.

Page-level **config components** are small client components that call
`setContext` in an effect on mount and clear it on unmount. This keeps the page
files themselves as server components (they only pass data down as props).

### Wiring the `+` (avoid duplicate modal state)

The add-resource modal currently lives inside `AddResourceButton`. Refactor so the
modal open/close handler is shared:

- `AddResourceButton` keeps rendering the desktop FAB (now `hidden md:flex`) and
  registers its `open()` handler as the topic page's `primaryAction`.
- The mobile bar's **+** simply calls `primaryAction.onClick`, opening the same
  modal — no second modal instance.

Same pattern for `AddTopicButton` on the paper page.

### Rendering location

- `NavProvider` wraps the tree in `app/layout.tsx` (inside the existing provider
  stack, around `SplitScreenLayout`).
- `BottomBar` is rendered once globally (in the layout / `SplitScreenLayout`),
  fixed-positioned, shown only `< md`. It is hidden on desktop, so it does not
  interfere with the desktop split-screen resizable panels.
- `Header` gains `hidden md:flex` so it disappears on mobile. Pages keep importing
  it (low blast radius); breadcrumbs already live in page `<main>`, so hierarchy
  context survives on mobile.

## What gets removed / replaced on mobile

- Topic page's fixed Prev/Next **FABs** (bottom-left) → replaced by bar Prev/Next.
- Add-resource **FAB** → desktop-only; mobile uses bar **+**.
- Add-topic **FAB** → desktop-only; mobile uses bar **+** (paper page).
- Header's mobile-only split-view button → moves into the Menu sheet.

Content bottom padding bumped on mobile (`pb-24` + safe-area) so the fixed bar
never overlaps the last row / existing FAB region.

## Data flow (topic page example)

1. `TopicPage` (server) already computes `prevTopic` / `nextTopic`. It passes them
   plus `topicId` to `<TopicNavConfig />` (client).
2. `TopicNavConfig` calls `setContext({ prev, next, primaryAction: openAddResource })`.
3. `BottomBar` reads context → renders ⟵ Prev, center +, Next ⟶ in the middle slots.
4. Tapping Prev/Next navigates via `next/link`; tapping + opens the add modal;
   tapping Menu opens the sheet.

## Error / edge handling

- Missing prev or next → that slot renders a disabled spacer (layout stays stable).
- No `primaryAction` on a page → center slot is empty; bar stays balanced.
- Sheet open + route change → close the sheet on `pathname` change.
- SSR/hydration → bar gates on a `mounted` flag (like Header/AddResourceButton do
  today) to avoid theme/admin flash.
- Body scroll lock while sheet open (reuse `MobileDrawer` approach); restore on close.
- Split-screen mobile drawer and the bottom bar must not both fight for the bottom
  edge — when the mobile split drawer (`MobileDrawer`) is open it covers full screen
  (`inset-0`), so the bar is visually behind it; acceptable. Confirm z-index order
  (drawer `z-50` > bar).

## Testing

- **Responsive**: header visible ≥ md and hidden < md; bottom bar the inverse.
- **Contextual slots**: home shows Home/Search/Menu; topic shows Prev/+/Next/Menu;
  paper shows + only with a custom unit; prev/next hidden at list ends.
- **Menu sheet**: opens/closes via tap, backdrop, Esc, route change; toggles theme
  and split view; user/admin actions match old header behavior.
- **+ action**: mobile bar + and desktop FAB open the same modal; submit works.
- **A11y**: focus trap in sheet, `aria-label`s on icon buttons, live region on open.
- **Safe area**: bar sits above the iOS home indicator (manual device/emulator).

## Out of scope (YAGNI)

- No swipe-between-topics gesture (Prev/Next buttons only).
- No bottom bar on desktop.
- No new persisted user settings.
- No redesign of page bodies, cards, or breadcrumbs beyond bottom padding.
