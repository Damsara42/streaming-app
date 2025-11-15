document.addEventListener('DOMContentLoaded', () => {
    loadHeroSlider();
    loadHomepageContent();
    setupSearch();
    updateUserNav();
});

/**
 * Updates the navigation to show "Profile" or "Login"
 */
function updateUserNav() {
    const token = localStorage.getItem('user_token');
    const nav = document.querySelector('.main-header nav');
    
    // Find and remove existing login/profile link
    const authLink = document.getElementById('auth-link');
    if (authLink) {
        authLink.remove();
    }

    if (token) {
        // In a real app, you'd fetch the user's profile
        // For now, just add a 'Profile' and 'Logout' link
        nav.innerHTML += '<a id="auth-link" href="#">Profile</a>';
        nav.innerHTML += '<a id="logout-link" href="#">Logout</a>';
        
        document.getElementById('logout-link').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('user_token');
            window.location.reload();
        });

    } else {
        nav.innerHTML += '<a id="auth-link" href="/login.html">Login</a>';
    }
}

/**
 * =================================================================
 * HERO SLIDER
 * =================================================================
 */
let currentSlide = 0;
let slides = [];
let slideInterval;

async function loadHeroSlider() {
    try {
        const res = await fetch('/api/slides');
        slides = await res.json();

        if (slides.length === 0) {
            document.querySelector('.hero-slider').innerHTML = '<p>No slides available.</p>';
            return;
        }

        const sliderContainer = document.querySelector('.hero-slider');
        sliderContainer.innerHTML = ''; // Clear any placeholders

        slides.forEach((slide, index) => {
            const slideEl = document.createElement('div');
            slideEl.className = 'slide';
            if (index === 0) slideEl.classList.add('active');
            slideEl.style.backgroundImage = `url(${slide.image})`;
            
            slideEl.innerHTML = `
                <div class="slide-content">
                    <h1>${slide.title}</h1>
                    <p>${slide.subtitle || ''}</p>
                    <a href="${slide.link || '#'}" class="btn btn-primary">Watch Now</a>
                </div>
            `;
            sliderContainer.appendChild(slideEl);
        });

        // Add nav buttons
        const navContainer = document.querySelector('.slider-nav');
        if (navContainer) {
            navContainer.querySelector('.prev').addEventListener('click', () => {
                changeSlide(-1);
                resetSlideInterval();
            });
            navContainer.querySelector('.next').addEventListener('click', () => {
                changeSlide(1);
                resetSlideInterval();
            });
        }
        
        startSlideInterval();

    } catch (err) {
        console.error('Failed to load hero slider:', err);
    }
}

function startSlideInterval() {
    slideInterval = setInterval(() => {
        changeSlide(1);
    }, 5000); // Change slide every 5 seconds
}

function resetSlideInterval() {
    clearInterval(slideInterval);
    startSlideInterval();
}

function changeSlide(direction) {
    const slideElements = document.querySelectorAll('.hero-slider .slide');
    if (slideElements.length === 0) return;

    slideElements[currentSlide].classList.remove('active');
    
    currentSlide = (currentSlide + direction + slideElements.length) % slideElements.length;
    
    slideElements[currentSlide].classList.add('active');
}


/**
 * =================================================================
 * HOMEPAGE CONTENT (Categories & Shows)
 * =================================================================
 */
async function loadHomepageContent() {
    try {
        // Fetch categories and shows in parallel
        const [catRes, showRes] = await Promise.all([
            fetch('/api/categories'),
            fetch('/api/shows')
        ]);

        const categories = await catRes.json();
        const shows = await showRes.json();
        
        const container = document.getElementById('categories-container');
        container.innerHTML = ''; // Clear loading spinner

        // Render each category section
        categories.forEach(category => {
            const section = document.createElement('section');
            section.className = 'show-grid-container';
            section.id = `category-${category.id}`;
            
            section.innerHTML = `<h2>${category.name}</h2>`;
            
            const grid = document.createElement('div');
            grid.className = 'show-grid';
            
            // Filter shows for this category
            const categoryShows = shows.filter(s => s.category_id === category.id);
            
            if (categoryShows.length === 0) {
                grid.innerHTML = '<p>No shows in this category yet.</p>';
            } else {
                categoryShows.forEach(show => {
                    grid.innerHTML += createShowCard(show);
                });
            }
            
            section.appendChild(grid);
            container.appendChild(section);
        });

    } catch (error) {
        console.error('Failed to load homepage:', error);
        document.getElementById('categories-container').innerHTML = '<p class="error-message">Could not load content.</p>';
    }
}

function createShowCard(show) {
    // Navigate to show.html with the show's ID
    return `
        <div class="show-card" onclick="location.href='/show.html?id=${show.id}'">
            <img src="${show.poster || '/assets/images/placeholder-poster.jpg'}" alt="${show.title}">
            <div class="show-card-title">${show.title}</div>
        </div>
    `;
}

/**
 * =================================================================
 * AJAX SEARCH
 * =================================================================
 */
function setupSearch() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');
    const categoriesContainer = document.getElementById('categories-container');
    const heroSection = document.querySelector('.hero-parallax');

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
        // If search box is cleared, show homepage content again
        if (searchInput.value.trim() === '') {
            resultsContainer.style.display = 'none';
            categoriesContainer.style.display = 'block';
            heroSection.style.display = 'flex'; // Show hero
        }
    });

    async function performSearch() {
        const query = searchInput.value;
        if (!query) return;

        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const results = await res.json();
            
            const grid = document.getElementById('search-grid');
            grid.innerHTML = '';

            if (results.length === 0) {
                grid.innerHTML = '<p>No results found.</p>';
            } else {
                results.forEach(show => {
                    grid.innerHTML += createShowCard(show);
                });
            }
            
            // Hide homepage content and show search results
            categoriesContainer.style.display = 'none';
            heroSection.style.display = 'none'; // Hide hero
            resultsContainer.style.display = 'block';

        } catch (error) {
            console.error('Search failed:', error);
        }
    }
}