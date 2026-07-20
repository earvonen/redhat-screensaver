#!/usr/bin/env bash
# Deploy redhat-screensaver to the current OpenShift project:
# ImageStream, Deployment/Service/Route, Tekton Tasks/Pipeline, image-pusher RBAC,
# and optionally start a PipelineRun.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="${SCRIPT_DIR}/deploy"
OPENSHIFT_DIR="${DEPLOY_DIR}/openshift"
TEKTON_DIR="${DEPLOY_DIR}/tekton"

NAMESPACE="${NAMESPACE:-}"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT:-pipeline}"
RUN_PIPELINE="${RUN_PIPELINE:-false}"
GIT_URL="${GIT_URL:-}"
GIT_REVISION="${GIT_REVISION:-}"
IMAGE_TAG="${IMAGE_TAG:-}"
WAIT="${WAIT:-true}"

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Apply OpenShift runtime manifests and Tekton build resources from deploy/.

Options:
  -n, --namespace <ns>     Target project/namespace (default: current oc context)
  -s, --service-account    PipelineRun ServiceAccount (default: pipeline)
  -r, --run-pipeline       Create a PipelineRun after applying resources
  --git-url <url>          Override PipelineRun git-url param
  --git-revision <rev>     Override PipelineRun git-revision param
  --image-tag <tag>        Override PipelineRun image-tag param
  --no-wait                With --run-pipeline, do not wait for completion
  -h, --help               Show this help

Environment:
  NAMESPACE, SERVICE_ACCOUNT, RUN_PIPELINE, GIT_URL, GIT_REVISION, IMAGE_TAG, WAIT
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "error: required command not found: $1" >&2
    exit 1
  fi
}

log() {
  printf '==> %s\n' "$*"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -n|--namespace)
      NAMESPACE="${2:?}"
      shift 2
      ;;
    -s|--service-account)
      SERVICE_ACCOUNT="${2:?}"
      shift 2
      ;;
    -r|--run-pipeline)
      RUN_PIPELINE=true
      shift
      ;;
    --git-url)
      GIT_URL="${2:?}"
      shift 2
      ;;
    --git-revision)
      GIT_REVISION="${2:?}"
      shift 2
      ;;
    --image-tag)
      IMAGE_TAG="${2:?}"
      shift 2
      ;;
    --no-wait)
      WAIT=false
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "error: unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

require_cmd oc

if [[ -n "${NAMESPACE}" ]]; then
  OC=(oc -n "${NAMESPACE}")
else
  OC=(oc)
  NAMESPACE="$("${OC[@]}" project -q)"
fi

log "Deploying to namespace: ${NAMESPACE}"

log "Applying ImageStream"
"${OC[@]}" apply -f "${OPENSHIFT_DIR}/imagestream.yaml"

log "Applying Deployment, Service, and Route"
"${OC[@]}" apply -f "${OPENSHIFT_DIR}/deployment.yaml"
"${OC[@]}" apply -f "${OPENSHIFT_DIR}/service.yaml"
"${OC[@]}" apply -f "${OPENSHIFT_DIR}/route.yaml"

log "Applying Tekton Tasks and Pipeline"
"${OC[@]}" apply -f "${TEKTON_DIR}/task-git-clone.yaml"
"${OC[@]}" apply -f "${TEKTON_DIR}/task-build-push.yaml"
"${OC[@]}" apply -f "${TEKTON_DIR}/pipeline.yaml"

log "Granting system:image-pusher to ServiceAccount ${SERVICE_ACCOUNT}"
"${OC[@]}" policy add-role-to-user system:image-pusher \
  "system:serviceaccount:${NAMESPACE}:${SERVICE_ACCOUNT}" \
  -n "${NAMESPACE}" >/dev/null

# Kaniko needs UID 0; anyuid is required on OpenShift (not the same as privileged).
log "Granting anyuid SCC to ServiceAccount ${SERVICE_ACCOUNT}"
if ! oc adm policy add-scc-to-user anyuid \
  -z "${SERVICE_ACCOUNT}" \
  -n "${NAMESPACE}" >/dev/null 2>&1; then
  log "Warning: could not grant anyuid (need cluster-admin). Kaniko may fail without it."
fi

start_pipeline_run() {
  local pr_file pr_name
  pr_file="$(mktemp)"
  # shellcheck disable=SC2064
  trap "rm -f '${pr_file}'" RETURN

  {
    cat <<EOF
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  generateName: redhat-screensaver-build-
  namespace: ${NAMESPACE}
  labels:
    app: redhat-screensaver
spec:
  pipelineRef:
    name: redhat-screensaver-build
  serviceAccountName: ${SERVICE_ACCOUNT}
  workspaces:
    - name: shared-workspace
      volumeClaimTemplate:
        metadata:
          labels:
            app: redhat-screensaver
        spec:
          accessModes:
            - ReadWriteOnce
          resources:
            requests:
              storage: 1Gi
EOF
    if [[ -n "${GIT_URL}" || -n "${GIT_REVISION}" || -n "${IMAGE_TAG}" ]]; then
      echo "  params:"
      if [[ -n "${GIT_URL}" ]]; then
        printf '    - name: git-url\n      value: %s\n' "${GIT_URL}"
      fi
      if [[ -n "${GIT_REVISION}" ]]; then
        printf '    - name: git-revision\n      value: %s\n' "${GIT_REVISION}"
      fi
      if [[ -n "${IMAGE_TAG}" ]]; then
        printf '    - name: image-tag\n      value: %s\n' "${IMAGE_TAG}"
      fi
    fi
  } >"${pr_file}"

  pr_name="$("${OC[@]}" create -f "${pr_file}" -o jsonpath='{.metadata.name}')"
  log "Created PipelineRun: ${pr_name}"

  if [[ "${WAIT}" == "true" ]]; then
    log "Waiting for PipelineRun ${pr_name} to succeed"
    "${OC[@]}" wait --for=condition=Succeeded "pipelinerun/${pr_name}" --timeout=20m
  fi
}

if [[ "${RUN_PIPELINE}" == "true" ]]; then
  log "Starting PipelineRun (serviceAccount=${SERVICE_ACCOUNT})"
  start_pipeline_run
else
  log "Skipping PipelineRun (pass --run-pipeline to build and push the image)"
fi

HOST="$("${OC[@]}" get route redhat-screensaver -o jsonpath='{.spec.host}' 2>/dev/null || true)"
if [[ -n "${HOST}" ]]; then
  log "Route: https://${HOST}"
else
  log "Route not ready yet; check with: oc get route redhat-screensaver -n ${NAMESPACE}"
fi

log "Done"
