# Happy Girlfriend's Day 🩷

An interactive one-page site for Shivani — *Chellun Kutty*.

Everything is static: plain HTML, CSS and JavaScript with no build step, no
dependencies and no external requests (fonts and photos live in the repo), so it
runs as-is on GitHub Pages.

## What's in it

| Section | What happens |
| --- | --- |
| Envelope | A wax-sealed envelope you tap to open the page |
| Hero | Her name, and *நான் உன்னை காதலிக்கிறேன்* — "na unna kadhalikheren" |
| Letter | The note, next to a photo |
| தமிழ் | A flip card that turns over to the Tamil for "I love you" |
| Us | Nine photos, tap to open a lightbox (arrow keys and swipe work) |
| Reasons | Twelve hearts to tap, with a counter |
| Play | **Four in a Row** and **Othello** — see below |
| How much | A slider that refuses to stop at 100% |
| Forever | A heart that keeps count of taps |

### The games

**Four in a Row** is a real game of Connect Four, played against an opponent that
never wins and never blocks her. The board starts one move from a win and the
winning column is marked with an arrow. When she wins, every disc on the board
turns pink and the grid spells out **CHELLUN KUTTY I LOVE YOU**.

**Othello** is a real game of reversi — full legal-move and flipping rules, with
every legal square highlighted. The opponent avoids corners and edges and always
flips as little as it can get away with, so she wins. When the board fills up (or
via the *skip to the part where I tell you* button) every piece on the board
flips pink from the middle outwards, then settles into a heart.

## Publishing it

Push to GitHub, then **Settings → Pages → Source: Deploy from a branch**, and
pick the branch with the `/ (root)` folder. It goes live at
`https://<username>.github.io/Happy-Girlfriend-Day/`.

To run it locally:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Making it yours

Spots worth editing are marked with `✏️ EDIT ME` in the source:

- **The letter** — `index.html`, in the `#letter` section.
- **Your signature** — the `.sign` line in `index.html`.
- **Photo captions** — the `PHOTOS` array near the top of `assets/js/main.js`.
- **The twelve reasons** — the `REASONS` array in `assets/js/main.js`.

To swap a photo, drop the new file into `photos/` and point the matching entry in
`PHOTOS` at it. The images are already resized for the web; keep new ones under
about 1500px on the long edge.

## Layout

```
index.html
assets/
  css/style.css      the whole design
  css/fonts.css      self-hosted webfaces
  fonts/             woff2 subsets (latin + tamil)
  js/main.js         envelope, petals, gallery, reasons, extras
  js/connect4.js     Four in a Row
  js/othello.js      Othello
photos/              the nine photos
```
