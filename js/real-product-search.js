// Real Product Search with Database Integration
class RealProductSearch {
    constructor() {
        this.products = [];
        this.searchCache = new Map();
        this.debounceTimer = null;
        this.isLoading = false;
        this.init();
    }
    
    async init() {
        console.log('🔍 Initializing Real Product Search...');
        await this.loadProducts();
        this.setupSearchFunctionality();
    }
    
    async loadProducts() {
        try {
            console.log('📦 Loading products from database...');
            
            if (!window.supabase) {
                console.error('❌ Supabase not available');
                return;
            }
            
            const { data: products, error } = await window.supabase
                .from('products')
                .select('*')
                .eq('in_stock', true)
                .order('name');
            
            if (error) {
                console.error('❌ Error loading products:', error);
                return;
            }
            
            this.products = products || [];
            console.log(`✅ Loaded ${this.products.length} products`);
            
        } catch (error) {
            console.error('❌ Failed to load products:', error);
        }
    }
    
    setupSearchFunctionality() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeSearchBars();
        });
        
        if (document.readyState !== 'loading') {
            this.initializeSearchBars();
        }
    }
}
    
    initializeSearchBars() {
        const searchInputs = document.querySelectorAll('.main-search-bar');
        
        searchInputs.forEach((searchInput, index) => {
            this.setupAutocomplete(searchInput, index);
        });
        
        // Setup search buttons
        const searchButtons = document.querySelectorAll('.search-btn');
        searchButtons.forEach((btn, index) => {
            const searchInput = searchInputs[index];
            if (searchInput) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.performSearch(searchInput.value.trim());
                });
            }
        });
    }
    
    setupAutocomplete(searchInput, index) {
        // Create unique container for this search input
        const containerId = `autocomplete-container-${index}`;
        let autocompleteContainer = document.getElementById(containerId);
        
        if (autocompleteContainer) {
            autocompleteContainer.remove();
        }
        
        autocompleteContainer = document.createElement('div');
        autocompleteContainer.id = containerId;
        autocompleteContainer.className = 'real-autocomplete-container';
        
        const searchSection = searchInput.closest('.search-section');
        if (searchSection) {
            searchSection.style.position = 'relative';
            searchSection.appendChild(autocompleteContainer);
        }
        
        // Event listeners
        searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value.trim(), autocompleteContainer);
        });
        
        searchInput.addEventListener('keydown', (e) => {
            this.handleKeydown(e, autocompleteContainer);
        });
        
        searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                autocompleteContainer.style.display = 'none';
            }, 200);
        });
        
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim() && autocompleteContainer.innerHTML) {
                autocompleteContainer.style.display = 'block';
            }
        });
    }
    
    handleSearchInput(query, container) {
        clearTimeout(this.debounceTimer);
        
        if (query.length < 1) {
            container.style.display = 'none';
            return;
        }
        
        this.debounceTimer = setTimeout(() => {
            this.showAutocomplete(query, container);
        }, 150);
    }
    
    handleKeydown(e, container) {
        if (e.key === 'Enter') {
            e.preventDefault();
            container.style.display = 'none';
            this.performSearch(e.target.value.trim());
        } else if (e.key === 'Escape') {
            container.style.display = 'none';
            e.target.blur();
        }
    }
    
    showAutocomplete(query, container) {
        if (this.isLoading) return;
        
        // Check cache first
        const cacheKey = query.toLowerCase();
        if (this.searchCache.has(cacheKey)) {
            this.renderSuggestions(this.searchCache.get(cacheKey), query, container);
            return;
        }
        
        // Show loading state
        this.showLoadingState(container);
        
        // Search products
        const suggestions = this.searchProducts(query);
        
        // Cache results
        this.searchCache.set(cacheKey, suggestions);
        
        // Render suggestions
        this.renderSuggestions(suggestions, query, container);
    }
    
    searchProducts(query) {
        const normalizedQuery = query.toLowerCase().trim();
        
        if (!this.products || this.products.length === 0) {
            return [];
        }
        
        // Filter products based on name, category, description
        const matches = this.products.filter(product => {
            const name = (product.name || '').toLowerCase();
            const category = (product.category || '').toLowerCase();
            const description = (product.description || '').toLowerCase();
            
            return name.includes(normalizedQuery) ||
                   category.includes(normalizedQuery) ||
                   description.includes(normalizedQuery);
        });
        
        // Sort by relevance
        return matches.sort((a, b) => {
            const aName = (a.name || '').toLowerCase();
            const bName = (b.name || '').toLowerCase();
            
            // Exact name matches first
            const aExact = aName === normalizedQuery;
            const bExact = bName === normalizedQuery;
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            
            // Name starts with query
            const aStarts = aName.startsWith(normalizedQuery);
            const bStarts = bName.startsWith(normalizedQuery);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            
            // Alphabetical order
            return aName.localeCompare(bName);
        }).slice(0, 8);
    }
    
    showLoadingState(container) {
        container.innerHTML = `
            <div class="autocomplete-loading">
                <div class="loading-spinner"></div>
                <div>Searching products...</div>
            </div>
        `;
        container.style.display = 'block';
    }
    
    renderSuggestions(suggestions, query, container) {
        if (suggestions.length === 0) {
            container.innerHTML = `
                <div class="autocomplete-no-results">
                    <div class="no-results-icon">🔍</div>
                    <div>No products found for "${query}"</div>
                    <div class="suggestion-text">Try different keywords</div>
                </div>
            `;
            container.style.display = 'block';
            return;
        }
        
        const suggestionsHTML = suggestions.map(product => `
            <div class="autocomplete-item" onclick="window.realProductSearch.selectProduct(${product.id}, '${this.escapeHtml(product.name)}')">
                <div class="product-image-container">
                    <img src="${product.image_url || 'images/placeholder.jpg'}" 
                         alt="${this.escapeHtml(product.name)}" 
                         onerror="this.src='images/placeholder.jpg'">
                </div>
                <div class="product-details">
                    <div class="product-name">${this.highlightMatch(product.name, query)}</div>
                    <div class="product-meta">
                        <span class="product-category">${product.category || 'Product'}</span>
                        <span class="product-price">₹${product.price}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        let viewAllButton = '';
        if (suggestions.length >= 5) {
            viewAllButton = `
                <div class="autocomplete-item view-all-item" onclick="window.realProductSearch.performSearch('${this.escapeHtml(query)}')">
                    <div class="view-all-content">
                        <span>View all results for "${query}"</span>
                        <span class="arrow">→</span>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = suggestionsHTML + viewAllButton;
        container.style.display = 'block';
    }
    
    highlightMatch(text, query) {
        if (!text || !query) return text;
        
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    selectProduct(productId, productName) {
        // Update all search inputs
        const searchInputs = document.querySelectorAll('.main-search-bar');
        searchInputs.forEach(input => {
            input.value = productName;
        });
        
        // Hide all autocomplete containers
        const containers = document.querySelectorAll('.real-autocomplete-container');
        containers.forEach(container => {
            container.style.display = 'none';
        });
        
        // Navigate to product or perform search
        this.viewProduct(productId);
    }
    
    viewProduct(productId) {
        // Store product ID and navigate to product page
        sessionStorage.setItem('selectedProductId', productId);
        
        // If on shop page, scroll to product
        if (window.location.pathname.includes('shop.html')) {
            const productCard = document.querySelector(`[data-product-id="${productId}"]`);
            if (productCard) {
                productCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                productCard.style.animation = 'highlight 2s ease-in-out';
                return;
            }
        }
        
        // Navigate to shop page
        window.location.href = `shop.html?product=${productId}`;
    }
    
    async performSearch(searchTerm) {
        if (!searchTerm) {
            this.showToast('Please enter a search term', 'error');
            return;
        }
        
        console.log('🔍 Performing search for:', searchTerm);
        
        // Get search results
        const results = this.searchProducts(searchTerm);
        
        // Store results
        sessionStorage.setItem('searchResults', JSON.stringify(results));
        sessionStorage.setItem('searchTerm', searchTerm);
        
        // Navigate to shop page if not already there
        if (!window.location.pathname.includes('shop.html')) {
            window.location.href = 'shop.html';
        } else {
            // Display results immediately
            this.displaySearchResults();
        }
    }
    
    displaySearchResults() {
        const searchResults = sessionStorage.getItem('searchResults');
        const searchTerm = sessionStorage.getItem('searchTerm');
        
        if (!searchResults || !searchTerm) return;
        
        const products = JSON.parse(searchResults);
        this.renderSearchResultsPage(products, searchTerm);
    }
    
    renderSearchResultsPage(products, searchTerm) {
        const productGrid = document.querySelector('.product-grid');
        const pageTitle = document.querySelector('.page-header h1');
        
        if (pageTitle) {
            pageTitle.innerHTML = `Search Results for "<span style="color: #4a7c59;">${searchTerm}</span>"`;
        }
        
        if (!productGrid) return;
        
        if (products.length === 0) {
            productGrid.innerHTML = `
                <div class="no-search-results">
                    <div class="no-results-icon">🔍</div>
                    <h3>No products found for "${searchTerm}"</h3>
                    <p>Try searching with different keywords or browse our categories.</p>
                    <button class="btn btn-primary" onclick="window.location.href='shop.html'">
                        Browse All Products
                    </button>
                </div>
            `;
            return;
        }
        
        // Add results count
        const resultsCount = document.createElement('div');
        resultsCount.className = 'search-results-count';
        resultsCount.innerHTML = `Found ${products.length} product${products.length !== 1 ? 's' : ''} for "${searchTerm}"`;
        
        const container = productGrid.parentNode;
        const existingCount = container.querySelector('.search-results-count');
        if (existingCount) {
            existingCount.remove();
        }
        container.insertBefore(resultsCount, productGrid);
        
        // Render products
        productGrid.innerHTML = products.map(product => `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${product.image_url || 'images/placeholder.jpg'}" 
                         alt="${this.escapeHtml(product.name)}" 
                         onerror="this.src='images/placeholder.jpg'">
                    ${!product.in_stock ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-category">${product.category || 'Product'}</p>
                    <p class="product-price">₹${product.price}</p>
                    <button class="btn btn-primary add-to-cart-btn" 
                            onclick="addToCart(${product.id})"
                            ${!product.in_stock ? 'disabled' : ''}>
                        ${product.in_stock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    // Refresh products when needed
    async refreshProducts() {
        await this.loadProducts();
        this.searchCache.clear();
    }
}

// Initialize real product search
window.addEventListener('supabaseReady', () => {
    window.realProductSearch = new RealProductSearch();
});

// Fallback initialization
setTimeout(() => {
    if (window.supabase && !window.realProductSearch) {
        window.realProductSearch = new RealProductSearch();
    }
}, 2000);