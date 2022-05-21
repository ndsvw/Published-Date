"use strict";

//
// Classes
//

class DateParser {
  parse(dateString) {
    let parsedDate = Date.parse(dateString);
    return isNaN(parsedDate) ? undefined : parsedDate;
  }
}

class MetasSearcher {
  constructor(metas) {
    this.metas = metas;
  }

  searchForDates() {
    let publishedDate;
    let modifiedDate;

    // Sources for meta tags:
    // https://gist.github.com/lancejpollard/1978404
    // https://www.dublincore.org/specifications/dublin-core/dcmi-terms/

    let publishedProperties = [
      "article:published_time",
      "created",
      "available",
      "date",
      "dateAccepted",
      "dateCopyrighted",
      "issued",
    ];

    let modifiedProperties = [
      "article:modified_time",
      "og:updated_time",
      "modified",
      "revised",
    ];

    for (let property of publishedProperties) {
      let match = this.metas.find(x => x.name === property);
      if (match) {
        let content = match.content;
        if (content) {
          let date = Date.parse(content);
          if (!isNaN(date))
            publishedDate = date;
          break;
        }
      }
    }

    for (let property of modifiedProperties) {
      let match = this.metas.find(x => x.name === property);
      if (match) {
        let content = match.content;
        if (content) {
          let date = Date.parse(content);
          if (!isNaN(date))
            modifiedDate = date;
          break;
        }
      }
    }

    return {
      published: publishedDate,
      updated: modifiedDate
    };
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
    return Promise.resolve(findOutDate(metas));
  } else {
    console.error("no active tab");
    return Promise.resolve("ooops");
  }
}

function findOutDate(metas) {
  let metasSearcher = new MetasSearcher(metas);
  var dates = metasSearcher.searchForDates();
  return {
    published: dates.published,
    updated: dates.updated
  };
}