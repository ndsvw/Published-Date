"use strict";

class Searcher {
    constructor(dateType) {
        this.dateType = dateType;
    }

    search() {
        throw new Error('Method not implemented');
    }
}

class SearchResult {
    constructor(dateType, extractedValue, interpretedDate, searchMethodShortcut, confidence) {
        this.dateType = dateType;
        this.extractedValue = extractedValue;
        this.interpretedDate = interpretedDate;
        this.searchMethodShortcut = searchMethodShortcut;
        this.confidence = confidence;
    }

    toDto() {
        return {
            dateType: this.dateType,
            extractedValue: this.extractedValue,
            interpretedDate: this.interpretedDate,
            searchMethodShortcut: this.searchMethodShortcut,
            confidence: this.confidence, // 0 - 100
        };
    }
}

class MetaSearcher extends Searcher {
    constructor(dateType, searchMeta, allMetas, confidence) {
        super(dateType);
        this.searchMeta = searchMeta;
        this.allMetas = allMetas;
        this.confidence = confidence;
    }

    search() {
        let match = this.allMetas.find(x => x.name === this.searchMeta);
        if (match) {
            let content = match.content;
            if (content) {
                let date = DateParser.parse(content);
                if (date == undefined)
                    return null;
                return new SearchResult(this.dateType, content, date, "meta", this.confidence);
            }
        }
    }
}

class JsonLdSearcher extends Searcher {
    constructor(dateType, searchLdType, searchProperty, jsonLd, confidence) {
        super(dateType);
        this.searchLdType = searchLdType;
        this.searchProperty = searchProperty;
        this.jsonLd = jsonLd;
        this.confidence = confidence;
    }

    search() {
        // cleanse, because some websites have multiline json ld or similar...
        let cleansedJsonLd = this.jsonLd.replace(/(\r\n|\n|\r|\t)/gm, "");

        let ld = JSON.parse(cleansedJsonLd);
        if (ld["@context"]?.match(/^https?:\/\/schema\.org/)) {
            if (ld["@graph"] !== undefined) {
                let filtered = ld["@graph"].filter(x => x["@type"] === this.searchLdType);

                if (filtered === undefined || filtered.length == 0)
                    return undefined;

                let single = filtered[0];

                if (single[this.searchProperty] === undefined)
                    return undefined;

                let content = single[this.searchProperty];
                let date = DateParser.parse(content);
                if (date == undefined)
                    return null;
                return new SearchResult(this.dateType, content, date, "json-ld", this.confidence);
            } else {
                if (ld["@type"] !== this.searchLdType)
                    return undefined;

                let content = ld[this.searchProperty];
                if (content === undefined)
                    return undefined;

                let date = DateParser.parse(content);
                if (date == undefined)
                    return null;
                return new SearchResult(this.dateType, content, date, "json-ld", this.confidence);
            }
        }

        return undefined;
    }
}