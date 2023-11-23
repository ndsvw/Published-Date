
window.onload = async function () {
  var DateTime = luxon.DateTime

  console.log("onload");
  let results = await browser.runtime.sendMessage({ type: "getDateInformation", data: {} });
  await updateWaybackMachineArea();

  var numerOfResultsHeading = document.getElementById("number-of-results");

  if(results === undefined) {
    numerOfResultsHeading.innerText = "No dates found";
    return;
  }

  results.sort(function(a,b){ return b.confidence - a.confidence; });

  numerOfResultsHeading.innerText = results.length + " date(s) found";

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

async function updateWaybackMachineArea() {
  let waybackArea = document.getElementById("wayback-area");
  let waybackLink = document.getElementById("wayback-link");
  let tabUrl = await browser.runtime.sendMessage({ type: "getUrl", data: {} });
  if(tabUrl.startsWith("http")) {
    let currentYear = new Date().getFullYear();
    let waybackUrl = `https://web.archive.org/web/${currentYear}0000000000*/${tabUrl}`;
    const link = document.createElement("a");
    link.setAttribute("href", waybackUrl)
    link.innerText = "WayBackMachine for this site";
    waybackLink.appendChild(link);
    waybackArea.style.display = 'block';
  } else {
    waybackArea.style.display = 'none';
  }
}