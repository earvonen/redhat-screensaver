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
- `Containerfile` — production container image
- `openshift/imagestream.yaml` — `ImageStream` for the app image
- `tekton/` — Buildah `Task`, `Pipeline`, and example `PipelineRun`

Animation tuning (speed, angle range) lives in `public/app.js`.

## Container image

Build locally:

```bash
docker build -f Containerfile -t redhat-screensaver:latest .
docker run --rm -p 3000:3000 redhat-screensaver:latest
```

Podman discovers `Containerfile` in the context by default, so `podman build -t redhat-screensaver:latest .` is enough.

## OpenShift & Tekton

Resources live under `openshift/` and `tekton/`.

1. **ImageStream** — defines `redhat-screensaver` so the internal registry can associate pushes with a stream:

   ```bash
   oc apply -f openshift/imagestream.yaml
   ```

2. **Task & Pipeline** — Buildah-based build/push and a Pipeline that targets  
   `$(image-registry)/$(PipelineRun.namespace)/redhat-screensaver:$(image-tag)` (defaults match the ImageStream name and `latest` tag):

   ```bash
   oc apply -f tekton/task-build-push.yaml
   oc apply -f tekton/pipeline.yaml
   ```

3. **Service account** — allow the Tekton `pipeline` service account (or whichever SA you set on the `PipelineRun`) to push images in the namespace:

   ```bash
   oc policy add-role-to-user system:image-pusher system:serviceaccount:YOUR_NAMESPACE:pipeline -n YOUR_NAMESPACE
   ```

4. **Workspace** — the Pipeline needs a workspace with the repo root (including `Containerfile`). See `tekton/pvc.example.yaml` for a sample PVC; populate it with a git clone or copy of the sources, then start a run from `tekton/pipelinerun.example.yaml` (set `metadata.namespace` and match the PVC name).

The build `Task` runs **privileged** Buildah with `vfs` storage, which is a common OpenShift Pipelines pattern. If your cluster restricts that, switch to an approved build strategy (for example an external CI that pushes the image, or a cluster-supported build task).

**Pull secret:** the Task uses `registry.redhat.io/ubi9/buildah`. Your cluster needs credentials to pull that image (often already configured on OpenShift).
