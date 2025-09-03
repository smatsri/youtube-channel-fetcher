/**
 * @fileoverview YouTube video fetching module that provides functionality to retrieve
 * channel information and videos from YouTube channels using the YouTube Data API v3.
 *
 * @author Your Name
 * @version 1.0.0
 */

const { YouTubeChannelFetcher } = require("./fetcher");

/**
 * YouTube API key from environment variables
 * @type {string}
 */
const API_KEY = process.env.YOUTUBE_API_KEY;

/**
 * Fetches YouTube videos and channel information for a given channel input.
 *
 * This function accepts various input formats including channel URLs, usernames,
 * or channel IDs, and returns comprehensive video data along with channel statistics.
 *
 * @async
 * @function fetchYoutubeVideos
 * @param {string} channelInput - The channel identifier. Can be:
 *   - Channel URL (e.g., "https://www.youtube.com/@AmberReacts24")
 *   - Username (e.g., "Marques Brownlee")
 *   - Channel URL with @ symbol (e.g., "https://www.youtube.com/@mkbhd")
 *   - Channel ID (e.g., "UCBJycsmduvYEL83R_U4JriQ")
 *
 * @returns {Promise<Array<Object>|undefined>} Returns an array of video objects containing:
 *   - title: Video title
 *   - description: Video description
 *   - publishedAt: Publication date
 *   - videoId: YouTube video ID
 *   - thumbnailUrl: Video thumbnail URL
 *   - viewCount: Number of views
 *   - likeCount: Number of likes
 *   - commentCount: Number of comments
 *   - duration: Video duration
 *   - channelTitle: Channel name
 *   - channelId: Channel ID
 *
 * @throws {Error} Throws an error if:
 *   - Channel input is invalid or channel not found
 *   - YouTube API key is missing or invalid
 *   - API quota is exceeded
 *   - Network connection issues occur
 *
 * @example
 * // Using channel URL
 * const videos = await fetchYoutubeVideos("https://www.youtube.com/@AmberReacts24");
 *
 * @example
 * // Using username
 * const videos = await fetchYoutubeVideos("Marques Brownlee");
 *
 * @example
 * // Using channel URL with @ symbol
 * const videos = await fetchYoutubeVideos("https://www.youtube.com/@mkbhd");
 */
async function fetchYoutubeVideos(channelInput) {
  const fetcher = new YouTubeChannelFetcher(API_KEY);

  try {
    console.log(`🔍 Getting channel ID for: ${channelInput}`);
    const channelId = await fetcher.getChannelId(channelInput);
    console.log(`📺 Channel ID: ${channelId}`);

    // Retrieve comprehensive channel information including subscriber count and video count
    console.log("\n📊 Getting channel information...");
    const channelInfo = await fetcher.getChannelInfo(channelId);
    console.log(`Channel: ${channelInfo.title}`);
    console.log(
      `Subscribers: ${parseInt(channelInfo.subscriberCount).toLocaleString()}`
    );
    console.log(
      `Total Videos: ${parseInt(channelInfo.videoCount).toLocaleString()}`
    );

    // Fetch all videos from the channel with detailed information
    // Configuration: max 50 results, ordered by date, including full video details
    console.log("\n🎥 Fetching all videos...");
    const videos = await fetcher.getAllChannelVideos(channelId, {
      maxResults: 50,
      order: "date",
      includeDetails: true,
    });

    // Display a summary of the fetched data
    console.log("\n📈 Summary:");
    console.log(`Total videos fetched: ${videos.length}`);

    if (videos.length > 0) {
      const latestVideo = videos[0];
      console.log(`Latest video: "${latestVideo.title}"`);
      console.log(
        `Published: ${new Date(latestVideo.publishedAt).toLocaleDateString()}`
      );
    }

    return videos;
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

/**
 * Fetches YouTube videos with streaming support using Server-Sent Events.
 * This function streams video data as it's being fetched, providing real-time updates.
 *
 * @async
 * @function streamYoutubeVideos
 * @param {string} channelInput - The channel identifier
 * @param {Function} onProgress - Callback function for progress updates
 * @param {Function} onVideo - Callback function for each video
 * @param {Function} onComplete - Callback function when complete
 * @param {Function} onError - Callback function for errors
 *
 * @example
 * streamYoutubeVideos(
 *   "https://www.youtube.com/@AmberReacts24",
 *   (progress) => console.log(`Progress: ${progress.current}/${progress.total}`),
 *   (video) => console.log(`New video: ${video.title}`),
 *   (result) => console.log(`Complete: ${result.totalVideos} videos`),
 *   (error) => console.error(`Error: ${error.message}`)
 * );
 */
async function streamYoutubeVideos(
  channelInput,
  onProgress,
  onVideo,
  onComplete,
  onError
) {
  const fetcher = new YouTubeChannelFetcher(API_KEY);

  try {
    console.log(`🔍 Getting channel ID for: ${channelInput}`);
    onProgress({
      stage: "channel_lookup",
      message: `Looking up channel: ${channelInput}`,
    });

    const channelId = await fetcher.getChannelId(channelInput);
    console.log(`📺 Channel ID: ${channelId}`);

    // Retrieve comprehensive channel information
    console.log("\n📊 Getting channel information...");
    onProgress({
      stage: "channel_info",
      message: "Fetching channel information...",
    });

    const channelInfo = await fetcher.getChannelInfo(channelId);
    console.log(`Channel: ${channelInfo.title}`);
    console.log(
      `Subscribers: ${parseInt(channelInfo.subscriberCount).toLocaleString()}`
    );
    console.log(
      `Total Videos: ${parseInt(channelInfo.videoCount).toLocaleString()}`
    );

    // Send channel info
    onProgress({
      stage: "channel_ready",
      message: `Channel found: ${channelInfo.title}`,
      channelInfo,
    });

    // Fetch videos with streaming support
    console.log("\n🎥 Fetching videos with streaming...");
    onProgress({ stage: "videos_start", message: "Starting video fetch..." });

    await fetcher.streamAllChannelVideos(channelId, {
      maxResults: 50,
      order: "date",
      includeDetails: true,
      onProgress: (progress) => {
        onProgress({
          stage: "videos_progress",
          message: `Fetching page ${progress.page}... (${progress.totalFetched} videos so far)`,
          ...progress,
        });
      },
      onVideos: (videos) => {
        // Stream each video individually
        videos.forEach((video) => onVideo(video));
      },
    });

    onComplete({
      message: "All videos fetched successfully",
      channelInfo,
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    onError(error);
  }
}

/**
 * Module exports for YouTube video fetching functionality
 *
 * @exports {Object} Module exports containing:
 *   - YouTubeChannelFetcher: The main class for fetching YouTube channel data
 *   - fetchYoutubeVideos: Convenience function for fetching videos from a channel
 *   - streamYoutubeVideos: Streaming function for real-time video fetching
 */
module.exports = {
  YouTubeChannelFetcher,
  fetchYoutubeVideos,
  streamYoutubeVideos,
};
