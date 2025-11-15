document.addEventListener('DOMContentLoaded', () => {
    // Get show ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const showId = urlParams.get('id');

    if (!showId) {
        document.body.innerHTML = '<h1>Error: No show ID provided.</h1>';
        return;
    }

    loadShowDetails(showId);
    loadEpisodes(showId);
    checkContinueWatching(showId);
});

/**
 * Loads the main show details (banner, poster, description)
 */
async function loadShowDetails(showId) {
    try {
        const res = await fetch(`/api/shows/${showId}`);
        if (!res.ok) throw new Error('Show not found');
        
        const show = await res.json();

        // Set banner image
        const bannerEl = document.querySelector('.show-banner');
        bannerEl.style.backgroundImage = `url(${show.banner || '/assets/images/placeholder-banner.jpg'})`;

        // Set poster image
        document.getElementById('show-poster-img').src = show.poster || '/assets/images/placeholder-poster.jpg';
        
        // Set info
        document.getElementById('show-title').textContent = show.title;
        document.getElementById('show-description').textContent = show.description;

        // Set genres
        const genresContainer = document.getElementById('show-genres');
        genresContainer.innerHTML = '';
        if (show.genres) {
            const genres = show.genres.split(',');
            genres.forEach(genre => {
                genresContainer.innerHTML += `<span class="genre-tag">${genre.trim()}</span>`;
            });
        }

    } catch (err) {
        console.error('Failed to load show details:', err);
        document.querySelector('.show-banner-content').innerHTML = `<h1>${err.message}</h1>`;
    }
}

/**
 * Loads the list of episodes for the show
 */
async function loadEpisodes(showId) {
    try {
        const res = await fetch(`/api/shows/${showId}/episodes`);
        const episodes = await res.json();

        const listContainer = document.getElementById('episode-list');
        listContainer.innerHTML = ''; // Clear loader

        if (episodes.length === 0) {
            listContainer.innerHTML = '<p>No episodes available for this show yet.</p>';
            return;
        }

        episodes.forEach(ep => {
            listContainer.innerHTML += `
                <div class="episode-card">
                    <div class="episode-thumbnail">
                        <img src="${ep.thumbnail || '/assets/images/placeholder-thumb.jpg'}" alt="${ep.title}">
                    </div>
                    <div class="episode-details">
                        <h3>Ep ${ep.ep_number}: ${ep.title}</h3>
                        <p>${ep.description || 'No description available.'}</p>
                    </div>
                    <div class="episode-play-btn">
                        <a href="/watch.html?id=${ep.id}" title="Play Episode">▶</a>
                    </div>
                </div>
            `;
        });

    } catch (err) {
        console.error('Failed to load episodes:', err);
        document.getElementById('episode-list').innerHTML = '<p class="error-message">Could not load episodes.</p>';
    }
}

/**
 * Checks if the user has watch history for this show
 */
async function checkContinueWatching(showId) {
    const token = localStorage.getItem('user_token');
    if (!token) return; // Not logged in

    try {
        const res = await fetch('/api/history', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const history = await res.json();
        
        // Find the most recently watched episode FOR THIS SHOW
        const showHistory = history.filter(item => item.show_id == showId); // Note: Loose comparison for type
        
        if (showHistory.length > 0) {
            const lastWatched = showHistory[0]; // API returns sorted by date
            const progressPercent = (lastWatched.progress / lastWatched.duration) * 100; // Assumes duration is available
            
            const continueBar = document.getElementById('continue-watching-bar');
            continueBar.style.display = 'flex';
            
            const title = `Ep ${lastWatched.ep_number}: ${lastWatched.title}`;
            document.getElementById('continue-episode-title').textContent = title;
            
            const continueLink = document.getElementById('continue-btn');
            continueLink.href = `/watch.html?id=${lastWatched.episode_id}`;
            
            // Note: This logic requires the history API to return more data
            // (like ep_number, show_id, etc.) which the Part 2 API does.
        }
        
    } catch (err) {
        console.error('Could not fetch watch history:', err);
    }
}