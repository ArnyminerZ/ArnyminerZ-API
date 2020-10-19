const crypto = require('crypto')

const PASSWORD_LENGTH = 256;
const SALT_LENGTH = 64;
const ITERATIONS = 10000;
const DIGEST = 'sha256';
const BYTE_TO_STRING_ENCODING = 'hex'; // this could be base64, for instance

module.exports = {
    generateHashPassword: (password) => {
        return new Promise((accept, reject) => {
            const salt = crypto.randomBytes(SALT_LENGTH).toString(BYTE_TO_STRING_ENCODING);
            crypto.pbkdf2(password, salt, ITERATIONS, PASSWORD_LENGTH, DIGEST, (error, hash) => {
                if (error) {
                    reject(error);
                } else {
                    accept({
                        salt,
                        hash: hash.toString(BYTE_TO_STRING_ENCODING),
                        iterations: ITERATIONS,
                    });
                }
            });
        })
    },
    verifyPassword: (passwordData, passwordAttempt) => {
        return new Promise((accept, reject) => {
            crypto.pbkdf2(passwordAttempt, passwordData.salt, parseInt(passwordData.iterations), PASSWORD_LENGTH, DIGEST, (error, hash) => {
                if (error) {
                    reject(error);
                } else {
                    accept(passwordData.hash === hash.toString(BYTE_TO_STRING_ENCODING));
                }
            });
        });
    }
}
