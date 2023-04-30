
window.onload = async function () {
  var DateTime = luxon.DateTime

  console.log("onload");
  var backgroundPage = browser.extension.getBackgroundPage();
  let results = await backgroundPage.getDateInformation();

  var numerOfResultsHeading = document.getElementById("number-of-results");

  if(results === undefined) {
    numerOfResultsHeading.innerHTML = "No dates found";
    return;
  }

  numerOfResultsHeading.innerHTML = results.length + " dates found";

  var table = document.getElementById("results");
  table.innerHTML = "";

  results.forEach(r => {
    let dt = DateTime.fromJSDate(new Date(r.interpretedDate));

    const newRow = document.createElement("tr");

    const cellConfidence = document.createElement("td");
    const imageConfidence = document.createElement("img");
    imageConfidence.setAttribute("src", "../icons/dot/dot-circle-svgrepo-com.svg");
    imageConfidence.setAttribute("title", "High confidence: The information was provided by the website.");
    imageConfidence.classList.add("green-dot");
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
  else
    return "";
}