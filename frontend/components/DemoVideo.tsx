"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO_SRC = "/media/sre-copilot-walkthrough.mp4";
const POSTER_SRC = "/posters/sre-copilot-walkthrough.svg";

export function DemoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  function playVideo() {
    setError(false);
    setShouldLoad(true);
    setIsPlaying(true);
  }

  useEffect(() => {
    if (!shouldLoad) return;
    void videoRef.current?.play().catch(() => {
      setError(true);
      setIsPlaying(false);
    });
  }, [shouldLoad]);

  return (
    <div className="demo-video-frame">
      <div className="demo-video-chrome">
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="home-window-dot" />
          <span className="home-window-dot" />
          <span className="home-window-dot" />
        </div>
        <span className="demo-video-address">SRE Copilot / product walkthrough</span>
        <span className="font-mono text-[10px] text-white/50">DEMO</span>
      </div>
      <div className="demo-video-screen">
        <video
          ref={videoRef}
          className="demo-video"
          src={shouldLoad ? VIDEO_SRC : undefined}
          poster={POSTER_SRC}
          preload="none"
          muted
          playsInline
          controls
          aria-label="SRE Copilot product walkthrough"
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onError={() => setError(true)}
        />
        <button
          type="button"
          className={`demo-video-play ${isPlaying ? "is-playing" : ""}`}
          onClick={playVideo}
          aria-label="Play product walkthrough video"
        >
          <svg viewBox="0 0 24 24" className="size-7" fill="currentColor" aria-hidden="true">
            <path d="M8 5.8c0-.8.9-1.3 1.6-.9l10 6.2a1 1 0 0 1 0 1.7l-10 6.2c-.7.4-1.6-.1-1.6-.9V5.8Z" />
          </svg>
        </button>
        {error && (
          <p className="demo-video-error" role="status">
            Walkthrough unavailable. Check that the media file is present and encoded for the web.
          </p>
        )}
      </div>
    </div>
  );
}
