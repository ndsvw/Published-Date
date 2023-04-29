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

    let result = await sendQueryToTab(tab, "get-metas");
    if (!result)
      return Promise.resolve(undefined);
    let metasJson = result.response;
    let metas = JSON.parse(metasJson);
    console.log("Metas:", metas);

    let datesFromMetas = findOutDatesFromMetas(metas);
    console.log(datesFromMetas);
    return Promise.resolve(datesFromMetas);

    // result = await sendQueryToTab(tab, "get-ld-jsons");
    // if (!result)
    //   return Promise.resolve(undefined);
      
    // let ldJsons = result.response;
    // let lds = JSON.parse(ldJsons);
    // console.log("LD-Jsons:", lds);
    // let dateFromLdJsons = findOutDateFromLdJsons(lds);
    // return Promise.resolve(dateFromLdJsons);

    //return Promise.resolve(undefined);
  } else {
    console.error("no active tab");
    return Promise.resolve("ooops");
  }
}

// function findOutDateFromLdJsons(jsons){
//   for(let json of jsons){
//     try{
//       let ld = JSON.parse(json);
//       if(ld["@context"] === "https://schema.org")
//     }
//   }
// }

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

  return metasSearchers.map(x => x.search()).filter(x => x !== undefined).map(x => x.toDto());
}