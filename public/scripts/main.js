let allVideos = [];
let filteredVideos = [];
let isStreaming = false;

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
            <div class="video-card" id="video-${videoId}">
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

// Add video to grid with animation
function addVideoToGrid(video) {
  const grid = document.getElementById("videosGrid");
  const videoCard = createVideoCard(video);
  
  // Create a temporary div to hold the new video
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = videoCard;
  const newVideoElement = tempDiv.firstElementChild;
  
  // Add animation class
  newVideoElement.style.opacity = '0';
  newVideoElement.style.transform = 'translateY(20px)';
  
  grid.appendChild(newVideoElement);
  
  // Trigger animation
  setTimeout(() => {
    newVideoElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    newVideoElement.style.opacity = '1';
    newVideoElement.style.transform = 'translateY(0)';
  }, 50);
}

// Update progress display
function updateProgress(progress) {
  const statsDiv = document.getElementById("stats");
  const loadingDiv = document.getElementById("loading");
  
  let message = progress.message || "Loading...";
  
  if (progress.stage === 'videos_progress' && progress.totalFetched !== undefined) {
    message = `Fetched ${progress.totalFetched} videos so far... (Page ${progress.page})`;
  }
  
  loadingDiv.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">${message}</div>
      ${progress.totalFetched ? `<div class="loading-count">Videos loaded: ${progress.totalFetched}</div>` : ''}
    </div>
  `;
  
  if (progress.channelInfo) {
    statsDiv.innerHTML = `
      <h2>📊 Channel Statistics</h2>
      <p>Channel: ${progress.channelInfo.title}</p>
      <p>Subscribers: ${parseInt(progress.channelInfo.subscriberCount).toLocaleString()}</p>
      <p>Total Channel Videos: ${parseInt(progress.channelInfo.videoCount).toLocaleString()}</p>
      <p>Videos Loaded: ${allVideos.length}</p>
    `;
    statsDiv.style.display = "block";
  }
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

// Streaming video loader
async function loadVideosStream(channelInput) {
  if (!channelInput || !channelInput.trim()) {
    document.getElementById("error").innerHTML = "Please enter a channel name or URL";
    document.getElementById("error").style.display = "block";
    return;
  }

  if (isStreaming) {
    console.log("Already streaming, ignoring request");
    return;
  }

  isStreaming = true;
  allVideos = [];
  filteredVideos = [];

  // Reset UI
  document.getElementById("loading").style.display = "block";
  document.getElementById("error").style.display = "none";
  document.getElementById("stats").style.display = "none";
  document.getElementById("searchInput").style.display = "none";
  document.getElementById("videosGrid").innerHTML = "";

  try {
    const eventSource = new EventSource(`/api/videos/stream?channel=${encodeURIComponent(channelInput)}`);
    
    eventSource.onmessage = function(event) {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'connected':
          console.log('Stream connected');
          break;
          
        case 'progress':
          updateProgress(data);
          break;
          
        case 'video':
          allVideos.push(data.video);
          filteredVideos.push(data.video);
          addVideoToGrid(data.video);
          
          // Update stats if visible
          if (document.getElementById("stats").style.display !== "none") {
            const statsContent = document.getElementById("stats").innerHTML;
            const updatedStats = statsContent.replace(
              /Videos Loaded: \d+/,
              `Videos Loaded: ${allVideos.length}`
            );
            document.getElementById("stats").innerHTML = updatedStats;
          }
          break;
          
        case 'complete':
          console.log('Stream completed');
          document.getElementById("loading").style.display = "none";
          document.getElementById("searchInput").style.display = "block";
          
          // Final stats update
          if (data.channelInfo) {
            document.getElementById("stats").innerHTML = `
              <h2>📊 Channel Statistics</h2>
              <p>Channel: ${data.channelInfo.title}</p>
              <p>Subscribers: ${parseInt(data.channelInfo.subscriberCount).toLocaleString()}</p>
              <p>Total Channel Videos: ${parseInt(data.channelInfo.videoCount).toLocaleString()}</p>
              <p>Videos Loaded: ${allVideos.length}</p>
              <p>✅ Stream completed successfully!</p>
            `;
          }
          
          eventSource.close();
          isStreaming = false;
          break;
          
        case 'error':
          console.error('Stream error:', data.message);
          document.getElementById("loading").style.display = "none";
          document.getElementById("error").innerHTML = `Error: ${data.message}`;
          document.getElementById("error").style.display = "block";
          eventSource.close();
          isStreaming = false;
          break;
      }
    };
    
    eventSource.onerror = function(event) {
      console.error('EventSource failed:', event);
      document.getElementById("loading").style.display = "none";
      document.getElementById("error").innerHTML = "Connection to server lost. Please try again.";
      document.getElementById("error").style.display = "block";
      eventSource.close();
      isStreaming = false;
    };
    
  } catch (error) {
    console.error("Error setting up stream:", error);
    document.getElementById("loading").style.display = "none";
    document.getElementById("error").innerHTML = `Error: ${error.message}`;
    document.getElementById("error").style.display = "block";
    isStreaming = false;
  }
}

// Load and display videos (non-streaming fallback)
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
  loadVideosStream(channelInput);
});

// Allow Enter key to trigger fetch
document
  .getElementById("channelInput")
  .addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const channelInput = document
        .getElementById("channelInput")
        .value.trim();
      loadVideosStream(channelInput);
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
