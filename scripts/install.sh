if [[ $(/usr/bin/id -u) -ne 0 ]]; then
  echo "🛑 The script must be ran as root"
  exit
fi

INSTALLATION_DIR="$(dirname "$PWD")"

read -p "ℹ Please, check that $INSTALLATION_DIR is the installation dir for EAIC API. y/n" -n 1 -r

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo
  cd "$INSTALLATION_DIR" || (
    echo "🛑 The specified installation dir doesn't exist!"
    exit
  )

  ENVIRONMENT_FILE="/etc/environment"
  echo "🔁 Removing old installation dir..."
  sed -i '/^EAIC_API_INSTALLATION=/d' "$ENVIRONMENT_FILE"

  echo "🔁 Storing new installation dir..."
  echo "ENVIRONMENT_FILE=$ENVIRONMENT_FILE" >> "$ENVIRONMENT_FILE"
  export ENVIRONMENT_FILE="$ENVIRONMENT_FILE"

  echo "🔁 Installing npm dependencies..."
  npm install

  echo "🔁 Checking for the required configuration files..."

  INI_FILE="$PWD/eaic.ini"
  if [[ -f "$INI_FILE" ]]; then
    echo "✅ eaic.ini"
  else
    echo "🛑 The installation dir doesn't contain any eaic.ini file. Please, store one and run the script again."
    exit
  fi

  ACCOUNT_KEY_FILE="$PWD/serviceAccountKey.json"
  if [[ -f "$ACCOUNT_KEY_FILE" ]]; then
    echo "✅ serviceAccountKey.json"
  else
    echo "🛑 The installation dir doesn't contain any serviceAccountKey.json file. Please, store one and run the script again."
    exit
  fi

  SYSTEMD_DIR="/etc/systemd/system"
  SERVICE_FILE="$SYSTEMD_DIR/eaic_api.service"
  if [[ -f "$SERVICE_FILE" ]]; then
    echo "🔁 Removing old service..."
    systemctl stop eaic_api
    rm "$SERVICE_FILE"
    systemctl daemon-reload
  fi

  echo "🔁 Copying service file..."
  cp eaic_api.service "$SYSTEMD_DIR"
  echo "🔁 Filling service placeholders..."
  if [[ -z "${TELEGRAM_TOKEN}" ]]; then
    echo "⚠ TELEGRAM_TOKEN not defined, Telegram functionality will be disabled."
    sed -i '/Environment=%TELEGRAM_TOKEN/d' "$SERVICE_FILE"
  else
    sed -i "s+%TELEGRAM_TOKEN+$TELEGRAM_TOKEN+g" "$SERVICE_FILE"
  fi
  sed -i "s+%INSTALLATION_DIR+$INSTALLATION_DIR+g" "$SERVICE_FILE"

  echo "🔁 Reloading daemon..."
  systemctl daemon-reload

  echo "🔁 Starting service..."
  systemctl start eaic_api
fi
