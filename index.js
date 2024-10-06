// Goals for this assignment: accessibility for majority of devices, performance, and user experience, some features that were 
// planned, are not implemented to reduce feature-richness and complexity of the application, to maintain performance and user experience.

window.addEventListener('load', async function () {
    //retrieve UI elements and stores them in constants for later use
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('results-container');
    const resultsCount = document.getElementById('resultsCount');

    // Initialise variables for pagination, tracking of seen images, search term, and loading state
    let currentPage = 1;
    const pageSize = 20;
    let seenImagesIds = new Set();
    let currentSearchTerm = '';
    let isLoading = false;

    // Prevent default form submission and intiates seach with inputted value
    searchForm.addEventListener('submit', async function (event) {
        event.preventDefault(); // Prevent the form from submitting traditionally
        const searchTerm = searchInput.value.trim();

        if (searchTerm) {
            resetSearch();
            await fetchAndDisplayResults(searchTerm, currentPage);
        }
    });

    // Fetches search results from api asynchronously, showing or hiding elements based on the results
    async function fetchAndDisplayResults(searchTerm, page) {
        // Check if a search is already in progress, and if so, return early
        if (isLoading) return;
        isLoading = true;
        const endpoint = `https://api.vam.ac.uk/v2/objects/search?q=${encodeURIComponent(searchTerm)}&page=${page}&pageSize=${pageSize}&data_profile=full`;

        try {
            const response = await fetch(endpoint);
            const data = await response.json();
            displayResults(data);

        } catch (error) {
            console.error('Fetching error:', error);
            resultsContainer.innerHTML = '<p>Error fetching results. Please try again later.</p>';
        } finally {
            isLoading = false;
        }
    }

    // Update UI with results from API, or displays given message if no results are found
    function displayResults(data) {
        // Code logic for displaying search results
        if (!data.records.length) {
            if (currentPage === 1) showNoResults();
            return;
        }
        resultsCount.textContent = `${data.info.record_count} result(s) found`;
        resultsCount.style.display = 'block';
        data.records.forEach(record => {
            if (!seenImagesIds.has(record._primaryImageId)) {
                seenImagesIds.add(record._primaryImageId);
                const resultItem = createResultItem(record);
                resultsContainer.appendChild(resultItem);
            }
        });
        setUpIntersectionObserver();
    }

    // Set up Intersection Observer to lazy load images as they come into view (via scroll)
    // Enhances performance by only loading images when they are needed
    // Also adds a class to the image to make it visible
    function setUpIntersectionObserver() {
        const loadImages = document.querySelectorAll('.result-item img:not(.visible)');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.1
        });
        loadImages.forEach(image => {
            observer.observe(image);
        });
    }

    // Create detailed result item for each record and handles click eveb for modal image view.
    // Also handles the logic for lazy loading images
    function createResultItem(record) {
        console.log(record);

        const { _primaryImageId, _primaryTitle, _primaryMaker, _primaryDate, summaryDescription } = record;
        const imageUrl = _primaryImageId ? `https://framemark.vam.ac.uk/collections/${_primaryImageId}/full/full/0/default.jpg` : 'https://via.placeholder.com/150';
        const title = _primaryTitle ? _primaryTitle : 'No title';
        const maker = _primaryMaker?.name || _primaryMaker?.association || 'No maker';
        const date = _primaryDate || 'Date unknown';
        // Create a new div element to hold the result item and its details

        const item = document.createElement('div');
        item.className = 'result-item';
        // Add the image, title, and details to the resulted item
        item.innerHTML = `
            <img src="${imageUrl}" alt="${title}" loading="lazy">
            <div>
                <h2>${title}</h2>
                <p>Association & Name: ${maker}</p>
                <p>Date: ${date}</p>
                ${summaryDescription ? `<p>About this image: <hr>
                ${summaryDescription}</p>` : ''}
            </div>
        `;

        item.querySelector('img').addEventListener('click', () => showModal(imageUrl, title));
        return item;
    }

    // Show modal with image and title when an image is clicked
    // Also sets the image source and caption
    function showModal(imageUrl, title) {
        const modal = document.getElementById('lightboxModal');
        const modalImg = document.getElementById('lightboxImg');
        const caption = document.getElementById('caption');
        modalImg.src = imageUrl;
        modalImg.alt = title;
        caption.textContent = title;
        modal.style.display = 'block';
    }

    // Close modal when close button is clicked
    document.querySelector('.close').addEventListener('click', () => {
        this.document.getElementById('lightboxModal').style.display = 'none';
    });

    // Reset search state and UI when a new search is initiated
    // Also clears the seen images set
    function resetSearch() {
        currentPage = 1;
        seenImagesIds.clear();
        resultsContainer.innerHTML = '';
        currentSearchTerm = searchInput.value.trim();
        isLoading = false;
    }

    // Display message when a user enters random search term that returns no results, or searches for an image that does not exist 
    function showNoResults() {
        resultsCount.style.display = 'none';
        resultsContainer.innerHTML = '';
        const noResultsMsg = document.createElement('div');
        noResultsMsg.className = 'no-results';
        noResultsMsg.textContent = 'No results found, please try another search term.';
        resultsContainer.appendChild(noResultsMsg);
    }

    // Infinite scroll functionality
    // Fetches more results when user has scrolled to the bottom of the page
    // Also checks if user has scrolled to the bottom of the page, and if so, fetches more results
    window.addEventListener('scroll', async () => {
        //check if user has scrolled to bottom of intial page
        if (currentPage === null) {
            resetSearch;
        }
        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight && !isLoading) {
            currentPage++;
            await fetchAndDisplayResults(currentSearchTerm, currentPage);
        }

    });

});
