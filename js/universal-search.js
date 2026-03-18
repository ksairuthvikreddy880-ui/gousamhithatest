// Universal Search System - Works on all pages
class UniversalSearch {
    constructor() {
        this.products = [];
        this.searchCache = new Map();
        this.debounceTimer = null;
        this.isInitialized = false;
        this.init();
    }
    
    async init() {
        console.log('🔍 Initializing Universal Search...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    async setup() {
        await this.loadProducts();
        this.initializeAllSearchBars();
        this.addSearchStyles();
        this.isInitialized = true;
        console.log('✅ Universal Search initialized');
    }
    
    async loadProducts() {
        try {
            console.log('📦 Loading products...');
            
            // Wait for Supabase to be available
            let attempts = 0;
            while (!window.supabase && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!window.supabase) {
                console.warn('⚠️ Supabase not available, using fallback products');
                this.products = this.getFallbackProducts();
                return;
            }
            
            const { data: products, error } = await window.supabase
                .from('products')
                .select('*')
                .eq('in_stock', true)
                .order('name');
            
            if (error) {
                console.error('❌ Error loading products:', error);
                this.products = this.getFallbackProducts();
                return;
            }
            
            this.products = products || [];
            console.log(`✅ Loaded ${this.products.length} products`);
            
        } catch (error) {
            console.error('❌ Failed to load products:', error);
            this.products = this.getFallbackProducts();
        }
    }
    
    getFallbackProducts() {
        return [
            { id: 1, name: 'Organic Milk', category: 'Dairy', price: 60, image_url: 'images/milk.png', in_stock: true },
            { id: 2, name: 'Fresh Paneer', category: 'Dairy', price: 120, image_url: 'images/paneer.png', in_stock: true },
            { id: 3, name: 'Pure Ghee', category: 'Dairy', price: 450, image_url: 'images/ghee.png', in_stock: true },
            { id: 4, name: 'Organic Curd', category: 'Dairy', price: 50, image_url: 'images/curd.png', in_stock: true },
            { id: 5, name: 'Fresh Buttermilk', category: 'Dairy', price: 30, image_url: 'images/buttermilk.png', in_stock: true }
        ];
    }
    
    initializeAllSearchBars() {
        // Find all search bars on the page
        const searchInputs = document.querySelectorAll('.main-search-bar');
        const searchButtons = document.querySelectorAll('.search-btn');
        
        console.log(`🔍 Found ${searchInputs.length} search bars`);
        
        searchInputs.forEach((searchInput, index) => {
            this.setupSearchBar(searchInput, index);
        });
        
        searchButtons.forEach((searchBtn, index) => {
            const correspondingInput = searchInputs[index];
            if (correspondingInput) {
                searchBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.performSearch(correspondingInput.value.trim());
                });
            }
        });
    }
    
    setupSearchBar(searchInput, index) {
        // Create unique dropdown container
        const dropdownId = `search-dropdown-${index}`;
        let dropdown = document.getElementById(dropdownId);
        
        if (dropdown) {
            dropdown.remove();
        }
        
        dropdown = document.createElement('div');
        dropdown.id = dropdownId;
        dropdown.className = 'universal-search-dropdown';
        
        // Position dropdown relative to search section
        const searchSection = searchInput.closest('.search-section');
        if (searchSection) {
            searchSection.style.position = 'relative';
            searchSection.style.zIndex = '1000';
            searchSection.appendChild(dropdown);
        }
        
        // Add event listeners
        searchInput.addEventListener('input', (e) => {
            this.handleInput(e.target.value.trim(), dropdown, searchInput);
        });
        
        searchInput.addEventListener('keydown', (e) => {
            this.handleKeydown(e, dropdown, searchInput);
        });
        
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim() && dropdown.innerHTML) {
                dropdown.style.display = 'block';
                // Ensure dropdown is visible
                this.ensureDropdownVisibility(dropdown);
            }
        });
        
        searchInput.addEventListener('blur', () => {
            // Delay hiding to allow clicking on dropdown items
            setTimeout(() => {
                dropdown.style.display = 'none';
            }, 200);
        });
        
        // Prevent dropdown from closing when clicking inside it
        dropdown.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });
    }
    
    ensureDropdownVisibility(dropdown) {
        // Force the dropdown to appear above other elements
        dropdown.style.zIndex = '10000';
        dropdown.style.position = 'absolute';
        
        // Check if dropdown is being cut off and adjust if needed
        setTimeout(() => {
            const rect = dropdown.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            
            if (rect.bottom > viewportHeight) {
                // If dropdown goes below viewport, reduce max-height
                const availableHeight = viewportHeight - rect.top - 20;
                dropdown.style.maxHeight = `${Math.max(200, availableHeight)}px`;
            }
        }, 10);
    }
    
    handleInput(query, dropdown, searchInput) {
        clearTimeout(this.debounceTimer);
        
        if (query.length < 1) {
            dropdown.style.display = 'none';
            return;
        }
        
        this.debounceTimer = setTimeout(() => {
            this.showDropdown(query, dropdown, searchInput);
        }, 200);
    }
    
    handleKeydown(e, dropdown, searchInput) {
        if (e.key === 'Enter') {
            e.preventDefault();
            dropdown.style.display = 'none';
            this.performSearch(searchInput.value.trim());
        } else if (e.key === 'Escape') {
            dropdown.style.display = 'none';
            searchInput.blur();
        }
    }
    
    showDropdown(query, dropdown, searchInput) {
        // Check cache first
        const cacheKey = query.toLowerCase();
        if (this.searchCache.has(cacheKey)) {
            this.renderDropdown(this.searchCache.get(cacheKey), query, dropdown, searchInput);
            return;
        }
        
        // Show loading
        dropdown.innerHTML = `
            <div class="search-loading">
                <div class="loading-spinner"></div>
                <span>Searching...</span>
            </div>
        `;
        dropdown.style.display = 'block';
        this.ensureDropdownVisibility(dropdown);
        
        // Search products
        const results = this.searchProducts(query);
        
        // Cache results
        this.searchCache.set(cacheKey, results);
        
        // Render dropdown
        this.renderDropdown(results, query, dropdown, searchInput);
    }
    
    searchProducts(query) {
        const normalizedQuery = query.toLowerCase().trim();
        
        if (!this.products || this.products.length === 0) {
            return [];
        }
        
        // Filter products
        const matches = this.products.filter(product => {
            const name = (product.name || '').toLowerCase();
            const category = (product.category || '').toLowerCase();
            
            return name.includes(normalizedQuery) || 
                   category.includes(normalizedQuery);
        });
        
        // Sort by relevance
        return matches.sort((a, b) => {
            const aName = (a.name || '').toLowerCase();
            const bName = (b.name || '').toLowerCase();
            
            // Exact matches first
            if (aName === normalizedQuery) return -1;
            if (bName === normalizedQuery) return 1;
            
            // Starts with query
            if (aName.startsWith(normalizedQuery) && !bName.startsWith(normalizedQuery)) return -1;
            if (!aName.startsWith(normalizedQuery) && bName.startsWith(normalizedQuery)) return 1;
            
            // Alphabetical
            return aName.localeCompare(bName);
        }).slice(0, 6);
    }
    
    renderDropdown(results, query, dropdown, searchInput) {
        if (results.length === 0) {
            dropdown.innerHTML = `
                <div class="search-no-results">
                    <div class="no-results-icon">🔍</div>
                    <div class="no-results-text">No products found for "${query}"</div>
                    <div class="no-results-suggestion">Try different keywords</div>
                </div>
            `;
            dropdown.style.display = 'block';
            this.ensureDropdownVisibility(dropdown);
            return;
        }
        
        const resultsHTML = results.map(product => `
            <div class="search-result-item" onclick="universalSearch.selectProduct(${product.id}, '${this.escapeHtml(product.name)}')">
                <div class="result-image">
                    <img src="${product.image_url || 'images/placeholder.jpg'}" 
                         alt="${this.escapeHtml(product.name)}" 
                         onerror="this.src='images/placeholder.jpg'">
                </div>
                <div class="result-info">
                    <div class="result-name">${this.highlightMatch(product.name, query)}</div>
                    <div class="result-meta">
                        <span class="result-category">${product.category || 'Product'}</span>
                        <span class="result-price">₹${product.price}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        let viewAllButton = '';
        if (results.length >= 4) {
            viewAllButton = `
                <div class="search-view-all" onclick="universalSearch.performSearch('${this.escapeHtml(query)}')">
                    <span>View all results for "${query}"</span>
                    <span class="view-all-arrow">→</span>
                </div>
            `;
        }
        
        dropdown.innerHTML = resultsHTML + viewAllButton;
        dropdown.style.display = 'block';
        this.ensureDropdownVisibility(dropdown);
    }
    
    highlightMatch(text, query) {
        if (!text || !query) return text;
        
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<strong style="background: #fff3cd; color: #856404;">$1</strong>');
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
        console.log('🎯 Selected product:', productName);
        
        // Update all search inputs
        const searchInputs = document.querySelectorAll('.main-search-bar');
        searchInputs.forEach(input => {
            input.value = productName;
        });
        
        // Hide all dropdowns
        const dropdowns = document.querySelectorAll('.universal-search-dropdown');
        dropdowns.forEach(dropdown => {
            dropdown.style.display = 'none';
        });
        
        // Navigate to product
        this.viewProduct(productId);
    }
    
    viewProduct(productId) {
        // Store selected product
        sessionStorage.setItem('selectedProductId', productId);
        
        // If on shop page, try to highlight the product
        if (window.location.pathname.includes('shop.html')) {
            setTimeout(() => {
                const productCard = document.querySelector(`[data-product-id="${productId}"]`);
                if (productCard) {
                    productCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    productCard.style.border = '3px solid #4a7c59';
                    productCard.style.boxShadow = '0 0 20px rgba(74, 124, 89, 0.3)';
                    
                    setTimeout(() => {
                        productCard.style.border = '';
                        productCard.style.boxShadow = '';
                    }, 3000);
                    return;
                }
            }, 500);
        }
        
        // Navigate to shop page
        window.location.href = `shop.html?product=${productId}`;
    }
    
    performSearch(searchTerm) {
        if (!searchTerm) {
            this.showToast('Please enter a search term', 'warning');
            return;
        }
        
        console.log('🔍 Performing search for:', searchTerm);
        
        // Get search results
        const results = this.searchProducts(searchTerm);
        
        // Store search data
        sessionStorage.setItem('searchResults', JSON.stringify(results));
        sessionStorage.setItem('searchTerm', searchTerm);
        
        // Navigate to shop page
        if (!window.location.pathname.includes('shop.html')) {
            window.location.href = 'shop.html';
        } else {
            // If already on shop page, trigger search display
            if (window.displaySearchResults) {
                window.displaySearchResults();
            }
        }
    }
    
    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `universal-toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                <span class="toast-message">${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    addSearchStyles() {
        // Add CSS styles for search dropdown
        const styleId = 'universal-search-styles';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .universal-search-dropdown {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 1px solid #e0e0e0;
                border-top: none;
                border-radius: 0 0 12px 12px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                z-index: 9999;
                display: none;
                max-height: 400px;
                overflow-y: auto;
            }
            
            /* Ensure search section has proper positioning context */
            .search-section {
                position: relative !important;
                z-index: 1000;
            }
            
            .search-loading {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 15px 20px;
                color: #666;
            }
            
            .loading-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid #f3f3f3;
                border-top: 2px solid #4a7c59;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .search-no-results {
                padding: 20px;
                text-align: center;
                color: #666;
            }
            
            .no-results-icon {
                font-size: 24px;
                margin-bottom: 8px;
            }
            
            .no-results-text {
                font-weight: 500;
                margin-bottom: 4px;
            }
            
            .no-results-suggestion {
                font-size: 14px;
                color: #999;
            }
            
            .search-result-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid #f5f5f5;
                transition: background-color 0.2s ease;
            }
            
            .search-result-item:hover {
                background-color: #f8f9fa;
            }
            
            .search-result-item:last-child {
                border-bottom: none;
            }
            
            .result-image {
                width: 40px;
                height: 40px;
                border-radius: 8px;
                overflow: hidden;
                flex-shrink: 0;
            }
            
            .result-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .result-info {
                flex: 1;
                min-width: 0;
            }
            
            .result-name {
                font-weight: 500;
                color: #333;
                margin-bottom: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .result-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 14px;
            }
            
            .result-category {
                color: #666;
            }
            
            .result-price {
                color: #4a7c59;
                font-weight: 600;
            }
            
            .search-view-all {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: #f8f9fa;
                cursor: pointer;
                color: #4a7c59;
                font-weight: 500;
                border-top: 1px solid #e0e0e0;
            }
            
            .search-view-all:hover {
                background: #e9ecef;
            }
            
            .view-all-arrow {
                font-weight: bold;
            }
            
            .universal-toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
            }
            
            .universal-toast.warning {
                border-left: 4px solid #ffc107;
            }
            
            .universal-toast.info {
                border-left: 4px solid #17a2b8;
            }
            
            .toast-content {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 16px;
            }
            
            .toast-icon {
                font-size: 18px;
            }
            
            .toast-message {
                color: #333;
                font-weight: 500;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            /* Mobile responsive */
            @media (max-width: 768px) {
                .universal-search-dropdown {
                    max-height: 300px;
                    z-index: 10000;
                    box-shadow: 0 12px 35px rgba(0,0,0,0.2);
                }
                
                .search-result-item {
                    padding: 10px 12px;
                }
                
                .result-image {
                    width: 35px;
                    height: 35px;
                }
                
                .universal-toast {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                }
                
                /* Ensure navbar doesn't interfere */
                .navbar {
                    z-index: 999 !important;
                }
                
                /* Ensure dropdown is above navbar elements */
                .nav-wrapper {
                    z-index: 998 !important;
                }
            }
            
            /* Desktop specific adjustments */
            @media (min-width: 769px) {
                .universal-search-dropdown {
                    z-index: 9999;
                    min-width: 400px;
                }
                
                /* Ensure proper stacking context */
                .navbar .container {
                    position: relative;
                    z-index: 998;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Initialize Universal Search
let universalSearch;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        universalSearch = new UniversalSearch();
    });
} else {
    universalSearch = new UniversalSearch();
}

// Make it globally available
window.universalSearch = universalSearch;

console.log('🔍 Universal Search script loaded');