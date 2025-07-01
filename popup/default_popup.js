window.onload = async function () {
  var DateTime = luxon.DateTime;
  console.log("onload");
  
  // Initialize the view
  await updatePopupContent();
  
  // Set up a simple listener for tab changes (both activation and completion)
  browser.runtime.onMessage.addListener(async (message) => {
    if (message.type === "tabChanged") {
      console.log(`Tab event: ${message.data.status}, tabId: ${message.data.tabId}`);
      // Update content regardless of the status type
      await updatePopupContent();
    }
  });
}

function showLoadingState() {
  // Set loading message
  var numerOfResultsHeading = document.getElementById("number-of-results");
  numerOfResultsHeading.innerText = "Loading...";
  
  // Clear results table
  var table = document.getElementById("results");
  table.innerText = "";
  
  // Clear external alternatives area
  clearExternalAlternativesArea();
}

async function updatePopupContent() {
  var DateTime = luxon.DateTime;
  
  // Show loading state
  var numerOfResultsHeading = document.getElementById("number-of-results");
  numerOfResultsHeading.innerText = "Loading...";
  
  // Clear results table but don't remove "Loading..." message yet
  var table = document.getElementById("results");
  table.innerText = "";
  
  // Clear external alternatives area
  clearExternalAlternativesArea();
  
  // Start fetching external alternatives (will be populated when data is ready)
  let updateExternalAlternativesAreaPromise = updateExternalAlternativesArea();

  // Get date information
  try {
    let results = await browser.runtime.sendMessage({ type: "getDateInformation", data: {} });
    
    if(results === undefined || results.length === 0) {
      numerOfResultsHeading.innerText = "No dates found";
      return;
    }

    results.sort(function(a,b){ return b.confidence - a.confidence; });

    numerOfResultsHeading.innerText = results.length + " date" + (results.length > 1 ? "s" : "") + " found";

    results.forEach(r => {
      let dt = DateTime.fromJSDate(new Date(r.interpretedDate));

      const newRow = document.createElement("tr");

      const cellConfidence = document.createElement("td");
      let imageConfidence = createConfidenceImage(r.confidence);
      cellConfidence.appendChild(imageConfidence);

      const cellSearchMethodShortcut = document.createElement("td");
      cellSearchMethodShortcut.appendChild(createMethodShortcutLabel(r.searchMethodShortcut));

      const cellType = document.createElement("td");
      cellType.appendChild(createDateTypeIcon(r.dateType));
      
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
  } catch (error) {
    console.error("Error fetching date information:", error);
    numerOfResultsHeading.innerText = "Error loading dates";
  }
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
  else if(searchMethodShortcut === "url") {
      labelSearchMethodShortcut.classList.add("purple-label");
      labelSearchMethodShortcut.setAttribute("title", "Extracted from the URL of the web page");
  }
  else if(searchMethodShortcut === "script-tag") {
      labelSearchMethodShortcut.classList.add("green-label");
      labelSearchMethodShortcut.setAttribute("title", "Extracted from a script tag on the web page");
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

function createDateTypeIcon(dateType) {
  const iconWrapper = document.createElement("div");
  iconWrapper.style.display = "inline-block";
  iconWrapper.classList.add("date-type-icon");
  
  let svgIcon, tooltipText;
  
  if (dateType === "published") {
    // Plus icon for published
    svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
    </svg>`;
    tooltipText = "Published date";
    iconWrapper.classList.add("date-type-published");
  } else if (dateType === "updated") {
    // Refresh/sync icon for updated
    svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
    </svg>`;
    tooltipText = "Updated date";
    iconWrapper.classList.add("date-type-updated");
  } else if (dateType === "published or updated") {
    // Light blue question mark
    svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
      <text x="8" y="12" text-anchor="middle" font-size="14" font-weight="bold" font-family="Arial, sans-serif" fill="#4A90E2">?</text>
    </svg>`;
    tooltipText = "Published or updated date (ambiguous)";
    iconWrapper.classList.add("date-type-published-or-updated");
  }
  
  iconWrapper.innerHTML = svgIcon;
  iconWrapper.setAttribute("title", tooltipText);
  
  return iconWrapper;
}

function clearExternalAlternativesArea() {
  let externalAlternativesArea = document.getElementById("external-alternatives-area");
  let waybackLink = document.getElementById("wayback-link");
  let googleLink = document.getElementById("google-link");
  
  // Clear existing links
  waybackLink.innerHTML = "";
  googleLink.innerHTML = "";
  
  // Hide the area until we have new content
  externalAlternativesArea.style.display = 'none';
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