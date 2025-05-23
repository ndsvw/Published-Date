"use strict";

//
// Classes
//

const DateType = {
  PUBLISHED: 'published',
  UPDATED: 'updated',
  PUBLISHEDORUPDATED: 'published or updated'
};

browser.tabs.onActivated.addListener(async (activeInfo) => {
  notifyPopupOfTabChange(activeInfo.tabId, "activated");
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only notify when the tab has completed loading and is active
  if (changeInfo.status === "complete") {
    const activeTabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (activeTabs.length > 0 && activeTabs[0].id === tabId) {
      notifyPopupOfTabChange(tabId, "complete");
    }
  }
});

async function notifyPopupOfTabChange(tabId, status) {
  try {
    await browser.runtime.sendMessage({ 
      type: "tabChanged", 
      data: { tabId, status } 
    });
  } catch (error) {
    // Popup not open, ignore error for now
  }
}

function findOutDatesFromLdJsons(jsons) {
  // https://schema.org/Date

  let searchers = [];
  for (let json of jsons) {
    // cleanse, because some websites have multiline json ld or similar...
    let cleansedJsonLd = json.replace(/(\r\n|\n|\r|\t)/gm, "");
    let ld;
    try {
      ld = JSON.parse(cleansedJsonLd);
    } catch(e) {
      console.warn("Parsing LD JSON failed.");
      return [];
    }
    if(Array.isArray(ld)) {
      for(let subld of ld) {
        searchers.push(...SearcherInstances.GenerateJsonLdSearchers(subld))
      }
    } else {
      searchers.push(...SearcherInstances.GenerateJsonLdSearchers(ld))
    }
  }
  return searchers.map(x => x.search()).filter(x => x !== undefined && x !== null).map(x => x.toDto());  
}

function findOutDatesFromMetas(metas) {
  let metaSearchers = SearcherInstances.GenerateMetaSearchers(metas);
  return metaSearchers.map(x => x.search()).filter(x => x !== undefined && x !== null).map(x => x.toDto());
}

function findOutDatesFromTimeTagDatetimes(datetimes) {
  let results = [];
  datetimes.forEach(d => {
    let date = DateParser.parse(d);
    if (date != undefined)
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
