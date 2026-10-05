---
name: October 4
description: A Brewers fan remembrance told through real broadcast frames and a six-pitch at-bat.
colors:
  navy: "#101b28"
  deep: "#0b1420"
  cream: "#f4efdf"
  muted: "#c1c8c9"
  gold: "#f3c455"
  line: "#3f4b54"
typography:
  display:
    fontFamily: "Bricolage, sans-serif"
    fontSize: "clamp(62px, 6.7vw, 96px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Bricolage, sans-serif"
    fontSize: "clamp(38px, 4vw, 58px)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.8
rounded:
  circle: "50%"
spacing:
  content-gutter: "48px"
  tablet-gutter: "34px"
  mobile-gutter: "25px"
components:
  next-pitch:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.cream}"
    padding: "14px 19px"
  watch-link:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.navy}"
    padding: "17px 23px"
---

# Design System: October 4

## Overview

The real evening light at American Family Field establishes the setting. Large, plain lettering introduces the matchup; two supplied player portraits preserve its personal tension. A cream passage presents the pitch record, followed by a navy passage with the final score.

This is an independent Brewers fan remembrance. The creator confirmed that “our best” means Jackson Chourio and “their best” means San Diego's top closer, Mason Miller. Preserve that specific matchup and the Brewers voice. “Their best” does not mean the best Padres player overall. No official MLB endorsement is claimed.

This document records `index.html`, `styles.css`, and `app.js` after the desktop and mobile visual review on October 5, 2026. The reviewer returned “ship” with no material fixes.

## Colors

Navy is the main surface; deep navy distinguishes the game situation. Cream supplies both dark-surface text and the contrasting at-bat surface. Gold emphasizes the “Their best.” headline, Milwaukee’s result, and the watch action. Muted text and fine line color support facts without competing with the photographs.

The at-bat passage uses dark supporting text (`#465460`), fine rules (`#b9bdb7` / `#bcc1ba`), a selected pitch fill (`#e4dfc4`), and a winning pitch fill (`#d9e1c7`). Green (`#39502e`) identifies the winning score and hit mark. The photograph supplies the sunset color.

## Typography

Self-hosted Bricolage Grotesque Bold, registered as **Bricolage**, supplies headings, player names, scores, and velocity. Self-hosted Manrope Regular and Bold supply prose, labels, and controls. Keep their license files in `assets/fonts/`.

The hero uses the display role above. Desktop player names are 52px; the closing headline reaches 72px. Prose is generally 14–18px, with 12–13px supporting facts and labels. Counts, pitch speeds, and scores use tabular numerals to keep their positions stable.

## Layout

The story order is masthead, ballpark photograph, game situation, paired portraits, at-bat, result, repeated ballpark photograph, and credits. Content has a 1240px maximum width including its gutters. The hero and closing photograph fill the page width.

- At **1000px and below**, content gutters become 34px, portrait height becomes 460px, and the game strip omits the series label.
- At **650px and below**, gutters become 25px. The hero lettering moves toward the lower part of the photograph; the game strip becomes two columns. Portraits remain side by side at 340px high. The pitch stage precedes its list, the result becomes one column, and the footer stacks.
- At **360px and below**, gutters become 20px, the hero title becomes 50px, and portraits become 300px high.
- At **1600px and above**, hero lettering, captions, and game-strip content align with the centered 1144px inner content width.

Keep both faces visible at mobile widths. Use `object-fit: cover` for display crops and retain the complete originals. Desktop hero positioning is 50% 43%; mobile is 52% 27%, with a stronger bottom gradient for text readability.

## Elevation & Depth

There are no card shadows. Depth comes from full-width tonal changes and dark gradients over the real images. Fine rules divide facts and pitch rows. Preserve the visible ballpark and players beneath those gradients.

## Shapes

Photographs, sections, and action buttons have square corners. Circles are limited to the central “vs.” marker and single-letter pitch marks. The small gold diamond in the game strip represents the loaded bases. Arrows and the hit check use simple stroked SVGs.

## Components

The masthead keeps the wordmark and original-clip link prominent. The game strip states the situation before the at-bat. The result uses two aligned score rows, with Milwaukee in gold. The closing gold action opens the actual MLB clip; credits remain available in a native disclosure.

The replay starts on pitch one. Every pitch row is a button, and **Next pitch** advances through six pitches. Selecting a row updates velocity, pitch type, description, and count; only the selected row has `aria-current="step"`. Pitch six changes Milwaukee’s score from 2 to 4, changes the state to “Final · Brewers win,” and changes the action to **Replay the at-bat**. The next activation returns to pitch one. There is no automatic playback.

Keep the full pitch list and final result in semantic HTML when JavaScript is unavailable. Replay controls appear only when initialized. A polite live region announces pitch changes. Keyboard focus is a 3px gold outline, with a dark amber outline on the cream surface. The winning score has one 450ms settle animation; reduced motion removes animations, transitions, and smooth scrolling.

## Do's and Don'ts

- Use the supplied broadcast screenshots, factual pitch data, and source links; preserve the complete PNG originals and image credits.
- Keep the confirmed comparison intact: Chourio against San Diego's top closer, Miller, from the user's Brewers perspective.
- Keep controls usable by keyboard, text readable over images, and the complete outcome available without JavaScript.
- Do not replace real frames with generated players, a fabricated ballpark, ASCII imagery, or decorative alterations to the photographs.
- Do not add autoplay, unrelated statistics, shadowed card grids, or decoration that delays the matchup and outcome.
