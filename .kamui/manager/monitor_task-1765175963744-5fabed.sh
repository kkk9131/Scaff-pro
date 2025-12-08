#!/usr/bin/env bash

ROOT="/Users/kazuto/Desktop/Scaff-pro"
MONITOR_FILE="$ROOT/.kamui/manager/202512081541_monitor_task-1765175963744-5fabed.html"
SOCKET="kamui-task-1765175963744-5fabed-1765175963897-socket"
SESSION="kamui-task-1765175963744-5fabed-1765175963897"

while true; do
  timestamp="$(date '+%Y-%m-%d %H:%M')"
  snapshot="$(tmux -L \"$SOCKET\" capture-pane -pt \"$SESSION\" 2>&1 || true)"

  status_class="status-badge--running"
  status_label="実行中"
  summary="tmuxセッションから出力を取得しました。"

  if printf '%s' "$snapshot" | grep -q 'No such file or directory'; then
    status_class="status-badge--pending"
    status_label="接続待ち"
    summary="tmuxソケットに接続できず、エージェントが終了または未起動の可能性があります。"
  fi

  escaped_snapshot="$(python3 - << 'PY'
import html
import sys

data = sys.stdin.read()
print(html.escape(data))
PY
<<< "$snapshot")"

  read -r -d '' row <<ROW || true
          <tr>
            <td class="timestamp">$timestamp</td>
            <td>
              <div class="agent-meta">
                <span class="status-badge $status_class">$status_label</span>
                <span class="agent-label">$summary</span>
              </div>
              <details class="snapshot-details">
                <summary class="details-toggle">ログ詳細</summary>
                <pre>$escaped_snapshot</pre>
              </details>
            </td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
ROW

  if [ -f "$MONITOR_FILE" ]; then
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
  fi

  sleep 60
done

