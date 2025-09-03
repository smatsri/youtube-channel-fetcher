const Router = require("express");
const { fetchYoutubeVideos, streamYoutubeVideos } = require("./youtube-videos");

const router = Router();

router.get("/", async (req, res) => {
  const videos = await fetchYoutubeVideos(req.query.channel);
  res.json(videos);
});

router.get("/stream", (req, res) => {
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

module.exports = router;
