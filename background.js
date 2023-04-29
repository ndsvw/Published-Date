"use strict";

//
// Classes
//

const DateType = {
  PUBLISHED: 'published',
  UPDATED: 'updated',
  PUBLISHEDORUPDATED: 'published or updated'
};

class SearchResult {
  constructor(searcher, extractedValue, interpretedDate) {
    this.searcher = searcher;
    this.extractedValue = extractedValue;
    this.interpretedDate = interpretedDate;
  }

  toDto() {
    return {
      dateType: this.searcher.dateType,
      extractedValue: this.extractedValue,
      interpretedDate: this.interpretedDate,
    };
  }
}

class Searcher {
  constructor(dateType) {
    this.dateType = dateType;
  }

  search() {
    throw new Error('Method not implemented');
  }
}

class MetaSearcher extends Searcher {
  constructor(dateType, searchMeta, allMetas) {
    super(dateType);
    this.searchMeta = searchMeta;
    this.allMetas = allMetas;
  }

  search() {
    let match = this.allMetas.find(x => x.name === this.searchMeta);
    if (match) {
      let content = match.content;
      if (content) {
        let date = Date.parse(content);
        if (isNaN(date))
          return null;
        return new SearchResult(this, content, date);
      }
    }
  }
}

class JsonLdSearcher extends Searcher {
  constructor(dateType, searchLdType, searchProperty, allJsonLds) {
    super(dateType);
    this.searchLdType = searchLdType;
    this.searchProperty = searchProperty;
    this.allJsonLds = allJsonLds;
  }

  search() {
    for(let jsonLd of this.allJsonLds) {

      // cleanse, because some websites have multiline json ld or similar...
      let cleansedJsonLd = jsonLd.replace(/(\r\n|\n|\r|\t)/gm, "");

      let ld = JSON.parse(cleansedJsonLd);
      if(ld["@context"] === "https://schema.org" || ld["@context"] === "https://schema.org/") {
        if(ld["@graph"] !== undefined) {
          let filtered = ld["@graph"].filter(x => x["@type"] === this.searchLdType);
          console.log("aaa " + filtered);

          if(filtered === undefined || filtered.length == 0)
            return undefined;

          let single = filtered[0];
          
          if(single[this.searchProperty] === undefined)
            return undefined;

          let content = single[this.searchProperty];
          let date = Date.parse(content);
          if (isNaN(date))
            return null;
          return new SearchResult(this, content, date);
        } else {
          if(ld["@type"] !== this.searchLdType)
            return undefined;

          let content = ld[this.searchProperty];
          if(content === undefined)
            return undefined;

          let date = Date.parse(content);
          if (isNaN(date))
            return null;
          return new SearchResult(this, content, date);  
        }
      }
    }

    return undefined;
  }
}

class DateParser {
  parse(dateString) {
    let parsedDate = Date.parse(dateString);
    return isNaN(parsedDate) ? undefined : parsedDate;
  }
}

//
// Main Logic
//

async function sendQueryToTab(tab, query) {
  let response;
  try {
    response = await browser.tabs.sendMessage(
      tab.id,
      { query: query }
    );
  } catch (e) {
    console.warn("Could not send query to tab.", e); // e.g. because tab returns json and conent is not injected.
    return Promise.resolve(undefined);
  }
  console.log(`Response from the content script for query '${query}':`, response);
  return Promise.resolve(response);
}

async function getDateInformation() {
  let tabs = await browser.tabs.query({
    currentWindow: true,
    active: true
  });
  let tab = tabs[0];
  if (tab) {
    // test connection to content script
    let testConntectionResult = await sendQueryToTab(tab, "test-connection");
    if (!testConntectionResult)
      return Promise.resolve(undefined);

    let metasResult = await sendQueryToTab(tab, "get-metas");
    if (!metasResult)
      return Promise.resolve(undefined);
    let metasJson = metasResult.response;
    let metas = JSON.parse(metasJson);
    console.log("Metas:", metas);

    let results = findOutDatesFromMetas(metas);

    let jsonLdResult = await sendQueryToTab(tab, "get-ld-jsons");
    if (jsonLdResult) {
      let ldJsons = jsonLdResult.response;
      let lds = JSON.parse(ldJsons);
      console.log("LD-Jsons:", lds);
      let dateFromLdJsons = findOutDateFromLdJsons(lds);
      results = results.concat(dateFromLdJsons);
    }
      
    return Promise.resolve(results);
  } else {
    console.error("no active tab");
    return Promise.resolve("ooops");
  }
}

function findOutDateFromLdJsons(jsons){
  // https://schema.org/Date

  let ldSearchers = [
    new JsonLdSearcher(DateType.PUBLISHED, "Answer", "datePublished", jsons),
    new JsonLdSearcher(DateType.PUBLISHED, "Answer", "dateCreated", jsons),
    new JsonLdSearcher(DateType.UPDATED, "Answer", "dateModified", jsons),

    new JsonLdSearcher(DateType.PUBLISHED, "Article", "datePublished", jsons),
    new JsonLdSearcher(DateType.PUBLISHED, "Article", "dateCreated", jsons),
    new JsonLdSearcher(DateType.UPDATED, "Article", "dateModified", jsons),

    new JsonLdSearcher(DateType.PUBLISHED, "NewsArticle", "datePublished", jsons),
    new JsonLdSearcher(DateType.PUBLISHED, "NewsArticle", "dateCreated", jsons),
    new JsonLdSearcher(DateType.UPDATED, "NewsArticle", "dateModified", jsons),

    new JsonLdSearcher(DateType.PUBLISHED, "QAPage", "datePublished", jsons),
    new JsonLdSearcher(DateType.PUBLISHED, "QAPage", "dateCreated", jsons),
    new JsonLdSearcher(DateType.UPDATED, "QAPage", "dateModified", jsons),

    new JsonLdSearcher(DateType.PUBLISHED, "Question", "datePublished", jsons),
    new JsonLdSearcher(DateType.PUBLISHED, "Question", "dateCreated", jsons),
    new JsonLdSearcher(DateType.UPDATED, "Question", "dateModified", jsons),

    new JsonLdSearcher(DateType.PUBLISHED, "WebPage", "datePublished", jsons),
    new JsonLdSearcher(DateType.PUBLISHED, "WebPage", "dateCreated", jsons),
    new JsonLdSearcher(DateType.UPDATED, "WebPage", "dateModified", jsons),

    new JsonLdSearcher(DateType.PUBLISHED, "WebSite", "datePublished", jsons),
    new JsonLdSearcher(DateType.PUBLISHED, "WebSite", "dateCreated", jsons),
    new JsonLdSearcher(DateType.UPDATED, "WebSite", "dateModified", jsons),

    new JsonLdSearcher(DateType.PUBLISHED, "JobPosting", "datePosted", jsons),
    new JsonLdSearcher(DateType.PUBLISHED, "RealEstateListing", "datePosted", jsons),
    new JsonLdSearcher(DateType.PUBLISHED, "SpecialAnnouncement", "datePosted", jsons),

    new JsonLdSearcher(DateType.PUBLISHED, "MediaObject", "uploadDate", jsons),

  ];

  return ldSearchers.map(x => x.search()).filter(x => x !== undefined && x !== null).map(x => x.toDto());
}

function findOutDatesFromMetas(metas) {
  let metasSearchers = [
      new MetaSearcher(DateType.PUBLISHED, "article:published_time", metas),
      new MetaSearcher(DateType.PUBLISHED, "created", metas),
      new MetaSearcher(DateType.PUBLISHED, "available", metas),
      new MetaSearcher(DateType.PUBLISHED, "date", metas),
      new MetaSearcher(DateType.PUBLISHED, "dateAccepted", metas),
      new MetaSearcher(DateType.PUBLISHED, "dateCopyrighted", metas),
      new MetaSearcher(DateType.PUBLISHED, "issued", metas),

      new MetaSearcher(DateType.UPDATED, "article:modified_time", metas),
      new MetaSearcher(DateType.UPDATED, "og:updated_time", metas),
      new MetaSearcher(DateType.UPDATED, "modified", metas),
      new MetaSearcher(DateType.UPDATED, "revised", metas),
  ];

  return metasSearchers.map(x => x.search()).filter(x => x !== undefined && x !== null).map(x => x.toDto());
}