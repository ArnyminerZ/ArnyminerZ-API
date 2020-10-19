module.exports = {
    /**
     * Checks if two bounds of dates overlap
     * @param from_1 {Date} The starting date of the first bound
     * @param to_1 {Date} The ending date of the first bound
     * @param from_2 {Date} The starting date of the second bound
     * @param to_2 {Date} The ending date of the second bound
     * @return {Boolean} If the bounds match
     */
    dateBoundsMatch: (from_1, to_1, from_2, to_2) => {
        const from1 = from_1.getTime(),
            to1 = to_1.getTime(),
            from2 = from_2.getTime(),
            to2 = to_2.getTime();

        return (from2 >= from1 && from2 < to1) || (to2 > from1 && to2 <= to1)
    },
    DateRange: class {
        /**
         * Initializes the DateRange Class
         * @param startDate {Date} The start date of the bounds
         * @param endDate {Date} The end date of the bounds, must be later of startDate, or errors may occur.
         */
        constructor(startDate, endDate) {
            this.startDate = startDate;
            this.endDate = endDate;
        }

        /**
         * Checks if the dates range contains another
         * @param date {Date} The date to check if within bounds
         */
        contains(date) {
            return (date.getTime() <= this.endDate.getTime() && date.getTime() >= this.startDate.getTime())
        }
    }
}
