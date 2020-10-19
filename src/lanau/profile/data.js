const {checkToken} = require('../../auth/token-checker')

module.exports = {
    processLaNauProfileDataChange: async (req, res, con) => {
        // >> First let's check if there's a logged in user
        const user = await checkToken(req, res, con, false, false)
        if (user == null) // The user must be logged in
            return res.status(401).send({error: 'not_logged_in'})

        try {
            // >> Then check if the user is allowed to access La NAU
            const allowed = await user.hasPermission('lanau')
            if (!allowed)
                return res.status(403).send({error: 'not_allowed'})

            const body = req.body
            const dni = body.dni,
                address = body.address,
                city = body.city,
                zipCode = body.zipCode

            const result = await user.updateLaNAUData(dni, address, city, zipCode)
            res.send({status: true, data: result});
        } catch (err) {
            console.error(err)
            res.status(500).send({error: err});
        }
    }
}
