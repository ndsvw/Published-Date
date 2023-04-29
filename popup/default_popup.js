
window.onload = async function () {
  var DateTime = luxon.DateTime

  console.log("onload");
  var backgroundPage = browser.extension.getBackgroundPage();
  let results = await backgroundPage.getDateInformation();

  var table = document.getElementById("results");
  table.innerHTML = "";

  results.forEach(r => {
    let dt = DateTime.fromJSDate(new Date(r.interpretedDate));

    const cellType = document.createElement("td");
    cellType.innerHTML = r.dateType;

    const newRow = document.createElement("tr");
    const cellDate = document.createElement("td");
    cellDate.innerHTML = dt.toLocaleString(DateTime.DATETIME_MED);
    cellDate.setAttribute("title", dt.toRelativeCalendar());

    newRow.appendChild(cellType);
    newRow.appendChild(cellDate);

    table.appendChild(newRow);
  });
}