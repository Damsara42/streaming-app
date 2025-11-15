document.addEventListener('DOMContentLoaded', () => {
    // Route to the correct setup function based on the page
    if (document.body.id === 'admin-login-page') {
        setupAdminLogin();
    } else if (document.body.id === 'admin-dashboard-page') {
        setupDashboard();
    }
});

/**
 * =================================================================
 * LOGIN PAGE LOGIC
 * =================================================================
 */
function setupAdminLogin() {
    const loginForm = document.getElementById('admin-login-form');
    const loginError = document.getElementById('login-error');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = '';
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch('/api/auth/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok) {
                // Login successful
                localStorage.setItem('admin_token', data.token);
                window.location.href = '/admin/index.html';
            } else {
                loginError.textContent = data.error || 'Login failed.';
            }
        } catch (err) {
            console.error('Login error:', err);
            loginError.textContent = 'An error occurred. Please try again.';
        }
    });
}

/**
 * =================================================================
 * DASHBOARD PAGE LOGIC
 * =================================================================
 */
function setupDashboard() {
    // 1. Check Auth first
    if (!checkAdminAuth()) return;

    // 2. Setup core navigation
    setupSidebarNav();
    setupLogout();

    // 3. Initialize the default page (Dashboard)
    initDashboardPage();

    // 4. Setup all other CMS pages
    initSlidesPage();
    initCategoriesPage();
    initShowsPage();
    initEpisodesPage();
}

/**
 * -----------------------------------------------------------------
 * Auth & Navigation
 * -----------------------------------------------------------------
 */
function checkAdminAuth() {
    const token = getAuthToken();
    if (!token) {
        window.location.href = '/admin/login.html';
        return false;
    }
    return true;
}

function getAuthToken() {
    return localStorage.getItem('admin_token');
}

function setupLogout() {
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login.html';
    });
}

function setupSidebarNav() {
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    const pages = document.querySelectorAll('.admin-page');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');

            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show target page
            pages.forEach(page => {
                if (page.id === targetId) {
                    page.classList.add('active');
                } else {
                    page.classList.remove('active');
                }
            });
        });
    });
}

/**
 * -----------------------------------------------------------------
 * Helper Functions (API Fetcher, Form Resets)
 * -----------------------------------------------------------------
 */
async function apiFetch(endpoint, options = {}) {
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${getAuthToken()}`
    };
    
    // Don't set Content-Type for FormData, browser does it
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    } else if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(endpoint, { ...options, headers });

    if (res.status === 401) { // Unauthorized
        alert('Session expired. Please log in again.');
        window.location.href = '/admin/login.html';
        return;
    }
    
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `API Error: ${res.status}`);
    }

    // Handle no-content responses (like DELETE)
    if (res.status === 204) {
        return null;
    }
    
    return res.json();
}

function clearForm(formElement) {
    formElement.reset();
    // Clear any hidden ID fields
    const hiddenId = formElement.querySelector('input[type="hidden"]');
    if (hiddenId) {
        hiddenId.value = '';
    }
}

/**
 * -----------------------------------------------------------------
 * Page: Dashboard (Analytics)
 * -----------------------------------------------------------------
 */
async function initDashboardPage() {
    try {
        const stats = await apiFetch('/api/admin/analytics');
        document.getElementById('stat-users').textContent = stats.users;
        document.getElementById('stat-shows').textContent = stats.shows;
        document.getElementById('stat-episodes').textContent = stats.episodes;
        document.getElementById('stat-views').textContent = stats.daily_views; // Placeholder
    } catch (err) {
        console.error('Failed to load analytics:', err);
        alert('Could not load analytics.');
    }
}

/**
 * -----------------------------------------------------------------
 * Page: Manage Slides
 * -----------------------------------------------------------------
 */
function initSlidesPage() {
    const form = document.getElementById('slide-form');
    const tableBody = document.getElementById('slides-table').querySelector('tbody');
    const clearBtn = document.getElementById('slide-form-clear');

    async function loadSlides() {
        try {
            const slides = await apiFetch('/api/admin/slides');
            tableBody.innerHTML = '';
            slides.forEach(slide => {
                tableBody.innerHTML += `
                    <tr>
                        <td><img src="${slide.image}" alt="${slide.title}" style="width: 100px;"></td>
                        <td>${slide.title}</td>
                        <td>${slide.link}</td>
                        <td>
                            <button class="btn btn-small" onclick="editSlide(${slide.id})">Edit</button>
                            <button class="btn btn-danger btn-small" onclick="deleteSlide(${slide.id})">Delete</button>
                        </td>
                    </tr>
                `;
            });
        } catch (err) { console.error('Failed to load slides:', err); }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const id = formData.get('id');
        
        try {
            if (id) {
                // Update (PUT)
                await apiFetch(`/api/admin/slides/${id}`, { method: 'PUT', body: formData });
            } else {
                // Create (POST)
                await apiFetch('/api/admin/slides', { method: 'POST', body: formData });
            }
            clearForm(form);
            loadSlides();
        } catch (err) { alert(`Error saving slide: ${err.message}`); }
    });
    
    clearBtn.addEventListener('click', () => clearForm(form));
    loadSlides();
}

window.editSlide = async (id) => {
    try {
        const slide = await apiFetch(`/api/admin/slides/${id}`);
        document.getElementById('slide-id').value = slide.id;
        document.getElementById('slide-title').value = slide.title;
        document.getElementById('slide-subtitle').value = slide.subtitle;
        document.getElementById('slide-link').value = slide.link;
        // Note: File input cannot be programmatically set for security
        alert('Editing slide. Please re-upload image if you wish to change it.');
    } catch (err) { alert(`Error loading slide data: ${err.message}`); }
};

window.deleteSlide = async (id) => {
    if (!confirm('Are you sure you want to delete this slide?')) return;
    try {
        await apiFetch(`/api/admin/slides/${id}`, { method: 'DELETE' });
        initSlidesPage(); // Reload
    } catch (err) { alert(`Error deleting slide: ${err.message}`); }
};


/**
 * -----------------------------------------------------------------
 * Page: Manage Categories
 * -----------------------------------------------------------------
 */
function initCategoriesPage() {
    const form = document.getElementById('category-form');
    const tableBody = document.getElementById('categories-table').querySelector('tbody');
    const clearBtn = document.getElementById('category-form-clear');

    async function loadCategories() {
        try {
            const categories = await apiFetch('/api/categories'); // Use public route
            tableBody.innerHTML = '';
            categories.forEach(cat => {
                tableBody.innerHTML += `
                    <tr>
                        <td>${cat.id}</td>
                        <td>${cat.name}</td>
                        <td>
                            <button class="btn btn-small" onclick="editCategory(${cat.id}, '${cat.name}')">Edit</button>
                            <button class="btn btn-danger btn-small" onclick="deleteCategory(${cat.id})">Delete</button>
                        </td>
                    </tr>
                `;
            });
            // Also populate show/episode dropdowns
            populateCategoryDropdowns(categories);
        } catch (err) { console.error('Failed to load categories:', err); }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('category-id').value;
        const name = document.getElementById('category-name').value;
        const body = JSON.stringify({ name });
        
        try {
            if (id) {
                // Update (PUT)
                await apiFetch(`/api/admin/categories/${id}`, { method: 'PUT', body });
            } else {
                // Create (POST)
                await apiFetch('/api/admin/categories', { method: 'POST', body });
            }
            clearForm(form);
            loadCategories();
        } catch (err) { alert(`Error saving category: ${err.message}`); }
    });
    
    clearBtn.addEventListener('click', () => clearForm(form));
    loadCategories();
}

window.editCategory = (id, name) => {
    document.getElementById('category-id').value = id;
    document.getElementById('category-name').value = name;
};

window.deleteCategory = async (id) => {
    if (!confirm('Are you sure you want to delete this category? This may unassign shows.')) return;
    try {
        await apiFetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
        initCategoriesPage(); // Reload
    } catch (err) { alert(`Error deleting category: ${err.message}`); }
};

function populateCategoryDropdowns(categories) {
    const showCatSelect = document.getElementById('show-category');
    showCatSelect.innerHTML = '<option value="">-- Select Category --</option>';
    categories.forEach(cat => {
        showCatSelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });
}


/**
 * -----------------------------------------------------------------
 * Page: Manage Shows
 * -----------------------------------------------------------------
 */
function initShowsPage() {
    const form = document.getElementById('show-form');
    const tableBody = document.getElementById('shows-table').querySelector('tbody');
    const clearBtn = document.getElementById('show-form-clear');

    async function loadShows() {
        try {
            const shows = await apiFetch('/api/shows'); // Use public route
            tableBody.innerHTML = '';
            shows.forEach(show => {
                tableBody.innerHTML += `
                    <tr>
                        <td><img src="${show.poster}" alt="${show.title}"></td>
                        <td>${show.title}</td>
                        <td>${show.category_name || 'N/A'}</td>
                        <td>
                            <button class="btn btn-small" onclick="editShow(${show.id})">Edit</button>
                            <button class="btn btn-danger btn-small" onclick="deleteShow(${show.id})">Delete</button>
                        </td>
                    </tr>
                `;
            });
            // Also populate episode dropdown
            populateShowDropdown(shows);
        } catch (err) { console.error('Failed to load shows:', err); }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const id = formData.get('id');
        
        try {
            if (id) {
                // Update (PUT)
                await apiFetch(`/api/admin/shows/${id}`, { method: 'PUT', body: formData });
            } else {
                // Create (POST)
                await apiFetch('/api/admin/shows', { method: 'POST', body: formData });
            }
            clearForm(form);
            loadShows();
        } catch (err) { alert(`Error saving show: ${err.message}`); }
    });
    
    clearBtn.addEventListener('click', () => clearForm(form));
    loadShows();
}

window.editShow = async (id) => {
    try {
        const show = await apiFetch(`/api/shows/${id}`); // Use public route
        document.getElementById('show-id').value = show.id;
        document.getElementById('show-title').value = show.title;
        document.getElementById('show-description').value = show.description;
        document.getElementById('show-genres').value = show.genres;
        document.getElementById('show-category').value = show.category_id;
        alert('Editing show. Please re-upload images if you wish to change them.');
    } catch (err) { alert(`Error loading show data: ${err.message}`); }
};

window.deleteShow = async (id) => {
    if (!confirm('Are you sure you want to delete this show? This will delete ALL its episodes.')) return;
    try {
        await apiFetch(`/api/admin/shows/${id}`, { method: 'DELETE' });
        initShowsPage(); // Reload
        initEpisodesPage(); // Reload episode dropdown
    } catch (err) { alert(`Error deleting show: ${err.message}`); }
};

function populateShowDropdown(shows) {
    const epShowSelect = document.getElementById('episode-show-select');
    epShowSelect.innerHTML = '<option value="">-- Select a Show --</option>';
    shows.forEach(show => {
        epShowSelect.innerHTML += `<option value="${show.id}">${show.title}</option>`;
    });
}

/**
 * -----------------------------------------------------------------
 * Page: Manage Episodes
 * -----------------------------------------------------------------
 */
function initEpisodesPage() {
    const showSelect = document.getElementById('episode-show-select');
    const managerDiv = document.getElementById('episode-manager');
    const form = document.getElementById('episode-form');
    const tableBody = document.getElementById('episodes-table').querySelector('tbody');
    const clearBtn = document.getElementById('episode-form-clear');
    const episodesTitle = document.getElementById('current-episodes-title');

    showSelect.addEventListener('change', () => {
        const showId = showSelect.value;
        if (showId) {
            managerDiv.style.display = 'block';
            document.getElementById('episode-show-id').value = showId;
            episodesTitle.textContent = `Current Episodes for "${showSelect.options[showSelect.selectedIndex].text}"`;
            loadEpisodes(showId);
        } else {
            managerDiv.style.display = 'none';
        }
    });

    async function loadEpisodes(showId) {
        try {
            const episodes = await apiFetch(`/api/shows/${showId}/episodes`); // Use public
            tableBody.innerHTML = '';
            episodes.forEach(ep => {
                tableBody.innerHTML += `
                    <tr>
                        <td>${ep.ep_number}</td>
                        <td>${ep.title}</td>
                        <td>${new Date(ep.publish_date).toLocaleString()}</td>
                        <td>
                            <button class="btn btn-small" onclick="editEpisode(${ep.id})">Edit</button>
                            <button class="btn btn-danger btn-small" onclick="deleteEpisode(${ep.id})">Delete</button>
                        </td>
                    </tr>
                `;
            });
        } catch (err) { console.error('Failed to load episodes:', err); }
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const id = formData.get('id');
        const showId = formData.get('show_id');
        
        try {
            if (id) {
                // Update (PUT)
                await apiFetch(`/api/admin/episodes/${id}`, { method: 'PUT', body: formData });
            } else {
                // Create (POST)
                await apiFetch('/api/admin/episodes', { method: 'POST', body: formData });
            }
            clearForm(form);
            document.getElementById('episode-show-id').value = showId; // Keep show ID
            loadEpisodes(showId);
        } catch (err) { alert(`Error saving episode: ${err.message}`); }
    });
    
    clearBtn.addEventListener('click', () => {
        const showId = document.getElementById('episode-show-id').value;
        clearForm(form);
        document.getElementById('episode-show-id').value = showId; // Keep show ID
    });
}

window.editEpisode = async (id) => {
    try {
        const ep = await apiFetch(`/api/episodes/${id}`); // Use public
        document.getElementById('episode-id').value = ep.id;
        document.getElementById('episode-show-id').value = ep.show_id;
        document.getElementById('episode-number').value = ep.ep_number;
        document.getElementById('episode-title').value = ep.title;
        document.getElementById('episode-desc').value = ep.description;
        document.getElementById('episode-drive-url').value = ep.drive_url;
        // Format date for datetime-local input
        const pubDate = new Date(ep.publish_date);
        const localDateTime = new Date(pubDate.getTime() - (pubDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        document.getElementById('episode-publish-date').value = localDateTime;
        
        alert('Editing episode. Please re-upload thumbnail if you wish to change it.');
    } catch (err) { alert(`Error loading episode data: ${err.message}`); }
};

window.deleteEpisode = async (id) => {
    if (!confirm('Are you sure you want to delete this episode?')) return;
    try {
        await apiFetch(`/api/admin/episodes/${id}`, { method: 'DELETE' });
        const showId = document.getElementById('episode-show-select').value;
        initEpisodesPage(); // Reload
        document.getElementById('episode-show-select').value = showId;
        document.getElementById('episode-show-select').dispatchEvent(new Event('change'));
    } catch (err) { alert(`Error deleting episode: ${err.message}`); }
};