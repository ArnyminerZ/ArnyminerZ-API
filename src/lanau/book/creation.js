const mysqlSync = require('../../utils/mysql-sync')

const {checkAvailability, AvailabilityCheckResult} = require('./booking-loader')

module.exports = {
    processLaNauBookCreation: async (req, res, con) => {
        const body = req.body;
        const userId = body.userId
        const startDate = body.startDate
        const endDate = body.endDate
        const people = body.people

        if (!userId || !startDate || !endDate || !people)
            return res.status(400).send({error: "missing-data"})

        const bookingStartDate = new Date(startDate),
            bookingEndDate = new Date(endDate),
            bookingPeople = parseInt(people)

        try {
            const bookingAvailable = await checkAvailability(con, null, bookingStartDate, bookingEndDate, bookingPeople)

            if (bookingAvailable === AvailabilityCheckResult.EVENT_PASSED)
                return res.status(400).send({error: 'event_passed'})
            if (bookingAvailable === AvailabilityCheckResult.MAX_PEOPLE_REACHED)
                return res.status(403).send({error: 'max_people_reached'})

            const submitBookingSql = "INSERT INTO `ArnyminerZ`.`lanau_bookings`(`user`, `people`, `date`, `end`) VALUES (UNHEX(REPLACE('{0}','-','')), '{1}', '{2}', '{3}')"
                .format(userId, parseInt(people), bookingStartDate.toISOString(), bookingEndDate.toISOString())
            const submitBookingResult = await mysqlSync.query(con, submitBookingSql)

            res.json(submitBookingResult);
        } catch (e) {
            return res.status(500).send(e)
        }
    }
}
