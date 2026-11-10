# gregrecchiaproductions.com

Greg Recchia's one-page site, replacing his Squarespace page. Greg is Carl's student; Carl manages him (StudioLand MGMT).
Carl, 10 Nov 2026: "something more like a one pager rather than an elaborate three.js behemoth like my site", in
"Definitely his branding".

No framework, no build step. Netlify publishes `site/` (`netlify.toml`).

Until it is on Netlify, Carl sees it at https://claude.ai/artifact/XA2wrXqQrUkxmvVJyUHMHd (private to him), built by
`python3 tools/build_preview.py <dir>` and published with its `img/`, `audio/` and `video/` beside it. The site's paths are
relative so the same page works there; its form only says it is a preview.

## What's in it
- `site/index.html`: the whole page, styles and script inline. Sections in his Squarespace order: hero, intro, the player,
  testimonials, contact. His five steps came off: "Yeah take em out" (Carl, 10 Nov 2026), as they repeated his intro
  (vocals, transitions, ear candy) before the songs; kept in `archive/five-steps.html` to put back.
- His branding, read off his Squarespace page (saved as a PDF, 10 Nov 2026): black, the wood (`img/wood-tile.webp`),
  butter-cream type, tinted panels in butter frames, and his three
  fonts, Encode Sans Condensed, Krub and Alfa Slab One, saved in `site/fonts/` (latin only).
- His name in FBS Funegral, on trial: "Can we isolate this and try it?" (Carl, 10 Nov 2026, with a type sample of
  GREG RECCHIA). Traced into `img/wordmark.svg` and drawn as a CSS mask (`.wordmark`) so it takes any colour; the
  sample faded out over the A's right foot, so each column was darkened back to full ink before tracing. In the hero
  it replaces the logo's small navy name, under his mark, with
  MIXER & CO-PRODUCER spaced under it, in white: "Instead of productions, can it say MIXER & CO-PRODUCER" (Carl, 10 Nov 2026). It is a commercial font: Greg needs a licence for it as a logo if he keeps it.
- The headline, EARWORM ARCHITECT FOR / HOOK-OBSESSED INDIE ARTISTS, in the MIXER & CO-PRODUCER line's type
  (Encode Sans Condensed 600, spaced capitals), bigger: "can you use that for the architect lines? Maybe a bigger size
  though?" (Carl, 10 Nov 2026). Two lines, broken after FOR. Where the headline and buttons finally go is his to pick
  (A in the wood, B a strip along the video's foot, C the buttons top right; B recommended).
- The hero's background is Greg at the console, looping silently behind the type: "Can we use one of these for the
  top of the page? Like a background video?" (Carl, 10 Nov 2026, with three clips). Of the three it is
  `Contact_Vid.mov`; in the other two he stands facing the camera in the middle of the frame, where the headline sits.
  `video/console.mp4` (H.264, no sound, 1.1 MB) with its first frame as the poster; darkened by `.hero::before`;
  held on that frame for anyone who asks for less motion. Upright phones crop toward him.
- His mark, a circle with two arcs, flipped: "Can we flip this horizontally and use it to replace the old waveform
  logo?" (Carl, 10 Nov 2026). Traced into `img/mark.svg` and painted as a mask like the wordmark: white in the hero,
  cream in the footer, butter as the tab icon (`img/favicon.svg`). The old headphone-and-waveform logo is gone from
  the site. `img/share.jpg`, the picture a shared link shows, is the hero's mark and name over the console clip.
- One wood surface from the video to the footer, the player and the form on it as dark panels in the cards' butter
  frame: "It feels so jarring from one to the next" (Carl, 10 Nov 2026, of black and wood bands taking turns), picked
  over an all-dark page on mockups ("Middle column"). The wood is tiled as itself and its mirror, so it has no seam.
- Text sizes and colours are sets, picked by Carl on the consistency officer's quiz (10 Nov 2026): six sizes as
  `--text-*` at the top of the styles, white only over the video, cream for everything else read, nothing faded.
  `python3 tools/check_consistency.py` lists anything outside them; run it before every change. The rest of the
  quiz (https://claude.ai/artifact/AM6gVs8Rb5PWBfe1Q6VbEG) saves its answers in its own database: read them with
  ArtifactData `list`, collection `answers`. The officer's notes are in `.officers/` (not in git).
- Every word is his, from the Squarespace page. Nothing on the page is written for him.
- The player: four songs whose masters and art came from his StudioLand MGMT page (studiolandmgmt-site,
  `deploy-mgmt/greg-recchia/`). Each song's "vibe" is his own line from the Squarespace player. A song is one row in
  `TRACKS` plus its MP3 in `site/audio/` (keep each under ~40 MB) and art in `site/img/`.
- Contact goes to Netlify Forms (form name `contact`). Set the email it notifies in Netlify's form settings.

## Waiting on Greg
- The other five songs from his Squarespace player: Naskar (Mishaal Tamer), Just Chill, Daylight (Ryan Pol…),
  Small Talk (JUST …), To My Grave (iiswe…). Their names were cut off in the PDF.
- The rest of his testimonials (only Mishaal Tamer's slide was in the PDF), each with a photo.
- His domain pointed at Netlify.
