/**
 * This file contains some scripts for checking the login tokens
 *
 * @author ArnyminerZ
 * @version 1 2020/10/15
 * @file token-checker.js
 */

//<editor-fold desc=">> Import some required dependencies">
const fs = require('fs')
//</editor-fold>

//<editor-fold desc=">> Import some required scripts">
const {User, loadUser} = require('../auth/user-loader')
const tokenizer = require('./tokenizer')
//</editor-fold>

module.exports = {
    /**
     * Runs a check with the stored cookies for knowing if the user is logged in
     * @param {Request<P, ResBody, ReqBody, ReqQuery>} req The request made
     * @param {Response<Body>} res For sending responses to the server. Can be null if redirect is false.
     * @param {Connection} con The MySQL active session
     * @param {Boolean} redirect If true, a redirect to /?redirectTo={current-path} will be made. If false, the login page will be shown if not logged in.
     * @param {Boolean} shouldDelete If true, the stored token will be deleted
     * @return {null|User} Null if not logged in, otherwise, the logged in user
     */
    checkToken: async (req, res, con, redirect, shouldDelete) => {
        const cookies = req.cookies;
        let token = cookies.token;
        if (token == null)
            token = req.body.token;
        const tokenValid = token != null ? tokenizer.isTokenValid(token) : false;
        if (token == null || !tokenValid) {
            if (!tokenValid) {
                console.log("Token is not valid:", token)
                res.cookie('token', null, {maxAge: 0})
            }
            if (redirect)
                res.redirect('/?redirectTo=' + req.originalUrl)

            return undefined
        } else {
            const tokenData = tokenizer.getToken(token)
            const userId = tokenData.userId;
            const user = await loadUser(con, userId)

            if (user == null) {
                tokenizer.deleteAuthToken(token)
                if (redirect)
                    res.redirect('/')
                return undefined
            }

            return user
        }
    }

}
