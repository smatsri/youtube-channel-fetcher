require("dotenv").config();
const express = require("express");
const path = require("path");
const {
  fetchYoutubeVideos,
  streamYoutubeVideos,
} = require("./lib/youtube-videos");
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// Serve static files from the output directory (for the JSON file)
app.use("/output", express.static(path.join(__dirname, "output")));

// Route for the main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Regular API route (non-streaming)
app.get("/api/videos", async (req, res) => {
  const videos = await fetchYoutubeVideos(req.query.channel);
  res.json(videos);
});

// Streaming API route using Server-Sent Events
app.get("/api/videos/stream", (req, res) => {
  const channelInput = req.query.channel;

  if (!channelInput) {
    res.status(400).json({ error: "Channel parameter is required" });
    return;
  }

  // Set headers for Server-Sent Events
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  });

  // Send initial connection event
  res.write(
    `data: ${JSON.stringify({
      type: "connected",
      message: "Stream started",
    })}\n\n`
  );

  let videoCount = 0;

  streamYoutubeVideos(
    channelInput,
    // onProgress
    (progress) => {
      res.write(
        `data: ${JSON.stringify({ type: "progress", ...progress })}\n\n`
      );
    },
    // onVideo
    (video) => {
      videoCount++;
      res.write(
        `data: ${JSON.stringify({
          type: "video",
          video,
          count: videoCount,
        })}\n\n`
      );
    },
    // onComplete
    (result) => {
      res.write(
        `data: ${JSON.stringify({
          type: "complete",
          ...result,
          totalVideos: videoCount,
        })}\n\n`
      );
      res.end();
    },
    // onError
    (error) => {
      res.write(
        `data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`
      );
      res.end();
    }
  );

  // Handle client disconnect
  req.on("close", () => {
    console.log("Client disconnected from stream");
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);

  console.log(`📄 Main page: http://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});
