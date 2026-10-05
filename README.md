# October 4, 2026

A Brewers fan remembrance of Jackson Chourio's walk-off against Mason Miller in NLDS Game 2. Built from three supplied broadcast screenshots and the official MLB game record.

Live address after deployment: https://omatty123.github.io/october-four/

This directory is an independent repository. The surrounding META workspace and its private teaching material are excluded.

## Local preview

```sh
python3 -m http.server 8784 --bind 127.0.0.1 --directory /Users/wegehaum/Documents/ChatGPT/META/october-four
```

Open http://127.0.0.1:8784/. Stop the server after use.

## Checks

```sh
node --check app.js
node tests/check-site.mjs
```

GitHub Actions runs the checks and deploys only the page, its assets, and factual game data. Source imagery is retained under `assets/originals`. Credits and font licenses are under `assets`.

The page's outcome remains visible without JavaScript. JavaScript adds an optional six-pitch replay. No analytics, autoplay, accounts, or external runtime dependencies are used.
