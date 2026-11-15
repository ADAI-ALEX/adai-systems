"use client";

import { useRef, useState } from "react";
import type { Video } from "@/content/projects";

/** A real recording, loaded only when asked for. The poster is shown until then. */
export function Player({ video }: { video: Video }) {
  const element = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  return (
    <div className="player frame" data-started={started} style={{ aspectRatio: `${video.width} / ${video.height}` }}>
      <video
        ref={element}
        src={video.src}
        poster={video.poster}
        preload="none"
        controls={started}
        playsInline
        aria-label={video.label}
        width={video.width}
        height={video.height}
      />
      {started ? null : (
        <button
          type="button"
          className="player-start"
          onClick={() => {
            setStarted(true);
            void element.current?.play();
          }}
        >
          <span className="player-icon" aria-hidden="true">
            ▶
          </span>
          <span>
            Play the demo <span className="meta">{video.seconds} s, with sound</span>
          </span>
        </button>
      )}
    </div>
  );
}
