const apiUrl = "https://api.coingecko.com/api/v3/coins/markets";
const apiParams = "?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false";
let currentPerPage = 10;
const defualtParams = {
  vs_currency: 'usd',
  order:'market_cap_desc',
  per_page:currentPerPage,
  sparkline: false,
}
const maxComparisons = 5;
const refreshInterval = 60000; // Refresh every 60 seconds
let updateInterval;
let cryptoData = [];
let filteredData = [];

// Fetch and display popular cryptocurrencies
async function fetchCryptocurrencies() {
  try {
    const params = {...defualtParams, per_page: currentPerPage}
    const queryParams = new URLSearchParams(params).toString();
    console.log(queryParams);
    const response = await fetch(`${apiUrl}?${queryParams}`);
    if (!response.ok) throw new Error("Failed to fetch data from the API.");
    cryptoData = await response.json(); // Store the data globally
    displayCryptocurrencies(cryptoData); // Display the fetched data
  } catch (error) {
    console.error("Error fetching cryptocurrencies:", error);
    alert("Failed to fetch cryptocurrency data. Please try again later.");
  }
}

// Display cryptocurrencies on the page
function displayCryptocurrencies(data) {
  const cryptoList = $("#cryptoList");
  cryptoList.empty();

  data.forEach((crypto) => {
    const card = `
      <div class="crypto-card" data-id="${crypto.id}">
        <h3>${crypto.name}</h3>
        <p>Symbol: ${crypto.symbol.toUpperCase()}</p>
        <p class="market-cap">Market Cap: $${crypto.market_cap.toLocaleString()}</p>
        <p class="price-change">24h Change: ${crypto.price_change_percentage_24h.toFixed(2)}%</p>
        <p>Price: $${crypto.current_price.toLocaleString()}</p>
        <button onclick="addToComparison('${crypto.id}', '${crypto.name}', ${crypto.current_price})">Compare</button>
      </div>
    `;
    cryptoList.append(card);
  });
}

// Periodically refresh cryptocurrency data
function startPeriodicUpdates() {
  console.log(1);
  fetchCryptocurrencies(); // Fetch immediately on page load
  setInterval(fetchCryptocurrencies, refreshInterval); // Schedule updates every minute
}


// Add a cryptocurrency to the comparison section
function addToComparison(id, name, price) {
  const comparisonTable = $("#comparisonTable");
  const currentComparisons = comparisonTable.children().length;

  if (currentComparisons >= maxComparisons) {
    alert("You can only compare up to 5 cryptocurrencies.");
    return;
  }

  const card = `
    <div class="comparison-card" id="${id}">
      <h4>${name}</h4>
      <p>Price: $${price.toLocaleString()}</p>
      <button onclick="removeFromComparison('${id}')">Remove</button>
    </div>
  `;
  comparisonTable.append(card);

  saveToLocalStorage();
}

// Remove a cryptocurrency from the comparison section
function removeFromComparison(id) {
  $(`#${id}`).remove();
  saveToLocalStorage();
}

// Save comparison state to localStorage
function saveToLocalStorage() {
  const comparisonData = [];
  $("#comparisonTable .comparison-card").each(function () {
    const id = $(this).attr("id");
    const name = $(this).find("h4").text();
    const price = $(this).find("p").text().split("$")[1];
    comparisonData.push({ id, name, price });
  });
  localStorage.setItem("cryptoComparisons", JSON.stringify(comparisonData));
}

// Load comparison state from localStorage
function loadFromLocalStorage() {
  const storedData = JSON.parse(localStorage.getItem("cryptoComparisons")) || [];
  const comparisonTable = $("#comparisonTable");

  storedData.forEach((item) => {
    const card = `
      <div class="comparison-card" id="${item.id}">
        <h4>${item.name}</h4>
        <p>Price: $${parseFloat(item.price).toLocaleString()}</p> 
        <button onclick="removeFromComparison('${item.id}')">Remove</button>
      </div>
    `;
    comparisonTable.append(card);
  });
}

let sorted = false;
// Sort cryptocurrencies by criteria
function sortCryptos(criteria) {
  const cryptoCards = $(".crypto-card");

  const sortedCards = cryptoCards.sort((a, b) => {
    const valueA = parseFloat($(a).find(criteria).text().replace(/[^0-9.-]+/g, "")); // Extract numeric value
    const valueB = parseFloat($(b).find(criteria).text().replace(/[^0-9.-]+/g, ""));
    if (sorted) {
      sorted = false;
      return valueA - valueB;
    } else {
      sorted = true;
      return valueB - valueA;
      
    }
  });

  $("#cryptoList").html(sortedCards);
}

// Attach sorting events
$(document).ready(() => {
  fetchCryptocurrencies();

  $("#sortMarketCap").on("click", () => sortCryptos(".market-cap")); // Add appropriate class for market cap
  $("#sort24hChange").on("click", () => sortCryptos(".price-change")); // Add appropriate class for 24h change
});

// Initialize the application
$(document).ready(() => {
  startPeriodicUpdates(); // Start periodic updates
  loadFromLocalStorage();
});

// document.addEventListener("visibilitychange", () => {
//   if (document.hidden) {
//     clearInterval(updateInterval); // Stop updates when tab is inactive
//   } else {
//     startPeriodicUpdates(); // Resume updates when tab is active
//   }
// });

// Filter cryptocurrencies based on search query
function filterCryptocurrencies(query) {
  filteredData = cryptoData.filter((crypto) => {
    return (
      crypto.name.toLowerCase().includes(query.toLowerCase()) ||
      crypto.symbol.toLowerCase().includes(query.toLowerCase()))
  }
  );
  displayCryptocurrencies(filteredData);
}

// Attach search input event
$(document).ready(() => {
  // Search button click event listener
  $("#searchButton").on("click", () => {
    const query = $("#searchInput").val().trim();
    if (query) {
      filterCryptocurrencies(query);
      $("#clearSearchButton").show(); // Show clear button after searching
    }
  });

  // Clear button click event listener
  $("#clearSearchButton").on("click", clearSearch);

  // Show clear button only if there is data filtered
  $("#searchInput").on("input", function () {
    if (filteredData.length) {
      $("#clearSearchButton").show();
    } else {
      $("#clearSearchButton").hide();
    }
  });
});

// Clear search input and reset the results
function clearSearch() {
  $("#searchInput").val(""); // Clear the input field
  $("#clearSearchButton").hide(); // Hide the clear button
  displayCryptocurrencies(cryptoData); // Reset to full data
}

// Handle per-page dropdown change
function updatePerPage(value) {
  currentPerPage = value; // Set the perPage variable
  fetchCryptocurrencies(); // Fetch data with the updated perPage value
}

$("#perPageSelect").on("change", function () {
  const selectedValue = $(this).val();
  updatePerPage(selectedValue); // Update the `perPage` variable and fetch data
});

// Apply the selected theme
function applyTheme(theme) {
  document.body.className = ""; // Clear existing theme classes
  if (theme === "dark") {
    document.body.classList.add("dark-theme");
  } else if (theme === "blue") {
    document.body.classList.add("blue-theme");
  }
  localStorage.setItem("selectedTheme", theme); // Save theme to localStorage
}

// Initialize the theme on page load
function initializeTheme() {
  const savedTheme = localStorage.getItem("selectedTheme") || "light"; // Default to light theme
  $("#themeSelect").val(savedTheme); // Set dropdown to saved theme
  applyTheme(savedTheme); // Apply the saved theme
}

// Event listener for theme change
$(document).ready(() => {
  initializeTheme();

  $("#themeSelect").on("change", function () {
    const selectedTheme = $(this).val();
    applyTheme(selectedTheme);
  });
});