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
- `deploy/openshift/` — `ImageStream`, `Deployment`, `Service`, and `Route`
- `deploy/tekton/` — git-clone `Task`, Kaniko build `Task`, `Pipeline`, and example `PipelineRun`
- `deploy.sh` — apply manifests (and optionally start a PipelineRun)

Animation tuning (speed, angle range) lives in `public/app.js`.

## Container image

Build locally:

```bash
docker build -f Containerfile -t redhat-screensaver:latest .
docker run --rm -p 3000:3000 redhat-screensaver:latest
```

Podman discovers `Containerfile` in the context by default, so `podman build -t redhat-screensaver:latest .` is enough.

## OpenShift & Tekton

Resources live under `deploy/openshift/` and `deploy/tekton/`.

### Quick deploy

From a machine with `oc` logged into the target cluster:

```bash
./deploy.sh
```

That applies the ImageStream, Deployment/Service/Route, Tekton Tasks/Pipeline, and grants `system:image-pusher` to the `pipeline` ServiceAccount in the current project.

To also start a build and wait for it:

```bash
./deploy.sh --run-pipeline
```

Useful flags: `-n <namespace>`, `--git-url`, `--git-revision`, `--image-tag`, `--no-wait`. Run `./deploy.sh --help` for details.

Until the image tag exists, pods may stay in **ImagePullBackOff**; use `--run-pipeline` (or apply `deploy/tekton/pipelinerun.example.yaml`) so Kaniko pushes `redhat-screensaver:latest`. The Deployment uses an **`image.openshift.io/triggers`** annotation so new pushes roll the app automatically. OpenShift shows the URL with:

```bash
oc get route redhat-screensaver -o jsonpath='{.spec.host}{"\n"}'
```

### Manual steps

1. **ImageStream** — defines `redhat-screensaver` so the internal registry can associate pushes with a stream:

   ```bash
   oc apply -f deploy/openshift/imagestream.yaml
   ```

2. **Deployment, Service, Route** — run the container from the `ImageStream` (`redhat-screensaver:latest`) and expose it with an edge TLS **Route**. Apply in the **same namespace** as the `ImageStream`:

   ```bash
   oc apply -f deploy/openshift/deployment.yaml
   oc apply -f deploy/openshift/service.yaml
   oc apply -f deploy/openshift/route.yaml
   ```

3. **Tasks & Pipeline** — a **git-clone** Task (default clone from [https://github.com/earvonen/redhat-screensaver](https://github.com/earvonen/redhat-screensaver) on `main`), then Kaniko build/push (**no privileged containers**). The Pipeline targets  
   `$(image-registry)/$(PipelineRun.namespace)/redhat-screensaver:$(image-tag)` (defaults match the ImageStream name and `latest` tag):

   ```bash
   oc apply -f deploy/tekton/task-git-clone.yaml
   oc apply -f deploy/tekton/task-build-push.yaml
   oc apply -f deploy/tekton/pipeline.yaml
   ```

4. **Service account** — the build `Task` logs in to the **internal registry** using the **PipelineRun ServiceAccount token** (mounted automatically). That account still needs permission to push:

   ```bash
   oc policy add-role-to-user system:image-pusher system:serviceaccount:YOUR_NAMESPACE:pipeline -n YOUR_NAMESPACE
   ```

5. **Workspaces** — only **shared-workspace** is required: the **fetch-source** task clones the Git repo into it, then **build-and-push** uses it as the Kaniko context. Because each Task runs in its own Pod, this must be a **PVC** (not `emptyDir`). `deploy.sh` and `pipelinerun.example.yaml` use a **`volumeClaimTemplate`** so Tekton creates a per-run claim automatically.

   Override clone source or branch on the Pipeline with params **`git-url`** and **`git-revision`** on the `PipelineRun` if needed.

6. **Kaniko on OpenShift** — Kaniko needs to run as UID 0. Grant the PipelineRun ServiceAccount the **`anyuid`** SCC (this is not the same as a privileged container):

   ```bash
   oc adm policy add-scc-to-user anyuid -z pipeline -n YOUR_NAMESPACE
   ```

The build `Task` uses **Kaniko** (`gcr.io/kaniko-project/executor`) plus a small **ubi-minimal** step that writes `config.json` from the SA token; neither step uses `privileged: true`. Pushing to registries **other** than the configured **`image-registry`** host may require a different approach (for example a custom `dockerconfig` workspace or external CI). The Task passes **`--skip-tls-verify`** for the default internal registry hostname; tighten that if your policy requires verified TLS.
