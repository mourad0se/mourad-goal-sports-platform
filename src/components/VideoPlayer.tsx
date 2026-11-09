"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type Hls from "hls.js";
import {
  AlertTriangle,
  Loader2,
  Maximize,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

/**
 * Professional HLS/MP4 player built on hls.js with custom controls.
 * (Video.js equivalent — lighter and framework-agnostic.)
 */
export function VideoPlayer({
  url,
  type,
  isLive,
}: {
  url: string;
  type: "hls" | "mp4";
  isLive: boolean;
}) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const attach = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    setLoading(true);
    setError(false);

    if (type === "hls") {
      const { default: HlsCtor } = await import("hls.js");
      if (HlsCtor.isSupported()) {
        const hls = new HlsCtor({
          enableWorker: true,
          lowLatencyMode: isLive,
          liveSyncDurationCount: 3,
        });
        hlsRef.current = hls;
        hls.on(HlsCtor.Events.ERROR, (_evt, data) => {
          if (data.fatal) {
            if (data.type === HlsCtor.ErrorTypes.NETWORK_ERROR) hls.startLoad();
            else if (data.type === HlsCtor.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
            else setError(true);
          }
        });
        hls.on(HlsCtor.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          void video.play().catch(() => setPlaying(false));
        });
        hls.loadSource(url);
        hls.attachMedia(video);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS
        video.src = url;
        video.addEventListener("loadedmetadata", () => {
          setLoading(false);
          void video.play().catch(() => setPlaying(false));
        }, { once: true });
      } else {
        setError(true);
        setLoading(false);
      }
    } else {
      video.src = url;
      video.addEventListener("loadedmetadata", () => {
        setLoading(false);
        void video.play().catch(() => setPlaying(false));
      }, { once: true });
    }
  }, [url, type, isLive]);

  useEffect(() => {
    void attach();
    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [attach, reloadKey]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);
    const onError = () => setError(true);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("error", onError);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onError);
    };
  }, [reloadKey]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const changeVolume = (value: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = value;
    v.muted = value === 0;
    setVolume(value);
    setMuted(v.muted);
  };

  const toggleFullscreen = () => {
    const shell = shellRef.current;
    if (!shell) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void shell.requestFullscreen().catch(() => undefined);
  };

  return (
    <div
      ref={shellRef}
      className="video-shell group/player relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl"
    >
      <video
        key={reloadKey}
        ref={videoRef}
        className="aspect-video w-full bg-black"
        playsInline
        onClick={togglePlay}
      />

      {/* top gradient + live chip */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-4">
        <span className="text-[11px] font-semibold tracking-wide text-white/70">{t.player.hint}</span>
        {isLive && (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-live px-2 py-1 text-[11px] font-extrabold text-white">
            <span className="live-dot bg-white" />
            {t.player.live}
          </span>
        )}
      </div>

      {/* loading spinner */}
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
          <Loader2 size={36} className="animate-spin-slow text-pitch-400" />
          <span className="text-sm font-semibold text-white/80">{t.player.loading}</span>
        </div>
      )}

      {/* error state */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-navy-950/95 p-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-live/15 text-live">
            <AlertTriangle size={22} />
          </span>
          <p className="font-extrabold text-white">{t.player.errorTitle}</p>
          <p className="max-w-sm text-sm text-mist">{t.player.errorBody}</p>
          <button onClick={() => setReloadKey((k) => k + 1)} className="btn-primary mt-2 text-xs">
            <RotateCcw size={14} />
            {t.common.retry}
          </button>
        </div>
      )}

      {/* center play button when paused */}
      {!playing && !loading && !error && (
        <button
          onClick={togglePlay}
          aria-label={t.player.play}
          className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-pitch-500/90 text-navy-950 shadow-[0_0_40px_-5px_rgba(22,199,132,0.7)] transition-transform hover:scale-105"
        >
          <Play size={26} fill="currentColor" className="ms-0.5" />
        </button>
      )}

      {/* bottom controls */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/85 to-transparent p-3 transition-opacity",
          playing ? "opacity-0 group-hover/player:opacity-100" : "opacity-100",
        )}
      >
        <button
          onClick={togglePlay}
          aria-label={playing ? t.player.pause : t.player.play}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/15"
        >
          {playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleMute}
            aria-label={muted ? t.player.unmute : t.player.mute}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/15"
          >
            {muted || volume === 0 ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            aria-label="Volume"
            className="h-1 w-20 cursor-pointer accent-[#16C784]"
          />
        </div>

        <div className="flex-1" />

        <button
          onClick={toggleFullscreen}
          aria-label={t.player.fullscreen}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/15"
        >
          <Maximize size={18} />
        </button>
      </div>
    </div>
  );
}
