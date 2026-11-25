/* Keep each real video poster visible until playback actually starts. */
(() => {
  const selector = 'video.vh-hero__video, video.vt__video';
  const mark = (video, playing) => {
    if (video instanceof HTMLVideoElement && video.matches(selector)) {
      video.classList.toggle('viri-video-playing', playing);
    }
  };
  document.addEventListener('playing', (event) => mark(event.target, true), true);
  for (const eventName of ['waiting', 'error', 'emptied', 'abort', 'pause', 'ended']) {
    document.addEventListener(eventName, (event) => mark(event.target, false), true);
  }
  const initialize = (root) => {
    root.querySelectorAll(selector).forEach((video) => {
      mark(video, !video.paused && !video.ended && !video.error && video.readyState >= 3);
    });
  };
  initialize(document);
  document.addEventListener('shopify:section:load', (event) => initialize(event.target));
})();
