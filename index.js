const apiUrl = "https://api.coingecko.com/api/v3/coins/markets";
let currentPerPage = 10;
const defaultParams = {
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: currentPerPage,
    sparkline: false,
};
const maxComparisons = 5;
const refreshInterval = 60000; // Refresh data per minute
let updateInterval;
let cryptoData = [];
let filteredData = [];

// Fetch and display data
async function fetchCryptos() {
    const spinner = $("#loadingSpinner");
    const params = { ...defaultParams, per_page: currentPerPage };
    const queryParams = new URLSearchParams(params).toString();
    try {
        spinner.show(); // Show Spinner
        const response = await fetch(`${apiUrl}?${queryParams}`);

        if (!response.ok) throw new Error("Failed to fetch data from the API.");

        cryptoData = await response.json(); // Store the data
        displayCryptocurrencies(cryptoData); // Display the data
    } catch (error) {
        console.error("Error fetching cryptocurrencies:", error);
        alert("Failed to fetch cryptocurrency data. Please try again later.");
    } finally {
        spinner.hide(); // Hide spinner
    }
}

// Display cryptos on the page
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

// Refresh crypto data
function refreshData() {
    // Fetch on page load
    setInterval(fetchCryptos, refreshInterval); // Update data on every minute
}

// Add a cryptocurrency to the comparison section
function addToComparison(id, name, price) {
    const comparisonTable = $("#comparisonTable");
    const currentComparisons = comparisonTable.children().length;
    const comparisonMessage = $("#noComparisonMessage");

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
    comparisonMessage.hide();
    saveToLocalStorage();
}

// Remove a cryptocurrency from the comparison section
function removeFromComparison(id) {
    $(`#${id}`).remove();
    saveToLocalStorage();
    const comparisonTable = $("#comparisonTable");
    const comparisonMessage = $("#noComparisonMessage");

    if (comparisonTable.children().length === 0) {
        comparisonMessage.show(); // Show "No crypto in comparison" message
    }
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
    const comparisonMessage = $("#noComparisonMessage");

    if (storedData.length === 0) {
        comparisonMessage.show(); // Show "No crypto in comparison" message
    } else {
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
}

// Sort cryptocurrencies by criteria
let sorted = false;
function sortCryptos(criteria) {
    const cryptoCards = $(".crypto-card");

    const sortedCards = cryptoCards.sort((a, b) => {
        const valueA = parseFloat(
            $(a)
                .find(criteria)
                .text()
                .replace(/[^0-9.-]+/g, "")
        ); // Extract numeric value
        const valueB = parseFloat(
            $(b)
                .find(criteria)
                .text()
                .replace(/[^0-9.-]+/g, "")
        );
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
    fetchCryptos();
    $("#sortMarketCap").on("click", () => sortCryptos(".market-cap")); // Add appropriate class for market cap
    $("#sort24hChange").on("click", () => sortCryptos(".price-change")); // Add appropriate class for 24h change
});

// Initialize the application
$(document).ready(() => {
    fetchCryptos(); // fetch data
    loadFromLocalStorage();
});

// Reduce api call if tab is inactive
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        clearInterval(updateInterval); // Stop updates when tab is inactive
    } else {
        refreshData(); // Resume updates when tab is active
    }
});

// Filter cryptocurrencies based on search query
function filterCryptocurrencies(query) {
    filteredData = cryptoData.filter((crypto) => {
        return crypto.name.toLowerCase().includes(query.toLowerCase()) || crypto.symbol.toLowerCase().includes(query.toLowerCase());
    });
    displayCryptocurrencies(filteredData);
}

// Attach search input event
$(document).ready(() => {
    $("#searchButton").on("click", () => {
        const query = $("#searchInput").val().trim();
        if (query) {
            filterCryptocurrencies(query);
            $("#clearSearchButton").show(); // Show clear if data filtered
        }
    });

    // Show clear button only if there is data filtered
    $("#searchInput").on("input", function () {
        if (filteredData.length) {
            $("#clearSearchButton").show();
        } else {
            $("#clearSearchButton").hide();
        }
    });

    // Clear button click event listener
    $("#clearSearchButton").on("click", clearSearch);
});

// Clear search input and reset the results
function clearSearch() {
    $("#searchInput").val("");
    $("#clearSearchButton").hide();
    displayCryptocurrencies(cryptoData);
}

// Per-page dropdown
function updatePerPage(value) {
    currentPerPage = value;
    fetchCryptos();
}

$("#perPageSelect").on("change", function () {
    const selectedValue = $(this).val();
    updatePerPage(selectedValue);
});

// Apply the selected theme
function applyTheme(theme) {
    document.body.className = "";
    if (theme === "dark") {
        document.body.classList.add("dark-theme");
    } else if (theme === "blue") {
        document.body.classList.add("blue-theme");
    }
    localStorage.setItem("selectedTheme", theme); // Save theme to localStorage
}

// Initialize the theme on page load
function initializeTheme() {
    const savedTheme = localStorage.getItem("selectedTheme") || "default";
    $("#themeSelect").val(savedTheme);
    applyTheme(savedTheme);
}

// Event listener for theme change
$(document).ready(() => {
    initializeTheme();
    $("#themeSelect").on("change", function () {
        const selectedTheme = $(this).val();
        applyTheme(selectedTheme);
    });
});
