let allVideos = [];
let filteredVideos = [];

// Format duration from PT37M46S to 37:46
function formatDuration(duration) {
  if (!duration) return "Unknown";

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "Unknown";

  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Format numbers (views, likes, comments)
function formatNumber(num) {
  if (!num) return "0";
  const number = parseInt(num);
  if (number >= 1000000) {
    return (number / 1000000).toFixed(1) + "M";
  } else if (number >= 1000) {
    return (number / 1000).toFixed(1) + "K";
  }
  return number.toString();
}

// Create video card HTML
function createVideoCard(video) {
  const videoId = video.id;
  const snippet = video.snippet;
  const thumbnail =
    snippet.thumbnails.medium || snippet.thumbnails.default;

  return `
            <div class="video-card">
                <div class="video-thumbnail">
                    <img src="${thumbnail.url}" alt="${
    snippet.title
  }" loading="lazy">
                    <div class="video-duration">${formatDuration(
                      video.duration
                    )}</div>
                </div>
                <div class="video-info">
                    <h3 class="video-title">${snippet.title}</h3>
                    <p class="video-description">${snippet.description}</p>
                    <div class="video-meta">
                        <span>📅 ${formatDate(snippet.publishedAt)}</span>
                        <span>👁️ ${formatNumber(
                          video.viewCount
                        )} views</span>
                    </div>
                    <div class="video-stats">
                        <div class="stat-item">
                            <span>👍</span>
                            <span>${formatNumber(video.likeCount)}</span>
                        </div>
                        <div class="stat-item">
                            <span>💬</span>
                            <span>${formatNumber(video.commentCount)}</span>
                        </div>
                    </div>
                    <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" class="watch-button">
                        Watch on YouTube
                    </a>
                </div>
            </div>
        `;
}

// Filter videos based on search term
function filterVideos(searchTerm) {
  if (!searchTerm.trim()) {
    filteredVideos = [...allVideos];
  } else {
    const term = searchTerm.toLowerCase();
    filteredVideos = allVideos.filter(
      (video) =>
        video.snippet.title.toLowerCase().includes(term) ||
        video.snippet.description.toLowerCase().includes(term) ||
        (video.tags &&
          video.tags.some((tag) => tag.toLowerCase().includes(term)))
    );
  }
  renderVideos();
}

// Render videos to the grid
function renderVideos() {
  const grid = document.getElementById("videosGrid");
  if (filteredVideos.length === 0) {
    grid.innerHTML =
      '<div class="error">No videos found matching your search.</div>';
    return;
  }

  grid.innerHTML = filteredVideos.map(createVideoCard).join("");
}

// Load and display videos
async function loadVideos(channelInput) {
  if (!channelInput || !channelInput.trim()) {
    document.getElementById("error").innerHTML =
      "Please enter a channel name or URL";
    document.getElementById("error").style.display = "block";
    return;
  }

  try {
    // Show loading state
    document.getElementById("loading").style.display = "block";
    document.getElementById("error").style.display = "none";
    document.getElementById("stats").style.display = "none";
    document.getElementById("searchInput").style.display = "none";
    document.getElementById("videosGrid").innerHTML = "";
    const response = await fetch(
      `/api/videos?channel=${encodeURIComponent(channelInput)}`
    );
    if (!response.ok) {
      throw new Error("Failed to load videos");
    }

    const videos = await response.json();
    if (!videos || videos.length === 0) {
      throw new Error("No videos found for this channel");
    }

    allVideos = videos;
    filteredVideos = [...allVideos];

    // Update stats
    document.getElementById("stats").innerHTML = `
                <h2>📊 Channel Statistics</h2>
                <p>Total Videos: ${videos.length}</p>
                <p>Channel: ${videos[0]?.channelTitle || "Unknown"}</p>
            `;

    // Show stats and search, hide loading
    document.getElementById("loading").style.display = "none";
    document.getElementById("stats").style.display = "block";
    document.getElementById("searchInput").style.display = "block";
    renderVideos();
  } catch (error) {
    console.error("Error loading videos:", error);
    document.getElementById("loading").style.display = "none";
    document.getElementById(
      "error"
    ).innerHTML = `Error: ${error.message}`;
    document.getElementById("error").style.display = "block";
  }
}

// Fetch button functionality
document.getElementById("fetchButton").addEventListener("click", () => {
  const channelInput = document
    .getElementById("channelInput")
    .value.trim();
  loadVideos(channelInput);
});

// Allow Enter key to trigger fetch
document
  .getElementById("channelInput")
  .addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const channelInput = document
        .getElementById("channelInput")
        .value.trim();
      loadVideos(channelInput);
    }
  });

// Search functionality
document.getElementById("searchInput").addEventListener("input", (e) => {
  filterVideos(e.target.value);
});

// Initialize page - don't load videos automatically
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loading").style.display = "none";
  document.getElementById("error").style.display = "none";
});
