#!/usr/bin/env bash

set -euo pipefail

PORT="${1:-3007}"

find_pids() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true
    return
  fi

  if command -v fuser >/dev/null 2>&1; then
    fuser -n tcp "$PORT" 2>/dev/null || true
    return
  fi

  if command -v ss >/dev/null 2>&1; then
    ss -ltnp "( sport = :$PORT )" 2>/dev/null \
      | awk -F'pid=|,' 'NR > 1 && NF > 1 { print $2 }' \
      | sort -u
    return
  fi

  echo "Nenhum utilitário disponível para localizar o processo da porta $PORT." >&2
  exit 1
}

find_supervisors() {
  local pid="$1"
  local current_pid="$pid"

  while true; do
    local parent_pid
    parent_pid="$(ps -o ppid= -p "$current_pid" 2>/dev/null | tr -d '[:space:]')"

    if [[ -z "$parent_pid" ]] || [[ "$parent_pid" -le 1 ]]; then
      break
    fi

    local parent_command
    parent_command="$(ps -o command= -p "$parent_pid" 2>/dev/null || true)"

    if [[ "$parent_command" == *"ts-node-dev"* ]] || [[ "$parent_command" == *"nodemon"* ]]; then
      echo "$parent_pid"
      current_pid="$parent_pid"
      continue
    fi

    break
  done
}

terminate_pid() {
  local pid="$1"
  local process_state
  process_state="$(ps -o stat= -p "$pid" 2>/dev/null | tr -d '[:space:]' || true)"

  if [[ -z "$process_state" ]] || [[ "$process_state" == Z* ]]; then
    echo "Processo $pid já não estava ativo."
    return 0
  fi

  if ! kill "$pid" 2>/dev/null; then
    process_state="$(ps -o stat= -p "$pid" 2>/dev/null | tr -d '[:space:]' || true)"
    if [[ -z "$process_state" ]] || [[ "$process_state" == Z* ]]; then
      echo "Processo $pid já não estava ativo."
      return 0
    fi

    echo "Falha ao enviar SIGTERM para o processo $pid." >&2
    return 1
  fi

  for _ in 1 2 3 4 5; do
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "Processo $pid finalizado."
      return 0
    fi
  done

  kill -9 "$pid" 2>/dev/null || true

  process_state="$(ps -o stat= -p "$pid" 2>/dev/null | tr -d '[:space:]' || true)"

  if [[ -n "$process_state" ]] && [[ "$process_state" != Z* ]] && kill -0 "$pid" 2>/dev/null; then
    echo "Falha ao finalizar o processo $pid." >&2
    return 1
  fi

  echo "Processo $pid finalizado com SIGKILL."
}

PIDS="$(find_pids)"

if [[ -z "${PIDS//[[:space:]]/}" ]]; then
  echo "Nenhum processo escutando na porta $PORT."
  exit 0
fi

TARGETS="$PIDS"

for pid in $PIDS; do
  TARGETS+=$'\n'"$(find_supervisors "$pid")"
done

TARGETS="$(printf '%s\n' "$TARGETS" | awk 'NF && !seen[$0]++')"

FAILURES=0
for pid in $TARGETS; do
  if ! terminate_pid "$pid"; then
    FAILURES=1
  fi
done

if [[ "$FAILURES" -ne 0 ]]; then
  exit 1
fi

echo "Porta $PORT liberada."