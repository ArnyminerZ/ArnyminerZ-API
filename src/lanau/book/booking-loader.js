const uuid = require('uuid')

const mysql = require('../../utils/mysql-sync')
const {dateBoundsMatch, DateRange} = require('../../utils/date-utils')

const OwnerCheckResult = {
    OK: 0,
    BOOKING_NOT_FOUND: 1,
    USER_NOT_OWNER: 2
}
const AvailabilityCheckResult = {
    OK: 0,
    EVENT_PASSED: 1,
    MAX_PEOPLE_REACHED: 2
}

/**
 * Loads the data of a user
 * @param {Connection} conn The connected MySQL session
 */
const loadBookings = async (conn) => {
    const bookings = await mysql.query(conn, "SELECT * FROM `ArnyminerZ`.`lanau_bookings`")
    const data = JSON.parse(JSON.stringify(bookings))
    for (const d in data)
        if (data.hasOwnProperty(d))
            data[d]["user"] = uuid.stringify(data[d].user.data)
    return data;
}

/**
 * Checks if there's availability. This checks:
 * - If the maximum amount of people is reached
 * - If the event has already been
 * @param conn {Connection} The MySQL session
 * @param skipId {Number|null} The id of the booking to check, if it's already stored, so it won't be taken into account
 * @param startDate {Date} The start date for the event
 * @param endDate {Date} The end date for the event
 * @param people {number} The amount of people that will attend
 * @return {Promise<AvailabilityCheckResult>}
 */
const checkAvailability = async (conn, skipId, startDate, endDate, people) => {
    const now = new Date()

    if (now.getTime() > startDate.getTime())
        return AvailabilityCheckResult.EVENT_PASSED

    const bookings = await loadBookings(conn)
    const maxPeople = parseInt(process.env.MAX_PEOPLE_PER_BOOKING)
    people = parseInt(people) // Convert to int just in case
    //console.log("Checking availability for", people, "people in", bookings.length, "bookings...")
    for (const b in bookings)
        if (bookings.hasOwnProperty(b)) {
            const booking = bookings[b]
            if (skipId != null) {
                if (parseInt(booking.id) === skipId) {
                    //console.log("  Got booking", b, "- Skipped!")
                    continue
                }
            }

            const bookingStartDate = new Date(booking.date)
            const bookingEndDate = new Date(booking.end)
            const bookingPeople = parseInt(booking.people)
            const boundsMatch = dateBoundsMatch(startDate, endDate, bookingStartDate, bookingEndDate)

            //console.log("  Got booking", b, "- Start date:", bookingStartDate, "End date:", bookingEndDate, "People:", booking.people, "Bounds match:", boundsMatch)

            if (!boundsMatch) continue

            people += bookingPeople
            if (people > maxPeople) {
                //console.log("    New total amount of people", people, "is greater than the allowed people:", maxPeople)
                return AvailabilityCheckResult.MAX_PEOPLE_REACHED
            }
        }

    return AvailabilityCheckResult.OK
}

module.exports = {
    OwnerCheckResult, AvailabilityCheckResult,
    Booking: class {
        /**
         * The main constructor for the class
         * @param conn {Connection} The MySQL session
         * @param id {Number} The id of the booking
         */
        constructor(conn, id) {
            this.conn = conn;
            this.id = id;
        }

        /**
         * Checks if a user is the one who made the reservation
         * @param userId {String} The id of the user to check
         * @return {Promise<OwnerCheckResult>} Whether or not the user made the reservation
         */
        async checkOwner(userId) {
            const checkOwnerSql = "SELECT ArnyminerZ.uuid_of(`user`) FROM `ArnyminerZ`.`lanau_bookings` WHERE `id`='{0}';"
                .format(this.id)
            const checkOwnerResult = await mysql.query(this.conn, checkOwnerSql)
            if (checkOwnerResult.length <= 0)
                return OwnerCheckResult.BOOKING_NOT_FOUND
            const checkOwnerElement = checkOwnerResult[0]
            const ownerUuid = checkOwnerElement['ArnyminerZ.uuid_of(`user`)']
            if (ownerUuid !== userId)
                return OwnerCheckResult.USER_NOT_OWNER
            return OwnerCheckResult.OK
        }

        /**
         * Gets the start and end dates for the booking
         * @return {Promise<DateRange|null>} The start and end dates or null if event doesn't exist
         */
        async getDateRange() {
            const getDateSql = "SELECT `date`, `end` FROM `ArnyminerZ`.`lanau_bookings` WHERE `id`='{0}';"
                .format(this.id)
            const getDateResult = await mysql.query(this.conn, getDateSql)
            if (getDateResult.length <= 0)
                return null
            const dates = getDateResult[0]
            return new DateRange(new Date(dates.date), new Date(dates.end))
        }

        /**
         * Updates some data of the event.
         * Please note that this will only update the event, it won't check if there are conflicts
         * @param people {Number|null} The amount of people that the event will now have. Null for not updating
         * @param startDate {Date|null} The new start date for the event. Null for not updating
         * @param endDate {Date|null} The new end date for the event. Null for not updating
         */
        async update(people, startDate, endDate) {
            let fields = ''

            if (people != null) fields += "`people`='{0}',".format(people)
            if (startDate != null) fields += "`date`='{0}',".format(startDate.toISOString())
            if (endDate != null) fields += "`end`='{0}',".format(endDate.toISOString())
            fields = fields.substring(0, fields.length - 1)

            const updateSql = "UPDATE `ArnyminerZ`.`lanau_bookings` SET {0} WHERE `id`='{1}';"
                .format(fields, this.id)
            await mysql.query(this.conn, updateSql)
        }
    },
    loadBookings, checkAvailability
};
