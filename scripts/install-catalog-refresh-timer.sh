#!/usr/bin/env bash
set -euo pipefail
if [[ "$EUID" -ne 0 ]]; then
    printf '%s\n' 'Run: sudo bash scripts/install-catalog-refresh-timer.sh' >&2
    exit 1
fi
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
run_user="${SUDO_USER:-$(stat -c '%U' "$project_dir")}"
if [[ "$project_dir" == *[\"\\%]* || "$project_dir" == *$'\n'* ]]; then
    printf '%s\n' 'Project path cannot contain quotes, backslashes, percent signs or newlines.' >&2
    exit 1
fi
cat > /etc/systemd/system/pubsetup-catalog-refresh.service <<EOF
[Unit]
Description=Pubsetup vendor catalog refresh
After=docker.service network-online.target
Wants=network-online.target
StartLimitIntervalSec=3600
StartLimitBurst=3

[Service]
Type=exec
User=$run_user
WorkingDirectory="$project_dir"
ExecStart=/usr/bin/bash "$project_dir/scripts/catalog-refresh.sh"
Restart=on-failure
RestartSec=300
RuntimeMaxSec=12h
TimeoutStopSec=30
EOF
cat > /etc/systemd/system/pubsetup-catalog-refresh.timer <<'EOF'
[Unit]
Description=Refresh Pubsetup catalog on Sunday evening (Warsaw)

[Timer]
OnCalendar=Sun *-*-* 22:00:00 Europe/Warsaw
Persistent=true
AccuracySec=1min
Unit=pubsetup-catalog-refresh.service

[Install]
WantedBy=timers.target
EOF
systemctl daemon-reload
systemctl enable --now pubsetup-catalog-refresh.timer
systemctl list-timers pubsetup-catalog-refresh.timer --no-pager
