const mysqlSync = require('../../utils/mysql-sync')

const {checkToken} = require('../../security/tokenizer')
const {Booking, OwnerCheckResult, checkAvailability, AvailabilityCheckResult} = require('./booking-loader')

module.exports = {
    processLaNauBookQuery: async (req, res, con) => {
        const params = req.params;

        try {
            const checkSql = "SELECT ArnyminerZ.uuid_of(`user`), `people`, `date`, `end` FROM `ArnyminerZ`.`lanau_bookings` WHERE `id`='{0}';".format(params.id);
            // First get the reservation data
            const bookingResult = await mysqlSync.query(con, checkSql)

            if (bookingResult.length <= 0)
                return res.status(400).send({error: 'booking_not_found'})

            const booking = bookingResult[0]
            booking["user"] = booking["ArnyminerZ.uuid_of(`user`)"]

            // Then get the reserving user
            const userSql = "SELECT `name`, `surname`, `username`, `email`, `profileImage`, `phoneNumber` FROM `ArnyminerZ`.`users` WHERE `id`=UNHEX(REPLACE('{0}','-',''));"
                .format(booking.user)
            const user = await mysqlSync.query(con, userSql)

            if (user.length > 0)
                booking["user"] = user[0]

            res.send({result: 'ok', data: booking})
        } catch (e) {
            return res.status(500).send(e)
        }
    },
    processLaNauBookDelete: async (req, res, con) => {
        const params = req.params;

        try {
            const id = params.id

            // >> First let's check if there's a logged in user
            const user = await checkToken(req, res, con, false, false, false)
            if (user == null) // The user must be logged in
                return res.status(401).send({error: 'not_logged_in'})

            // >> Then, check if the logged user is the one who made the reservation
            const booking = new Booking(con, id)
            const isOwner = await booking.checkOwner(user.id)

            if (isOwner === OwnerCheckResult.BOOKING_NOT_FOUND)
                return res.status(400).send({error: 'booking_not_found'})
            if (isOwner === OwnerCheckResult.USER_NOT_OWNER)
                return res.status(403).send({error: 'user_not_owner'})

            // >> And now, let's just delete the booking
            const deleteSql = "DELETE FROM `ArnyminerZ`.`lanau_bookings` WHERE `id`='{0}';"
                .format(params.id)
            const deleteResult = await mysqlSync.query(con, deleteSql)

            res.send({result: 'ok', data: deleteResult})
        } catch (e) {
            return res.status(500).send(e)
        }
    },
    processLaNauBookEditable: async (req, res) => {
        const params = req.params;

        try {
            const id = params.id

            // >> First let's check if there's a logged in user
            const user = await checkToken(req, res, con, false, false, false)
            if (user == null) // The user must be logged in
                return res.status(401).send({error: 'not_logged_in'})

            // >> Then, check if the logged user is the one who made the reservation
            const booking = new Booking(con, id)
            const isOwner = await booking.checkOwner(user.id)

            if (isOwner === OwnerCheckResult.BOOKING_NOT_FOUND)
                return res.status(400).send({error: 'booking_not_found'})
            if (isOwner === OwnerCheckResult.USER_NOT_OWNER)
                return res.status(403).send({error: 'user_not_owner'})

            // >> Now, check if the event was in the past
            const dateRange = await booking.getDateRange()
            if (dateRange == null)
                return res.status(400).send({error: 'booking_not_found'})
            const currentDate = new Date()

            if (dateRange.startDate.getTime() < currentDate)
                return res.status(400).send({error: 'event_passed'})

            res.send({result: 'ok'})
        } catch (e) {
            return res.status(500).send(e)
        }
    },
    processLaNauBookUpdate: async (req, res, con) => {
        const params = req.params;
        const body = req.body

        const startDate = body.startDate
        const endDate = body.endDate
        const people = body.people

        if (!startDate || !endDate || !people)
            return res.status(400).send({error: 'missing_data'})

        try {
            const id = params.id

            // >> First let's check if there's a logged in user
            const user = await checkToken(req, res, con, false, false, false)
            if (user == null) // The user must be logged in
                return res.status(401).send({error: 'not_logged_in'})

            // >> Then, check if the logged user is the one who made the reservation
            const booking = new Booking(con, id)
            const isOwner = await booking.checkOwner(user.id)

            if (isOwner === OwnerCheckResult.BOOKING_NOT_FOUND)
                return res.status(400).send({error: 'booking_not_found'})
            if (isOwner === OwnerCheckResult.USER_NOT_OWNER)
                return res.status(403).send({error: 'user_not_owner'})

            // >> Now, check if the new date is valid
            const bookingStartDate = new Date(startDate)
            const bookingEndDate = new Date(endDate)
            const isAvailable = await checkAvailability(con, parseInt(booking.id), bookingStartDate, bookingEndDate, people)

            if (isAvailable === AvailabilityCheckResult.EVENT_PASSED)
                return res.status(400).send({error: 'event_passed'})
            if (isAvailable === AvailabilityCheckResult.MAX_PEOPLE_REACHED)
                return res.status(403).send({error: 'max_people_reached'})

            // >> Finally, we can update the event
            await booking.update(people, bookingStartDate, bookingEndDate)

            res.send({result: 'ok'})
        } catch (e) {
            return res.status(500).send(e)
        }
    }
}
