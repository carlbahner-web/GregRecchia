/* <vinyl-player>, the portfolio record player from StudioLand MGMT's profile pages, copied from studiolandmgmt-site
   (portfolio-player-kit/src/vinyl-player.js, 10 Nov 2026) for Greg's own site. Its drawings here are Greg's versions (vinyl/art/),
   not StudioLand's; its colours and fonts are set from the page.
   It now differs from the kit: three fixes Carl made to the record's movement on carlbahner.com (src/nav.mjs there) are
   carried over, each marked FROM CARLBAHNER below: the old record fades away on the deck rather than flying home, one
   record moves at a time, and no tap flash or touch-held hover slide on a phone ("can you look at the mechanics from
   the Carlbahner site repo? I fixed some quirks with the vinyl movement", Carl, 10 Nov 2026). And his deck from there:
   raised keys that press down, a raised knob, the title and artist on two lines in capitals that blur in once the record
   lands, the record and arm moved as he moved them (GREG'S DECK, at the end of the styles). */
/**
 * Styles for <vinyl-player>.
 *
 * Everything lives inside a shadow root, so these selectors can stay short and
 * cannot leak into (or be broken by) the host page's CSS.
 *
 * GEOMETRY NOTE
 * -------------
 * All turntable parts are positioned inside `.frame`, a *square* coordinate
 * space whose side length equals the plinth width. Using one square frame means
 * a percentage means the same physical distance horizontally and vertically,
 * which is what makes the tonearm rotation angles below correct at every size.
 *
 * Within that frame (units = % of frame side):
 *   platter centre .......... (35, 36), record radius 29, groove band 12 -> 27
 *   tonearm pivot ........... (85, 26)
 *   pivot -> spindle ........ 51.0
 *   effective arm length .... 53.0  (the usual ~1.035 overhang ratio)
 *
 * Solving the pivot/stylus triangle for a stylus sitting `r` from the spindle
 * gives the arm angles baked into `--arm-*` below: the lead-in groove (r=27)
 * needs -41.3deg and the run-out groove (r=12) needs -24.4deg. So the arm
 * sweeps *up* toward 0 as a side plays, exactly like a real one.
 *
 * At the rest angle (-62deg) the headshell sits at (60, 73) — clear of the
 * record, whose lowest point is y=65 — and the arm's centre line passes 39
 * units from the spindle, so a parked arm never crosses the disc.
 */
const styles = /* css */ `
:host {
  /* ---- Theming surface: override any of these from the host page ---- */
  --pp-bg:        #fcf7e8;
  --pp-panel:     #F1E9D6;
  --pp-line:      #2C2C2A;
  --pp-text:      #2C2C2A;
  --pp-muted:     #6E7A74;
  --pp-accent:    #BF7538;
  --pp-plinth-1:  #3A6168;
  --pp-plinth-2:  #3A6168;
  --pp-vinyl-1:   #2C2C2A;
  --pp-vinyl-2:   #2C2C2A;
  --pp-radius:    10px;
  /* How far to zoom into the artwork for the record label. Set to 1 when a
     track supplies its own purpose-made 'label' image. */
  --pp-label-zoom: 1.9;
  --pp-font:      'DWFairfield', 'Arial Narrow', sans-serif;
  --pp-font-body: 'TAYWingman', 'Segoe UI', system-ui, sans-serif;

  /* ---- Tonearm angles (see geometry note above) ---- */
  --arm-rest:  -62deg;   /* parked on the armrest        */
  --arm-start: -41.3deg; /* stylus in the lead-in groove */
  --arm-end:   -24.4deg; /* stylus in the run-out groove */
  --arm-angle: var(--arm-rest);

  /* ---- Live state, driven from JS ---- */
  --lift: 0;             /* 0 = stylus down, 1 = cued/lifted */

  display: block;
  color: var(--pp-text);
  font-family: var(--pp-font-body, var(--pp-font));
  -webkit-font-smoothing: antialiased;
  /* NAMED, and the name is load-bearing. An anonymous @container query resolves
     against the nearest container ANCESTOR OF THE ELEMENT BEING STYLED -- so the
     moment .deck and .shelf-col became containers of their own, a bare
     "(max-width: 720px)" stopped meaning "the player is narrow" for anything
     inside them and started meaning "this box is narrow", which is true of the
     crate at every width. Ask for the player by name. */
  container-type: inline-size;
  container-name: player;
}

:host([hidden]) { display: none; }

*, *::before, *::after { box-sizing: border-box; }

.pp {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr);
  /* CEILING RAISED 48px -> 56px. Carl: "the second column feels much closer to
     the first column than it does to the deck" -- measured, the crate-to-deck
     gap (47px) and the sleeve-to-sleeve gap (10px) were nearly 5x apart, so the
     two sleeve columns read as one tight group and the deck as a separate,
     distant thing. Raising this gap's ceiling and .shelf's gap floor together
     (see .shelf below) brings that ratio down to about 3.4x -- still a bigger
     jump to the deck than between sleeves, which is correct, just not so wide
     it reads as disconnected. */
  gap: clamp(20px, 4.6cqi, 56px);
  /* STRETCH, not start. Carl: "the bottom of the bottom sleeves should be at
     the same y-axis height as the bottom of the deck." With align-items:start
     the crate is only ever as tall as its own rows, so once the deck (the
     taller column most of the time) exceeds it, every pixel of that
     difference becomes dead air under the sleeves. Stretching hands the
     crate the row's full height; .shelf then spends it -- see align-content
     below. */
  align-items: stretch;
  padding: clamp(16px, 3cqi, 32px);
  background: var(--pp-bg);
  border: 1px solid var(--pp-line);
  border-radius: var(--pp-radius);
}

/* The crate reads left, the deck right — so the record peeks out of its sleeve
   toward the deck and flies the short way across. Done with order, not markup,
   so the deck keeps its place in the DOM for tab order and screen readers. */
/* THE CRATE IS ITS OWN CONTAINER, for the same reason the deck is. The sleeve
   grid sizes its tracks in cqi, and cqi resolves against the nearest container
   -- which was the whole player, while the grid itself only occupies about 40%
   of it. Between 721px and 860px of player that meant a minimum track of 150px
   inside a 276px column: two tracks plus the gap came to 311px, so auto-fill
   dropped to ONE sleeve per row and the crate became a 2000px tower. Measured,
   the whole player went 1168px tall at 700 wide and 2235px tall at 800 wide.
   Measuring against the crate makes the tracks answerable to the box they are
   actually in. */
.shelf-col { order: 1; container-type: inline-size; }
.deck-col  { order: 2; }
/* Wraps .shelf. In embed mode this is what scrolls, NOT .shelf-col -- see the
   note on :host([embed]) .shelf-scroll below for why that split exists. */
.shelf-scroll { display: block; height: 100%; min-height: 0; }

/* Single column once there isn't room for deck + shelf side by side. Stacked,
   the deck goes back on top: it is the thing you have come to look at, and there
   is no leftward flight to rationalise once they are above one another. */
@container player (max-width: 720px) {
  .pp { grid-template-columns: minmax(0, 1fr); }
  .deck-col  { order: 1; }
  .shelf-col { order: 2; }
}

/* ==========================================================================
   Turntable
   ========================================================================== */

.deck {
  position: relative;
  width: 100%;
  /* Plinth is 82% as tall as it is wide — deep enough that the parked tonearm
     (headshell at y=73) stays on the plinth. The square frame overhangs below
     it, but nothing is drawn down there and it is pointer-transparent. */
  aspect-ratio: 1 / 0.82;
}

.plinth {
  position: absolute;
  inset: 0;
  border-radius: calc(var(--pp-radius) + 4px);
  background:
    linear-gradient(148deg, var(--pp-plinth-1) 0%, var(--pp-plinth-2) 72%),
    var(--pp-plinth-2);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    inset 0 -1px 0 rgba(0, 0, 0, 0.6),
    0 24px 48px -24px rgba(0, 0, 0, 0.9);
}

/* Square coordinate frame — the reason the arm maths works.
   It clips, because .tonearm is a full-square box rotated about a point near
   its corner: every visible arm part stays well inside the square, but the
   rotated *box* sweeps far outside it and would otherwise scroll the page
   sideways on narrow screens. */
.frame {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  aspect-ratio: 1;
  pointer-events: none;
  overflow: hidden;
}

/* ---- Platter ------------------------------------------------------------ */

.platter {
  position: absolute;
  left: 6%;    /* centre (35, 36), radius 29 */
  top: 7%;
  width: 58%;
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 50%, #2a2622 0 62%, #201d1a 62% 100%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 6px 18px rgba(0, 0, 0, 0.75),
    0 2px 0 rgba(255, 255, 255, 0.03);
}

/* The record itself. Sized to the platter and spun by JS. */
.disc {
  position: absolute;
  inset: 1.5%;
  border-radius: 50%;
  opacity: 0;
  /* NO TRANSITION. The flier and this element are the same drawing at the same
     place; the swap between them has to happen in ONE frame. With a 160ms fade
     the flier was removed while this was still transparent, so the record
     blinked out of existence on arrival and faded back in -- and on the way out
     both were visible at once. Carl: "flickering in and out of existence." */
  will-change: transform;
}

.disc[data-loaded="true"] { opacity: 1; }

/* Fixed highlight that does NOT rotate with the record, so the record reads as
   spinning underneath a light source rather than carrying its own glare. */
.sheen {
  position: absolute;
  inset: 1.5%;
  border-radius: 50%;
  pointer-events: none;
  opacity: 0;
  transition: opacity 200ms linear;
  background:
    conic-gradient(from 205deg at 50% 50%,
      rgba(255, 255, 255, 0.00) 0deg,
      rgba(255, 255, 255, 0.10) 26deg,
      rgba(255, 255, 255, 0.00) 62deg,
      rgba(255, 255, 255, 0.00) 180deg,
      rgba(255, 255, 255, 0.07) 210deg,
      rgba(255, 255, 255, 0.00) 250deg);
  mix-blend-mode: screen;
}

.disc[data-loaded="true"] ~ .sheen { opacity: 1; }

.spindle {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 2.4%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: linear-gradient(145deg, #d9d4cc, #6f6a63);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.55), 0 1px 3px rgba(0, 0, 0, 0.6);
}

/* ---- The vinyl graphic (shared by platter + flying record) --------------- */

.vinyl {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    /* groove bands */
    repeating-radial-gradient(circle at 50% 50%,
      rgba(255, 255, 255, 0.055) 0 1px,
      rgba(0, 0, 0, 0.00) 1px 3px),
    /* land / lead-in / run-out shading */
    radial-gradient(circle at 50% 50%,
      #12100f 0 19%,
      #0d0c0b 19% 21%,
      var(--pp-vinyl-1) 21% 92%,
      var(--pp-vinyl-2) 92% 100%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.06),
    0 6px 18px -6px rgba(0, 0, 0, 0.8);
}

.vinyl-label {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 38%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  overflow: hidden;
  background: #241f1b;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.5);
}

/* The label defaults to the sleeve art. Both are square, so object-fit alone
   would shrink the *whole* cover into the circle — title text and all — which
   reads as a tiny album cover rather than a record label. Zooming in crops to
   the middle of the artwork instead. Supply a dedicated 'label' image in the
   track and set --pp-label-zoom: 1 to show it whole. */
.vinyl-label img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transform: scale(var(--pp-label-zoom, 1.9));
}

/* Spindle hole punched through the label. */
.vinyl-hole {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 6%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: #050505;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}

/* ---- Tonearm ------------------------------------------------------------ */

.tonearm {
  position: absolute;
  inset: 0;
  transform: rotate(var(--arm-angle));
  transform-origin: 85% 26%;   /* the pivot */
  transition: transform 900ms cubic-bezier(0.33, 0.02, 0.2, 1);
  pointer-events: none;
}

/* While a side plays, JS drives --arm-angle every frame; a long CSS transition
   would fight that, so tracking mode drops to a short smoothing transition. */
.tonearm[data-tracking="true"] { transition: transform 220ms linear; }

.arm-pivot {
  position: absolute;
  left: 85%;
  top: 26%;
  width: 7%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: linear-gradient(150deg, #4a443d, #221f1c);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 3px 8px rgba(0, 0, 0, 0.6);
}

/* Tube runs left from the pivot to the headshell (length 53% of the frame). */
.arm-tube {
  position: absolute;
  left: 32%;         /* 85 - 53 */
  top: 26%;
  width: 53%;
  height: 1.5%;
  transform: translateY(-50%);
  border-radius: 2px;
  background: linear-gradient(180deg, #cfc9c0, #8a847c 45%, #4d4843);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.55);
}

/* Counterweight sits behind the pivot. */
.arm-weight {
  position: absolute;
  left: 92%;
  top: 26%;
  width: 8%;
  height: 5%;
  transform: translate(0, -50%);
  border-radius: 3px;
  background: linear-gradient(180deg, #3a3530, #171412);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 2px 6px rgba(0, 0, 0, 0.6);
}

.headshell {
  position: absolute;
  left: 32%;
  top: 26%;
  width: 8%;
  height: 4.2%;
  /* The lift raises the whole headshell a touch when cued. */
  transform: translate(-42%, calc(-50% - (var(--lift) * 1.6%)));
  transition: transform 260ms cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 2px 3px 3px 2px;
  background: linear-gradient(180deg, #3e3934, #1b1917);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 3px 7px rgba(0, 0, 0, 0.65);
}

.stylus {
  position: absolute;
  left: 14%;
  bottom: -46%;
  width: 10%;
  height: 52%;
  background: linear-gradient(180deg, #bdb6ac, #6d675f);
  clip-path: polygon(0 0, 100% 0, 62% 100%, 38% 100%);
}

/* Armrest the tonearm parks on. Like a real one it cradles the arm *tube*
   about 38 units out from the pivot, not the overhanging headshell, and it is
   rotated to lie along the parked arm. */
.armrest {
  position: absolute;
  left: 67.2%;
  top: 59.6%;
  width: 10%;
  height: 3.4%;
  transform: translate(-50%, -50%) rotate(-62deg);
  border-radius: 4px;
  background: linear-gradient(180deg, #4b443c, #221e1b);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 3px 7px rgba(0, 0, 0, 0.6);
}

/* ---- Plinth furniture --------------------------------------------------- */

/* Positioned against the plinth, not the square frame — the frame overhangs
   below the deck and would drop this into the transport panel. */


/* Strobe dots around the platter rim — a real turntable tell. */
.strobe {
  position: absolute;
  inset: -2.5%;
  border-radius: 50%;
  pointer-events: none;
  background: repeating-conic-gradient(from 0deg,
    rgba(216, 135, 63, 0.55) 0deg 1.1deg,
    rgba(0, 0, 0, 0) 1.1deg 5deg);
  -webkit-mask: radial-gradient(circle, transparent 0 96%, #000 96% 100%);
          mask: radial-gradient(circle, transparent 0 96%, #000 96% 100%);
  opacity: 0.45;
}

/* ==========================================================================
   Now playing
   ========================================================================== */

.np-title {
  font-size: clamp(14px, 2.4cqi, 17px);
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.np-meta {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--pp-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---- Buttons ------------------------------------------------------------ */

button {
  font: inherit;
  color: inherit;
  border: 1px solid var(--pp-line);
  background: #201d19;
  border-radius: 10px;
  padding: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease, transform 80ms ease;
}

button:hover:not(:disabled)  { background: #2a2620; border-color: #3a352d; }
button:active:not(:disabled) { transform: translateY(1px); }
button:disabled              { opacity: 0.35; cursor: default; }

button svg { width: 18px; height: 18px; display: block; fill: currentColor; }

.play {
  background: var(--pp-accent);
  border-color: var(--pp-accent);
  color: #17120c;
  padding: 10px;
}

.play:hover:not(:disabled) { background: #e59a52; border-color: #e59a52; }
.play svg { width: 20px; height: 20px; }

.spacer { flex: 1 1 auto; }

.toggle[aria-pressed="true"] {
  border-color: var(--pp-accent);
  color: var(--pp-accent);
}

/* Volume */


.vol input[type="range"]::-moz-range-track {
  height: 4px;
  border-radius: 999px;
  background: #2a2620;
}
.vol input[type="range"]::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--pp-text);
  border: none;
}

/* ==========================================================================
   Shelf of sleeves
   ========================================================================== */

.shelf {
  display: grid;
  /* Retuned for the crate rather than the player: 22cqi of the whole thing is
     about 34cqi of the column it lives in. The FLOOR and the CEILING stay where
     they were, and both are load-bearing:

       112px floor   the narrowest crate is 244px wide -- the player's own
                     padding takes 36px off a 280px embed -- and two tracks plus
                     the gap below have to fit inside that. 120 does not; 112
                     does. Solving against the player's width instead of the
                     column's is what produced a six-row tower.
       150px ceiling holds the single-column crate at four sleeves across on a
                     tablet, which is what it did before any of this. */
  grid-template-columns: repeat(auto-fill, minmax(clamp(112px, 34cqi, 150px), 1fr));
  /* -- and see the override directly below, which has to sit AFTER this rule:
     same specificity, so source order is what decides, and in the block up top
     it was quietly losing.

     FLOOR RAISED 10px -> 16px, CEILING LEFT AT 18px -- see .pp's gap above for
     why. 112 * 2 + 16 = 240, still inside the 244px narrowest crate with 4px
     to spare (was 10px spare at the old 10px floor); the ceiling was already
     proven safe there (112 * 2 + 18 = 242) so it's untouched. */
  gap: clamp(16px, 1.6cqi, 18px);
  margin: 0;
  padding: 0;
  list-style: none;
  /* .shelf-col now stretches to the deck's height (see .pp); spend that height
     rather than leaving it as dead air below the sleeves.

     space-between was the first attempt -- flush top, flush bottom -- but with
     only two rows that put the WHOLE leftover height into the one gap between
     them: measured, an 86px gap between rows against a 10px gap between
     columns, which is exactly the "funky" Carl flagged. space-evenly fixed
     that by splitting the leftover into three equal shares (above the first
     row, between the rows, below the last) instead of dumping it all in one
     place, but it was still a SEPARATE gap from the column gap -- 35px between
     rows against 10px between columns, still visibly uneven once the row gap
     itself was looked at rather than just measured against the deck.

     CENTER, with the gap above now doing double duty as both row and column
     gap: the leftover height splits into exactly two shares, above the first
     row and below the last, and nothing sits between the rows beyond the same
     gap already used between columns. Whatever asymmetry remains is between
     that shared row/column gap and the .pp gap to the deck, which is the
     intentional, larger jump -- see .pp above. */
  height: 100%;
  align-content: center;
}

/* STACKED, THE CRATE IS THE WHOLE WIDTH, so the fraction that sizes its tracks
   has to be a different one. 34cqi is tuned for a crate that is about 36% of the
   player; applied to a full-width crate it gives half as many sleeves at half
   again the size, and a page 46% taller at 420px. 22cqi is what this layout used
   before the crate became a container. */
@container player (max-width: 720px) {
  .shelf { grid-template-columns: repeat(auto-fill, minmax(clamp(112px, 22cqi, 150px), 1fr)); }
}

.sleeve {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  border-radius: 3px;
  cursor: pointer;
  text-align: left;
  /* The peeking record is drawn outside the sleeve's box. */
  overflow: visible;
}

/* These are <span>s inside a <button>; without display:block they stay inline,
   where aspect-ratio does not apply and the whole sleeve collapses to nothing. */
.sleeve-stack {
  display: block;
  position: relative;
  aspect-ratio: 1;
  border-radius: 3px;
}

/* Record poking out of the sleeve on hover. */
.sleeve-peek {
  display: block;
  position: absolute;
  inset: 3% 3% 3% 3%;
  border-radius: 50%;
  transform: translateX(0) rotate(0deg);
  transition: transform 420ms cubic-bezier(0.22, 0.8, 0.3, 1);
  z-index: 0;
}

/* NO ROTATION, for the same reason the flight has none: a record coming out of
   a sleeve slides, it does not tilt. This is now the whole hover -- the artwork
   holds still and the record is the only thing that moves. */
/* FROM CARLBAHNER (index.html there, NO TAP FLASH): under a mouse only. A finger's tap left a phone's hover on, so
   the record jumped out of its sleeve before it flew; and the browser's own pale tap box flashed over the sleeve:
   "there is a quick white flash/glitch when selecting a vinyl", "On the sleeve", "Phone" (Carl, 9 Nov 2026). */
@media (hover: hover) { .sleeve:hover .sleeve-peek { transform: translateX(30%); } }
.sleeve:focus-visible .sleeve-peek { transform: translateX(30%); }
:host { -webkit-tap-highlight-color: transparent; }

.sleeve[data-state="deck"] .sleeve-peek { opacity: 0; transition: none; }
/* a sleeve whose record is fading away on the deck reads as empty until it has gone (FROM CARLBAHNER, A RECORD
   FADES AWAY) */
.sleeve[data-state="flying"] .sleeve-peek { opacity: 0; transition: none; }

.sleeve-art {
  display: block;
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: 3px;
  overflow: hidden;
  background: #1c1916;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.06) inset,
    0 10px 22px -12px rgba(0, 0, 0, 0.95);
  transition: transform 300ms cubic-bezier(0.22, 0.8, 0.3, 1), box-shadow 300ms ease;
}

.sleeve-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Spine shading so the square reads as a printed cardboard sleeve. */
.sleeve-art::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(0, 0, 0, 0.42) 0, rgba(0, 0, 0, 0) 7%),
    linear-gradient(200deg, rgba(255, 255, 255, 0.10) 0, rgba(255, 255, 255, 0) 42%);
}

/* The artwork does not move on hover. Its frame, face and hard shadow are drawn
   by the boiling SVG on the .sleeve element itself, which does NOT move, so
   shifting the art inside it slid the picture out of its own card. The record
   sliding out is the whole hover. */

.sleeve-meta {
  display: block;
  margin-top: 8px;
  min-width: 0;
}

.sleeve-title {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sleeve-sub {
  display: block;
  font-size: 11px;
  color: var(--pp-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* The sleeve whose record is currently on the deck reads as empty. */
.sleeve[data-state="deck"] .sleeve-art {
  filter: saturate(0.25) brightness(0.5);
}

.sleeve[data-state="deck"] .sleeve-art::before {
  content: "ON THE DECK";
  position: absolute;
  inset: auto 0 0 0;
  z-index: 2;
  padding: 5px 6px;
  font-size: 9px;
  letter-spacing: 0.14em;
  text-align: center;
  color: var(--pp-accent);
  background: rgba(0, 0, 0, 0.6);
}

:where(button, .sleeve):focus-visible {
  outline: 2px solid var(--pp-accent);
  outline-offset: 3px;
}

/* ==========================================================================
   Flight layer — the record travelling from sleeve to platter
   ========================================================================== */

/* TWO LAYERS, AND THE SPLIT IS THE WHOLE POINT.
   .flight is fixed to the viewport and NEVER moves: it is the clipper, and it is
   what keeps a record mid-flight from adding scrollbars to the host page.
   .flight-pan sits inside it and carries the page's scroll offset, so everything
   in it is positioned in DOCUMENT coordinates and travels with the page.

   Carl: "when a sleeve is mid-animation, if I scroll the images awkwardly get
   frozen in place on my browser while the rest of the page scrolls beneath it."
   They did: the fliers were position:fixed in viewport coordinates captured at
   the instant the flight began, so a scroll left them hanging in space.

   Both ENDS of a flight are in the document — the crate and the deck — so the
   fix is not to chase them individually but to move the layer they live in. */
.flight {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  pointer-events: none;
  /* A record mid-flight must never add scrollbars to the host page. */
  overflow: hidden;
  /* Hidden from AT: it is pure decoration mid-transition. */
}

.flight-pan {
  position: absolute;
  inset: 0;
}

/* absolute, not fixed: they live in .flight-pan now, in document coordinates */
.flier {
  position: absolute;
  border-radius: 50%;
  will-change: transform;
}

.flier-sleeve {
  position: absolute;
  border-radius: 3px;
  overflow: hidden;
  box-shadow: 0 24px 50px -20px rgba(0, 0, 0, 0.95);
  will-change: transform;
}

.flier-sleeve img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* ==========================================================================
   Status / errors
   ========================================================================== */

.status {
  margin-top: 10px;
  font-size: 12px;
  color: var(--pp-muted);
  min-height: 1em;
}

.status[data-error="true"] { color: #e2725b; }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

/* ==========================================================================
   Reduced motion — keep the mechanism, drop the travel
   ========================================================================== */

@media (prefers-reduced-motion: reduce) {
  .tonearm,
  .headshell,
  .sleeve-art,
  .sleeve-peek { transition-duration: 1ms !important; }
  .strobe { display: none; }
}

/* ==========================================================================
   ==  THE INK LAYER  ======================================================
   Everything above draws a real turntable: gradients for curved metal, blurred
   shadows for depth, an inset highlight on every lip. That is a photograph of a
   deck. BUZZ is a DRAWING of one — so this layer flattens all of it and puts a
   pen round the outside.

   Three rules, taken off the game's own frames and applied without exception:
     1. one flat fill per shape,
     2. one ink weight round every shape,
     3. one hard shadow throw, never blurred.
   ========================================================================== */

/* ---- 1. STRIP THE PHOTOGRAPH ------------------------------------------- */
/* Every one of these carried a blurred shadow and/or an inset highlight. There
   is not a single blurred edge anywhere in the game, so there is none here. */
.pp, .plinth, .platter, .disc, .vinyl, .vinyl-label, .vinyl-hole, .spindle,
.arm-pivot, .arm-tube, .arm-weight, .headshell, .armrest, .transport,
.sleeve-art, .flier-sleeve, button, .scrub-track {
  box-shadow: none;
}
/* Gloss and machine-shop tells: a conic-gradient strobe and a screen-blended
   sheen belong to the render, not the drawing. */
.sheen, .strobe { display: none; }

/* ---- 2. THE BOARD ------------------------------------------------------ */
/* The player is one printed board hung on the dark wall — same relationship the
   game's cream panels have with its charcoal curtain. Its frame, face and hard
   shadow are drawn by the boiling SVG, so the element itself paints nothing. */
.pp {
  background: transparent;
  --face: var(--pp-board, #fcf7e8);
  --stroke: var(--pp-ink, #2C2C2A);
  --shadow: #1A1A18;
  padding: clamp(18px, 3cqi, 30px);
}
/* the paper's grain rides in its own layer so the SVG face stays flat colour */
.pp::before {
  content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
  border-radius: var(--pp-radius);
  background-image: var(--pp-grain, none);
  background-size: var(--pp-grain-size, 512px) var(--pp-grain-size, 512px);
}

/* ---- 3. THE DECK ------------------------------------------------------- */
.plinth {
  background: var(--art-plinth, none) center / cover no-repeat, var(--pp-teal, #3A6168);
  border: var(--pp-ink-w, 3px) solid var(--pp-ink, #2C2C2A);
  border-radius: 12px;
  box-shadow: 7px 7px 0 var(--pp-ink, #2C2C2A);   /* hard, solid, no blur */
}
.plinth::after {           /* grain, over the flat teal */
  content: ""; position: absolute; inset: 0; border-radius: 9px;
  background-image: var(--pp-grain, none);
  background-size: var(--pp-grain-size, 512px) var(--pp-grain-size, 512px);
}

/* The platter is a flat mat with a pen round it — not a dished casting. */
.platter {
  background: var(--art-platter, none) center / cover no-repeat, #2F5259;
  border: var(--pp-ink-w, 3px) solid var(--pp-ink, #2C2C2A);
}

/* The record: flat charcoal, an ink outline, and CONCENTRIC RINGS DRAWN AS
   LINES. The original used dense noise to fake groove texture; drawn grooves
   are a handful of even hairlines, which is what the game's own record art
   does. */
.vinyl {
  background:
    var(--art-record, none) center / cover no-repeat,
    repeating-radial-gradient(circle at 50% 50%,
      rgba(252,247,232,0.22) 0 1px, rgba(0,0,0,0) 1px 9px),
    #23231F;
  border: var(--pp-ink-w, 3px) solid var(--pp-ink, #2C2C2A);
}
/* Mustard label with a pen round it — the game's record and token art exactly. */
.vinyl-label {
  background: var(--art-label, none) center / cover no-repeat, var(--pp-mustard, #F6CC60);
  border: 2px solid var(--pp-ink, #2C2C2A);
}
.vinyl-hole { background: var(--pp-ink, #2C2C2A); }
.spindle {
  background: var(--pp-cream, #fcf7e8);
  border: 2px solid var(--pp-ink, #2C2C2A);
}

/* ---- 4. THE ARM, as four inked shapes ---------------------------------- */
.arm-tube {
  height: 2.6%;
  background: var(--pp-cream, #fcf7e8);
  border: 2px solid var(--pp-ink, #2C2C2A);
  border-radius: 3px;
}
.arm-pivot   { background: var(--pp-cream, #fcf7e8);
               border: var(--pp-ink-w, 3px) solid var(--pp-ink, #2C2C2A); }
.arm-weight  { background: var(--pp-ink, #2C2C2A); border-radius: 3px; }
.headshell   { background: var(--pp-ink, #2C2C2A); border-radius: 2px 3px 3px 2px; }
.stylus      { background: var(--pp-ink, #2C2C2A); }
.armrest     { background: var(--pp-ink, #2C2C2A);
               border: 2px solid var(--pp-ink, #2C2C2A); border-radius: 4px; }

.badge { color: var(--pp-cream, #fcf7e8); font-family: var(--pp-font-body);
         font-weight: 700; letter-spacing: .16em; }
.badge b { font-family: var(--pp-font); color: var(--pp-mustard, #F6CC60);
           font-size: 1.3em; letter-spacing: 0; }

/* ---- 5. TRANSPORT, WHICH LIVES ON THE DECK ----------------------------- */
/* Carl: "Can we fit a play button, stop button, and the artist/title text in
   the space below?" — so the panel that used to sit under the deck is gone and
   the transport is printed on the plinth itself, in the band of bare teal
   between the mat and the bottom of his keyline.

   ONE OBJECT, NOT TWO. A separate cream card under the deck read as a second
   printed thing that happened to be nearby; a deck with its controls ON it is
   one drawing. It is also what the band is FOR — every real plinth carries its
   buttons and its type down there.

   TWO BUTTONS AND A TITLE IS THE WHOLE TRANSPORT NOW. The scrubber, the two
   clocks and prev/next went with the panel: seeking was the panel's reason to
   exist, and the crate on the left is how you change record.

   THE DECK IS ITS OWN CONTAINER, and that is the whole reason this row keeps
   its shape. Carl: "your buttons and text is awkwardly spaced, and is even
   spaced differently in landscape vs portrait." It was, and the cause was that
   every size in here was measured against the WRONG thing:

     - cqi resolves against the nearest container, which was the whole player.
       In two columns the player is ~1180 wide and the deck is ~610; stacked,
       the player IS the deck. So the same declaration produced a 21px title on
       one and a 15px title on the other, against decks that were not that
       different in size. Type and gaps drifted apart from the deck they sit on.
     - and where cqi could not stretch far enough I had reached for a breakpoint,
       which made the row physically jump to a different inset and a different
       band height at 430px. That IS the landscape-versus-portrait difference he
       is looking at: two layouts, not one.

   Making .deck a container fixes both at the root. Every length below is now a
   percentage of the DECK, so the row is the same drawing at every size — it just
   gets bigger. No breakpoint, and nothing to keep in sync. */
.deck { container-type: inline-size; }

.onDeck {
  position: absolute; z-index: 3;
  left: 8%; right: 8%; bottom: 9%;   /* the fallback deck; the plinth rule below owns the real one */
  display: flex; align-items: center;
  gap: clamp(7px, 2.4cqi, 18px);
}
/* PLAY AND STOP ARE A PAIR; THE TITLE IS NOT PART OF IT. Carl, asked which of
   sizing and spacing looked mathematical rather than looked-at: the gap
   between the two buttons. It was the same number as the gap from the button
   pair to the text -- .onDeck had one gap for three items, so nothing marked
   play and stop as belonging to each other more than either belongs to the
   title next to it. A control pair and its label are not the same
   relationship, so they should not share a value just because the CSS made
   that easy. .controls is its own flex row with its own, tighter gap; .onDeck
   keeps its wider one for the space after the pair, which is now doing one
   job instead of two. */
.controls { display: flex; align-items: center; flex: none;
            gap: clamp(4px, 1.2cqi, 9px); }
/* FLEX-BASIS ZERO, NOT AUTO, and that is the whole fix for the scrunch. Carl:
   "the play/stop/text scrunches depending on how long the text is." With
   flex: 1 1 auto this item's base size is its CONTENT width, so a long title
   made the row overflow and every flexible item shrank in proportion -- the
   buttons included. Measured, a 77-character title took the play button from
   48.8px down to 23.3px.

   Basis 0 means the text asks for no width of its own and simply takes what is
   left after the buttons, so the buttons never enter the negotiation. min-width:
   0 is still needed alongside it or the ellipsis never fires: a flex item will
   not shrink below its content's minimum without it. */
.np { flex: 1 1 0; min-width: 0; }
/* An empty status still occupied a line, which on a phone-width deck is a
   third of the band -- it shoved the title and the artist up off the buttons
   and over the mat's edge. It only has something to say when something has
   gone wrong. */
.status:empty { display: none; }

/* THE BUTTONS SCALE WITH THE DECK TOO, which is the other half of the fix. A
   band measured in percent and a button measured in pixels stop agreeing the
   moment the deck changes size: 44px is a third of the band on a phone and a
   sixth of it on a desktop, so the row could not be centred the same way twice.
   Sized off the deck they always sit the same, and the band never has to move.

   The floor is 30px, not 44. 44 is the AAA target size; AA asks for 24, and 30
   clears it — which is the right trade when the alternative is a button taking
   up a seventh of the whole deck on a phone, as it was doing.

   Play stays the larger of the two, exactly as before: the glyph is half the
   button's width in both, so they are one drawing at two sizes.

   BUT NOT ONLY A HAIR LARGER. Shown three renders -- current, the two the
   same size, and stop shrunk further -- Carl: "bigger difference is the
   move." At 26px vs 30px stop read as 87% of play, close enough to look like
   an inconsistency rather than a choice; shrunk to 22px it reads at 73%, a
   gap unambiguous enough that nobody has to wonder whether it was on
   purpose. */
/* flex: none -- a control is a fixed object, not something that gives way to a
   long title. Its size is already answerable to the deck through cqi. */
.controls button { flex: none; padding: 0; border-radius: 22%;
                    width: clamp(22px, 5.8cqi, 36px); height: clamp(22px, 5.8cqi, 36px); }
.controls .play  { width: clamp(30px, 8cqi, 50px);  height: clamp(30px, 8cqi, 50px); }
.controls button > svg:not(.boil) { width: 50%; height: 50%; }

/* THE PROGRESS BAR, DRAWN AS A TROUGH. Carl, on the strip below the row: "The
   progress bar you had before, would it fit here?" It does, and it is the only
   part of the old panel worth bringing back — the two clocks are gone for good
   (this IS the clock), and so is the buffered fill, which had nothing to say
   about an audio file that ships inside the page and is buffered before it can
   be painted.

   Cream trough, one ink weight round it, flat rust fill. The knob is the game's
   mustard token and it is scaled to nothing until you actually reach for the
   bar — at rest this is a drawn line, which is exactly what Carl sketched.

   .scrub is a TALL INVISIBLE HIT AREA and .scrub-track is the thin drawn thing
   inside it, so the bar can be a hairline and still be grabbable. Both are sized
   in percentages of the deck, like everything else in this band. */
.scrub { position: absolute; z-index: 3; left: 8%; right: 8%; bottom: 1%; height: 6%;
         display: flex; align-items: center; cursor: pointer; touch-action: none; }
.scrub[aria-disabled="true"] { cursor: default; opacity: .4; }
.scrub-track { position: relative; width: 100%; height: 22%; overflow: hidden;
               border-radius: 999px;
               background: var(--pp-cream, #fcf7e8);
               /* the same pen as the buttons (2.5px on a desktop deck), scaled
                  so the trough is not the one thing outlined more finely than
                  everything round it */
               border: clamp(2px, 0.42cqi, 3px) solid var(--pp-ink, #2C2C2A); }
.scrub-played { position: absolute; inset: 0 auto 0 0; width: 0;
                border-radius: 999px; background: var(--pp-accent, #BF7538); }
/* translate(-50%) rather than a negative margin: the knob's width is clamped at
   both ends, so a margin in cqi would stop being half of it the moment either
   clamp bit, and the knob would drift off the position it is reporting. */
.scrub-knob { position: absolute; top: 50%; left: 0; aspect-ratio: 1;
              width: clamp(11px, 2.6cqi, 17px);
              border-radius: 50%; box-shadow: none;
              background: var(--pp-mustard, #F6CC60);
              border: clamp(2px, 0.42cqi, 3px) solid var(--pp-ink, #2C2C2A);
              transform: translate(-50%, -50%) scale(0);
              transition: transform 140ms ease; }
.scrub:hover .scrub-knob,
.scrub:focus-visible .scrub-knob,
.scrub[data-dragging="true"] .scrub-knob { transform: translate(-50%, -50%) scale(1); }

/* CREAM TYPE ON THE TEAL, WHICH IS THE GAME'S OWN VOCABULARY, not a new one:
   the speed badge that used to sit in this band did exactly this, and so does
   every stat the game prints straight onto its charcoal curtain. The ink-on-
   paper pairing is for the crate, which IS paper. */
.np-title { font-family: var(--pp-font); font-weight: 400; letter-spacing: .01em;
            font-size: clamp(13px, 3.4cqi, 24px); color: var(--pp-cream, #fcf7e8);
            line-height: 1.15; }
.np-meta  { font-family: var(--pp-font-body); font-weight: 700;
            font-size: clamp(9px, 1.8cqi, 13px); margin-top: 0.25em;
            letter-spacing: .14em; text-transform: uppercase;
            color: var(--pp-mint, #BFCDC0); line-height: 1.2; }

/* ---- 6. BUTTONS: the game's button, exactly ---------------------------- */
/* mustard or cream face, pen outline, hard offset, charcoal glyph. The face is
   drawn by the SVG so its edge boils; the element only carries the glyph. */
button { background: transparent; border: 0; border-radius: 8px; padding: 9px;
         color: var(--pp-ink, #2C2C2A);
         --face: var(--pp-cream, #fcf7e8);
         --stroke: var(--pp-ink, #2C2C2A);
         --shadow: var(--pp-ink, #2C2C2A);
         --throw: 3px; --ink-w: 2.5px;
         transition: transform 80ms ease; }
button:hover:not(:disabled)  { background: transparent; --face: #FFFDF5; }
/* pressing pushes the face down ONTO its own shadow, the way a printed button
   behaves — no easing into a lighter tint */
button:active:not(:disabled) { transform: translate(3px, 3px); --throw: 0px; }
/* DISABLED IS A PALER PRINT, NOT A SEE-THROUGH ONE. opacity:.45 let the teal
   deck show through a mustard face and the result was olive -- a colour that is
   in neither palette, showing for the three seconds a record is in flight. Flat
   fills only, per the house rule, so a disabled button gets its own flat pair. */
/* THE PEN IS ALWAYS THE PEN. Paling the outline and the shadow along with the
   face made the buttons vanish into the teal; only the FACE greys out, and the
   charcoal stroke and hard shadow stay, so a disabled button is still visibly a
   button that is not available. */
button:disabled { opacity: 1; --face: #C6C1B1; color: #56564F; }
.play:disabled  { --face: #D6CB9E; }
button > svg:not(.boil) { width: 19px; height: 19px; fill: currentColor; }
.play { background: transparent; padding: 11px; --face: var(--pp-mustard, #F6CC60); }
.play:hover:not(:disabled) { --face: #FBDA88; }
.play > svg:not(.boil) { width: 22px; height: 22px; }
.toggle[aria-pressed="true"] { --face: var(--pp-mustard, #F6CC60);
                               color: var(--pp-ink, #2C2C2A); }

.vol input[type="range"]::-webkit-slider-runnable-track,
.vol input[type="range"]::-moz-range-track { height: 6px; background: var(--pp-cream, #fcf7e8);
  border: 2px solid var(--pp-ink, #2C2C2A); border-radius: 6px; }
.vol input[type="range"]::-webkit-slider-thumb { width: 14px; height: 14px; margin-top: -6px;
  background: var(--pp-mustard, #F6CC60); border: 2px solid var(--pp-ink, #2C2C2A); }
.vol input[type="range"]::-moz-range-thumb { width: 14px; height: 14px;
  background: var(--pp-mustard, #F6CC60); border: 2px solid var(--pp-ink, #2C2C2A); }

/* ---- 7. THE CRATE ------------------------------------------------------ */
/* THE FLIGHT CLONE MUST BE THE SAME DRAWING AS THE SLEEVE IT STANDS IN FOR.
   .flier-sleeve was left as a bare image with a 3px radius, so the moment a
   flight started the sleeve lost its ink outline and its cream board, and got
   them back when the flight ended. That is a pop, not a transition. */
.sleeve-art, .flier-sleeve {
              background: var(--pp-cream, #fcf7e8);
              border: 2.5px solid var(--pp-ink, #2C2C2A); border-radius: 2px; }
/* NO SPINE BAR. It was a 5%-wide dark band down the left of every sleeve, meant
   to read as printed cardboard. Carl: "there's a weird grey strip on the left of
   all the sleeves." On a photograph it reads as a smudge on the image rather
   than as an edge of the object, and the ink outline is already doing the work
   of saying "this is a printed sleeve". */
.sleeve-art::after { background: none; }

/* THE SLEEVE'S CARD IS DRAWN BY THE BOIL AND THE BOIL DOES NOT MOVE. A .sleeve
   is a <button>, so installBoil stamps it and its frame, face and hard shadow
   are painted by an SVG on the element itself -- while this rule was shifting
   only the ARTWORK inside it. Carl: "the artwork animates diagonally up-left,
   but the boiling frame does not change position so it looks odd. I'd rather
   the album art not move and just let the vinyl peek-out be the hover
   animation." So the art holds still and the record does the moving, which is
   also the only part of it that means anything. */

/* THE CAPTION HAS TO CLEAR THE SLEEVE'S OWN OUTLINE. That outline is drawn at
   the element's edge, and .sleeve carries no padding, so the drawn line ran
   straight through the first letter of every title -- Carl: "the text is hidden
   by the border." 10px in from a 2.5px pen, plus the boil's wobble, which is
   what the extra room is for. */
.sleeve { padding: 10px; }
.sleeve-meta { padding: 0; }

/* A HOVERED SLEEVE COMES TO THE FRONT. The peek record slides out to the right,
   which put it UNDER the next sleeve in the grid -- later siblings paint on top
   and nothing here was competing. Carl: "the vinyl slides out during hover but
   it ends up being BEHIND the sleeve next to it which looks super weird." The
   <li> is unpositioned and sets no z-index, so it creates no stacking context
   and these compare directly against each other. */
.sleeve { position: relative; z-index: 0; }
.sleeve:hover, .sleeve:focus-visible, .sleeve[data-state="deck"] { z-index: 3; }
.sleeve-title { font-family: var(--pp-font-body); font-weight: 700; letter-spacing: .03em;
                color: var(--pp-ink, #2C2C2A); }
.sleeve-sub   { font-family: var(--pp-font-body); letter-spacing: .04em; }
.sleeve[data-state="deck"] .sleeve-art { filter: none; opacity: .55; }
.sleeve[data-state="deck"] .sleeve-art::before {
  font-family: var(--pp-font-body); font-weight: 700; letter-spacing: .16em;
  background: var(--pp-ink, #2C2C2A); color: var(--pp-mustard, #F6CC60); padding: 6px; }

.status { font-family: var(--pp-font-body); font-weight: 700; letter-spacing: .1em;
          text-transform: uppercase; font-size: 11px;
          color: var(--pp-mint, #BFCDC0); }
/* --red is a colour for CREAM PAPER and the status now sits on the teal deck,
   where it measures 1.5:1 against the ground — unreadable. On a dark ground
   this game signals with mustard (the NEW BEST badge does), so that is what an
   error uses here. Alert red #FE3636 stays out of this page either way: it
   means "this can kill you", and nothing on a turntable can. */
.status[data-error="true"] { color: var(--pp-mustard, #F6CC60); }

:where(button, .sleeve):focus-visible { outline: 3px solid var(--pp-accent, #BF7538);
                                        outline-offset: 3px; }

/* ---- 8. THE INKED SHAPE, restated INSIDE the shadow root ---------------
   These rules also live in the page stylesheet, and they have to live twice:
   a shadow root does not inherit page styles, so without this copy the boil's
   own <svg> lands unstyled — statically positioned (a grid item, which tears
   the player's layout apart) and filled default black. */
[data-boil] { position: relative; border: 0; background: transparent; }
[data-boil] > *:not(.boil) { position: relative; z-index: 1; }
.boil { position: absolute; inset: 0; width: 100%; height: 100%;
        overflow: visible; pointer-events: none; z-index: 0; }
.boil .bShadow { fill: var(--shadow, #C9BFA6); stroke: none; }
.boil .bFace   { fill: var(--face, #fcf7e8);
                 stroke: var(--stroke, #2C2C2A); stroke-width: var(--ink-w, 3px); }
.boil path     { stroke-linejoin: round; stroke-linecap: round; }

/* ---- 9. CARL'S ARTWORK TAKES OVER ------------------------------------- */
/* An opaque drawing simply covers the CSS version underneath, which is why the
   deck and the record need nothing but the variable. THE ARM IS DIFFERENT: it is
   a sparse shape on a transparent square, so the drawn tube and headshell would
   show straight through the gaps around it. Hence 'data-art', listing which
   slots are really filled — the one thing a bare custom property cannot express,
   because CSS has no way to ask "is this variable set?".

   The deck also goes SQUARE here. The plinth was 82% as tall as it is wide so a
   parked arm stayed on it; Carl's deck is drawn square, and stretching it to
   0.82 would bend the one thing his linework is carrying — the rounded corners
   and the inner keyline. The frame was always square, so this actually removes
   a discrepancy rather than adding one. */
:host([data-art~="plinth"]) .deck { aspect-ratio: 1; }
:host([data-art~="plinth"]) .plinth {
  border: 0; box-shadow: none; background-color: transparent;
  background-image: var(--art-plinth);
  background-size: 100% 100%; background-repeat: no-repeat;
}
:host([data-art~="plinth"]) .plinth::after { content: none; }  /* his grain is drawn in */

:host([data-art~="record"]) .vinyl {
  border: 0;
  background: var(--art-record) center / 100% 100% no-repeat;
}
/* THE COVER COVERS THE LABEL CARL DREW, and no more than that. Carl: "I just
   want it jussssst big enough so the component's label isn't showing."

   His well measures 38.9% of the disc across the median of 720 rays walked in
   from the rim, reaching 41.6% at the 90th percentile where the orange marks
   run wider. The component's own label is 38%, which is why only a sliver of his
   drawing was ever peeking. 42.5% clears the widest of it with about half a
   percent to spare.

   Measuring this twice is the lesson: the first pass took "anything brighter
   than the vinyl" in the middle of the disc and got 63.9%, because the grey
   groove LINES are brighter than the black too. Cream and orange are far
   brighter than any groove — threshold for the label, not against the ground. */
:host([data-art~="record"]) .vinyl-label { width: 42.5%; }

:host([data-art~="tonearm"]) .arm-tube,
:host([data-art~="tonearm"]) .arm-pivot,
:host([data-art~="tonearm"]) .arm-weight,
:host([data-art~="tonearm"]) .headshell,
:host([data-art~="tonearm"]) .stylus,
:host([data-art~="tonearm"]) .armrest { display: none; }

/* THE S-ARM, AND ITS PIVOT BROUGHT IN. Carl wanted the pivot post nearer the
   record, sketched roughly. Moving it is not a nudge: the pivot is the point the
   whole arm rotates about, so every angle is re-derived from it, AND the parked
   arm swings in with it. At the old rest of -62deg this pivot would have parked
   the stylus 25.3 from the spindle against a 26-unit disc — the needle sitting
   on the record. Solved, not eyeballed:

   THE PARKED ARM IS SET BY TWO OF CARL'S LINES, and both are exact rather than
   eyeballed:

   The first attempt hung the whole ARM straight down (rest -90deg). Carl, seeing
   it: "you did what I asked but after seeing it I don't love it" — and what he
   circled was the COUNTERWEIGHT STUB, not the arm. Those are not the same line:
   this arm is an S, so the stub sits at its own angle to the pivot->stylus chord.
   Measured, that offset is 9.8deg, so standing the stub upright is a rest of
   -80.2deg — 9.8deg clockwise, exactly the "few degrees clockwise" he guessed.

   2. "its highest point is level at the same y point as the top of the mat" — the
      highest point is the stub tip, 133.8 px from the pivot in the drawing =
      13.7% of the frame. With the stub VERTICAL the tip is exactly that far above
      the pivot (which it was not when the arm hung straight down and the stub
      leaned), so the pivot sits at 17 + 13.7 = 30.7% and the tip lands on 17.0%.

     pivot    75.6%, 30.7%   pivot->spindle 36.2   reach 39.8%
              (72% before the pair was centred; the spindle moved with it,
               so the distance and every angle below are untouched)
     start    -56.7deg   end -35.3deg   rest -80.2deg
     parked, the stylus is 38.3 from the spindle against a 26-unit disc.

   The transform-origin has to agree with where the art puts the pivot, or the
   arm swings about a point it is not drawn around.

   IT DID NOT, FOR A WHILE, AND THAT WAS A BUG. Carl: "if you load up a full
   song and compare the song-start position and the song-end position of the
   record player's arm, you'll see that the pivot point (shoulder?) drifts
   over time instead of cleanly rotating at a fixed point." This value was
   never wrong -- art/build/art.py's lay_out_s_arm() was measuring the wrong
   pivot in tonearm-source.png and then faithfully placing THAT at 75.6%,
   30.7% instead of the real disc. Its "rose" colour mask was loose enough to
   also catch the tube's own peachy stroke, which runs nearly the full height
   of the source frame, dragging the computed centroid off toward the tube.
   Fixed at the source -- see lay_out_s_arm()'s own comment on the corrected
   mask -- and art/tonearm.webp regenerated from it, which is what actually
   belongs at 75.6%, 30.7% now. Confirmed by measuring the regenerated webp's
   drawn dot directly: 75.50%, 30.70%, a rounding-level match.

   MOVED UP 4.5pt AND LEFT 2pt WITH THE PLATTER, same shifts, same reasons
   -- see "AND THEN UP, BY THE SAME RULE" and "AND LEFT 2%" on .platter
   above. Still exactly where the art draws its pivot: this is a
   translation of the whole assembly, not a change to where the dot sits
   inside the tonearm drawing. */
:host([data-art~="tonearm"]) .tonearm { transform-origin: 73.6% 26.2%; }
:host([data-art~="tonearm"]) {
  --arm-start: -56.7deg;
  --arm-end: -35.3deg;
  --arm-rest: -80.2deg;
}

/* THE DECK BECAME SQUARE, SO THE DECK'S GEOMETRY HAS TO BE RE-SOLVED. The
   platter was placed for a plinth 82% as tall as it is wide; on a square one it
   sits high and left with a dead band of teal under it. Dropping and growing it
   fixes the balance -- but the tonearm angles are DERIVED from where the spindle
   is, so they cannot be left alone, and they are not eyeballed here.

   Solving the pivot/stylus triangle: the stylus sits 53 units from the pivot at
   (85, 26), so for a groove radius r the angle is the one that puts it r from the
   spindle. Run against the ORIGINAL numbers that model reproduces the shipped
   -41.3deg and -24.4deg to within 0.02 units, which is what makes it safe to
   trust for new ones.

   THE MAT MUST NOT OVERHANG THE DECK (Carl). Measured off his drawing, the cream
   keyline runs at 5.3% and the platter's left edge was at 5% -- so the mat sat
   ON the line. Its clearance inside the keyline is now checked as a number
   rather than judged by eye:

     keyline  inside edges at left 6.5%, right 90.5%, top 8%, bottom 89%
     platter  left 15.6%, top 17%, width 52%  ->  centre (41.6, 43), radius 26

   THE PLATTER AND THE ARM MOVE AS ONE. Carl: "keep their relative size and
   position, but they should move a hair to the right... they're a bit off center
   to the left." Parked, the two together spanned 12% to 77.7%, centred on 44.9%,
   against a keyline centred on 48.5% — so the pair sat 3.6% left of the frame the
   deck draws round them. Both shift by that 3.6% and NOTHING ELSE CHANGES: every
   arm angle is solved from the pivot->spindle VECTOR, and translating both ends
   of a vector leaves it identical. The clearances land at 10.3% on the left and
   10.4% on the right, which is the check that it really is centred.
     grooves  10.8 .. 24.2   (the same 12/29 .. 27/29 proportions as before)
     start    -46.9deg       end -31.4deg
     rest     -62deg unchanged: it parks the stylus 37.1 from the spindle,
              comfortably outside the 26-unit disc.
     the pivot at 85% is still inside the keyline's 90.5%.

   AND THEN UP, BY THE SAME RULE. Carl drew a line on a screenshot and asked
   for the record's top edge to land there. Read off that screenshot against
   two landmarks measured from the real render rather than the picture alone
   -- the top corner dashes (centred ~11% down) and the record's own then-
   current top edge (18.25%, from .platter's top 17% plus the disc's own
   inset) -- his line sits roughly midway between them, ~14%. That is a
   4.5pt shift, applied the identical way the 3.6% one was: only .platter's
   top and the tonearm's pivot Y move, by the same amount, so the pivot->
   spindle vector is untouched and --arm-start/--arm-end/--arm-rest stay
   exactly as solved above.

   AND LEFT 2%. Carl, after the up move: "It looks like you moved it to the
   right a bit too yeah?" Measured, it hadn't -- disc centre-X was pixel-
   identical before and after, 0px delta -- but the pair sitting closer to
   the tonearm's fixed-X pivot after moving up plausibly read that way, and
   he asked for 2% left regardless. Same rule again: .platter's left and the
   tonearm's pivot X move together by 2%, the vector is untouched, the
   angles stay solved. */
:host([data-art~="plinth"]) .platter { left: 13.6%; top: 12.5%; width: 52%; }
/* the arm angles used to be set here, for the straight arm at the old pivot.
   They belong with the ARM, not the plinth — the tonearm block below owns them. */

/* THE TRANSPORT BAND, MEASURED OFF THE SAME KEYLINE AS EVERYTHING ELSE. Below
   the mat there is a strip of bare teal inside Carl's drawn keyline, and that is
   where the buttons and the title go:

     mat bottom    17 + 52 = 69%
     keyline       inside bottom 89%, left 6.5%, right 90.5%, centre 48.5%
     the band      70.5% .. 81%  ->  10.5% tall, 1.5% clear of the mat

   IT STOPS AT 81% BECAUSE HIS DRAWING IS NOT EMPTY DOWN THERE. Taking the band
   all the way to the keyline put the play button's shadow across the little
   cream dash drawn in the bottom-left corner, which read as an accident rather
   than a layer. Measured off plinth.webp instead of judged by eye: sweeping the
   cream mask between the mat and the keyline, the strip from 8.5% to 88.5%
   across is clear of a single cream pixel down to 81%, and the corner dashes
   start at 82%. So 81% is the floor, with a point of margin.

   IT STARTS WHERE THE MAT STARTS, ON THE CORNER DASH'S OWN DIAGONAL. Carl:
   "It's way too far left. The two dashes in the bottom left corner are a good
   reference angle to follow (45?) to find where the play button should begin
   the row." He is right on both counts, and the angle is measurable: pulling
   the two dashes out of plinth.webp as connected components puts them at
   (8.73, 82.80) and (10.71, 84.83) with their own stroke axes at 50.8 and 47.3
   degrees — so 49 degrees up-and-right, and near enough his 45 that the answer
   barely moves between the two (16.7% against 17.8%).

   Continued into the deck, that ray crosses the button's vertical centre at
   x=16.72%. The mat's left edge is at 15.6%. Those are the same place to within
   a point, so the row starts at 15.6% and gets BOTH: it sits on the diagonal the
   corner is pointing along, and it is flush with the mat above it — an alignment
   you can actually see, rather than a near-miss beside one.

   It was at 8.5% before, chosen to centre the block on the keyline. That was the
   wrong frame: the row is not a panel spanning the deck, it is a thing standing
   under the mat.

   Nothing of the arm reaches into it either. Parked at -80.2deg the stylus sits
   at (68.8, 69.9) — above the band's top edge, which is the check that mattered,
   since the parked arm is the one that hangs down over this corner of the deck.

   ONE BAND AT EVERY SIZE. There was a breakpoint here that moved the row right
   and dropped the band to the keyline below 430px, because a fixed 44px button
   would not fit in 10.5% of a phone-sized deck. That is what Carl saw as
   "spaced differently in landscape vs portrait" — two layouts. The button now
   scales with the deck instead (see .controls button above), so the band holds it
   at every size and this is the only rule. */
:host([data-art~="plinth"]) .onDeck {
  left: 15.6%; right: 11.5%; top: 70.5%; bottom: 19%;
}

/* THE PROGRESS BAR SITS IN THE LAST CLEAR STRIP ON THE DECK, which is exactly
   where Carl drew a line across and asked whether it would fit. It does, and
   the numbers are the reason to trust it rather than the sketch:

     the strip     between the row (81%) and the keyline (89.4%) there is not a
                   single cream pixel from 81% to 88.9% across this span
     the span      15.6% .. 81.4% — it STARTS where everything else in this band
                   starts (the mat's left edge, the play button) and is centred
                   on the keyline's 48.5%, which is the axis the mat and arm are
                   centred on
     the check     that leaves 3.7% to the left corner dash and 3.6% to the
                   right one. Those two agreeing is what says the span is right;
                   nothing was nudged to make them match.

   The drawn bar is a hairline — 1.8% of the deck — so the grabbable area is a
   transparent box 8% tall around it, reaching up to just under the buttons and
   down to just above the keyline. That is every pixel available: 25px on a phone
   against a 5.5px bar. Both are centred on 84.8%, the midpoint between the
   buttons' bottom edge (79.75%) and the keyline (89.4%). */
:host([data-art~="plinth"]) .scrub {
  position: absolute; z-index: 3;
  left: 15.6%; right: 18.6%; top: 80.8%; height: 8%;
}

/* the speed badge sat at the plinth's bottom-left, which on Carl's drawing is
   the dark rounded corner -- charcoal type on charcoal ink. Moved inside his
   cream keyline. */
:host([data-art~="plinth"]) .badge { left: 13%; bottom: 12%; }

/* ---- 9b. EMBED MODE: FILL THE BOX YOU ARE GIVEN ------------------------
   The height stops depending on how many records there are, which is the whole
   point: a fixed-height iframe only works if the content is height-stable, and a
   crate that grows with the catalogue is not. So the player fills its box and
   the CRATE is what absorbs the difference, by scrolling.

   min-height: 0 on the scrolling column is not optional. A grid item's automatic
   minimum size is its content, so without it the crate refuses to shrink below
   six sleeves tall and pushes the player past the bottom of the frame instead of
   scrolling inside it. */
/* container-type: SIZE, not inline-size, and only here. It is what makes 100cqb
   -- the player's own height -- available to everything inside, which is the
   only way the deck can be told to fit a box rather than just a width. Size
   containment needs a definite height in both axes, which an embedded player
   has and a page one does not, so this cannot be the default. */
:host([embed]) { display: block; height: 100%; container-type: size; }
/* align-items: STRETCH. The page layout sets start, which is right when the
   grid is as tall as its content -- the crate and the deck each end where they
   end. In a fixed-height frame it means the items keep sizing to their content
   and simply overflow the row instead of filling it, so the crate never reaches
   the height that would make it scroll. Measured: a 737px crate inside a 460px
   row. */
:host([embed]) .pp { height: 100%; grid-template-rows: minmax(0, 1fr);
                     align-items: stretch;
                     /* No frame of its own here -- see the installBoil() call
                        near the bottom of this file, which skips stamping .pp
                        with data-boil specifically in embed mode. A host page
                        drops this straight into a card that already has its
                        own hand-inked border (that's the whole point of embed
                        mode: it's a component, not a page), so .pp drawing its
                        OWN pen line and hard shadow read as a border nested
                        inside a border.

                        Section 2 (THE BOARD, above .pp::before) sets this
                        element's plain CSS to background:transparent on
                        purpose, because .pp NORMALLY paints nothing itself --
                        its frame, face and shadow are the boiling SVG's job,
                        always. Skip that SVG here and there is nothing left to
                        paint the board at all, so this has to restore a plain
                        background as a non-boiled version of the same board,
                        not just turn a border off. */
                     background: var(--pp-board, #fcf7e8);
                     border: none; }

/* NOFRAME: for a host that INLINES this element directly onto its own page,
   into a spot the host already draws a card border around (index.html's
   .spotify-card does exactly this). Same reason as EMBED's border:none just
   above -- a frame around a frame reads as a mistake -- but NOT the same fix,
   on purpose: EMBED's height:100%/grid-template-rows/scrolling exist only
   because "the host page must not cooperate" (see EMBED MODE near the top of
   this file) -- a real <iframe src="…?embed"> on someone else's Softr or
   Webflow page can't be handed a height that adapts to content, because no
   script or handshake is allowed to run on their side. Inlined, that
   constraint is gone: this markup and the host page's are the same document,
   so the player can just grow to whatever height its content needs, the same
   as it already does un-annotated (neither embed nor noframe) on this file's
   own full page. NOFRAME borrows only the frame-skip half of EMBED, not the
   fixed-box half -- see the stamp condition down in the glue script, which is
   the other half of turning the frame off. */
:host([noframe]) .pp { background: var(--pp-board, #fcf7e8); border: none; }

:host([embed]) .shelf-col { min-height: 0; }
:host([embed]) .deck-col { min-height: 0; display: grid; place-items: center; }

/* THE SCROLL CLIP LIVES ON .shelf-scroll, NOT ON .shelf-col. overflow-y: auto
   on a box also forces that box's overflow-x to compute as auto (CSS
   Overflow Module: a 'visible' axis paired with a non-'visible' axis on the
   same box upgrades to 'auto', so it can be clipped consistently) -- and
   .sleeve deliberately sets overflow: visible so the record can peek out
   past its own edge on hover (see .sleeve-peek below). Put the scrollbar on
   .shelf-col itself and that same upgrade clips the peek the instant a
   sleeve is close enough to the crate's own right edge -- which the LAST
   column always is. .shelf-col is also the cqi container the crate's sizing
   (see .shelf, .sleeve-peek) is measured against, so its width is not
   ours to spend on breathing room.

   OUTSIDE embed mode this same overlap already happens, unclipped and
   unremarked-on: .shelf-col has no overflow rule there at all, so a peeking
   record has always been free to cross into the gap toward the deck (or,
   stacked, into .pp's own padding) exactly the way it crosses into a
   neighbouring sleeve. Embed's scrolling is what's new, not the overlap, so
   the fix widens .shelf-scroll -- width, not padding, so this is genuine
   extra room and not content sharing the space the crate is already sized
   against -- past .shelf-col's own right edge, by 60px: comfortably past
   the peek's max travel (30% of a record at most ~150px * 0.94 wide, the
   .sleeve-peek inset, is ~42px) with room to spare. That's the same space a
   non-clipping .shelf-col already let this cross into, just widened out to
   .shelf-scroll instead. .shelf-col's own width, and with it the cqi-driven
   column count and track sizing this file spent so much tuning on, is
   untouched -- .shelf-scroll's WIDTH grew, nothing about .shelf-col did. */
:host([embed]) .shelf-scroll {
  width: calc(100% + 60px);
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 60px;
  box-sizing: border-box;
}

/* THE DECK IS SQUARE, so left to itself it takes its height from its width and
   overflows any frame shorter than the column is wide. min() lets whichever
   dimension is scarcer win. 88cqb rather than 100 leaves room for the player's
   own padding at the top and bottom. */
:host([embed]) .deck { width: min(100%, 88cqb); }

/* A scrollbar is chrome. Drawn thin and in the ink, so it reads as part of the
   object rather than as the browser showing through. On .shelf-scroll now,
   same as the clip itself -- see the note above .shelf-scroll's rule. */
:host([embed]) .shelf-scroll { scrollbar-width: thin;
  scrollbar-color: var(--pp-ink, #2C2C2A) transparent; }

/* Stacked, the deck and the crate share the height instead of sitting side by
   side, so the deck can have rather less of it. 52cqb leaves the crate a usable
   strip to scroll in even in a short frame. */
@container player (max-width: 720px) {
  :host([embed]) .pp { grid-template-rows: auto minmax(0, 1fr); }
  :host([embed]) .deck { width: min(100%, 52cqb); }

  /* .shelf's own align-content: center (see .shelf above) was reasoned about
     for the SIDE-BY-SIDE case, where shelf-col stretches to roughly match
     the deck's height -- the leftover to split above/below the sleeve rows
     is modest there. Stacked in embed mode, shelf-col's row is instead
     minmax(0, 1fr) of whatever height the iframe's fixed pixel height (set
     by the host page, sized for the tallest crate this file's own width
     sweep expects) leaves over after the deck -- and a host sized for that
     worst case leaves a MUCH narrower phone, with fewer columns and thus a
     shorter crate, sitting inside a box far taller than its own content.
     Centered, that reads as a gap wedged between the deck and the crate,
     which looks broken rather than composed. Left at the top, the same
     leftover space is just trailing room below the last row -- ordinary,
     not a visible seam between two things that are supposed to be
     adjacent. */
  :host([embed]) .shelf { align-content: start; }
}

/* ---- 10. THE ILLUSTRATION SLOTS --------------------------------------- */
/* Override-or-fallback, the repo's contract: the art layer is listed FIRST in
   each background above, so an opaque WEBP simply covers the drawing and an
   absent one falls through to it. Nothing here is load-bearing. */
/* THE ARM ART FILLS THE SQUARE EXACTLY — 'contain' would letterbox it and move
   the pivot off the point the page rotates about, which is the one thing that
   cannot drift. */
.tonearm::after { content: ""; position: absolute; inset: 0; z-index: 2;
  background: var(--art-tonearm, none) center / 100% 100% no-repeat;
  pointer-events: none; }

/* THE NEEDLE DROP, ON THE DRAWN ARM. --lift had exactly one consumer in the
   whole page — .headshell's transform — and the ink layer hides .headshell along
   with every other CSS arm part once Carl's drawing is in. So the tonearm had
   ZERO visible children and cueing the needle moved nothing at all, while the
   sequence still waited 260ms for it. Carl, having asked: "Is there an
   intentional buffer before playing once the needle lands on the record?" There
   was, and it was covering an animation you could not see.

   A DIP IS A SCALE ABOUT THE PIVOT, not a translate. Seen from directly above, a
   cue lever moves the arm straight up — perpendicular to the screen — so in plan
   view it produces no sideways motion whatsoever and any 2D reading of it is a
   convention. The honest convention is distance from the camera: lifted is
   NEARER, so very slightly larger. Translating instead would drag the pivot
   across the deck, and the pivot is bolted to it.

   Scaling about the pivot is what makes that true: the pivot holds still and the
   headshell end travels most, which is the way the real thing moves.

   2% IS THE REAL FIGURE, not a taste one. A cue lever lifts a real arm about 5mm
   over a 300mm platter — 1.7% of the platter's width. Here that is 5.4px against
   a 317px mat, and 2% moves the stylus 5.6px. Measured: the pivot travels 0.00px
   and the stylus 5.61px on a 610px deck.

   CUED IS 1.0 AND LOWERED IS 0.98, not the other way round. Every angle and
   clearance on this arm — the parked stub standing vertical, its tip level with
   the top of the mat — was measured with the arm cued, which is how it sits at
   rest. Scaling UP from there would have quietly moved all of it by a couple of
   pixels. The lowered arm is the one that shrinks, which is also the truer read:
   down is further from the camera.

   THE ORIGIN MUST MATCH .tonearm's. If they disagree, the arm cues about one
   point and swings about another, and the drawing pulls apart at the pivot. */
:host([data-art~="tonearm"]) .tonearm::after {
  transform-origin: 73.6% 26.2%;
  transform: scale(calc(0.98 + var(--lift, 0) * 0.02));
  transition: transform 260ms cubic-bezier(.4, 0, .2, 1);
}
@media (prefers-reduced-motion: reduce) {
  :host([data-art~="tonearm"]) .tonearm::after { transition-duration: 1ms; }
}
/* NO BOIL ON GREG'S: "Oh we don't want boil for Greg" (Carl, 10 Nov 2026). The kit's hand-drawn edges boil only when a
   page runs its boil script (installBoil, on the MGMT pages); Greg's never loads it, and its last hook here is gone. */
/* ===== GREG'S DECK, AS CARL BUILT HIS ON CARLBAHNER.COM =====================================================
   "What did we do differently in my Carlbahner site deck? The 3d buttons, the placement of words. The removal of the
   weird shadow?", then "All of it, and we need to change the colors of any illustrations" (Carl, 10 Nov 2026). From
   carlbahner.com's src/props.mjs: GREG'S CONTROLS, ON THE DECK; THE KEYS; THE KNOB; THE DECK'S BUTTONS AND WORDS, with
   his saved sizes and moves (DECK_UI); DECK_MOVE; and src/nav.mjs THE WORDS WAIT FOR THE RECORD. The shadow is gone
   from the drawing itself (vinyl/art/plinth.webp, made by tools/vinyl_art.py from carlbahner's deck). Colours come
   from the page's --pp-* (Greg's), never StudioLand's. Only the 3D room's own parts (thickness, the post) stay there. */

/* the record and the arm 1% toward the corner and 1.5% toward the front, moved as one so the arm's angles hold
   (carlbahner DECK_MOVE: x 0.01, z 0.015) */
:host([data-art~="plinth"]) .platter { left: 14.6%; top: 14%; }
:host([data-art~="tonearm"]) .tonearm { translate: 1% 1.5%; }

/* THE KEYS: play and stop as real keys, raised off the deck and pressed down while held, springing back up: "can the play
   buttons have depth? and then when they're clicked they actually depress?", "do they come back up after the click is
   released?" (Carl, 2 Nov 2026). A cream top with a charcoal line, on its side in a darker cream down to the deck. Both
   the same size, 1.23 times the kit's, the pair 1.4% left and 0.8% up (his DECK_UI keySize, keysX, keysY). */
:host([data-art~="plinth"]) .onDeck { left: 14.2%; top: 69.7%; bottom: auto; height: 10.5%; gap: 4.6cqi; }
:host([data-art~="plinth"]) .controls { gap: 2.3cqi; }
:host([data-art~="plinth"]) .controls button,
:host([data-art~="plinth"]) .controls .play {
  --k: clamp(26px, 8.4cqi, 54px); --side: clamp(3px, 1cqi, 7px); --pen: clamp(2px, .42cqi, 3px);
  width: var(--k); height: var(--k); padding: 0; border-radius: 22%;
  background: var(--pp-cream); color: var(--pp-ink); border: var(--pen) solid var(--pp-ink);
  box-shadow: 0 var(--side) 0 0 var(--pp-key-side, #c9c2b2), 0 var(--side) 0 var(--pen) var(--pp-ink);
  transform: translateY(0); transition: transform 70ms ease, box-shadow 70ms ease;
}
:host([data-art~="plinth"]) .controls button:hover:not(:disabled) { background: var(--pp-key-hover, #fbf9f4); }
:host([data-art~="plinth"]) .controls button:active:not(:disabled),
:host([data-art~="plinth"]) .controls button.pressed {
  transform: translateY(calc(var(--side) * .7));
  box-shadow: 0 calc(var(--side) * .3) 0 0 var(--pp-key-side, #c9c2b2), 0 calc(var(--side) * .3) 0 var(--pen) var(--pp-ink);
}
:host([data-art~="plinth"]) .controls button:disabled { background: var(--pp-panel); color: var(--pp-muted); }
:host([data-art~="plinth"]) .controls button > svg:not(.boil) { width: 46%; height: 46%; }

/* THE PROGRESS LINE: a cream track with a charcoal line round it, the played part charcoal, and THE KNOB, raised as the
   keys are, always riding it: "can the scrubber/circle thing also have depth?" (Carl, 2 Nov 2026). It drags; it does
   not press down ("You should be able to drag it and skip through the song but it won't depress"). */
:host([data-art~="plinth"]) .scrub-track { height: 30%; background: var(--pp-cream); }
:host([data-art~="plinth"]) .scrub-played { background: var(--pp-ink); }
:host([data-art~="plinth"]) .scrub-knob {
  --side: clamp(2px, .7cqi, 5px); --pen: clamp(2px, .42cqi, 3px);
  width: clamp(14px, 4.6cqi, 30px); background: var(--pp-cream); border: var(--pen) solid var(--pp-ink);
  box-shadow: 0 var(--side) 0 0 var(--pp-key-side, #c9c2b2), 0 var(--side) 0 var(--pen) var(--pp-ink);
  transform: translate(-50%, calc(-50% - var(--side) / 2)) scale(1);
}
:host([data-art~="plinth"]) .scrub[aria-disabled="true"] { opacity: 1; }

/* THE WORDS: the song's title on top, its artist under it, in the heading face in capitals, in the deck's cream, bigger
   than the kit's: "it should be Top line song title, bottom line artist name", "the text on the deck needs to be bigger"
   (Carl, 3 Nov 2026). The title 5.6% of the deck, the artist 4.2%; each line shrinks to fit (_fitWords), and only then
   is cut short. Moved 2.2% right and 1.4% up (his DECK_UI textX, textY). His artist line is at 72%; here it is full,
   Greg's site having nothing faded (his consistency quiz). */
:host([data-art~="plinth"]) .np { padding-left: 2.2cqi; transform: translateY(-1.4cqi); }
:host([data-art~="plinth"]) .np-title,
:host([data-art~="plinth"]) .np-meta {
  font-family: var(--pp-font); font-weight: 600; text-transform: uppercase; letter-spacing: .01em;
  color: var(--pp-cream); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0;
}
:host([data-art~="plinth"]) .np-title { font-size: 5.6cqi; line-height: 1.05; }
:host([data-art~="plinth"]) .np-meta { font-size: 4.2cqi; line-height: 1.1; margin-top: .15em; }

/* THE WORDS WAIT FOR THE RECORD: off while it is on its way, and once it is down they come in out of a blur, the whole of
   them at once: "can we make the words on the player not show up until the vinyl lands? it can fade in?", then "make the
   fade be a blur-in not like, entering line by line" (Carl, 8 Nov 2026). */
.np-title, .np-meta { transition: opacity 900ms ease, filter 900ms ease; }
.np.wait .np-title, .np.wait .np-meta { opacity: 0; filter: blur(1.4cqi); transition: none; }
@media (prefers-reduced-motion: reduce) { .np-title, .np-meta { transition: none; } }


/* ===== THE OFFICERS' ROUND, 10 Nov 2026: the player inside the page's own sets =====================================
   The covers' words were 12.5 and 11 and ON THE DECK 9, outside Carl's six sizes; they are the bar's own now (the song
   15 in Encode, the artist and ON THE DECK 13). Their frames were 2.5 with rounded corners in a page drawn in 3 and
   square. The progress line took the browser's thin ring where every other stop has the 3 one. */
.sleeve-title { font: 600 15px/1.3 var(--pp-font); letter-spacing: 0; }
.sleeve-sub { font-size: 13px; }
.sleeve[data-state="deck"] .sleeve-art::before { font-size: 13px; }
.sleeve-art, .flier-sleeve { border-width: 3px; border-radius: 0; }
.sleeve-art img, .flier-sleeve img { border-radius: 0; }
.scrub:focus-visible { outline: 3px solid var(--pp-accent); outline-offset: 3px; }
/* His answers on the same round: his own words for each song under its artist, as his Squarespace player had them
   ("Use DRAFT 1"); the playing song's cover says NOW PLAYING ("CHOOSE A RECORD / NOW PLAYING"); and the player draws
   no inside edge of its own, so it lines up with the page's edges and sits under its heading as the quote does
   ("Use the DRAFT set"). */
.sleeve-style { display: block; font: italic 400 13px/1.3 var(--pp-font-body); color: var(--pp-muted);
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sleeve[data-state="deck"] .sleeve-art::before { content: "NOW PLAYING"; }
:host([noframe]) .pp { padding: 0; }
.sleeve { padding: 0; }   /* the room it kept was for a boiling outline, which Greg's page doesn't draw */
/* THE PAGE'S COLUMNS: side by side, the covers and the deck take the page's own pair (--cols and --gap-cols, set on
   Greg's page), so the deck starts where the intro's words, the quote and the form do ("so the columns still don't
   seem intentional", Carl, 10 Nov 2026). Stacked below 720 as before. */
@container player (min-width: 721px) {
  :host([noframe]) .pp { grid-template-columns: var(--cols, minmax(0, 1fr) minmax(0, 1.35fr)); column-gap: var(--gap-cols, 56px); }
}

/* THE DECK DRAWN IN CODE, NOT A PICTURE: "can we replace the deck with something procedural?", then, of three drawn
   in code, "ooh i like the screws" and "i meant slate" (Carl, 10 Nov 2026). A square slate board with a charcoal edge,
   an off-white line inset round it and a screw in each corner, all sized to the deck so it scales with it. */
:host([data-art~="plinth"]) .plinth {
  --inset: 2.4cqi; --at: 5.2cqi;
  background-color: var(--pp-teal); border: 3px solid var(--pp-ink); border-radius: 0;
  box-shadow: inset 0 0 0 var(--inset) var(--pp-teal), inset 0 0 0 calc(var(--inset) + 3px) var(--pp-cream);
  background-size: auto; background-image:
    radial-gradient(circle at var(--at) var(--at), var(--screw)),
    radial-gradient(circle at calc(100% - var(--at)) var(--at), var(--screw)),
    radial-gradient(circle at var(--at) calc(100% - var(--at)), var(--screw)),
    radial-gradient(circle at calc(100% - var(--at)) calc(100% - var(--at)), var(--screw));
  --screw: var(--pp-ink) 0 .35cqi, var(--pp-cream) .4cqi 1.1cqi, var(--pp-ink) 1.15cqi 1.45cqi, transparent 1.5cqi;
}
/* CENTRED ON THE SQUARE ("and then it will be centered too right?", Carl): placed for the drawing's lopsided board, the
   record and arm stood 87 from its left edge and 116 from its right (of 591). Everything on the deck moves 2.4% right. */
:host([data-art~="plinth"]) .platter { left: 17%; }
:host([data-art~="tonearm"]) .tonearm { translate: calc(1% + 2.4cqi) 1.5%; }
:host([data-art~="plinth"]) .onDeck { left: 16.6%; }
:host([data-art~="plinth"]) .scrub { left: 18%; right: 16.2%; }
`;


/**
 * <vinyl-player> — an interactive record-player portfolio piece.
 *
 * Pick a sleeve; the record slides out of it, flies onto the platter, the
 * platter spins up, the tonearm swings across and drops, and the track plays.
 *
 * It is a plain custom element with no dependencies and no build step, so it
 * drops into any site — static HTML, Squarespace/Webflow code blocks, React,
 * Astro, whatever.
 *
 *   <script type="module" src="/src/vinyl-player.js"><\/script>
 *   <vinyl-player src="/tracks.json"></vinyl-player>
 *
 * Tracks can also come from a property (`el.tracks = [...]`) or an inline
 * <script type="application/json"> child. See README.md.
 */




/* -------------------------------------------------------------------------- */
/* helpers                                                                     */
/* -------------------------------------------------------------------------- */

/* THE HESITATION BEFORE A RECORD LEAVES THE DECK. Carl: "can we begin the arm
   movement back to its standby position and THEN the two songs begin their
   animations? It would only be a fraction of a second but it would stop the
   playing record from teleporting in front of the needle head." Then, having
   watched it: "I want the arm to complete its movement before the records start
   moving please."

   So the wait is the WHOLE swing, not the part of it that clears the disc.

   The first version waited 300ms, derived by walking the park transition and
   asking when the stylus passes the disc's edge — 130ms from the lead-in groove
   out to 300ms from the run-out. That is the minimum for the record not to
   teleport out from under the needle, and it is not what he wants: he wants the
   arm to have arrived.

   THE DURATION IS READ OFF THE ELEMENT, not restated here. It lives in
   `.tonearm { transition: transform 900ms ... }`, and a second copy of 900 in
   this file is a number that goes stale the first time that curve is retuned. */
const SPIN_PERIOD_MS = 1800;          // one revolution at 33 1/3 rpm
const BASE_RPM = 100 / 3;             // 33.333…

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/* Nothing on the deck SHOWS a clock -- the bar is the clock. This exists so the
   slider can announce a real position rather than a bare percentage. */
function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Run a Web Animations keyframe set and resolve when it settles.
 * Cancelling an animation rejects `.finished`; callers treat that as "the
 * sequence was superseded", so swallow it here and report it via the result.
 */
function animate(el, keyframes, options) {
  const anim = el.animate(keyframes, { fill: 'both', ...options });
  return anim.finished.then(() => true, () => false);
}

const svg = (paths) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths}</svg>`;

const ICONS = {
  play:  svg('<path d="M8 5.14v13.72L19 12 8 5.14z"/>'),
  pause: svg('<path d="M7 5h3.2v14H7zm6.8 0H17v14h-3.2z"/>'),
  stop:  svg('<rect x="6.4" y="6.4" width="11.2" height="11.2" rx="1.6"/>'),
};

/** Markup for a record. Shared by the platter, the shelf peek and the flier. */
function vinylHTML(labelSrc, alt = '') {
  const label = labelSrc
    ? `<div class="vinyl-label"><img src="${escapeHTML(labelSrc)}" alt="${escapeHTML(alt)}" draggable="false"></div>`
    : '<div class="vinyl-label"></div>';
  return `<div class="vinyl">${label}<div class="vinyl-hole"></div></div>`;
}

/* -------------------------------------------------------------------------- */
/* component                                                                   */
/* -------------------------------------------------------------------------- */

class VinylPlayer extends HTMLElement {
  static observedAttributes = ['src', 'autoadvance', 'max'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    /** @type {Array<object>} */
    this._tracks = [];
    /** Index of the record currently on the platter, or -1. */
    this.current = -1;
    /** Bumped on every new selection so stale animation steps bail out. */
    this._gen = 0;
    /** True while a record is travelling. */
    this._busy = false;
    /** A sleeve picked while a record was on its way, played once it has landed (ONE RECORD MOVING AT A TIME). */
    this._next = null;

    this._spin = null;          // WAAPI animation driving platter rotation
    this._spinRamp = null;      // rAF id for the spin-up/down ramp
    this._tick = null;          // rAF id for tonearm tracking
    this._dragging = false;
    this._volume = 0.85;
    /** Animations currently carrying a record, so a new selection can stop them. */
    this._flights = new Set();
    /** Sleeves whose art is hidden behind a stand-in, so nothing is left invisible. */
    this._hiddenSleeves = new Set();

    this._onFlightScroll = this._onFlightScroll.bind(this);
    this._onKeyScrub = this._onKeyScrub.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);

  }

  /* ---- public API ------------------------------------------------------ */

  get tracks() { return this._tracks; }

  /* A CAP, HONOURED WHEREVER THE LIST COMES FROM -- the property, the inline
     JSON or a fetched src -- because a limit that only one of the three routes
     respects is not a limit. No default: a bare <vinyl-player> takes whatever it
     is given, and a page that wants four says so.

     It buys nothing for an EMBED's predictability, which was the thing worth
     checking. Measured at 1000x520, the player is 498px tall with 2, 4, 6 or 12
     records and the page overflows by zero in every case: the scrolling crate
     already made the height independent of the count. What it buys is the
     SCROLLBAR going away -- see the note in the README. */
  get max() {
    const n = parseInt(this.getAttribute('max'), 10);
    return Number.isFinite(n) && n > 0 ? n : Infinity;
  }

  set tracks(value) {
    const all = Array.isArray(value) ? value.map(normaliseTrack) : [];
    this._tracks = all.slice(0, this.max);
    // Before _build() there is no shelf to render into; connectedCallback
    // renders once it exists.
    if (this._built) this._renderShelf();
  }

  /** Put a record on the deck and play it. */
  play(index = this.current) {
    if (index < 0 || index >= this._tracks.length) return;
    if (index === this.current) return this._resume();
    return this._select(index);
  }

  pause() {
    if (!this.audio || this.audio.paused) return;
    this.audio.pause();
  }

  /* ---- lifecycle ------------------------------------------------------- */

  connectedCallback() {
    if (!this._built) this._build();
    // the deck's words re-fit when the deck changes size (GREG'S DECK, _fitWords)
    if (!this._fitRO) { this._fitRO = new ResizeObserver(() => this._fitWords()); this._fitRO.observe(this); }

    // Tracks may arrive from an attribute, an inline JSON block, or the
    // property setter having run before upgrade. Handle all three.
    upgradeProperty(this, 'tracks');
    if (this._tracks.length) this._renderShelf();
    else this._loadTracksFromDOM();
  }

  disconnectedCallback() {
    this._stopTick();
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('scroll', this._onFlightScroll);
    window.removeEventListener('resize', this._onFlightScroll);
    cancelAnimationFrame(this._spinRamp);
    this._spin?.cancel();
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (!this._built) return;
    if (name === 'src') this._loadTracksFromDOM();
    // Re-run the setter so the cap is applied to the list already held.
    if (name === 'max') this.tracks = this._tracks;
  }

  /* ---- construction ---------------------------------------------------- */

  _build() {
    this._built = true;

    const root = this.shadowRoot;
    root.innerHTML = `
      <style>${styles}</style>
      <div class="pp" part="container">
        <div class="deck-col">
          <div class="deck" part="deck">
            <div class="plinth">
            </div>
            <div class="frame">
              <div class="platter">
                <div class="strobe"></div>
                <div class="disc" id="disc"></div>
                <div class="sheen"></div>
                <div class="spindle"></div>
              </div>
              <div class="armrest"></div>
              <div class="tonearm" id="tonearm">
                <div class="arm-tube"></div>
                <div class="arm-weight"></div>
                <div class="arm-pivot"></div>
                <div class="headshell"><div class="stylus"></div></div>
              </div>
            </div>
            <div class="scrub" id="scrub" role="slider" tabindex="0"
                 aria-label="Seek" aria-valuemin="0" aria-valuemax="100"
                 aria-valuenow="0" aria-valuetext="0:00" aria-disabled="true">
              <div class="scrub-track"><div class="scrub-played" id="played"></div></div>
              <div class="scrub-knob" id="knob"></div>
            </div>
            <div class="onDeck">
              <div class="controls">
                <button id="playBtn" class="play" title="Play" aria-label="Play" disabled>${ICONS.play}</button>
                <button id="stopBtn" title="Stop" aria-label="Stop" disabled>${ICONS.stop}</button>
              </div>
              <div class="np">
                <p class="np-title" id="npTitle">${escapeHTML(this.getAttribute('idle') || 'Choose a record')}</p>
                <!-- The idle attribute sets these words (Greg's page: "Hear for yourself", Carl, 10 Nov 2026).
                     Empty at rest on purpose. "Pick a sleeve to drop the needle"
                     under a title already reading "Choose a record" said the same
                     thing twice, and at phone width the second copy did not even
                     fit — it truncated to "PICK A SLEEVE TO D...". -->
                <p class="np-meta" id="npMeta"></p>
                <p class="status" id="status" role="status" aria-live="polite"></p>
              </div>
            </div>
          </div>

        </div>

        <div class="shelf-col">
          <div class="shelf-scroll">
            <ul class="shelf" id="shelf"></ul>
          </div>
        </div>
      </div>
      <div class="flight" aria-hidden="true"><div class="flight-pan" id="flight"></div></div>
    `;

    const $ = (id) => root.getElementById(id);
    this.el = {
      disc: $('disc'), tonearm: $('tonearm'), shelf: $('shelf'),
      npTitle: $('npTitle'), npMeta: $('npMeta'), status: $('status'),
      playBtn: $('playBtn'), stopBtn: $('stopBtn'),
      scrub: $('scrub'), played: $('played'), knob: $('knob'),
      flight: $('flight'),
    };

    // The <audio> element lives in the shadow root: hidden, but a real element
    // so the browser handles range requests, codecs and media session for us.
    this.audio = new Audio();
    this.audio.preload = 'none';
    this.audio.volume = this._volume;
    if (this.hasAttribute('crossorigin')) {
      this.audio.crossOrigin = this.getAttribute('crossorigin');
    }
    root.appendChild(this.audio);

    this._wireAudio();
    this._wireControls();
    /* Passive, and it does nothing at all unless something is actually in the
       air — which is almost always. One childElementCount read per scroll. */
    window.addEventListener('scroll', this._onFlightScroll, { passive: true });
    window.addEventListener('resize', this._onFlightScroll, { passive: true });

    // The platter rotation is one infinite animation whose playbackRate we
    // ramp, which gives a genuine spin-up and spin-down for free.
    this._spin = this.el.disc.animate(
      [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
      { duration: SPIN_PERIOD_MS, iterations: Infinity, easing: 'linear' },
    );
    this._spin.pause();
    this._spin.playbackRate = 0;
  }

  /* ---- track sources --------------------------------------------------- */

  async _loadTracksFromDOM() {
    const inline = this.querySelector('script[type="application/json"]');

    /* SRC WINS OVER THE INLINE LIST when both are present, and that ordering is
       the whole mechanism behind the roster. Every engineer's page is the same
       shell -- same HTML, same cached chrome -- and all that distinguishes them
       is one small JSON file named by ?r= on the URL. The inline list is what the
       page shows with no ?r at all, and it stays as the fallback if the fetch
       fails, so a mistyped slug or a 404 lands on a working player rather than on
       an empty crate.

       It used to be the other way round, which meant setting src did nothing at
       all while an inline list was present. Nothing depended on that, because
       until now no page ever set both. */
    const src = this.getAttribute('src');
    if (src) {
      try {
        const res = await fetch(src, { credentials: 'same-origin' });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const data = await res.json();
        const tracks = Array.isArray(data) ? data : data.tracks;
        if (!Array.isArray(tracks) || !tracks.length) throw new Error('no tracks in it');
        this.tracks = tracks;
        return;
      } catch (err) {
        this._setStatus(`Could not load ${src}: ${err.message}`, true);
        if (this.fallbackTracks && this.fallbackTracks.length) {
          this.tracks = this.fallbackTracks;
          return;
        }
      }
    }

    if (inline) {
      try {
        this.tracks = JSON.parse(inline.textContent);
      } catch (err) {
        this._setStatus(`Could not parse inline track list: ${err.message}`, true);
      }
    }
  }

  /* ---- shelf ----------------------------------------------------------- */

  _renderShelf() {
    const { shelf } = this.el;
    shelf.innerHTML = '';

    this._tracks.forEach((track, i) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'sleeve';
      btn.type = 'button';
      btn.dataset.index = String(i);
      btn.setAttribute('aria-label', `Play ${track.title}${track.artist ? ` by ${track.artist}` : ''}`);
      btn.innerHTML = `
        <span class="sleeve-stack">
          <span class="sleeve-peek">${vinylHTML(track.label)}</span>
          <span class="sleeve-art">
            <img src="${escapeHTML(track.sleeve)}" alt="${escapeHTML(track.title)} sleeve artwork"
                 draggable="false" loading="lazy">
          </span>
        </span>
        <span class="sleeve-meta">
          <span class="sleeve-title">${escapeHTML(track.title)}</span>
          <span class="sleeve-sub">${escapeHTML(track.artist || '')}</span>${track.style ? `
          <span class="sleeve-style">${escapeHTML(track.style)}</span>` : ''}
        </span>`;
      btn.addEventListener('click', () => this._onSleeveClick(i));
      li.appendChild(btn);
      shelf.appendChild(li);
    });

    this._syncButtons();
  }

  _sleeveEl(index) {
    return this.el.shelf.querySelector(`.sleeve[data-index="${index}"]`);
  }

  _onSleeveClick(index) {
    // Clicking the record that's already on the deck toggles playback rather
    // than pointlessly taking it off and putting it back.
    if (index === this.current && !this._busy) {
      return this.audio.paused ? this._resume() : this.pause();
    }
    this._select(index);
  }

  /* ---- the main sequence ----------------------------------------------- */

  async _select(index) {
    const track = this._tracks[index];
    if (!track) return;
    /* FROM CARLBAHNER, ONE RECORD MOVING AT A TIME (src/nav.mjs there; "Yes fix them", Carl, 2 Nov 2026): while a pick is
       under way, the same sleeve again does nothing, and another is held (the latest one) until this record has landed,
       then runs as an ordinary switch. Each pick used to cancel the one in the air, and that record vanished mid-flight. */
    if (this._busy) {
      if (index !== this.current) this._next = index;
      return;
    }

    const gen = ++this._gen;
    this._abortFlights();
    this._busy = true;
    this._syncButtons();

    this.audio.pause();
    this._stopTick();

    const reduced = prefersReducedMotion();

    /* 1. THE OLD RECORD LEAVES WHILE THE NEW ONE ARRIVES. Carl: "if a song is
       playing and the user clicks on another sleeve, it takes quite a long time
       for the next song to start because the 'unloading' animation completes
       before the next song's animation begins. I feel like they could begin at
       the same time." They can, and one after the other was costing 1.3 seconds
       of watching an empty deck for nothing.

       This call is NOT awaited, but it is made here on purpose: everything
       _returnRecord does with the platter -- reading the disc's box, building
       its stand-in -- happens synchronously before its first await, so it has
       taken its copy of the outgoing record before _takeRecord below overwrites
       the disc with the incoming one. */
    /* ONLY RETURN A RECORD THAT IS ACTUALLY ON THE DECK. `current` is set as soon
       as a selection starts, long before its record lands, so clicking quickly
       between sleeves used to ask for a record to be flown back from a platter
       it had never reached -- while the trip that was still carrying it there
       was in the air. That is the duplicate: two stand-ins for one record. */
    let leaving = null;
    if (this.current !== -1 && this.el.disc.dataset.loaded === 'true') {
      /* Needle up and the motor slowing FIRST, then a beat, and only then does
         anything move. The platter does not wait -- it is the motor, and a deck
         starts slowing the moment you reach for the arm -- but the record itself
         holds until the stylus is off it. */
      const armWasParked = this._armAt === 'rest';
      this._setArm('rest', { lift: true });
      const slowing = this._rampSpin(0, reduced ? 0 : 700);
      /* Nothing to wait for if the arm is already home — a side that ran out, or
         a stop — and a 900ms pause on a stationary arm is just a pause. */
      if (!reduced && !armWasParked) await wait(this._armSwingMs());
      if (gen !== this._gen) return;
      leaving = Promise.all([slowing, this._returnRecord(this.current, gen, reduced)]);
    }

    if (this.current !== -1 && !leaving) {
      // It never made it to the platter. Put its sleeve back and move on.
      const stranded = this._sleeveEl(this.current);
      if (stranded) { stranded.dataset.state = ''; this._hideSleeveArt(stranded, false); }
      this.el.disc.dataset.loaded = 'false';
    }

    this.current = index;
    this._wordsWait(true);
    this._updateNowPlaying(track);
    this._setStatus('');

    // 2. Load the audio while the record is still travelling, so by the time
    //    the needle lands the browser usually has enough buffered to start.
    this.audio.preload = 'auto';
    this.audio.src = track.src;
    this.audio.load();

    // 3. Out of the sleeve and over to the platter — alongside the old record's
    //    trip back to the crate, not after it.
    await Promise.all([leaving, this._takeRecord(index, gen, reduced)]);
    if (gen !== this._gen) return;
    this._wordsWait(false);
    if (this._pickNext(index)) return;

    /* 4. THE MOTOR COMES UP TO SPEED WHILE THE ARM SWINGS OVER. These used to
       run end to end, which is not what anyone does with a deck: you start it
       turning and reach for the arm while it settles. Overlapping them is both
       truer and 0.9s shorter. */
    /* THE MUSIC AS THE RECORD LANDS (the officers' round, 10 Nov 2026: "Do it", of the 1.5s of quiet after it landed
       while the motor came up and the arm swung over). The motor comes up under the music, the arm swings straight
       down onto the record, and the song starts as it touches. */
    this._rampSpin(rpmRate(track.rpm), reduced ? 0 : 700);
    this._setArm('start', { lift: false });
    if (!reduced) await wait(320);
    if (gen !== this._gen) return;

    this._busy = false;
    this._next = null;
    await this._startPlayback(gen);
  }

  /* EACH LINE SHRINKS TO FIT, and only then is cut short (Carl's deck: "Each line shrinks to fit, and only then is cut
     short"), down to 60% of its size. */
  _fitWords() {
    for (const el of [this.el.npTitle, this.el.npMeta]) {
      if (!el) continue;
      el.style.fontSize = '';
      let fs = parseFloat(getComputedStyle(el).fontSize);
      const floor = fs * 0.6;
      while (el.scrollWidth > el.clientWidth + 1 && fs > floor) { fs *= 0.94; el.style.fontSize = fs + 'px'; }
    }
    /* THE ARTIST NEVER OUTGROWS THE SONG: each line shrank on its own, so a long title ended up smaller than the artist
       under it. The artist stays at most three quarters of the title, the two lines' ratio on Carl's deck (5.6 to 4.2). */
    const t = this.el.npTitle, m = this.el.npMeta;
    if (t && m) {
      const cap = parseFloat(getComputedStyle(t).fontSize) * 0.75;
      if (parseFloat(getComputedStyle(m).fontSize) > cap) m.style.fontSize = cap + 'px';
    }
  }

  /* THE WORDS WAIT FOR THE RECORD: off while it travels, in once it is down (GREG'S DECK, above). */
  _wordsWait(on) { this.el.npTitle?.parentElement?.classList.toggle('wait', on); }

  /* Another sleeve was picked while this record was on its way: that one now, this one off the deck. */
  _pickNext(index) {
    const j = this._next;
    this._next = null;
    if (j === null || j === index) return false;
    this._busy = false;
    this._select(j);
    return true;
  }

  /** Fly a record from its sleeve in the shelf onto the platter. */
  async _takeRecord(index, gen, reduced) {
    const sleeveEl = this._sleeveEl(index);
    const track = this._tracks[index];

    // The platter record is the destination; build it now so the swap at the
    // end of the flight is pixel-identical.
    this.el.disc.innerHTML = vinylHTML(track.label, '');
    this.el.disc.dataset.loaded = 'false';
    // Square the platter while it is EMPTY and stopped, so the record about to
    // land on it sits straight. Nothing is on screen to see this happen.
    if (this._spin) this._spin.currentTime = 0;

    if (!sleeveEl || reduced) {
      this.el.disc.dataset.loaded = 'true';
      if (sleeveEl) sleeveEl.dataset.state = 'deck';
      return;
    }

    const artEl = sleeveEl.querySelector('.sleeve-art');
    const from = artEl.getBoundingClientRect();
    const to = this.el.disc.getBoundingClientRect();
    // Same reason as the return trip: layout width, never the rotated box. The
    // platter is squared before a record lands on it, so today the two agree --
    // but a landing size that depends on that staying true is a trap.
    const discW = this.el.disc.offsetWidth || to.width;
    if (!from.width || !to.width) {           // laid out off-screen; skip travel
      this.el.disc.dataset.loaded = 'true';
      sleeveEl.dataset.state = 'deck';
      return;
    }

    /* WHERE THE RECORD ALREADY IS, before anything is hidden. Hovering a sleeve
       slides its peek record out, and the flier used to start at zero regardless
       -- so clicking a sleeve you were hovering snapped the record back inside
       its cover and then pulled it out again. Carl: "if i click it, it teleports
       back inside of the sleeve and then quickly slides out again before moving
       up to the play area."

       The peek is inset 3% of the same box the flier is built from, and both are
       the same width, so its translateX in px transfers straight across. Read it
       LIVE rather than assuming 30%: the hover transition is 420ms and the click
       can land part way through it. */
    const peekEl = sleeveEl.querySelector('.sleeve-peek');
    const startX = peekEl
      ? new DOMMatrix(getComputedStyle(peekEl).transform).e || 0
      : 0;

    // Hide the real sleeve and stand in with fixed-position clones, so the
    // record can travel above every stacking context on the page.
    this._hideSleeveArt(sleeveEl, true);

    const inset = from.width * 0.03;          // matches .sleeve-peek
    const size = from.width - inset * 2;
    const flier = this._makeFlier('flier', from.left + inset, from.top + inset, size, size);
    flier.innerHTML = vinylHTML(track.label, '');
    const sleeve = this._makeFlier('flier-sleeve', from.left, from.top, from.width, from.height);
    sleeve.innerHTML = `<img src="${escapeHTML(track.sleeve)}" alt="" draggable="false">`;

    /* TWO BEATS. This has been round the houses, so the reasoning is worth
       keeping. The original was two animations -- pull out, carry across -- and
       Carl never had a word to say about how it MOVED. Splitting it into three
       made it "jerky": four eases meeting at zero velocity is three dead stops
       inside one action. Collapsing all of it into a single continuous sweep
       fixed the stops and broke something else: "still too fast and jagged. It
       felt so much better before I told you how slow it felt to wait for the
       animations to happen in sequence."

       Both words in that sentence matter, and neither was about duration.

       JAGGED was the corner. Every keyframe in the single sweep was `linear`
       with the shaping in the effect's own easing, which is the right way to
       hold one speed -- but it means the path turns from "straight right" to
       "up and across" AT CRUISING SPEED, and an instant change of direction at
       speed is a jolt whatever the timing function says. In two beats the turn
       happens at zero velocity, which is exactly why it never read as a jolt in
       the original.

       TOO FAST was the peak, not the total. One sweep has to cover both legs
       under one curve, so the middle has to move quickly to pay for soft ends.
       Two beats each get their own ease and each can be unhurried.

       So: the original two curves, at durations set to match the original
       SPEEDS, since speed is what he is reacting to and the distances changed
       underneath them.

         pull-out  120px in 620ms = 194 px/s originally. It now travels the full
                   206px width of the sleeve rather than 58% of the record, so
                   the same speed is 1060ms; 1000ms is within 6% of it.
         carry     650px in 950ms = 684 px/s originally. 1150ms takes that to
                   565, 17% slower, because "too fast" has now been said twice
                   and this is the leg with the distance in it. */
    const outX = from.width - inset;
    const dx = (to.left + to.width / 2) - (from.left + inset + size / 2);
    const dy = (to.top + to.height / 2) - (from.top + inset + size / 2);
    const scale = discW / size;
    const lift = Math.min(60, Math.hypot(dx, dy) * 0.11);
    const PULL = 1000;

    /* Z-INDEX RATHER THAN DOM ORDER for the moment it comes forward. Re-parenting
       an element mid-animation is the kind of thing that works until it doesn't;
       a style change cannot interrupt a running animation at all. In the stacked
       layout the deck is ABOVE the crate, so the record really can pass back over
       its own sleeve on the way up -- which is what makes this necessary rather
       than decorative. */
    flier.style.zIndex = '1';
    sleeve.style.zIndex = '2';

    /* Beat 1 — all the way out, from behind the sleeve, STARTING WHERE THE
       RECORD ALREADY IS. The duration shrinks with the distance left to travel
       so the pull-out keeps one speed whether it began from inside the sleeve or
       from a third of the way out; a fixed 1000ms would make a hovered sleeve's
       record crawl. Floored at a fifth so a click at the very end of a long
       hover still reads as a pull rather than a snap. */
    const remaining = Math.max(0, outX - startX) / outX;
    await this._fly(flier, [
      { transform: `translate(${startX.toFixed(1)}px, 0)` },
      { transform: `translate(${outX.toFixed(1)}px, 0)` },
    ], { duration: PULL * Math.max(0.2, remaining),
         easing: 'cubic-bezier(.22,.75,.28,1)' });

    if (gen !== this._gen) { this._clearFlight(flier, sleeve); this._hideSleeveArt(sleeveEl, false); return; }
    flier.style.zIndex = '3';        // clear of the sleeve; in front from here

    // The sleeve settles back into the crate as the record leaves it. It does
    // NOT fade: it stands in for the real sleeve, which is hidden until the trip
    // ends, and fading it left a hole in the crate.
    const sleeveDrop = this._fly(sleeve, [
      { transform: 'translateY(0)' },
      { transform: 'translateY(9px)' },
    ], { duration: 420, easing: 'cubic-bezier(.3,1.4,.5,1)' });

    /* Beat 2 — carry it to the platter. NO ROTATION: it turned 325 degrees here
       once, which is not a thing that happens to a record between a crate and a
       deck, and with cover art on the label it arrived visibly upside down. */
    const trip = this._fly(flier, [
      { transform: `translate(${outX.toFixed(1)}px, 0) scale(1)`, offset: 0 },
      { transform: `translate(${(outX + (dx - outX) * 0.5).toFixed(1)}px, ${(dy * 0.5 - lift).toFixed(1)}px) scale(${((1 + scale) / 2).toFixed(4)})`, offset: 0.55 },
      { transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${scale.toFixed(4)})`, offset: 1 },
    ], { duration: 1150, easing: 'cubic-bezier(.36,.06,.22,1)' });

    await trip;
    await sleeveDrop;

    /* THE HANDOFF HAD NO GENERATION CHECK. A superseded trip still reached this
       point and stamped its record onto the platter and its sleeve as "on the
       deck" -- the deck showing one record while the player believed in
       another. */
    if (gen !== this._gen) { this._clearFlight(flier, sleeve); this._hideSleeveArt(sleeveEl, false); return; }

    // Reveal the platter record and drop the stand-ins in the same frame.
    this.el.disc.dataset.loaded = 'true';
    this._hideSleeveArt(sleeveEl, false);
    sleeveEl.dataset.state = 'deck';
    this._clearFlight(flier, sleeve);
  }

  /* FROM CARLBAHNER, A RECORD FADES AWAY (src/nav.mjs returnRecord there): the record off the platter fades away where it
     lies, over FADE_MS, while the next one comes out of its sleeve, and its own sleeve has it back once it has gone. It
     flew home until then (two beats, platter to the sleeve's mouth and pushed in), and on carlbahner.com the trip home
     glitched: "what if the vinyl just fades away over the course of a second or so" (Carl, 2 Nov 2026).

     Everything here before the first await is synchronous, as before: _select calls this without awaiting it, and
     _takeRecord then overwrites the disc with the incoming record, so the stand-in has to copy the outgoing one first.
     The stand-in lies exactly as the record does: the same middle, its LAYOUT width (offsetWidth; the disc is rotated,
     so its bounding box is too big at most angles) and the turn the motor left it at. */
  async _returnRecord(index, gen, reduced) {
    const sleeveEl = this._sleeveEl(index);
    const disc = this.el.disc;
    const box = disc.getBoundingClientRect();
    const w = disc.offsetWidth || box.width;
    const turn = getComputedStyle(disc).transform;
    const markup = disc.innerHTML;
    disc.dataset.loaded = 'false';
    if (!sleeveEl) return;
    if (reduced || !w) { sleeveEl.dataset.state = ''; return; }

    const ghost = this._makeFlier('flier', box.left + box.width / 2 - w / 2, box.top + box.height / 2 - w / 2, w, w);
    ghost.innerHTML = markup;
    ghost.style.transform = turn === 'none' ? '' : turn;
    ghost.style.zIndex = '0';          // under the record coming in
    sleeveEl.dataset.state = 'flying';
    await this._fly(ghost, [{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, easing: 'ease-in-out' });
    this._clearFlight(ghost);
    if (sleeveEl.dataset.state === 'flying') sleeveEl.dataset.state = '';
  }

  /* Hide only the SLEEVE ITSELF while its fixed-position clone stands in for
     it. This used to hide the whole button, which took the title and the artist
     underneath down with it -- so every flight blanked one caption in the crate
     and put it back afterwards. Only .sleeve-stack is cloned, so only
     .sleeve-stack may hide. */
  _hideSleeveArt(sleeveEl, hidden) {
    const stack = sleeveEl?.querySelector('.sleeve-stack');
    if (!stack) return;
    stack.style.visibility = hidden ? 'hidden' : '';
    if (hidden) this._hiddenSleeves.add(sleeveEl);
    else this._hiddenSleeves.delete(sleeveEl);
  }

  /* A FLIGHT ANIMATION THAT SOMETHING ELSE CAN STOP. animate() is fine for
     everything that runs to completion; a record in the air has to be
     interruptible, because the next selection cannot wait 2 seconds to find out
     the last one is obsolete. Cancelling makes `finished` reject, which the
     helper turns into a resolved false -- so the awaiting code carries straight
     on to its own generation check and tears itself down. */
  _fly(el, keyframes, options) {
    const anim = el.animate(keyframes, { fill: 'both', ...options });
    this._flights.add(anim);
    return anim.finished.then(() => true, () => false)
      .finally(() => this._flights.delete(anim));
  }

  /* Called at the top of every selection. Cancelling alone would be enough in
     principle -- each superseded trip removes its own stand-ins on the way out --
     but "in principle" is what put two copies of a record on screen. Emptying
     the layer as well makes it true by construction: at the start of a
     selection, nothing is in the air. */
  _abortFlights() {
    for (const anim of this._flights) anim.cancel();
    this._flights.clear();
    this._clearFlight();
    for (const el of [...this._hiddenSleeves]) this._hideSleeveArt(el, false);
  }

  _onFlightScroll() {
    const pan = this.el?.flight;
    if (!pan || !pan.childElementCount) return;
    pan.style.transform = `translate(${-window.scrollX}px, ${-window.scrollY}px)`;
  }

  /* `left` and `top` arrive as viewport coordinates, straight off a
     getBoundingClientRect. The scroll offset converts them to DOCUMENT ones,
     which is what makes them survive a scroll — the pan carries the difference
     back out. Set the pan here as well as on scroll, or a flight begun on an
     already-scrolled page starts in the wrong place. */
  _makeFlier(className, left, top, width, height) {
    const el = document.createElement('div');
    el.className = className;
    Object.assign(el.style, {
      left: `${left + window.scrollX}px`, top: `${top + window.scrollY}px`,
      width: `${width}px`, height: `${height}px`,
    });
    this.el.flight.appendChild(el);
    this._onFlightScroll();
    return el;
  }

  /* PER-TRIP, because two trips now run at once: the record leaving and the
     record arriving are in the air together, and emptying the whole layer would
     have each one delete the other's stand-ins. Called bare it still clears
     everything, which is what a teardown wants. */
  _clearFlight(...els) {
    if (!els.length) { this.el.flight.innerHTML = ''; return; }
    for (const el of els) el?.remove();
  }

  /* ---- platter + tonearm ----------------------------------------------- */

  /**
   * Ease the platter's rotation rate toward `target` over `ms`.
   * Resolves when the ramp completes.
   */
  /* A DECK STOPS WHERE IT STOPS. This used to carry on to the top of the turn
     when the platter came to rest, so the label would finish upright — which is
     a tidy idea and completely wrong. Carl: "when the song is stopped or paused,
     the vinyl rotates really fast to go back to its original position, which is
     not at all what a record player would do when the music is stopped." He is
     right, and it was worse than tidy: the drift ran for up to 1.1s AFTER the
     ramp had already brought the platter to a halt, so a record that had visibly
     stopped would set off again.

     Nothing parks now. The rotation is only ever reset in _takeRecord, on an
     EMPTY platter, so a record you have just put on sits square and a record you
     have just stopped sits wherever the motor left it. */
  _rampSpin(target, ms) {
    cancelAnimationFrame(this._spinRamp);
    const anim = this._spin;
    if (!anim) return Promise.resolve();

    const from = anim.playbackRate;
    if (target > 0) anim.play();
    if (ms <= 0 || from === target) {
      anim.playbackRate = target;
      if (target === 0) anim.pause();
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const start = performance.now();
      const step = (now) => {
        const t = clamp((now - start) / ms, 0, 1);
        // easeOutCubic: quick off the mark, settles gently — like a real motor.
        const eased = 1 - Math.pow(1 - t, 3);
        anim.playbackRate = from + (target - from) * eased;
        if (t < 1) {
          this._spinRamp = requestAnimationFrame(step);
        } else {
          anim.playbackRate = target;
          if (target === 0) anim.pause();
          resolve();
        }
      };
      this._spinRamp = requestAnimationFrame(step);
    });
  }

  /** Move the tonearm. `where` is 'rest' | 'start' | 'end' | a number 0..1. */
  /* How long the arm takes to get anywhere, straight off the element. */
  _armSwingMs() {
    const d = getComputedStyle(this.el.tonearm).transitionDuration || '0s';
    return Math.max(0, ...d.split(',').map((v) => (parseFloat(v) || 0) * 1000));
  }

  _setArm(where, { lift = false, tracking = false } = {}) {
    const arm = this.el.tonearm;
    this._armAt = where;
    arm.dataset.tracking = String(tracking);
    this.style.setProperty('--lift', lift ? '1' : '0');

    if (typeof where === 'number') {
      const a = this._armAngles();
      const angle = a.start + (a.end - a.start) * clamp(where, 0, 1);
      this.style.setProperty('--arm-angle', `${angle.toFixed(3)}deg`);
      return;
    }
    this.style.setProperty('--arm-angle', `var(--arm-${where})`);
  }

  /** Read the configured angles so themes can override the geometry. */
  _armAngles() {
    const cs = getComputedStyle(this);
    const num = (name, fallback) => {
      const v = parseFloat(cs.getPropertyValue(name));
      return Number.isFinite(v) ? v : fallback;
    };
    return { start: num('--arm-start', -42.4), end: num('--arm-end', -25.5) };
  }

  /* ---- playback -------------------------------------------------------- */

  async _startPlayback(gen) {
    try {
      await this.audio.play();
    } catch (err) {
      if (gen !== this._gen) return;

      // A new selection cancelled this one — the newer sequence owns the deck.
      if (err?.name === 'AbortError') return;

      this._setArm('start', { lift: true });
      await this._rampSpin(0, 600);

      // NotAllowedError is the autoplay policy: the media is fine, the browser
      // just wants a gesture. Anything else means the source itself failed, and
      // the 'error' listener has already written a more useful message — don't
      // clobber it with a misleading "press play".
      if (err?.name === 'NotAllowedError') {
        this._setStatus('Press play to start the record.');
      }
      this._syncButtons();
    }
  }

  async _resume() {
    if (this.current === -1 || this._busy) return;
    const gen = this._gen;
    const track = this._tracks[this.current];
    /* A SONG THAT DIDN'T LOAD LOADS AGAIN: after a failed load, play (here, the bar's, or its sleeve tapped again) did
       nothing until another song was picked (the officers' round, 10 Nov 2026). Now it asks for the file again. */
    if (this.audio.error) { this._setStatus(''); this.audio.src = track.src; this.audio.load(); }
    this._setArm(this._progress(), { lift: true });
    await this._rampSpin(rpmRate(track.rpm), 700);
    if (gen !== this._gen) return;
    this._setArm(this._progress(), { lift: false });
    await this._startPlayback(gen);
  }

  _progress() {
    const d = this.audio.duration;
    return Number.isFinite(d) && d > 0 ? clamp(this.audio.currentTime / d, 0, 1) : 0;
  }

  _wireAudio() {
    const a = this.audio;

    a.addEventListener('play', () => {
      this._startTick();
      this._syncButtons();
    });

    a.addEventListener('pause', () => {
        this._stopTick();
      this._syncButtons();
      // A pause that isn't part of a record change lifts the needle and lets
      // the platter coast down, same as reaching for the cue lever.
      if (!this._busy && !a.ended) {
        /* A stop wants the platter to coast down exactly like this, but NOT the
           arm put back on the groove -- a stop parks it. */
        if (!this._stopping) this._setArm(this._progress(), { lift: true });
        this._rampSpin(0, 900);
      }
    });

    a.addEventListener('ended', async () => {
      const gen = this._gen;
      this._setArm('end', { lift: true });
      await this._rampSpin(0, 1200);
      if (gen !== this._gen) return;
      this._setArm('rest', { lift: true });
      this._syncButtons();

      /* No message when a side ends — the arm parking and the platter
         coasting down already say it, and Carl does not want the page
         narrating itself. */
      if (this.hasAttribute('autoadvance') && this._tracks.length > 1) {
        this._select((this.current + 1) % this._tracks.length);
      }
    });

    a.addEventListener('loadedmetadata', () => {
      this.el.scrub.setAttribute('aria-disabled', 'false');
      this._syncButtons();
    });

    a.addEventListener('timeupdate', () => this._paintProgress());


    a.addEventListener('error', () => {
      const track = this._tracks[this.current];
      this._busy = false;
      this._setStatus(
        'That one didn’t load. Tap it to try again.',   // DRAFT 1 on the officers' round (10 Nov 2026)
        true,
      );
      this._rampSpin(0, 500);
      this._setArm('rest', { lift: true });
      this._syncButtons();
    });
  }

  /* ---- per-frame tonearm tracking -------------------------------------- */

  _startTick() {
    this._stopTick();
    const step = () => {
      if (!this.audio.paused && !this._busy) {
        this._setArm(this._progress(), { lift: false, tracking: true });
      }
      this._tick = requestAnimationFrame(step);
    };
    this._tick = requestAnimationFrame(step);
  }

  _stopTick() {
    cancelAnimationFrame(this._tick);
    this._tick = null;
    if (this.el?.tonearm) this.el.tonearm.dataset.tracking = 'false';
  }

  /* ---- transport UI ---------------------------------------------------- */

  _wireControls() {
    const { playBtn, stopBtn } = this.el;

    playBtn.addEventListener('click', () => {
      if (this.current === -1) return this._select(0);
      if (this.audio.paused) this._resume(); else this.pause();
    });

    /* STOP is not pause. It takes the needle off and sends the side back to
       the top, so the next press of play starts the record again rather than
       resuming it — which is what the button on a deck does. */
    const { scrub } = this.el;
    scrub.addEventListener('pointerdown', (e) => {
      if (scrub.getAttribute('aria-disabled') === 'true') return;
      this._dragging = true;
      scrub.dataset.dragging = 'true';
      scrub.setPointerCapture?.(e.pointerId);
      this._seekFromPointer(e);
      window.addEventListener('pointermove', this._onPointerMove);
      window.addEventListener('pointerup', this._onPointerUp);
    });
    scrub.addEventListener('keydown', this._onKeyScrub);

    stopBtn.addEventListener('click', () => {
      /* THE 'pause' LISTENER WOULD UNDO THIS. It puts the arm back on the
         current groove, which is right for a pause and wrong for a stop, and it
         runs in a task queued by pause() -- so it lands AFTER everything here
         and wins. Hence a flag that outlives this turn, cleared in a task queued
         after that one. Without it, stopping left the arm hovering over the
         lead-in groove instead of on its rest, which is where it belongs. */
      this._stopping = true;
      this.pause();
      this.audio.currentTime = 0;
      this._paintProgress();
      this._setArm('rest', { lift: true });
      setTimeout(() => { this._stopping = false; }, 0);
    });
  }

  _onPointerMove(e) { if (this._dragging) this._seekFromPointer(e); }

  _onPointerUp() {
    this._dragging = false;
    this.el.scrub.dataset.dragging = 'false';
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
  }

  _seekFromPointer(e) {
    const rect = this.el.scrub.getBoundingClientRect();
    this._seekRatio(clamp((e.clientX - rect.left) / rect.width, 0, 1));
  }

  _onKeyScrub(e) {
    if (this.el.scrub.getAttribute('aria-disabled') === 'true') return;
    const d = this.audio.duration;
    if (!Number.isFinite(d)) return;

    const jump = e.shiftKey ? 30 : 5;
    let handled = true;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowUp':   this.audio.currentTime = clamp(this.audio.currentTime + jump, 0, d); break;
      case 'ArrowLeft':  case 'ArrowDown': this.audio.currentTime = clamp(this.audio.currentTime - jump, 0, d); break;
      case 'Home': this.audio.currentTime = 0; break;
      case 'End':  this.audio.currentTime = Math.max(0, d - 0.25); break;
      default: handled = false;
    }
    if (handled) { e.preventDefault(); this._paintProgress(); }
  }

  _seekRatio(ratio) {
    const d = this.audio.duration;
    if (!Number.isFinite(d)) return;
    this.audio.currentTime = ratio * d;
    this._paintProgress();
    // Jump the arm straight to the new groove instead of easing to it.
    if (this.audio.paused) this._setArm(ratio, { lift: true });
  }

  _paintProgress() {
    const { played, knob, scrub } = this.el;
    const p = this._progress();
    const pct = `${(p * 100).toFixed(3)}%`;
    played.style.width = pct;
    knob.style.left = pct;
    scrub.setAttribute('aria-valuenow', (p * 100).toFixed(1));
    scrub.setAttribute('aria-valuetext',
      `${formatTime(this.audio.currentTime)} of ${formatTime(this.audio.duration)}`);
  }

  _updateNowPlaying(track) {
    this.el.npTitle.textContent = track.title;
    // the artist alone under the title, as on Carl's deck (GREG'S DECK, above)
    this.el.npMeta.textContent = this.hasAttribute('data-art') ? (track.artist || '')
      : [track.artist, track.role, track.year].filter(Boolean).join(' · ') || 'On the deck';
    this._fitWords();
    this.el.played.style.width = '0%';
    this.el.knob.style.left = '0%';

    // Reset every other sleeve back to "in the crate" -- but not one whose record is still fading off the deck,
    // which has it back once it has gone (FROM CARLBAHNER, A RECORD FADES AWAY).
    this.el.shelf.querySelectorAll('.sleeve').forEach((el) => {
      if (el.dataset.index !== String(this.current) && el.dataset.state !== 'flying') el.dataset.state = '';
    });

    this.dispatchEvent(new CustomEvent('trackchange', {
      detail: { index: this.current, track },
      bubbles: true,
    }));
  }

  _syncButtons() {
    const { playBtn, stopBtn } = this.el;
    const has = this._tracks.length > 0;
    const playing = has && !this.audio.paused;

    playBtn.disabled = !has || this._busy;
    stopBtn.disabled = !has || this._busy;

    playBtn.innerHTML = playing ? ICONS.pause : ICONS.play;
    playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    playBtn.title = playing ? 'Pause' : 'Play';
  }

  _setStatus(message, isError = false) {
    this.el.status.textContent = message;
    this.el.status.dataset.error = String(isError);
  }
}

/* -------------------------------------------------------------------------- */
/* small utilities                                                             */
/* -------------------------------------------------------------------------- */

/* How long a record takes to fade away off the deck (FROM CARLBAHNER: "over the course of a second or so"). */
const FADE_MS = 1000;
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rpmRate(rpm) {
  const value = Number(rpm);
  return Number.isFinite(value) && value > 0 ? value / BASE_RPM : 1;
}

function normaliseTrack(raw) {
  return {
    title: raw.title ?? 'Untitled',
    artist: raw.artist ?? '',
    role: raw.role ?? '',
    year: raw.year ?? '',
    src: raw.src ?? '',
    sleeve: raw.sleeve ?? '',
    // Default the record label to the sleeve art, centre-cropped by the CSS.
    label: raw.label ?? raw.sleeve ?? '',
    rpm: raw.rpm ?? 33.333,
    style: raw.style ?? '',
  };
}

/**
 * If a framework set `.tracks` before the element upgraded, the value is sitting
 * on the instance shadowing the prototype accessor. Move it through the setter.
 */
function upgradeProperty(el, prop) {
  if (!Object.prototype.hasOwnProperty.call(el, prop)) return;
  const value = el[prop];
  delete el[prop];
  el[prop] = value;
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

if (!customElements.get('vinyl-player')) {
  customElements.define('vinyl-player', VinylPlayer);
}




/* ------------------------------------------------------------------------ *
 * Demo audio, synthesised in the browser.
 *
 * The hosted page can't fetch anything, so rather than embedding megabytes of
 * base64 WAV we generate the same short arpeggios the repo's placeholder
 * script writes, and hand each one to the player as a data: URI. Real
 * deployments just point the track's "src" at an MP3 file.
 * ------------------------------------------------------------------------ */

const RATE = 16000;
const SECONDS = 9;

function toneDataUri(root, degrees) {
  const frames = RATE * SECONDS;
  const noteLen = RATE * 0.75;
  const bytes = new Uint8Array(44 + frames * 2);
  const view = new DataView(bytes.buffer);

  const ascii = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };

  ascii(0, 'RIFF');
  view.setUint32(4, 36 + frames * 2, true);
  ascii(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);        // PCM chunk size
  view.setUint16(20, 1, true);         // PCM
  view.setUint16(22, 1, true);         // mono
  view.setUint32(24, RATE, true);
  view.setUint32(28, RATE * 2, true);  // byte rate
  view.setUint16(32, 2, true);         // block align
  view.setUint16(34, 16, true);        // bits per sample
  ascii(36, 'data');
  view.setUint32(40, frames * 2, true);

  for (let n = 0; n < frames; n += 1) {
    const t = n / RATE;
    const semitone = degrees[Math.floor(n / noteLen) % degrees.length];
    const freq = root * Math.pow(2, semitone / 12);

    const pos = (n % noteLen) / noteLen;
    const env = Math.exp(-3.2 * pos);                       // per-note pluck
    const fade = Math.min(1, t / 0.4, (SECONDS - t) / 0.6); // in / out

    const v = Math.sin(2 * Math.PI * freq * t) * 0.55
            + Math.sin(2 * Math.PI * freq * 2 * t) * 0.16
            + Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.22;

    view.setInt16(44 + n * 2, Math.max(-1, Math.min(1, v * env * fade * 0.7)) * 32767, true);
  }

  let binary = '';
  const CHUNK = 0x8000;   // btoa chokes on very large apply() argument lists
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

/* portfolio copy: tracks come from the inline <script type="application/json"> inside <vinyl-player> below, not from a demo list -- see build_portfolios.py. */
