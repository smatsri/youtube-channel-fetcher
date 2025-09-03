const { google } = require("googleapis");
require("dotenv").config();

class YouTubeChannelFetcher {
  constructor(apiKey) {
    this.youtube = google.youtube({
      version: "v3",
      auth: apiKey,
    });
    this.apiKey = apiKey;
  }

  /**
   * Get channel ID from various input formats
   * @param {string} input - Channel username, channel ID, or channel URL
   * @returns {Promise<string>} Channel ID
   */
  async getChannelId(input) {
    try {
      // If it's already a channel ID (starts with UC)
      if (input.startsWith("UC") && input.length === 24) {
        return input;
      }

      // If it's a channel URL, extract the channel ID or username
      let channelIdentifier = input;
      if (input.includes("youtube.com/channel/")) {
        channelIdentifier = input
          .split("youtube.com/channel/")[1]
          .split("?")[0]
          .split("/")[0];
        if (channelIdentifier.startsWith("UC")) {
          return channelIdentifier;
        }
      } else if (
        input.includes("youtube.com/c/") ||
        input.includes("youtube.com/@")
      ) {
        channelIdentifier = input
          .split("youtube.com/")[1]
          .split("?")[0]
          .split("/")[0];
        if (channelIdentifier.startsWith("@")) {
          channelIdentifier = channelIdentifier.substring(1);
        }
      }

      // Search for channel by username or custom URL
      const response = await this.youtube.search.list({
        part: "snippet",
        q: channelIdentifier,
        type: "channel",
        maxResults: 1,
      });

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0].id.channelId;
      }

      throw new Error(`Channel not found: ${input}`);
    } catch (error) {
      console.error("Error getting channel ID:", error.message);
      throw error;
    }
  }

  /**
   * Get channel information
   * @param {string} channelId - YouTube channel ID
   * @returns {Promise<Object>} Channel information
   */
  async getChannelInfo(channelId) {
    try {
      const response = await this.youtube.channels.list({
        part: "snippet,statistics",
        id: channelId,
      });

      if (response.data.items && response.data.items.length > 0) {
        const channel = response.data.items[0];
        return {
          id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          thumbnail: channel.snippet.thumbnails.default.url,
          subscriberCount: channel.statistics.subscriberCount,
          videoCount: channel.statistics.videoCount,
          viewCount: channel.statistics.viewCount,
        };
      }

      throw new Error(`Channel not found: ${channelId}`);
    } catch (error) {
      console.error("Error getting channel info:", error.message);
      throw error;
    }
  }

  /**
   * Fetch all videos from a channel with pagination
   * @param {string} channelId - YouTube channel ID
   * @param {Object} options - Options for fetching videos
   * @returns {Promise<Array>} Array of all videos
   */
  async getAllChannelVideos(channelId, options = {}) {
    const {
      maxResults = 50,
      order = "date", // date, rating, relevance, title, videoCount, viewCount
      publishedAfter = null,
      publishedBefore = null,
      includeDetails = true,
    } = options;

    try {
      console.log(`Fetching videos from channel: ${channelId}`);

      let allVideos = [];
      let nextPageToken = null;
      let pageCount = 0;

      do {
        pageCount++;
        console.log(`Fetching page ${pageCount}...`);

        const searchParams = {
          part: "snippet",
          channelId: channelId,
          type: "video",
          order: order,
          maxResults: Math.min(maxResults, 50), // YouTube API max is 50
          pageToken: nextPageToken,
        };

        if (publishedAfter) {
          searchParams.publishedAfter = publishedAfter;
        }
        if (publishedBefore) {
          searchParams.publishedBefore = publishedBefore;
        }

        const response = await this.youtube.search.list(searchParams);

        if (response.data.items && response.data.items.length > 0) {
          let videos = response.data.items;

          // If detailed information is requested, fetch additional video details
          if (includeDetails) {
            const videoIds = videos.map((video) => video.id.videoId).join(",");
            const videoDetails = await this.getVideoDetails(videoIds);

            // Merge search results with detailed information
            videos = videos.map((video) => {
              const details = videoDetails.find(
                (detail) => detail.id === video.id.videoId
              );
              return {
                ...video,
                ...details,
              };
            });
          }

          allVideos = allVideos.concat(videos);
          console.log(
            `Found ${videos.length} videos on page ${pageCount}. Total so far: ${allVideos.length}`
          );
        }

        nextPageToken = response.data.nextPageToken;

        // Add a small delay to respect rate limits
        if (nextPageToken) {
          await this.delay(100);
        }
      } while (nextPageToken);

      console.log(
        `\n✅ Successfully fetched ${allVideos.length} videos from channel`
      );
      return allVideos;
    } catch (error) {
      console.error("Error fetching channel videos:", error.message);
      throw error;
    }
  }

  /**
   * Get detailed information for specific videos
   * @param {string} videoIds - Comma-separated video IDs
   * @returns {Promise<Array>} Array of video details
   */
  async getVideoDetails(videoIds) {
    try {
      const response = await this.youtube.videos.list({
        part: "snippet,statistics,contentDetails",
        id: videoIds,
      });

      return response.data.items.map((video) => ({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        publishedAt: video.snippet.publishedAt,
        thumbnail: video.snippet.thumbnails.default.url,
        duration: video.contentDetails.duration,
        viewCount: video.statistics.viewCount,
        likeCount: video.statistics.likeCount,
        commentCount: video.statistics.commentCount,
        tags: video.snippet.tags || [],
      }));
    } catch (error) {
      console.error("Error getting video details:", error.message);
      throw error;
    }
  }

  /**
   * Utility function to add delay
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Save videos to JSON file
   * @param {Array} videos - Array of videos
   * @param {string} filename - Output filename
   */
  saveToFile(videos, filename = "youtube_videos.json") {
    const fs = require("fs");
    const path = require("path");

    // Ensure output directory exists
    const outputDir = "output";
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create full path in output directory
    const fullPath = path.join(outputDir, filename);

    const data = {
      fetchedAt: new Date().toISOString(),
      totalVideos: videos.length,
      videos: videos,
    };

    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
    console.log(`\n💾 Videos saved to ${fullPath}`);
  }
}

// Example usage
async function main() {
  // Replace with your YouTube API key
  const API_KEY = process.env.YOUTUBE_API_KEY;

  if (API_KEY === "YOUR_YOUTUBE_API_KEY_HERE") {
    console.error("❌ Please set your YouTube API key in the script");
    console.log(
      "Get your API key from: https://console.developers.google.com/"
    );
    return;
  }

  const fetcher = new YouTubeChannelFetcher(API_KEY);

  try {
    // Example: Fetch videos from a channel
    // You can use channel ID, username, or channel URL
    const channelInput = "https://www.youtube.com/@AmberReacts24"; // Example channel ID
    // const channelInput = 'Marques Brownlee'; // Example username
    // const channelInput = 'https://www.youtube.com/@mkbhd'; // Example channel URL

    console.log(`🔍 Getting channel ID for: ${channelInput}`);
    const channelId = await fetcher.getChannelId(channelInput);
    console.log(`📺 Channel ID: ${channelId}`);

    // Get channel information
    console.log("\n📊 Getting channel information...");
    const channelInfo = await fetcher.getChannelInfo(channelId);
    console.log(`Channel: ${channelInfo.title}`);
    console.log(
      `Subscribers: ${parseInt(channelInfo.subscriberCount).toLocaleString()}`
    );
    console.log(
      `Total Videos: ${parseInt(channelInfo.videoCount).toLocaleString()}`
    );

    // Fetch all videos
    console.log("\n🎥 Fetching all videos...");
    const videos = await fetcher.getAllChannelVideos(channelId, {
      maxResults: 50,
      order: "date",
      includeDetails: true,
    });

    // Display summary
    console.log("\n📈 Summary:");
    console.log(`Total videos fetched: ${videos.length}`);

    if (videos.length > 0) {
      const latestVideo = videos[0];
      console.log(`Latest video: "${latestVideo.title}"`);
      console.log(
        `Published: ${new Date(latestVideo.publishedAt).toLocaleDateString()}`
      );
    }

    // Save to file
    fetcher.saveToFile(
      videos,
      `videos_${channelInfo.title.replace(/[^a-zA-Z0-9]/g, "_")}.json`
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Export the class for use in other modules
module.exports = YouTubeChannelFetcher;

// Run the example if this file is executed directly
if (require.main === module) {
  main();
}
