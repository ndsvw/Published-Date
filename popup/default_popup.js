window.onload = async function () {
  var DateTime = luxon.DateTime;
  console.log("onload");
  
  // Initialize the view
  await updatePopupContent();
}

async function updatePopupContent() {
  var DateTime = luxon.DateTime;
  let updateExternalAlternativesAreaPromise = updateExternalAlternativesArea();

  let results = await browser.runtime.sendMessage({ type: "getDateInformation", data: {} });
  
  var numerOfResultsHeading = document.getElementById("number-of-results");

  if(results === undefined || results.length === 0) {
    numerOfResultsHeading.innerText = "No dates found";
    return;
  }

  results.sort(function(a,b){ return b.confidence - a.confidence; });

  numerOfResultsHeading.innerText = results.length + " date" + (results.length > 1 ? "s" : "") + " found";

  var table = document.getElementById("results");
  table.innerText = "";

  results.forEach(r => {
    let dt = DateTime.fromJSDate(new Date(r.interpretedDate));

    const newRow = document.createElement("tr");

    const cellConfidence = document.createElement("td");
    let imageConfidence = createConfidenceImage(r.confidence);
    cellConfidence.appendChild(imageConfidence);

    const cellSearchMethodShortcut = document.createElement("td");
    cellSearchMethodShortcut.appendChild(createMethodShortcutLabel(r.searchMethodShortcut));

    const cellType = document.createElement("td");
    cellType.innerText = r.dateType;
    
    const cellDate = document.createElement("td");
    cellDate.classList.add("cell-local-date");
    cellDate.innerText = dt.toLocaleString(DateTime.DATETIME_MED);
    cellDate.setAttribute("title", dt.toRelativeCalendar());

    newRow.appendChild(cellConfidence);
    newRow.appendChild(cellSearchMethodShortcut);
    newRow.appendChild(cellType);
    newRow.appendChild(cellDate);

    table.appendChild(newRow);
  });

  await updateExternalAlternativesAreaPromise;
}

function createMethodShortcutLabel(searchMethodShortcut) {
  const labelSearchMethodShortcut = document.createElement("label");
  labelSearchMethodShortcut.innerText = searchMethodShortcut;
  labelSearchMethodShortcut.classList.add("label");

  if(searchMethodShortcut === "meta") {
    labelSearchMethodShortcut.classList.add("lightblue-label");
    labelSearchMethodShortcut.setAttribute("title", "Extracted from a 'meta tag' of the web page");
  }
  else if(searchMethodShortcut === "json-ld") {
    labelSearchMethodShortcut.classList.add("orange-label");
    labelSearchMethodShortcut.setAttribute("title", "Extracted from JSON-LD that was injected into the web page");
  }
  else if(searchMethodShortcut === "time-tag") {
    labelSearchMethodShortcut.classList.add("pink-label");
    labelSearchMethodShortcut.setAttribute("title", "Extracted from a 'time tag' somewhere on the web page");
  }
  else {
    console.warn(`Invalid operation. Shortcut ${searchMethodShortcut} not recognized.`);
  }

  return labelSearchMethodShortcut;
}

function createConfidenceImage(confidence) {
  const imageConfidence = document.createElement("img");
  imageConfidence.classList.add("confidence");

  if(confidence >= 80) {
    imageConfidence.setAttribute("src", "../img/icons/confidence/down-double-34-svgrepo-com.svg");
    imageConfidence.setAttribute("title", "High confidence: The information was provided directly by the website.");
    imageConfidence.classList.add("confidence-darkgreen");
    imageConfidence.classList.add("rotate-180");
  } else if(confidence >= 60) {
    imageConfidence.setAttribute("src", "../img/icons/confidence/down-svgrepo-com.svg");
    imageConfidence.setAttribute("title", "Medium confidence: The information may be retrieved unconventionally and could be wrong.");
    imageConfidence.classList.add("confidence-lightgreen");
    imageConfidence.classList.add("rotate-180");
  } else if(confidence >= 30) {
    imageConfidence.setAttribute("src", "../img/icons/confidence/down-double-34-svgrepo-com.svg");
    imageConfidence.setAttribute("title", "Low confidence: The information was generated based on assumptions and could be wrong.");
    imageConfidence.classList.add("confidence-yellow");
  } else {
    imageConfidence.setAttribute("src", "../img/icons/confidence/down-double-34-svgrepo-com.svg");
    imageConfidence.setAttribute("title", "Very low confidence: The information was generated based on assumptions and could be totally wrong.");
    imageConfidence.classList.add("confidence-orange"); 
  }

  return imageConfidence;
}

async function updateExternalAlternativesArea() {
  let externalAlternativesArea = document.getElementById("external-alternatives-area");
  let waybackLink = document.getElementById("wayback-link");
  let googleLink = document.getElementById("google-link");
  
  try {
    let tabUrl = await browser.runtime.sendMessage({ type: "getUrl", data: {} });
    
    if(tabUrl && tabUrl.startsWith("http")) {
      let currentYear = new Date().getFullYear();
      
      const waybackUrl = `https://web.archive.org/web/${currentYear}0000000000*/${tabUrl}`;
      const linkWayback = document.createElement("a");
      linkWayback.setAttribute("href", waybackUrl);
      linkWayback.setAttribute("target", "_blank");
      linkWayback.setAttribute("title", "View archived snapshots of this page in the Internet Archive");
      linkWayback.innerText = "Internet Archive Snapshots";
      waybackLink.appendChild(linkWayback);

      const googleUrl = `https://www.google.com/search?q=inurl%3A${tabUrl}`;
      const linkGoogle = document.createElement("a");
      linkGoogle.setAttribute("href", googleUrl);
      linkGoogle.setAttribute("target", "_blank");
      linkGoogle.setAttribute("title", "Search Google for this exact URL to find cached versions and references");
      linkGoogle.innerText = "Google URL Search";
      googleLink.appendChild(linkGoogle);

      externalAlternativesArea.style.display = 'block';
    } else {
      externalAlternativesArea.style.display = 'none';
    }
  } catch (error) {
    console.error("Error updating external alternatives:", error);
    externalAlternativesArea.style.display = 'none';
  }
}