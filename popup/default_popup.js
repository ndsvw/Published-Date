
window.onload = async function () {
  var DateTime = luxon.DateTime

  console.log("onload");
  var backgroundPage = browser.extension.getBackgroundPage();
  let results = await backgroundPage.getDateInformation();

  await updateWaybackMachineArea(backgroundPage);

  var numerOfResultsHeading = document.getElementById("number-of-results");

  if(results === undefined) {
    numerOfResultsHeading.innerHTML = "No dates found";
    return;
  }

  results.sort(function(a,b){ return b.confidence - a.confidence; });

  numerOfResultsHeading.innerHTML = results.length + " date(s) found";

  var table = document.getElementById("results");
  table.innerHTML = "";

  results.forEach(r => {
    let dt = DateTime.fromJSDate(new Date(r.interpretedDate));

    const newRow = document.createElement("tr");

    const cellConfidence = document.createElement("td");
    let imageConfidence = createConfidenceImage(r.confidence);
    cellConfidence.appendChild(imageConfidence);

    const cellSearchMethodShortcut = document.createElement("td");
    const labelSearchMethodShortcut = document.createElement("label");
    labelSearchMethodShortcut.innerHTML = r.searchMethodShortcut;
    labelSearchMethodShortcut.classList.add(searchMethodShortcutToColorLabelClass(r.searchMethodShortcut));
    cellSearchMethodShortcut.appendChild(labelSearchMethodShortcut);

    const cellType = document.createElement("td");
    cellType.innerHTML = r.dateType;
    
    const cellDate = document.createElement("td");
    cellDate.innerHTML = dt.toLocaleString(DateTime.DATETIME_MED);
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
  imageConfidence.setAttribute("src", "../icons/dot/dot-circle-svgrepo-com.svg");
  if(confidence >= 75) {
    imageConfidence.setAttribute("title", "High confidence: The information was provided directly by the website.");
    imageConfidence.classList.add("green-dot");
  } else if(confidence >= 33) {
    imageConfidence.setAttribute("title", "Medium confidence: The information was retrieved unconventionally and could be wrong.");
    imageConfidence.classList.add("yellow-dot");
  } else {
    imageConfidence.setAttribute("title", "Low confidence: The information was generated based on assumptions and could be totally wrong.");
    imageConfidence.classList.add("orange-dot");
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
    link.innerHTML = "WayBackMachine for this site";
    waybackLink.appendChild(link);
    waybackArea.style.display = 'block';
  } else {
    waybackArea.style.display = 'none';
  }
}