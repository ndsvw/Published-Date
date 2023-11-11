class DateParser {

    // returns a date or undefined, if it can't extract one
    static parse(dateString) {
        let trimmedDateString = dateString.trim();
        let parsedDate = Date.parse(trimmedDateString);
        return !isNaN(parsedDate) ? parsedDate : DateParser.#parseOnlyPartOfString(trimmedDateString);
    }

    static #parseOnlyPartOfString(trimmedDateString) {
        // e.g. 2023-01-23 or 2023/01/23
        var matches = trimmedDateString.match(/^[-0-9/_]{6,10}/);
        if (matches?.length >= 1){
            let parsedDate = Date.parse(matches[0]);
            return !isNaN(parsedDate) ? parsedDate : undefined;
        }
        return undefined;
    }
}