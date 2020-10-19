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

[other]
HTTP_PORT=
HTTPS_PORT=
DISABLE_HTTPS=[true|false]
```
You should fill the fields with the corresponding parameters. All the parameters in `other` are optional.

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

## Feedback ##
Every call to the API gets a JSON response. If it contains a key named `result` with a value `ok` this usually means that everything went ok, and a key named `data` should exist, if not said that the result key should be different.

Here are the different calls with its responses.

### `/user/:user` ###
Gets the data of the specified user
#### Requires ####
- `user`: The id or Firebase UID (deprecated) of the user
#### Returns ####
- `data`: An array with the found user. (The array usually should have only 1 element)
#### Throws ####
- 400:`user_not_found`: If the specified user doesn't exist.

### `/user/:user/log` ###
Gets all the posts and marked paths of a user.
**Actually a shitty code, please do not use for now**
#### Requires ####
- `user`: The id or Firebase UID (deprecated) of the user
#### Returns ####
- `data`: An array with the content.
#### Throws ####
- 400:`user-doesnt-exist`: If the specified user doesn't exist.

### `/user/:user/friend/request/:other` ###
Makes a friend request
#### Requires ####
- `user`: The id or Firebase UID (deprecated) of the user
- `other`: The id or Firebase UID (deprecated) of the target user
#### Returns ####
- `uuid`: The uuid of the request. Used for confirming or denying.
#### Throws ####
- 400:`cannot-ask-same`: If a user is trying to be friend with itself.
- 400:`user-doesnt-exist`: If the specified user doesn't exist.
- 400:`friend-doesnt-exist`: If the target user (`other`) doesn't exist.
- 400:`'users-already-friends'`: If the users already are friends.

### `/user/:user/friend/delete/:other` ###
Deletes a friendship
#### Requires ####
- `user`: The id or Firebase UID (deprecated) of the user
- `other`: The id or Firebase UID (deprecated) of the other user
#### Throws ####
- 400:`users-are-not-friends`: If the users are not friends.
- 400:`user-doesnt-exist`: If the specified user doesn't exist.
- 400:`friend-doesnt-exist`: If the target user (`other`) doesn't exist.

### `/user/:user/friend/requests` ###
Gets are the pending friend requests the user has
#### Requires ####
- `user`: The id or Firebase UID (deprecated) of the user
#### Returns ####
- `data`: An array with all the requests.
#### Throws ####
- 400:`user-doesnt-exist`: If the specified user doesn't exist.
