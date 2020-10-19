const {checkAvailability, AvailabilityCheckResult} = require('./booking-loader')

module.exports = {
    processLaNauBookCheckAvailable: async (req, res, con) => {
        const body = req.body;
        const bookingId = body.id;
        const startDate = body.startDate
        const endDate = body.endDate
        const people = body.people

        if (!startDate || !endDate || !people)
            return res.status(400).send({error: "missing-data"})

        const bookingStartDate = new Date(startDate),
            bookingEndDate = new Date(endDate),
            bookingPeople = parseInt(people)

        try {
            console.log("Start:", bookingStartDate, "End:", bookingEndDate, "People:", bookingPeople)

            const bookingAvailable = await checkAvailability(con, parseInt(bookingId), bookingStartDate, bookingEndDate, bookingPeople)

            if (bookingAvailable === AvailabilityCheckResult.EVENT_PASSED)
                return res.status(400).send({error: 'event_passed'})
            if (bookingAvailable === AvailabilityCheckResult.MAX_PEOPLE_REACHED)
                return res.status(403).send({error: 'max_people_reached'})

            res.send({result: 'ok'});
        } catch (e) {
            return res.status(500).send(e)
        }
    }
}
