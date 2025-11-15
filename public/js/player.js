document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const episodeId = urlParams.get('id');

    if (!episodeId) {
        document.body.innerHTML = '<h1>Error: No episode ID specified.</h1>';
        return;
    }

    loadEpisode(episodeId);
});

async function loadEpisode(episodeId) {
    try {
        const res = await fetch(`/api/episodes/${episodeId}`);
        if (!res.ok) throw new Error('Episode not found or not yet published.');
        
        const episode = await res.json();

        // Set title and description
        document.getElementById('episode-title').innerText = `Watching: ${episode.show_title} - Ep ${episode.ep_number} ${episode.title}`;
        document.getElementById('episode-desc').innerText = episode.description || 'No description available.';

        // Set the Google Drive embed URL
        const playerFrame = document.getElementById('gdrive-player');
        if (playerFrame) {
            playerFrame.src = episode.drive_url;
        }
        
        // Check for and display "Next Episode" button
        if (episode.next_episode_id) {
            const nextBtn = document.getElementById('next-episode-btn');
            nextBtn.style.display = 'inline-block';
            nextBtn.onclick = () => {
                // Navigate to the next episode
                window.location.href = `/watch.html?id=${episode.next_episode_id}`;
            };
        }
        
        // Setup "Continue Watching" progress saving
        setupWatchHistory(episodeId);

    } catch (error) {
        console.error('Failed to load episode:', error);
        document.getElementById('episode-title').innerText = 'Error loading episode.';
    }
}

/**
 * Sets up watch history saving.
 * NOTE: This is a placeholder implementation. Saving progress from
 * an embedded G-Drive iframe is impossible due to cross-origin security.
 * This code *simulates* saving progress by pinging the server every 15 seconds.
 * A real implementation would require a <video> tag and a direct file link.
 */
function setupWatchHistory(episodeId) {
    const token = localStorage.getItem('user_token');
    if (!token) return; // User not logged in

    // We can't *get* progress from the iframe.
    // We will just "ping" the server to say the user is watching.
    // A better way is to save a timestamp. For this demo, we save a fake "progress".
    // Let's pretend we're 10 seconds in.
    
    let simulatedProgress = 10; // Start at 10 seconds

    const progressInterval = setInterval(async () => {
        try {
            await fetch('/api/history/update', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    episode_id: episodeId,
                    progress: simulatedProgress // Send the simulated progress
                })
            });
            
            console.log('Saved progress:', simulatedProgress);
            simulatedProgress += 15; // Add 15 seconds for the next ping

        } catch (err) {
            console.error('Failed to save progress:', err);
            // Stop trying if it fails (e.g., token expired)
            clearInterval(progressInterval);
        }
    }, 15000); // Save every 15 seconds
}