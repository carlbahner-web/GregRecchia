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
- His branding, read off his Squarespace page (saved as a PDF, 10 Nov 2026): black and butter-cream type (still the hero's), and his three fonts, Encode Sans Condensed, Krub and Alfa Slab One, saved in `site/fonts/` (latin only).
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
- The body below the hero, redesigned: "can you re think the design of the main body entirely? Leave the hero section
  unchanged for the moment but show off your modern web dev chops" (Carl, 10 Nov 2026). Colours from a picture he sent
  ("What about these colors? Ignore the copy and font"): off-white page, charcoal, slate, dusty blue, ochre, all named
  at the top of THE BODY in the styles; ochre is never for words on the off-white (too light). It replaced one wood
  surface with framed panels (the wood photo and his old site's tints), which he'd come to dislike ("I don't like the
  whole page scheme"). In it: a bar that drops in at the top once the video is gone, with a scroll progress line; Greg
  standing in the live room (`video/greg.mp4`, cut from his `For_Website.mov`) beside his intro; things rising into
  place as you scroll (CSS scroll-driven, no script, none for less motion); the record player from his MGMT page (below), with a
  small player at the foot of the screen while a song plays and the record player is out of sight, and the phone's
  lock-screen controls (Media Session); the quote as a
  snap row ready for more; the contact form in charcoal with labels that float up. The hero is untouched.
- Text sizes and colours are sets, picked by Carl on the consistency officer's quiz (10 Nov 2026): six sizes as
  `--text-*` at the top of the styles, nothing faded. Colours: the hero's white and butter, the body's own set (above).
  `python3 tools/check_consistency.py` lists anything outside them; run it before every change. The rest of the
  quiz (https://claude.ai/artifact/AM6gVs8Rb5PWBfe1Q6VbEG) saves its answers in its own database: read them with
  ArtifactData `list`, collection `answers`. The officer's notes are in `.officers/` (not in git).
- Every word is his, from the Squarespace page. Nothing on the page is written for him.
- The player is the record player from his StudioLand MGMT profile page, `<vinyl-player>`: "I want to take the
  portfolio player from his profile page and migrate it to his website but with different images instead of my Slmgmt
  branded art" (Carl, 10 Nov 2026). Copied from studiolandmgmt-site `portfolio-player-kit/src/vinyl-player.js` into
  `site/vinyl/vinyl-player.js`. It now differs from the kit: three of Carl's fixes to the record's movement on
  carlbahner.com (its `src/nav.mjs`) are carried over, each marked FROM CARLBAHNER: the old record fades away on the
  deck instead of flying home, one record moves at a time (a pick mid-flight is held, not cancelled), and on a phone
  no tap flash and no hover slide ("can you look at the mechanics from the Carlbahner site repo? I fixed some quirks
  with the vinyl movement", Carl, 10 Nov 2026). The kit and his MGMT pages don't have them yet. Never put `.rise` (or
  any transform) on the player or round it: it shifts the flight layer and every record in the air is drawn off its
  path. And his deck from carlbahner.com ("The 3d buttons, the placement of words. The removal of the weird shadow?",
  then "All of it", Carl, 10 Nov 2026), GREG'S DECK at the end of the component's styles: play and stop as raised keys
  that press down while held, a raised knob on a cream progress line, the title over the artist in capitals that blur
  in once the record lands and shrink to fit, keys and words sized and moved as he set them, the record and arm 1% to
  the corner and 1.5% to the front, the whole cover on the label. Its four drawings are Greg's versions of Carl's,
  `site/vinyl/art/`, made by `tools/vinyl_art.py`, every colour Greg's ("we need to change the colors of any
  illustrations"): the deck from carlbahner's own (`assets/deck-plinth.webp` there: no thick shadow along its bottom
  and right, a thinner outline) in slate; the platter a deep slate disc with Greg's mark where the STUDIOLAND MGMT
  watermark was; the record's black and the arm's ink his charcoal, their cream his off-white, the label squares and
  the arm's yellow ochre. Nothing boils: "Oh we don't want boil for Greg" (Carl, 10 Nov 2026); the kit's boil script
  (MGMT pages) is never loaded here, and carlbahner's boiling things are not brought over. Its colours and fonts (his, not
  StudioLand's licensed ones) are set on `vinyl-player` in the styles. It replaced a waveform deck built the same day.
  Four songs whose masters and art came from that MGMT page; a song is one row in the JSON inside `<vinyl-player>`
  plus its MP3 in `site/audio/` (keep each under ~40 MB) and cover in `site/img/`.
- Contact goes to Netlify Forms (form name `contact`). Set the email it notifies in Netlify's form settings.

## Waiting on Greg
- The other five songs from his Squarespace player: Naskar (Mishaal Tamer), Just Chill, Daylight (Ryan Pol…),
  Small Talk (JUST …), To My Grave (iiswe…). Their names were cut off in the PDF.
- The rest of his testimonials (only Mishaal Tamer's slide was in the PDF), each with a photo.
- His domain pointed at Netlify.
