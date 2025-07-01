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
        if (this.#isContextValid(this.jsonLd)) {
            if (this.jsonLd["@graph"] !== undefined) {
                let filtered = this.jsonLd["@graph"].filter(x => this.#isTypeMatching(x["@type"], this.searchLdType));

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
                if (!this.#isTypeMatching(this.jsonLd["@type"], this.searchLdType))
                    return undefined;

                let content = this.jsonLd[this.searchProperty];
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

    #isTypeMatching(sourceCodeTypeValue, searchLdType) {
        if(typeof sourceCodeTypeValue === "string" && sourceCodeTypeValue === searchLdType)
            return true;

        if(Array.isArray(sourceCodeTypeValue) && sourceCodeTypeValue.filter(t => t === searchLdType).length >= 1)
            return true;

        return false;
    }

    #isContextValid(ld) {
        const schemaOrgRegex = /^https?:\/\/schema\.org/;

        if(ld["@context"] === undefined)
            return false;

        if(typeof ld["@context"] === "string" && ld["@context"]?.match(schemaOrgRegex))
            return true;

        // schema.org itself uses @context like this:
        if (typeof ld["@context"]["schema"] === "string" && ld["@context"]["schema"]?.match(schemaOrgRegex))
            return true;
        
        return false;
    }
}

class UrlSearcher extends Searcher {
    constructor(dateType, url, confidence) {
        super(dateType);
        this.url = url;
        this.confidence = confidence;
    }

    search() {
        if (!this.url || this.url === "about:blank") {
            return null;
        }

        try {
            const urlObj = new URL(this.url);
            const pathname = urlObj.pathname;
            
            const datePattern = /(\d{4})[-\/_]?(\d{1,2})[-\/_]?(\d{1,2})/;
            const match = pathname.match(datePattern);
            
            if (match) {
                const [, year, month, day] = match;
                const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                let date = DateParser.parse(dateStr);
                if (date !== undefined) {
                    return new SearchResult(this.dateType, match[0], date, "url", this.confidence);
                }
            }

        } catch (e) {
            // Invalid URL, return null
        }

        return null;
    }
}

class ScriptTagSearcher extends Searcher {
    constructor(dateType, scriptContent, confidence) {
        super(dateType);
        this.scriptContent = scriptContent;
        this.confidence = confidence;
    }

    search() {
        if (!this.scriptContent) {
            return null;
        }

        try {
            // ISO 8601 date pattern, e.g.:
            // YYYY-MM-DD
            // YYYY-MM-DDThh:mm:ss
            // YYYY-MM-DDThh:mm:ssZ
            // YYYY-MM-DDThh:mm:ss+hh:mm
            const isoDatePattern = /(\b\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?\b)/g;
            
            const matches = [...this.scriptContent.matchAll(isoDatePattern)];
            
            if (matches.length === 0) {
                return null;
            }
            
            // Only the first match for now to maintain compatibility with the existing architecture.
            // Could be improve to return more results.
            const dateStr = matches[0][0];
            const date = DateParser.parse(dateStr);
            
            if (date === undefined) {
                return null;
            }
            
            return new SearchResult(this.dateType, dateStr, date, "script-tag", this.confidence);
        } catch (e) {
            // Error in regex or parsing, return null
            return null;
        }
    }
}