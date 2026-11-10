# gregrecchiaproductions.com

Greg Recchia's one-page site, replacing his Squarespace page. Greg is Carl's student; Carl manages him (StudioLand MGMT).
Carl, 10 Nov 2026: "something more like a one pager rather than an elaborate three.js behemoth like my site", in
"Definitely his branding".

No framework, no build step. Netlify publishes `site/` (`netlify.toml`).

## What's in it
- `site/index.html`: the whole page, styles and script inline. Sections in his Squarespace order: hero, intro, his five
  steps, the player, testimonials, contact.
- His branding, read off his Squarespace page (saved as a PDF, 10 Nov 2026): black, the wood (`img/wood.webp`),
  butter-cream type, the five tinted cards with butter frames, his logo (`img/logo.webp`, from the PDF), and his three
  fonts, Encode Sans Condensed, Krub and Alfa Slab One, saved in `site/fonts/` (latin only).
- Every word is his, from the Squarespace page. Nothing on the page is written for him.
- The player: four songs whose masters and art came from his StudioLand MGMT page (studiolandmgmt-site,
  `deploy-mgmt/greg-recchia/`). Each song's "vibe" is his own line from the Squarespace player. A song is one row in
  `TRACKS` plus its MP3 in `site/audio/` (keep each under ~40 MB) and art in `site/img/`.
- Contact goes to Netlify Forms (form name `contact`). Set the email it notifies in Netlify's form settings.

## Waiting on Greg
- The other five songs from his Squarespace player: Naskar (Mishaal Tamer), Just Chill, Daylight (Ryan Pol…),
  Small Talk (JUST …), To My Grave (iiswe…). Their names were cut off in the PDF.
- The rest of his testimonials (only Mishaal Tamer's slide was in the PDF), each with a photo.
- A bigger logo (the PDF's is 451px).
- His domain pointed at Netlify.
