
window.onload = async function () {
  var DateTime = luxon.DateTime

  console.log("onload");
  var backgroundPage = browser.extension.getBackgroundPage();
  let results = await backgroundPage.getDateInformation();

  await updateWaybackMachineArea(backgroundPage);

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
    const labelSearchMethodShortcut = document.createElement("label");
    labelSearchMethodShortcut.innerText = r.searchMethodShortcut;
    labelSearchMethodShortcut.classList.add(searchMethodShortcutToColorLabelClass(r.searchMethodShortcut));
    cellSearchMethodShortcut.appendChild(labelSearchMethodShortcut);

    const cellType = document.createElement("td");
    cellType.innerText = r.dateType;
    
    const cellDate = document.createElement("td");
    cellDate.innerText = dt.toLocaleString(DateTime.DATETIME_MED);
    cellDate.setAttribute("title", dt.toRelativeCalendar());

    newRow.appendChild(cellConfidence);
    newRow.appendChild(cellSearchMethodShortcut);
    newRow.appendChild(cellType);
    newRow.appendChild(cellDate);

    table.appendChild(newRow);
  });
}

function searchMethodShortcutToColorLabelClass(searchMethodShortcut) {
  if(searchMethodShortcut === "meta")
    return "lightblue-label"
  else if(searchMethodShortcut === "json-ld")
    return "orange-label";
  else if(searchMethodShortcut === "time-tag")
    return "pink-label";
  else
    return "";
}

function createConfidenceImage(confidence) {
  const imageConfidence = document.createElement("img");
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

async function updateWaybackMachineArea(backgroundPage) {
  let waybackArea = document.getElementById("wayback-area");
  let waybackLink = document.getElementById("wayback-link");
  let tabUrl = await backgroundPage.getUrl();
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