
window.onload = async function () {
  var DateTime = luxon.DateTime

  console.log("onload");
  var backgroundPage = browser.extension.getBackgroundPage();
  let dates = await backgroundPage.getDateInformation();

  if (dates?.published) {
    let dt = DateTime.fromJSDate(new Date(dates.published));
    document.getElementById("published-date").innerHTML = dt.toLocaleString(DateTime.DATETIME_MED);
    document.getElementById("published-date").setAttribute("title", dt.toRelativeCalendar());
  }
  else {
    document.getElementById("published-date").innerHTML = "-";
    document.getElementById("published-date").setAttribute("title", "no information found");
  }

  if (dates?.updated) {
    let dt = DateTime.fromJSDate(new Date(dates.updated));
    document.getElementById("updated-date").innerHTML = dt.toLocaleString(DateTime.DATETIME_MED);
    document.getElementById("updated-date").setAttribute("title", dt.toRelativeCalendar());
  }
  else {
    document.getElementById("updated-date").innerHTML = "-";
    document.getElementById("updated-date").setAttribute("title", "no information found");
  }
}