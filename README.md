# Red Hat Screensaver

A small **Node.js + Express** app that serves a static frontend and a PNG over HTTP. The page loads the image from the API and animates it bouncing around the viewport, similar to a classic screensaver.

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer

## Setup

```bash
npm install
```

Place your asset at **`images/redhat.png`**. Without that file, the API returns 404 and the UI shows an error message.

## Run

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000). To use another port, set `PORT` before starting:

- **PowerShell:** `$env:PORT = 8080; npm start`
- **cmd:** `set PORT=8080 && npm start`
- **macOS / Linux:** `PORT=8080 npm start`

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/image` | Returns `images/redhat.png` with `Content-Type: image/png`, or JSON `{ "error": "..." }` with status 404 if the file is missing. |

Static files are served from `public/`. Any other `GET` request falls back to `public/index.html`.

## Project layout

- `server/index.js` — Express server
- `public/` — HTML, CSS, and client script for the screensaver UI
- `images/` — Drop **`redhat.png`** here

Animation tuning (speed, angle range) lives in `public/app.js`.
