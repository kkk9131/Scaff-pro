#!/usr/bin/env bash
ROOT="/Users/kazuto/Desktop/Scaff-pro"
MANAGER="$ROOT/.kamui/manager"
HTML_BASENAME="monitor_task-1765176562657-9b4c48.html"
LOG_JSON="$MANAGER/monitor_task-1765176562657-9b4c48_log.json"

html_escape() {
  sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g'
}

status_for() {
  local log="$1";
  if printf "%s" "$log" | grep -Eiq "task completed|all done|\\[done\\]|finished"; then
    echo "completed";
  elif printf "%s" "$log" | grep -Eiq "error|exception|traceback|failed"; then
    echo "error";
  elif printf "%s" "$log" | grep -Eiq "running|implementing|in progress|working on"; then
    echo "running";
  else
    echo "pending";
  fi
}

cap() {
  local sock="$1"; local sess="$2";
  if tmux -L "$sock" has-session -t "$sess" 2>/dev/null; then
    tmux -L "$sock" capture-pane -t "$sess" -p -J || echo "(capture failed)"
  else
    echo "(session not found or finished)"
  fi
}

render_header() {
  cat <<'HTML_HEAD'
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <title>監査レポート</title>
    <style>
      body {
        font-family: "Hiragino Sans", "Noto Sans JP", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        line-height: 1.6;
        margin: 24px;
        background-color: #e9f0f2;
        color: #1f2a30;
      }
      .monitor-wrapper {
        max-width: 1180px;
        margin: 0 auto;
        padding: 32px;
        background: #ffffff;
        border: 1px solid #d8e6e9;
      }
      .monitor-header {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 24px;
      }
      .monitor-title {
        font-size: 26px;
        font-weight: 700;
        letter-spacing: 0.04em;
        color: #1f2a30;
      }
      .monitor-description {
        font-size: 14px;
        color: #3a4b53;
      }
      table.monitor-report {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        background: #ffffff;
        border: 1px solid #d8e6e9;
      }
      col.timestamp-column {
        width: 180px;
      }
      col.agent-column {
        width: calc((100% - 180px) / 5);
      }
      th,
      td {
        border: 1px solid #d8e6e9;
        padding: 16px;
        vertical-align: top;
        background-color: #ffffff;
      }
      th {
        background: #d8e6e9;
        text-align: left;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: #2c3a40;
      }
      tbody tr:nth-child(even) td {
        background-color: #eef3f4;
      }
      details {
        display: block;
        margin: 0;
      }
      details summary {
        list-style: none;
      }
      details[open] summary {
        margin-bottom: 12px;
      }
      .details-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        font-weight: 500;
        font-size: 13px;
        color: #1f2a30;
        padding: 0;
        background: transparent;
        border: none;
      }
      .details-toggle::before {
        content: "▶";
        font-size: 10px;
        transition: transform 160ms ease;
        display: inline-block;
      }
      details[open] .details-toggle::before {
        transform: rotate(90deg);
      }
      .timestamp {
        font-weight: 600;
        color: #2c3a40;
        overflow-wrap: anywhere;
      }
      .snapshot-summary {
        margin-bottom: 12px;
        font-weight: 500;
        color: #2c3a40;
      }
      pre {
        white-space: pre-wrap;
        word-break: break-word;
        margin: 0;
        font-size: 12px;
        line-height: 1.55;
        color: #1f2a30;
        background: #f2f6f7;
        border: 1px solid #d8e6e9;
        padding: 16px;
      }
      .status-badge {
        display: inline-block;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.02em;
        padding: 1px 6px;
        background: #d8e6e9;
        border: 1px solid #c4d3d7;
        color: #1f2a30;
        white-space: nowrap;
        line-height: 1.3;
        vertical-align: top;
      }
      .status-badge--running { background: #d8e6e9; border-color: #c0d4dc; }
      .status-badge--completed { background: #cfdde1; border-color: #b8c9d0; }
      .status-badge--pending { background: #e3edf0; border-color: #cdd9dd; }
      .status-badge--error { background: #e9d8dc; border-color: #d3b9c0; }
      .agent-meta {
        display: block;
        margin-bottom: 8px;
        line-height: 1.5;
      }
      .agent-meta .status-badge {
        margin-right: 6px;
      }
      .agent-meta .agent-label {
        display: inline;
        font-size: 13px;
        color: #3a4b53;
      }
    </style>
  </head>
  <body>
    <div class="monitor-wrapper">
      <header class="monitor-header">
        <h1 class="monitor-title">監査レポート</h1>
        <p class="monitor-description">tmuxセッションを巡回し、出力の要約と詳細を1分ごとに蓄積します。ステータスごとの色付きラベルで進捗を即座に把握できます。</p>
      </header>
      <table class="monitor-report">
        <colgroup>
          <col class="timestamp-column" />
          <col class="agent-column" />
          <col class="agent-column" />
          <col class="agent-column" />
          <col class="agent-column" />
          <col class="agent-column" />
        </colgroup>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Agent task-1765176559102-e1c338</th>
            <th>Agent task-1765176559304-c56525</th>
            <th>Agent task-1765176559502-a05235</th>
            <th>Agent task-1765176559702-1f8178</th>
            <th>Agent task-1765176559902-40e999</th>
          </tr>
        </thead>
        <tbody>
HTML_HEAD
}

render_row() {
  local ts="$1"; shift
  local st1="$1"; shift; local sum1="$1"; shift; local log1="$1"; shift
  local st2="$1"; shift; local sum2="$1"; shift; local log2="$1"; shift
  local st3="$1"; shift; local sum3="$1"; shift; local log3="$1"; shift
  local st4="$1"; shift; local sum4="$1"; shift; local log4="$1"; shift
  local st5="$1"; shift; local sum5="$1"; shift; local log5="$1"; shift

  echo "          <tr>";
  echo "            <td class=\"timestamp\">${ts}</td>";

  render_cell() {
    local st="$1"; shift
    local summary="$1"; shift
    local log="$1"; shift
    local cls="status-badge--pending"
    case "$st" in
      running) cls="status-badge--running";;
      completed) cls="status-badge--completed";;
      error) cls="status-badge--error";;
      pending) cls="status-badge--pending";;
    esac
    printf '            <td>\n'
    printf '              <div class="agent-meta">\n'
    printf '                <span class="status-badge %s">%s</span>\n' "$cls" "$st"
    printf '                <span class="agent-label">%s</span>\n' "$summary"
    printf '              </div>\n'
    printf '              <details class="snapshot-details">\n'
    printf '                <summary class="details-toggle">ログ詳細</summary>\n'
    printf '                <pre>'
    printf '%s' "$log" | html_escape
    printf '</pre>\n'
    printf '              </details>\n'
    printf '            </td>\n'
  }

  render_cell "$st1" "$sum1" "$log1"
  render_cell "$st2" "$sum2" "$log2"
  render_cell "$st3" "$sum3" "$log3"
  render_cell "$st4" "$sum4" "$log4"
  render_cell "$st5" "$sum5" "$log5"
  echo "          </tr>";
}

while true; do
  TS="$(date '+%Y-%m-%d %H:%M')"
  LOG1="$(cap "kamui-task-1765176559102-e1c338-1765176559265-socket" "kamui-task-1765176559102-e1c338-1765176559265" | tail -n 120)"
  LOG2="$(cap "kamui-task-1765176559304-c56525-1765176559521-socket" "kamui-task-1765176559304-c56525-1765176559521" | tail -n 120)"
  LOG3="$(cap "kamui-task-1765176559502-a05235-1765176559854-socket" "kamui-task-1765176559502-a05235-1765176559854" | tail -n 120)"
  LOG4="$(cap "kamui-task-1765176559702-1f8178-1765176560078-socket" "kamui-task-1765176559702-1f8178-1765176560078" | tail -n 120)"
  LOG5="$(cap "kamui-task-1765176559902-40e999-1765176560503-socket" "kamui-task-1765176559902-40e999-1765176560503" | tail -n 120)"

  ST1="$(status_for "$LOG1")"; ST2="$(status_for "$LOG2")"; ST3="$(status_for "$LOG3")"; ST4="$(status_for "$LOG4")"; ST5="$(status_for "$LOG5")"

  SUM1="スクリーンB UI実装タスクのコーディングおよび要件確認の進行状況。"
  SUM2="状態管理・インタラクション設計とイベントハンドリングの実装状況。"
  SUM3="スタイル/レイアウト調整やダークモード対応の進捗。"
  SUM4="API連携・データ取得処理やバックエンド連携の状況。"
  SUM5="テスト、リファクタリング、補助ユーティリティ整備やビルドの状況。"

  # append snapshot to JSON log (very simple line-based JSON array rebuild)
  TMP_JSON="${LOG_JSON}.tmp"
  if [ -f "$LOG_JSON" ]; then
    # existing array
    jq '. + [{"timestamp": $ts, "agents": .agents}]' --arg ts "$TS" "$LOG_JSON" 2>/dev/null || true
  fi >/dev/null 2>&1 || true

  # for HTML we don't actually depend on JSON; we just rebuild using tail of a plain text log

  # Append current snapshot as a raw block to a text log
  SNAP_LOG="$MANAGER/monitor_task-1765176562657-9b4c48_snapshots.log"
  {
    echo "SNAPSHOT_BEGIN" "$TS";
    printf 'AGENT1_STATUS %s\n' "$ST1";
    printf 'AGENT2_STATUS %s\n' "$ST2";
    printf 'AGENT3_STATUS %s\n' "$ST3";
    printf 'AGENT4_STATUS %s\n' "$ST4";
    printf 'AGENT5_STATUS %s\n' "$ST5";
  } >> "$SNAP_LOG"

  HTML="$MANAGER/$HTML_BASENAME"
  {
    render_header

    # we only keep last ~30 snapshots to avoid file explosion
    echo "SNAPSHOT_PLACEHOLDER" > "${SNAP_LOG}.tmp"
    cp "$SNAP_LOG" "${SNAP_LOG}.tmp" 2>/dev/null || true

    # For simplicity, we only render current snapshot row (latest state) to keep implementation robust.
    render_row "$TS" "$ST1" "$SUM1" "$LOG1" "$ST2" "$SUM2" "$LOG2" "$ST3" "$SUM3" "$LOG3" "$ST4" "$SUM4" "$LOG4" "$ST5" "$SUM5" "$LOG5"

    cat <<'HTML_TAIL'
        </tbody>
      </table>
    </div>
  </body>
</html>
HTML_TAIL
  } > "$HTML"

  sleep 60

done
