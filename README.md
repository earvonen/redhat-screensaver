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
- `openshift/deployment.yaml`, `openshift/service.yaml`, `openshift/route.yaml` — run the image on OpenShift
- `tekton/` — git-clone `Task`, Kaniko build `Task`, `Pipeline`, and example `PipelineRun`

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

2. **Deployment, Service, Route** — run the container from the `ImageStream` (`redhat-screensaver:latest`) and expose it with an edge TLS **Route**. The **Deployment** uses an **`image.openshift.io/triggers`** annotation so new Tekton pushes roll the app automatically. Apply in the **same namespace** as the `ImageStream`:

   ```bash
   oc apply -f openshift/deployment.yaml
   oc apply -f openshift/service.yaml
   oc apply -f openshift/route.yaml
   ```

   Until the image tag exists, pods may stay in **ImagePullBackOff**; run the Pipeline once, or build/push the image, then wait for the rollout. OpenShift shows the URL with:

   ```bash
   oc get route redhat-screensaver -o jsonpath='{.spec.host}{"\n"}'
   ```

3. **Tasks & Pipeline** — a **git-clone** Task (default clone from [https://github.com/earvonen/redhat-screensaver](https://github.com/earvonen/redhat-screensaver) on `main`), then Kaniko build/push (**no privileged containers**). The Pipeline targets  
   `$(image-registry)/$(PipelineRun.namespace)/redhat-screensaver:$(image-tag)` (defaults match the ImageStream name and `latest` tag):

   ```bash
   oc apply -f tekton/task-git-clone.yaml
   oc apply -f tekton/task-build-push.yaml
   oc apply -f tekton/pipeline.yaml
   ```

4. **Service account** — allow the Tekton `pipeline` service account (or whichever SA you set on the `PipelineRun`) to push images in the namespace:

   ```bash
   oc policy add-role-to-user system:image-pusher system:serviceaccount:YOUR_NAMESPACE:pipeline -n YOUR_NAMESPACE
   ```

5. **Workspaces** — the Pipeline needs:
   - **shared-workspace:** starts empty; the **fetch-source** task clones the Git repo into it, then **build-and-push** uses the same workspace as the Kaniko context. `pipelinerun.example.yaml` uses **`emptyDir`**. You can switch to a PVC (see `tekton/pvc.example.yaml`) if you need more space or persistence.
   - **dockerconfig:** a Secret of type **kubernetes.io/dockerconfigjson** (so Kaniko can push). Bind it in `pipelinerun.example.yaml` (`REPLACE_WITH_DOCKERCONFIGJSON_SECRET`). Create one with registry credentials, or on OpenShift use a suitable secret from `oc describe serviceaccount pipeline` after linking pull/push credentials.

   Override clone source or branch on the Pipeline with params **`git-url`** and **`git-revision`** on the `PipelineRun` if needed.

The build `Task` uses **Kaniko** (`gcr.io/kaniko-project/executor`) plus a small **ubi-micro** prep step; neither step uses `privileged: true`. Your cluster must be allowed to **pull** the Kaniko image (mirror it if `gcr.io` is blocked). The Task passes **`--skip-tls-verify`** so pushes to the default internal registry hostname usually work without extra CA wiring; tighten that if your policy requires verified TLS.
