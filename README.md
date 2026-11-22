# CityReads – Social Reading Community prototype (CP3405)

This is a clickable, coded prototype that builds on the CP2408 Lean UX work for the Social Reading Community. It covers the weekend sprint stories PB-01 to PB-04 and PB-08.

It uses plain HTML, CSS and JavaScript, with no build step and no install. Data is saved in the browser's `localStorage`, so each device keeps its own demo data.

## Live demo

https://eslezer.github.io/Cityreads/ (served by GitHub Pages from `main`, root folder)

## Run it

Double-click `index.html`. Or, to get the same behaviour as the team demo, serve the folder:

```
python -m http.server 8126
```

Then open http://localhost:8126.

Run the logic tests (Node 18+):

```
node tests/logic.test.js
```

## Backlog item → code

| ID | Story | Where in the code | How to see it |
|---|---|---|---|
| PB-01 | Join via QR **or** a short web link/code | `views.welcome`, `views.signup`, `readJoinParam` in `js/app.js`; `isValidJoinCode` in `js/logic.js` | Welcome screen: scan (simulated), type `READ26`, or open the link. All three reach the same sign-up screen |
| PB-02 | Browse and join pre-loaded starter clubs | `views.home`, `views.club` in `js/app.js`; clubs in `js/data.js` | Home → any club → **Join this club** (member count goes up by one) |
| PB-03 | Reading tracker with clear milestones and visuals | `views.reading`, `milestoneBar` in `js/app.js`; milestone rules in `js/logic.js` | Club → **Track this book**, or **My reading** → **Add a book**, then log pages |
| PB-04 | Earn badges for reading milestones | `refreshBadges`, `views.badges` in `js/app.js`; `BADGES`, `earnedBadges` in `js/logic.js` | Reach 25 / 50 / 75 / 100%: a toast appears and the badge unlocks on **Badges** |
| PB-08 | Adjust text size and contrast | `views.settings`, `applySettings` in `js/app.js`; `html[data-text]`, `html.hc` in `css/styles.css` | **Display** (top right) → Large / Extra large, High-contrast colours |

## Screenshots

| Story | Screen |
|---|---|
| PB-01 | [Welcome: three ways to join](screenshots/01-welcome-PB-01.png) · [Same sign-up screen after scanning the QR](screenshots/02-signup-same-screen-PB-01.png) |
| PB-02 | [Home with starter clubs](screenshots/03-home-starter-clubs-PB-02.png) · [Club page](screenshots/04-club-page-PB-02.png) |
| PB-03 | [Milestone tracker](screenshots/05-reading-milestones-PB-03.png) · [Tracker on a phone](screenshots/08-mobile-reading-PB-03.png) |
| PB-04 | [Badges as loyalty-card stamps](screenshots/06-badges-PB-04.png) |
| PB-08 | [High contrast + extra-large text](screenshots/07-high-contrast-large-text-PB-08.png) |

## Acceptance criteria checked

- **PB-01:** *Given* I don't have a QR scanner, *when* I enter the club code on the landing page, *then* I reach the same sign-up screen as the QR link. Codes are accepted in any case and with spaces or dashes (`read-26`). A wrong code shows a clear error.
- **PB-02:** Five starter clubs show on the home feed on first launch. Joining shows "Joined" on the card, and the club stays joined after a reload.
- **PB-03:** Each book shows four milestones (25%, 50%, 75%, 100%) with the page number for each, a progress bar with markers, and "Next milestone … N pages to go". A milestone is never shown as reached before its page. Page input is limited to 0 through the book's length.
- **PB-04:** Badges are awarded once and kept, even if a book is removed. Each new badge is announced, including to screen readers (`aria-live`).
- **PB-08:** Text size and contrast apply instantly across every screen, and they're saved on the device.

`tests/logic.test.js` automates the rules behind these criteria (12 checks). The screens were checked by hand at desktop width and phone width (375 px).

## Demo script for Monday (about 3 minutes)

1. Welcome: show the three ways to join, type `read-26`, then create a profile. The "Welcome aboard" badge appears.
2. Home: point out the starter clubs ("never feels empty") and the city updates (civic framing).
3. Open **Easy Reads Circle** → **Join this club** → **Track this book**.
4. **My reading**: press **+25 pages** a few times and watch the milestones tick off, with the next milestone and pages to go.
5. **Badges**: show what's earned and what's still locked.
6. **Display**: switch to Extra large text and high contrast.
7. Use **Display → Reset demo** to start again.

## Suggested commits (one per story)

```
PB-01: onboarding with QR, short code and web link (#1)
PB-02: home feed with starter clubs and club page (#2)
PB-03: reading tracker with milestone markers (#3)
PB-04: milestone badges and announcements (#4)
PB-08: text size and high-contrast settings (#5)
```

## Not in this prototype

- Real accounts and a server: everything is stored locally.
- A real, scannable QR code: the poster QR is a stand-in.
- PB-05 to PB-07 and PB-09 to PB-10 are planned for the final sprint (Huy's designs for PB-05 to PB-07).
- All clubs, places and updates are placeholder demo content.
