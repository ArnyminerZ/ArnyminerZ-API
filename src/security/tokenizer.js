const crypto = require('crypto')
const fs = require('fs')

const _TOKENS_PATH = process.env.TOKENS_PATH || '.tokens.json';
const EFFICIENT_TOKEN_STORAGE = process.env.TOKEN_STORAGE_EFFICIENT || true;
const TOKEN_EXPIRATION_TIME = process.env.TOKEN_EXPIRATION_TIME || (10 * 60 * 1000);

/**
 * Gets all stored tokens in the _tokens.json file
 * @return {Array<{date: Date, salt: *, userId: *, hash: *, iterations: *}>} The stored tokens
 * @private
 */
function getAuthTokens() {
    const authTokensRead = fs.existsSync(_TOKENS_PATH) ?
        fs.readFileSync(_TOKENS_PATH, 'utf8') :
        '{}';
    return JSON.parse(authTokensRead);
}

/**
 * Stores a new token in _tokens.json
 * @param {string} id The id of the new token
 * @param {{date: Date, salt: *, userId: *, hash: *, iterations: *}} token The token to store.
 * @private
 */
function storeAuthToken(id, token) {
    const tokens = getAuthTokens();
    tokens[id] = token;

    fs.writeFileSync(_TOKENS_PATH, JSON.stringify(tokens));
}

/**
 * Deletes a token from _tokens.json
 * @param {string} id The id of the token to remove
 */
function deleteAuthToken(id) {
    const tokens = getAuthTokens();
    delete tokens[id];

    fs.writeFileSync(_TOKENS_PATH, JSON.stringify(tokens));
}

module.exports = {
    TOKEN_EXPIRATION_TIME, EFFICIENT_TOKEN_STORAGE,
    // Will generate at most 1461501637330902918203684832716283019655932542976 tokens, but max array size is 4294967296,
    //   so why does this matter?
    generateToken: (hash, salt, iterations, userId, date = new Date()) => {
        const authTokens = getAuthTokens()

        let id = crypto.randomBytes(20).toString('hex'); // Generate a token
        let existingToken = authTokens[id]; // Check if already exists
        if (existingToken !== undefined) // If it does
            while (existingToken !== undefined) { // Keep generating until a non existing one is gotten
                id = crypto.randomBytes(20).toString('hex')
                existingToken = authTokens[id];
            }

        storeAuthToken(id, {
            date, hash, salt, iterations, userId
        })

        return id
    },
    /**
     * Gets a token from its key
     * @param token {String} The token key
     * @return {{date: Date, salt: String, userId: Number, hash: String, iterations: Number}} The token value
     */
    getToken: (token) => getAuthTokens()[token],
    isTokenValid: (token) => {
        const t = getAuthTokens()[token]
        if (t === undefined) return false
        const date = new Date(t.date)
        const timeDiff = Date.now() - date.getTime()
        const expired = timeDiff >= TOKEN_EXPIRATION_TIME

        if (expired && EFFICIENT_TOKEN_STORAGE) {
            console.log("Token", token, "has expired, deleting.")
            deleteAuthToken(token)
        }

        return !expired
    },
    deleteAuthToken: deleteAuthToken
}
