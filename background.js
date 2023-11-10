"use strict";

//
// Classes
//

const DateType = {
  PUBLISHED: 'published',
  UPDATED: 'updated',
  PUBLISHEDORUPDATED: 'published or updated'
};

class DateParser {
  parse(dateString) {
    let parsedDate = Date.parse(dateString);
    return isNaN(parsedDate) ? undefined : parsedDate;
  }
}

function findOutDatesFromLdJsons(jsons) {
  // https://schema.org/Date

  let results = [];
  for (let json of jsons) {
    let ldSearchers = SearcherInstances.GenerateJsonLdSearchers(json)
    ldSearchers.map(x => x.search()).filter(x => x !== undefined && x !== null).map(x => x.toDto()).forEach(r => results.push(r));
  }
  return results;
}

function findOutDatesFromMetas(metas) {
  let metaSearchers = SearcherInstances.GenerateMetaSearchers(metas);
  return metaSearchers.map(x => x.search()).filter(x => x !== undefined && x !== null).map(x => x.toDto());
}

function findOutDatesFromTimeTagDatetimes(datetimes) {
  let results = [];
  datetimes.forEach(d => {
    let date = Date.parse(d);
    if (!isNaN(date))
      results.push(new SearchResult(DateType.PUBLISHEDORUPDATED, d, date, "time-tag", 10));
  });

  return results;
}

//
// Communication
//

const requestHandlers = {
  getDateInformation: getDateInformation,
  getUrl: getUrl,
};

browser.runtime.onMessage.addListener(async (message, sender) => {
  const { type, data } = message;
  if (type in requestHandlers) {
    const response = new Promise(async (resolve, reject) => {
      let response = await requestHandlers[type](data);
      resolve(response);
    });

    return response;
  } else {
    const response = "Unknown request received";
    console.error(response);
  }
});

async function getDateInformation(data) {
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

    let results = [];

    let metasResult = await sendQueryToTab(tab, "get-metas");
    if (metasResult) {
      let metasJson = metasResult.response;
      let metas = JSON.parse(metasJson);
      results = results.concat(findOutDatesFromMetas(metas));
    }

    let jsonLdResult = await sendQueryToTab(tab, "get-ld-jsons");
    if (jsonLdResult) {
      let ldJsons = jsonLdResult.response;
      let lds = JSON.parse(ldJsons);
      let dateFromLdJsons = findOutDatesFromLdJsons(lds);
      results = results.concat(dateFromLdJsons);
    }

    let timeTagsResults = await sendQueryToTab(tab, "get-time-tag-datetimes");
    if (timeTagsResults) {
      let jsonDatetimes = timeTagsResults.response;
      let datetimes = JSON.parse(jsonDatetimes);
      let dateFromTimeTagDatetimes = findOutDatesFromTimeTagDatetimes(datetimes);
      results = results.concat(dateFromTimeTagDatetimes);
    }

    return Promise.resolve(results);
  } else {
    console.error("no active tab");
    return Promise.resolve("ooops");
  }
}

async function getUrl(data) {
  let tabs = await browser.tabs.query({
    currentWindow: true,
    active: true
  });
  let tab = tabs[0];
  if (tab)
    return tab.url;
  return "about:blank";
}

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
