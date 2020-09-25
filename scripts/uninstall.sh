if [[ $(/usr/bin/id -u) -ne 0 ]]; then
  echo "🛑 The script must be ran as root"
  exit
fi

ENVIRONMENT_FILE="/etc/environment"
if [[ -z "${EAIC_API_INSTALLATION}" ]]; then
  echo "🔁 Removing old installation dir..."
  sed -i '/^EAIC_API_INSTALLATION=/d' "$ENVIRONMENT_FILE"
fi

SYSTEMD_DIR="/etc/systemd/system"
SERVICE_FILE="$SYSTEMD_DIR/eaic_api.service"
if [[ -f "$SERVICE_FILE" ]]; then
  echo "🔁 Removing service..."
  systemctl stop eaic_api
  rm "$SERVICE_FILE"
  systemctl daemon-reload
fi