# YouTube Channel Video Fetcher

A comprehensive Node.js application that fetches and displays videos from YouTube channels using the YouTube Data API v3. Features both a web interface and programmatic API for retrieving channel videos with detailed statistics.

## 🚀 Features

- ✅ **Web Interface**: Beautiful, responsive web UI for browsing channel videos
- ✅ **REST API**: Programmatic access via HTTP endpoints
- ✅ **Flexible Input**: Support for channel URLs, usernames, or channel IDs
- ✅ **Comprehensive Data**: Video details, statistics, thumbnails, and metadata
- ✅ **Smart Pagination**: Automatic handling of large channels
- ✅ **Rate Limiting**: Built-in API quota management
- ✅ **Search & Filter**: Real-time video search and filtering
- ✅ **Export Capability**: Save results to JSON files
- ✅ **Error Handling**: Robust error handling and user feedback

## 📁 Project Structure

```
├── lib/
│   ├── fetcher.js          # Core YouTube API wrapper class
│   └── youtube-videos.js   # Main video fetching module
├── public/
│   └── index.html          # Web interface
├── output/                 # Generated JSON files
├── server.js              # Express server and API endpoints
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🛠️ Setup

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

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
YOUTUBE_API_KEY=your_actual_api_key_here
PORT=3000
```

## 🚀 Usage

### Web Interface

Start the server and open your browser:

```bash
npm start
```

Then visit `http://localhost:3000` to use the web interface.

**Features:**

- Enter any channel URL, username, or @handle
- Browse videos in a responsive grid layout
- Search and filter videos in real-time
- View detailed video statistics
- Direct links to YouTube videos

### API Endpoints

#### `GET /api/videos?channel={channelInput}`

Fetch videos from a YouTube channel.

**Parameters:**

- `channel` (string): Channel URL, username, or channel ID

**Example:**

```bash
curl "http://localhost:3000/api/videos?channel=@mkbhd"
```

#### `GET /health`

Health check endpoint.

**Response:**

```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Programmatic Usage

```javascript
const {
  YouTubeChannelFetcher,
  fetchYoutubeVideos,
} = require("./lib/youtube-videos");

// Simple usage
const videos = await fetchYoutubeVideos("@mkbhd");

// Advanced usage with custom options
const fetcher = new YouTubeChannelFetcher(process.env.YOUTUBE_API_KEY);

const channelId = await fetcher.getChannelId("https://www.youtube.com/@mkbhd");
const channelInfo = await fetcher.getChannelInfo(channelId);
const videos = await fetcher.getAllChannelVideos(channelId, {
  maxResults: 50,
  order: "date",
  includeDetails: true,
});

// Save to file
fetcher.saveToFile(videos, "my_channel_videos.json");
```

## 📚 API Reference

### YouTubeChannelFetcher Class

#### Constructor

```javascript
new YouTubeChannelFetcher(apiKey);
```

#### Methods

##### `getChannelId(input)`

Resolve channel ID from various input formats.

**Parameters:**

- `input` (string): Channel URL, username, or channel ID

**Returns:** `Promise<string>` - Channel ID

**Supported formats:**

- `@username` - YouTube handle
- `https://www.youtube.com/@username` - Full URL
- `https://www.youtube.com/channel/UC...` - Channel URL
- `UC...` - Direct channel ID

##### `getChannelInfo(channelId)`

Get comprehensive channel information.

**Parameters:**

- `channelId` (string): YouTube channel ID

**Returns:** `Promise<Object>` - Channel details including subscriber count, video count, etc.

##### `getAllChannelVideos(channelId, options)`

Fetch all videos from a channel with pagination.

**Parameters:**

- `channelId` (string): YouTube channel ID
- `options` (Object): Configuration options
  - `maxResults` (number): Videos per page (max 50, default 50)
  - `order` (string): Sort order - 'date', 'rating', 'relevance', 'title', 'videoCount', 'viewCount'
  - `publishedAfter` (string): ISO 8601 date string
  - `publishedBefore` (string): ISO 8601 date string
  - `includeDetails` (boolean): Include detailed video stats (default true)

**Returns:** `Promise<Array>` - Array of video objects

##### `saveToFile(videos, filename)`

Save video data to JSON file.

**Parameters:**

- `videos` (Array): Array of video objects
- `filename` (string): Output filename (default 'youtube_videos.json')

### fetchYoutubeVideos Function

Convenience function for simple video fetching.

```javascript
const videos = await fetchYoutubeVideos(channelInput);
```

## 📊 Data Structure

### Video Object

```json
{
  "id": "video_id",
  "title": "Video Title",
  "description": "Video description...",
  "publishedAt": "2024-01-15T08:00:00Z",
  "thumbnail": "https://...",
  "duration": "PT10M30S",
  "viewCount": "1000000",
  "likeCount": "50000",
  "commentCount": "1000",
  "tags": ["tag1", "tag2"],
  "channelTitle": "Channel Name",
  "channelId": "UC..."
}
```

### Channel Object

```json
{
  "id": "UC...",
  "title": "Channel Name",
  "description": "Channel description...",
  "thumbnail": "https://...",
  "subscriberCount": "1000000",
  "videoCount": "500",
  "viewCount": "100000000"
}
```

## ⚡ Performance & Limits

### YouTube API Quotas

- **Default quota**: 10,000 units per day
- **Search requests**: 100 units each
- **Video details**: 1 unit each
- **Channel info**: 1 unit each

### Built-in Optimizations

- Automatic rate limiting with delays
- Efficient pagination handling
- Batch video detail requests
- Error retry mechanisms

## 🔧 Configuration

### Environment Variables

```env
YOUTUBE_API_KEY=your_api_key_here
PORT=3000
NODE_ENV=development
```

### Server Configuration

The Express server can be configured via environment variables:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode

## 🚨 Error Handling

The application handles various error scenarios:

- **Invalid API Key**: Clear error messages for authentication issues
- **Channel Not Found**: Graceful handling of non-existent channels
- **Rate Limiting**: Automatic delays and retry logic
- **Network Issues**: Timeout and connection error handling
- **API Quota Exceeded**: Informative quota limit messages

## 🎨 Web Interface Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Search**: Instant video filtering
- **Video Cards**: Rich video information display
- **Statistics**: View counts, likes, comments, and duration
- **Direct Links**: One-click access to YouTube videos
- **Loading States**: User-friendly loading indicators
- **Error Messages**: Clear error communication

## 📝 Scripts

```bash
npm start          # Start the web server
npm run dev        # Start in development mode
npm test           # Run tests (placeholder)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- [YouTube Data API v3 Documentation](https://developers.google.com/youtube/v3)
- [Google Cloud Console](https://console.developers.google.com/)
- [Express.js Documentation](https://expressjs.com/)
