// Hidden playback page for direct audio-stream presets. The stream URL and
// initial volume arrive as query parameters; the main process adjusts volume
// later via executeJavaScript on the <audio> element.
const params = new URLSearchParams(location.search);
const player = document.getElementById('player');

const url = params.get('url');
if (url) {
  player.src = url;
  player.volume = Math.min(Math.max(Number(params.get('vol') ?? 0.7), 0), 1);
  player.play().catch((err) => console.error('Stream playback failed:', err));
}
