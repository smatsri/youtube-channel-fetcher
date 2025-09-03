# YouTube Channel Video Fetcher

A Node.js script to fetch all videos from a YouTube channel using the YouTube Data API v3.

<!-- Test comment for commit message rule -->

## Features

- ✅ Fetch all videos from any YouTube channel
- ✅ Support for channel ID, username, or channel URL
- ✅ Automatic pagination handling for large channels
- ✅ Detailed video information including statistics
- ✅ Rate limiting and error handling
- ✅ Export results to JSON file
- ✅ Channel information display

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Get YouTube API Key

1. Go to the [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Create credentials (API Key)
5. Copy your API key

### 3. Configure the Script

Open `youtube-videos.js` and replace `YOUR_YOUTUBE_API_KEY_HERE` with your actual API key:

```javascript
const API_KEY = "your_actual_api_key_here";
```

## Usage

### Basic Usage

```bash
npm start
```

### Programmatic Usage

```javascript
const YouTubeChannelFetcher = require("./youtube-videos.js");

const fetcher = new YouTubeChannelFetcher("your_api_key");

// Get channel ID from various formats
const channelId = await fetcher.getChannelId("@mkbhd"); // Username
// or
const channelId = await fetcher.getChannelId("UCBJycsmduvYEL83R_U4JriQ"); // Channel ID
// or
const channelId = await fetcher.getChannelId("https://www.youtube.com/@mkbhd"); // URL

// Fetch all videos
const videos = await fetcher.getAllChannelVideos(channelId, {
  maxResults: 50,
  order: "date",
  includeDetails: true,
});

// Save to file
fetcher.saveToFile(videos, "my_channel_videos.json");
```

## API Reference

### YouTubeChannelFetcher

#### Constructor

- `new YouTubeChannelFetcher(apiKey)` - Initialize with your YouTube API key

#### Methods

##### `getChannelId(input)`

Get channel ID from username, channel ID, or channel URL.

**Parameters:**

- `input` (string): Channel username, ID, or URL

**Returns:** Promise<string> - Channel ID

##### `getChannelInfo(channelId)`

Get detailed channel information.

**Parameters:**

- `channelId` (string): YouTube channel ID

**Returns:** Promise<Object> - Channel information

##### `getAllChannelVideos(channelId, options)`

Fetch all videos from a channel.

**Parameters:**

- `channelId` (string): YouTube channel ID
- `options` (Object): Optional configuration
  - `maxResults` (number): Videos per page (max 50, default 50)
  - `order` (string): Sort order - 'date', 'rating', 'relevance', 'title', 'videoCount', 'viewCount' (default 'date')
  - `publishedAfter` (string): ISO 8601 date string
  - `publishedBefore` (string): ISO 8601 date string
  - `includeDetails` (boolean): Include detailed video stats (default true)

**Returns:** Promise<Array> - Array of video objects

##### `saveToFile(videos, filename)`

Save videos to JSON file.

**Parameters:**

- `videos` (Array): Array of video objects
- `filename` (string): Output filename (default 'youtube_videos.json')

## Example Output

The script will create a JSON file with the following structure:

```json
{
  "fetchedAt": "2024-01-15T10:30:00.000Z",
  "totalVideos": 1250,
  "videos": [
    {
      "id": {
        "kind": "youtube#video",
        "videoId": "abc123"
      },
      "snippet": {
        "publishedAt": "2024-01-15T08:00:00Z",
        "title": "Video Title",
        "description": "Video description...",
        "thumbnails": {
          "default": {
            "url": "https://..."
          }
        }
      },
      "statistics": {
        "viewCount": "1000000",
        "likeCount": "50000",
        "commentCount": "1000"
      }
    }
  ]
}
```

## Rate Limits

The YouTube Data API has quotas and rate limits:

- 10,000 units per day (default)
- Each search request costs 100 units
- Each video details request costs 1 unit

The script includes automatic delays to respect rate limits.

## Error Handling

The script includes comprehensive error handling for:

- Invalid API keys
- Channel not found
- Network errors
- API quota exceeded
- Rate limiting

## License

MIT
