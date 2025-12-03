#!/usr/bin/env bash
set -euo pipefail

MODEL_NAME="sd_xl_base_1.0.safetensors"
EXPECTED_SHA="31e35c80fc4829d14f90153f4c74cd59c90b779f6afe05a74cd6120b893f7e5b"
MODEL_URL="${MODEL_URL:-https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/${MODEL_NAME}}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHECKPOINT_DIR="${CHECKPOINT_DIR:-${ROOT_DIR}/ComfyUI/models/checkpoints}"
TARGET_PATH="${CHECKPOINT_DIR}/${MODEL_NAME}"

log() {
  printf '[%s] %s\n' "$(date +'%Y-%m-%d %H:%M:%S')" "$*"
}

require_tools() {
  for tool in curl sha256sum mktemp; do
    command -v "${tool}" >/dev/null 2>&1 || {
      echo "Missing required tool: ${tool}" >&2
      exit 1
    }
  done
}

download_with_retries() {
  local url="$1"
  local dest="$2"
  local -a headers=()

  if [[ -n "${HF_TOKEN:-}" ]]; then
    headers=(-H "Authorization: Bearer ${HF_TOKEN}")
  fi

  curl \
    -L \
    --fail \
    --retry 5 \
    --retry-delay 5 \
    --retry-all-errors \
    --connect-timeout 20 \
    --continue-at - \
    --output "${dest}" \
    "${headers[@]}" \
    "${url}"
}

verify_checksum() {
  local file="$1"

  if echo "${EXPECTED_SHA}  ${file}" | sha256sum --check --status; then
    return 0
  fi

  echo "Checksum verification failed for ${file}" >&2
  return 1
}

restart_comfyui() {
  local restart_cmd="${RESTART_COMMAND:-}"

  if [[ -n "${restart_cmd}" ]]; then
    log "Restarting ComfyUI via custom command: ${restart_cmd}"
    eval "${restart_cmd}"
    return $?
  fi

  if command -v systemctl >/dev/null 2>&1; then
    if systemctl --user list-unit-files --type=service 2>/dev/null | grep -q '^comfyui\\.service'; then
      log "Restarting ComfyUI with systemctl --user..."
      systemctl --user restart comfyui.service
      return $?
    fi

    if systemctl list-unit-files --type=service 2>/dev/null | grep -q '^comfyui\\.service'; then
      log "Restarting ComfyUI with systemctl..."
      systemctl restart comfyui.service
      return $?
    fi
  fi

  local compose_cmd=""
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    compose_cmd="docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    compose_cmd="docker-compose"
  fi

  if [[ -n "${compose_cmd}" && -f "${ROOT_DIR}/docker-compose.yml" ]]; then
    if ${compose_cmd} --project-directory "${ROOT_DIR}" config --services 2>/dev/null | grep -qx "comfyui"; then
      log "Restarting ComfyUI with ${compose_cmd}..."
      ${compose_cmd} --project-directory "${ROOT_DIR}" restart comfyui
      return $?
    fi
  fi

  echo "Unable to find a known ComfyUI service to restart automatically." >&2
  return 1
}

main() {
  require_tools
  mkdir -p "${CHECKPOINT_DIR}"

  if [[ -f "${TARGET_PATH}" ]]; then
    log "Existing checkpoint found at ${TARGET_PATH}; verifying checksum before re-downloading..."
    if verify_checksum "${TARGET_PATH}"; then
      log "Existing file already matches expected checksum."
      restart_comfyui || {
        echo "Checkpoint is present, but ComfyUI restart failed." >&2
        exit 1
      }
      exit 0
    fi
    log "Existing file failed checksum; re-downloading."
  fi

  local tmp_path
  tmp_path="$(mktemp "${CHECKPOINT_DIR}/${MODEL_NAME}.XXXX")"
  trap 'rm -f "${tmp_path}"' EXIT

  log "Downloading ${MODEL_NAME} to ${tmp_path}..."
  download_with_retries "${MODEL_URL}" "${tmp_path}"

  log "Verifying sha256..."
  verify_checksum "${tmp_path}" || exit 1

  mv "${tmp_path}" "${TARGET_PATH}"
  chmod 640 "${TARGET_PATH}"
  log "Checkpoint ready at ${TARGET_PATH}"

  trap - EXIT
  restart_comfyui || {
    echo "Checkpoint downloaded and verified, but ComfyUI restart failed." >&2
    exit 1
  }
  log "ComfyUI restarted."
}

main "$@"
