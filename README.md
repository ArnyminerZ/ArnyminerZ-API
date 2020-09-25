# Escalar Alcoià i Comtat #
## Environment variables ##
`TELEGRAM_TOKEN` should be set matching the token of the Telegram bot from [@BotFather](https://telegram.me/BotFather)

## Required files ##
The source installation dir should contain the following files:
### eaic.ini ###
This contains the configuration data for the software, it should follow this format:
```ini
[firebase]
API_KEY=
AUTH_DOMAIN=
DATABASE_URL=
PROJECT_ID=
STORAGE_BUCKET=
MESSAGING_SENDER_URL=
APP_ID=
MEASUREMENT_ID=

[mysql]
MYSQL_HOST=
MYSQL_USER=
MYSQL_PASS=
```
You should fill the fields with the corresponding parameters.

### serviceAccountKey.json ###
This contains the Firebase Admin credentials.
```json
{
  "type": "",
  "project_id": "",
  "private_key_id": "",
  "private_key": "",
  "client_email": "",
  "client_id": "",
  "auth_uri": "",
  "token_uri": "",
  "auth_provider_x509_cert_url": "",
  "client_x509_cert_url": ""
}
```
You should fill the fields with the corresponding parameters.
