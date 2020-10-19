const fs = require('fs')
const sharp = require('sharp')

const {checkToken} = require('./token-checker')
const {getFileExtension, changeFileExtension} = require('../utils/string-utils')

module.exports = {
    processAvatarChange: async (req, res, con) => {
        // >> First let's check if there's a logged in user
        const user = await checkToken(req, res, con, false, false)
        if (user == null) // The user must be logged in
            return res.status(401).send({error: 'not_logged_in'})

        const body = req.body
        const redirect = body.redirect
        try {
            if (!req.files) {
                res.status(400).send({
                    status: false,
                    message: 'No file uploaded'
                });
            } else {
                //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
                let avatar = req.files.avatar;

                if (avatar == null)
                    return res.status(400).send({
                        status: false,
                        message: 'Avatar file not set'
                    });

                //Use the mv() method to place the file in upload directory (i.e. "uploads")
                const srcExtension = getFileExtension(avatar.name)
                const path = './data/{0}.{1}'.format(user.id, srcExtension)
                avatar.mv(path);

                const newPath = changeFileExtension(path, 'webp')
                if (fs.existsSync(newPath))
                    fs.unlinkSync(newPath)

                // Resize image
                const avatarImage = sharp(avatar.data)
                avatarImage
                    .resize({width: 512, height: 512})
                await avatarImage.toFile(newPath)

                fs.unlinkSync(path)

                // Updating in DB
                await user.updateImage(newPath.substr(1))

                //send response
                if (redirect)
                    res.redirect(redirect)
                else
                    res.send({
                        status: true,
                        message: 'File is uploaded',
                        data: {
                            name: avatar.name,
                            mimetype: avatar.mimetype,
                            size: avatar.size,
                            path: newPath
                        }
                    });
            }
        } catch (err) {
            console.error(err)
            if (redirect)
                res.redirect(redirect + "/?error=" + err)
            else
                res.status(500).send({error: err});
        }
    },

    processDataChange: async (req, res, con) => {
        // >> First let's check if there's a logged in user
        const user = await checkToken(req, res, con, false, false)
        if (user == null) // The user must be logged in
            return res.status(401).send({error: 'not_logged_in'})

        const body = req.body
        const name = body.name,
            surname = body.surname,
            email = body.email,
            phoneNumber = body.phoneNumber,
            birthDate = body.birthDate
        try {
            const result = await user.updateData(name, surname, email, phoneNumber, birthDate)
            res.send({status: true, data: result});
        } catch (err) {
            console.error(err)
            res.status(500).send({error: err});
        }
    }
}
