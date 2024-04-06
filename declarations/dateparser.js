class DateParser {
    static firstPossibleDate = new Date(1980, 1, 1);
    static lastPossibleDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1)); // today in a year

    // returns a date or undefined, if it can't extract one
    static parse(dateString) {
        let trimmedDateString = dateString.trim();
        let parsedDate = Date.parse(trimmedDateString);
        if (!isNaN(parsedDate) && DateParser.#isPlausible(parsedDate))
            return parsedDate;

        parsedDate = DateParser.#parseOnlyPartOfString(trimmedDateString);
        if (parsedDate === undefined)
            return undefined;

        if (!DateParser.#isPlausible(parsedDate))
            return undefined;

        return parsedDate;
    }

    // returns a date or undefined, if it can't extract one
    static #parseOnlyPartOfString(trimmedDateString) {
        // e.g. 2023-01-23 or 2023/01/23
        var matches = trimmedDateString.match(/^[-0-9/_]{6,10}/);
        if (matches?.length >= 1) {
            let parsedDate = Date.parse(matches[0]);
            return !isNaN(parsedDate) ? parsedDate : undefined;
        }
        return undefined;
    }

    static #isPlausible(date) {
        // plausibility check whether the date could be a publish / update date
        return date >= DateParser.firstPossibleDate && date <= DateParser.lastPossibleDate;
    }
}