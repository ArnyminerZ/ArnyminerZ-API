# Escalar Alcoià i Comtat #
![[Commit Activity](https://github.com/ArnyminerZ/ArnyminerZ-API/commits/master)](https://img.shields.io/github/commit-activity/y/ArnyminerZ/ArnyminerZ-API?style=for-the-badge)
![[GitHub](https://github.com/ArnyminerZ/ArnyminerZ-API/blob/master/LICENSE)](https://img.shields.io/github/license/ArnyminerZ/ArnyminerZ-API?style=for-the-badge)

![GitHub branch checks state](https://img.shields.io/github/checks-status/ArnyminerZ/ArnyminerZ-API/master?style=for-the-badge)
![GitHub last commit](https://img.shields.io/github/last-commit/ArnyminerZ/ArnyminerZ-API?style=for-the-badge)

![[GitHub issues](https://github.com/ArnyminerZ/ArnyminerZ-API/issues)](https://img.shields.io/github/issues/ArnyminerZ/ArnyminerZ-API?style=for-the-badge)
![[GitHub pull requests](https://github.com/ArnyminerZ/ArnyminerZ-API/pulls)](https://img.shields.io/github/issues-pr/ArnyminerZ/ArnyminerZ-API?style=for-the-badge)

## Environment variables ##
### `TELEGRAM_TOKEN` 
Should be set matching the token of the Telegram bot from [@BotFather](https://telegram.me/BotFather)

### `TOKEN_EXPIRATION_TIME`
This is the time in milliseconds that will take a login token to expire.

On other words, the amount of time the user will be connected until it's required to input its password again, if the "Remember Me" field is not checked.

*Default: `600000` (10 minutes x 60 seconds x 1000ms)*
### `TOKEN_LONG_MULTIPLIER`
This is a number that will be multiplied to `TOKEN_EXPIRATION_TIME` if the "Remember Me" checkbox is marked.

*Default: `6` (Default 10 minutes\*6=1 hour)*
### `TOKEN_STORAGE_EFFICIENT`
If `true`, a token will be removed when expired. This will only apply if it's tried to get the token.

*Default: `true`*
### `TOKENS_PATH`
The path relative to the project folder on where to store the tokens JSON file. Must end with `.json` and not be a directory.

*Default: `_tokens.json`*

### `MAX_PEOPLE_PER_BOOKING`
The maximum amount of people that will be allowed per booking.

*Default: `5`*

### `SMTP_HOST`
The SMTP host for sending emails

### `SMTP_PORT`
The SMTP port for sending emails

### `SMTP_USER`
The SMTP user for sending emails

### `SMTP_PASS`
The SMTP pass for sending emails

### `HTTP_PORT`
The port that will be used for HTTP requests.

*Default: `3002`*


## Required files ##
The source installation dir should contain the following files:
### api.ini ###
This contains the configuration data for the software, it should follow this format:
```ini
[mysql]
MYSQL_HOST=
MYSQL_USER=
MYSQL_PASS=

[lanau]
MAX_PEOPLE_PER_BOOKING=

[token]
TOKEN_EXPIRATION_TIME=(600000)
TOKEN_LONG_MULTIPLIER=(6)
TOKEN_STORAGE_EFFICIENT=(true)
TOKENS_PATH=(.tokens.json)

[other]
HTTP_PORT=(3000)
HTTPS_PORT=(3001)
DISABLE_HTTPS=[true|false]
```
You should fill the fields with the corresponding parameters. All the parameters in `other` are optional.

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
