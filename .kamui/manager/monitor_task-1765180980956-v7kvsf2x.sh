#!/usr/bin/env bash
ROOT="/Users/kazuto/Desktop/Scaff-pro"
MANAGER="$ROOT/.kamui/manager"
TASK_NAME="task-1765180980956-v7kvsf2x"
# 起動時のタイムスタンプでファイル名を固定
STAMP="$(date '+%Y%m%d%H%M')"
MONITOR_FILE="$MANAGER/${STAMP}_monitor_${TASK_NAME}.html"

SOCK1="kamui-task-1765180980957-e4d08a-1765180981200-socket"; SESS1="kamui-task-1765180980957-e4d08a-1765180981200"
SOCK2="kamui-task-1765180981157-5286ca-1765180981799-socket"; SESS2="kamui-task-1765180981157-5286ca-1765180981799"
SOCK3="kamui-task-1765180981359-884254-1765180981986-socket"; SESS3="kamui-task-1765180981359-884254-1765180981986"
SOCK4="kamui-task-1765180981761-ef6d35-1765180983062-socket"; SESS4="kamui-task-1765180981761-ef6d35-1765180983062"
SOCK5="kamui-task-1765180981961-261a04-1765180983357-socket"; SESS5="kamui-task-1765180981961-261a04-1765180983357"
SOCK6="kamui-task-1765180981571-e66906-1765180983783-socket"; SESS6="kamui-task-1765180981571-e66906-1765180983783"

html_escape() {
  sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g'
}

capture() {
  local sock="$1"; local sess="$2";
  tmux -L "$sock" capture-pane -pt "$sess" 2>&1 || echo "(tmuxソケットに接続できませんでした: $sock / $sess)"
}

status_and_summary() {
  local log="$1"; local idx="$2";
  local status="running"; local label="実行中"; local summary="図面インポート系タスクの処理が実行中と推定されます。"

  if printf '%s' "$log" | grep -qi 'No such file or directory'; then
    status="pending"; label="接続待ち"; summary="tmuxソケットに接続できず、エージェントが未起動またはすでに終了している可能性があります。"
  elif printf '%s' "$log" | grep -Eiq 'error|exception|traceback|failed'; then
    status="error"; label="エラー"; summary="ログ内にエラーや例外らしき文言が検出されました。詳細を要確認です。"
  elif printf '%s' "$log" | grep -Eiq 'task completed|all done|\[done\]|finished'; then
    status="completed"; label="完了"; summary="ログからタスク完了のメッセージが検出されました。"
  fi

  printf '%s|%s|%s\n' "$status" "$label" "$summary"
}

ensure_header() {
  if [ -f "$MONITOR_FILE" ]; then
    return
  fi
  # 初期HTMLは外部で生成済みだが、存在しない場合に備えて最小限の骨組みを出力
  cat > "$MONITOR_FILE" << 'HTML_HEAD'
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <title>監査レポート</title>
  </head>
  <body>
    <div class="monitor-wrapper">
      <table class="monitor-report">
        <tbody>
        </tbody>
      </table>
    </div>
  </body>
</html>
HTML_HEAD
}

while true; do
  ensure_header
  TS="$(date '+%Y-%m-%d %H:%M')"

  LOG1="$(capture "$SOCK1" "$SESS1" | tail -n 120)";
  LOG2="$(capture "$SOCK2" "$SESS2" | tail -n 120)";
  LOG3="$(capture "$SOCK3" "$SESS3" | tail -n 120)";
  LOG4="$(capture "$SOCK4" "$SESS4" | tail -n 120)";
  LOG5="$(capture "$SOCK5" "$SESS5" | tail -n 120)";
  LOG6="$(capture "$SOCK6" "$SESS6" | tail -n 120)";

  IFS='|' read -r ST1 LB1 SUM1 <<< "$(status_and_summary "$LOG1" 1)"
  IFS='|' read -r ST2 LB2 SUM2 <<< "$(status_and_summary "$LOG2" 2)"
  IFS='|' read -r ST3 LB3 SUM3 <<< "$(status_and_summary "$LOG3" 3)"
  IFS='|' read -r ST4 LB4 SUM4 <<< "$(status_and_summary "$LOG4" 4)"
  IFS='|' read -r ST5 LB5 SUM5 <<< "$(status_and_summary "$LOG5" 5)"
  IFS='|' read -r ST6 LB6 SUM6 <<< "$(status_and_summary "$LOG6" 6)"

  ESC1="$(printf '%s' "$LOG1" | html_escape)"
  ESC2="$(printf '%s' "$LOG2" | html_escape)"
  ESC3="$(printf '%s' "$LOG3" | html_escape)"
  ESC4="$(printf '%s' "$LOG4" | html_escape)"
  ESC5="$(printf '%s' "$LOG5" | html_escape)"
  ESC6="$(printf '%s' "$LOG6" | html_escape)"

  row=""
  row+="          <tr>\n"
  row+="            <td class=\"timestamp\">$TS</td>\n"

  render_cell() {
    local status="$1"; local label="$2"; local summary="$3"; local log_html="$4";
    local cls="status-badge--pending"
    case "$status" in
      running) cls="status-badge--running";;
      completed) cls="status-badge--completed";;
      error) cls="status-badge--error";;
      pending) cls="status-badge--pending";;
    esac
    row+="            <td>\n"
    row+="              <div class=\"agent-meta\">\n"
    row+="                <span class=\"status-badge ${cls}\">${label}</span>\n"
    row+="                <span class=\"agent-label\">${summary}</span>\n"
    row+="              </div>\n"
    row+="              <details class=\"snapshot-details\">\n"
    row+="                <summary class=\"details-toggle\">ログ詳細</summary>\n"
    row+="                <pre>${log_html}</pre>\n"
    row+="              </details>\n"
    row+="            </td>\n"
  }

  render_cell "$ST1" "$LB1" "$SUM1" "$ESC1"
  render_cell "$ST2" "$LB2" "$SUM2" "$ESC2"
  render_cell "$ST3" "$LB3" "$SUM3" "$ESC3"
  render_cell "$ST4" "$LB4" "$SUM4" "$ESC4"
  render_cell "$ST5" "$LB5" "$SUM5" "$ESC5"
  render_cell "$ST6" "$LB6" "$SUM6" "$ESC6"

  row+="          </tr>\n"

  NEW_ROW="$row" python3 - "$MONITOR_FILE" << 'PY'
import os
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
html = path.read_text(encoding="utf-8")
marker = "</tbody>"
insert = os.environ.get("NEW_ROW", "")

if marker in html:
    html = html.replace(marker, insert + "\n" + marker, 1)
else:
    html = html + "\n" + insert

path.write_text(html, encoding="utf-8")
PY

  sleep 60

done
