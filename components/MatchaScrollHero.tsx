"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface Stage {
  id: string;
  number: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  stats: { value: string; label: string }[];
  position: "center" | "left" | "right";
  progressTarget: number;
  range: [number, number];
}

const STAGES: Stage[] = [
  {
    id: "origin",
    number: "01",
    category: "ORIGIN & HARVEST",
    title: "CEREMONIAL",
    subtitle: "UJI FIRST-FLUSH TENCHA",
    description:
      "Hand-harvested at dawn in Kyoto's misty hills. Shade-grown under straw reed mats for 28 days to maximize chlorophyll and L-theanine synthesis before granite stone-milling.",
    stats: [
      { value: "100%", label: "Uji Kyoto Origin" },
      { value: "28 Days", label: "Shade Canopy" },
      { value: "30μm", label: "Stone Milled" },
    ],
    position: "left",
    progressTarget: 0.05,
    range: [0, 0.24],
  },
  {
    id: "extraction",
    number: "02",
    category: "SLOW EXTRACTION",
    title: "18-HOUR DRIP",
    subtitle: "ETHIOPIAN COLD EXTRACTION",
    description:
      "Micro-lot Ethiopian Yirgacheffe slow-dripped drop by drop through pure mountain ice water. Eliminates harsh tannins and unlocks notes of candied citrus and jasmine blossom.",
    stats: [
      { value: "18 hrs", label: "Percolation" },
      { value: "4°C", label: "Ice Melt Extraction" },
      { value: "Zero", label: "Acrid Bitterness" },
    ],
    position: "right",
    progressTarget: 0.36,
    range: [0.25, 0.49],
  },
  {
    id: "fusion",
    number: "03",
    category: "MOLECULAR BALANCE",
    title: "EQUILIBRIUM",
    subtitle: "MICRO-AERATED OAT CREMA",
    description:
      "Steamed and flash-chilled organic Nordic oat milk suspended between vibrant ceremonial green tea and single-origin coffee, crafting silky micro-foam layers.",
    stats: [
      { value: "85mg", label: "Balanced Caffeine" },
      { value: "5 Hours", label: "Clean Flow State" },
      { value: "0g", label: "Added Sugars" },
    ],
    position: "left",
    progressTarget: 0.65,
    range: [0.50, 0.74],
  },
  {
    id: "serve",
    number: "04",
    category: "THE PERFECT SERVE",
    title: "RESERVE NO. 04",
    subtitle: "CHILLED BOROSILICATE POUR",
    description:
      "The culmination of Japanese tea ceremony tradition and modern specialty third-wave coffee science. Poured over hand-carved crystal ice at 4°C.",
    stats: [
      { value: "4°C", label: "Optimal Chill" },
      { value: "190ml", label: "Reserve Bottle" },
      { value: "Batch 04", label: "Limited Release" },
    ],
    position: "center",
    progressTarget: 0.95,
    range: [0.75, 1.0],
  },
];

const TOTAL_FRAMES = 190;

export default function MatchaScrollHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  // Virtual smooth scroll state
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);

  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [displayFrame, setDisplayFrame] = useState(1);

  // Frame rendering helper on canvas
  const renderFrame = useCallback((img: HTMLImageElement | undefined) => {
    const canvas = canvasRef.current;
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    const hRatio = width / imgWidth;
    const vRatio = height / imgHeight;
    const ratio = Math.max(hRatio, vRatio);

    const centerShiftX = (width - imgWidth * ratio) / 2;
    const centerShiftY = (height - imgHeight * ratio) / 2;

    ctx.drawImage(
      img,
      0,
      0,
      imgWidth,
      imgHeight,
      centerShiftX,
      centerShiftY,
      imgWidth * ratio,
      imgHeight * ratio
    );

    ctx.restore();
  }, []);

  // Preload frames
  useEffect(() => {
    let isCancelled = false;
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);
    let loadedCount = 0;

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const paddedIndex = String(i).padStart(3, "0");
      img.src = `/frames/matcha/frame_${paddedIndex}.webp`;

      img.onload = () => {
        if (isCancelled) return;
        loadedCount++;
        images[i - 1] = img;
        const prog = Math.round((loadedCount / TOTAL_FRAMES) * 100);
        setLoadProgress(prog);

        if (loadedCount === 1) {
          renderFrame(img);
        }

        if (loadedCount === TOTAL_FRAMES) {
          imagesRef.current = images;
          setImagesLoaded(true);
        }
      };

      img.onerror = () => {
        if (isCancelled) return;
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          imagesRef.current = images;
          setImagesLoaded(true);
        }
      };
    }

    return () => {
      isCancelled = true;
    };
  }, [renderFrame]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const idx = Math.max(0, Math.min(TOTAL_FRAMES - 1, displayFrame - 1));
      if (imagesRef.current[idx]) {
        renderFrame(imagesRef.current[idx]);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [displayFrame, renderFrame]);

  // Virtual Inertia / Smooth Scroll Wheel & Touch Handler
  useEffect(() => {
    let touchStartY = 0;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * 0.00045;
      targetProgressRef.current = Math.max(
        0,
        Math.min(1, targetProgressRef.current + delta)
      );
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY;
        touchStartY = touchY;
        const delta = deltaY * 0.0012;
        targetProgressRef.current = Math.max(
          0,
          Math.min(1, targetProgressRef.current + delta)
        );
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        targetProgressRef.current = Math.min(1, targetProgressRef.current + 0.08);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        targetProgressRef.current = Math.max(0, targetProgressRef.current - 0.08);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // 60FPS Inertial Animation Loop
  useEffect(() => {
    let animId: number;

    const tick = () => {
      const diff = targetProgressRef.current - currentProgressRef.current;
      currentProgressRef.current += diff * 0.055;

      const progress = currentProgressRef.current;
      const targetFrame = progress * (TOTAL_FRAMES - 1);
      const frameIndex = Math.round(targetFrame);
      const safeIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIndex));

      if (imagesRef.current[safeIndex]) {
        renderFrame(imagesRef.current[safeIndex]);
      }

      const stageIdx = STAGES.findIndex(
        (s) => progress >= s.range[0] && progress <= s.range[1]
      );
      if (stageIdx !== -1) {
        setActiveStageIndex(stageIdx);
      }

      setDisplayProgress(progress);
      setDisplayFrame(safeIndex + 1);

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [renderFrame]);

  // Jump or scrub to specific stage
  const jumpToStage = (stageIdx: number) => {
    const stage = STAGES[stageIdx];
    targetProgressRef.current = stage.progressTarget;
  };

  // Scrub bar direct click
  const handleScrubBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    targetProgressRef.current = newProgress;
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black text-white select-none touch-none">
      
      {/* Background ambient lighting vignette */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-600/10 blur-[180px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-black/90 pointer-events-none" />
      </div>

      {/* Floating Top Brand Mark */}
      <div className="absolute top-8 left-8 md:top-12 md:left-14 z-30 flex items-center gap-3 pointer-events-none">
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse" />
        <span className="font-mono text-[11px] tracking-[0.28em] uppercase text-zinc-400 font-semibold">
          KURA LABS / KYOTO
        </span>
      </div>

      {/* Top Right Frame Status */}
      <div className="absolute top-8 right-8 md:top-12 md:right-14 z-30 font-mono text-[11px] tracking-widest text-zinc-500 hidden sm:block pointer-events-none">
        <span className="text-zinc-300">FRAME</span>{" "}
        <span className="text-emerald-400">
          {String(displayFrame).padStart(3, "0")}
        </span>
        <span className="text-zinc-600"> / {TOTAL_FRAMES}</span>
      </div>

      {/* Center 60FPS Canvas */}
      <div className="relative w-full h-full flex items-center justify-center z-10">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover transition-opacity duration-700 pointer-events-none"
        />

        {/* Initial Loading Screen */}
        {!imagesLoaded && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
            <div className="relative w-14 h-14 flex items-center justify-center mb-5">
              <div className="absolute inset-0 rounded-full border border-zinc-800" />
              <div className="absolute inset-0 rounded-full border border-emerald-400 border-t-transparent animate-spin" />
              <span className="font-mono text-xs text-white font-bold">{loadProgress}%</span>
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500 mb-3">
              Buffering Experience
            </p>
            <div className="w-40 h-[2px] bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-150 ease-out"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Stage Overlays */}
        <div className="absolute inset-0 pointer-events-none z-20 flex items-center px-8 md:px-16 lg:px-24">
          {STAGES.map((stage, idx) => {
            const isActive = activeStageIndex === idx;

            return (
              <div
                key={stage.id}
                className={`absolute transition-all duration-700 ease-out transform ${
                  stage.position === "center"
                    ? "inset-x-0 mx-auto max-w-3xl text-center items-center flex flex-col px-6"
                    : stage.position === "left"
                    ? "left-8 md:left-16 lg:left-24 max-w-xl text-left"
                    : "right-8 md:right-16 lg:right-24 max-w-xl text-left md:text-right"
                } ${
                  isActive
                    ? "opacity-100 translate-y-0 filter blur-0 pointer-events-auto"
                    : "opacity-0 translate-y-8 filter blur-sm pointer-events-none"
                }`}
              >
                {/* Category Pill Tag */}
                <div
                  className={`inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full font-mono text-[10px] tracking-[0.2em] uppercase border ${
                    stage.position === "right" ? "md:ml-auto" : ""
                  } ${
                    isActive
                      ? "bg-white/[0.04] border-white/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                      : "bg-transparent border-white/10 text-zinc-500"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>{stage.number} {"//"} {stage.category}</span>
                </div>

                {/* Massive Bold Headline */}
                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white uppercase leading-[0.92] mb-3">
                  {stage.title}
                </h1>

                {/* Subtitle */}
                <h2 className="text-xs sm:text-sm md:text-base font-mono font-medium tracking-[0.18em] uppercase text-emerald-400 mb-4">
                  {stage.subtitle}
                </h2>

                {/* Description */}
                <p className="text-zinc-400 text-xs sm:text-sm md:text-base font-normal leading-relaxed max-w-md mb-8">
                  {stage.description}
                </p>

                {/* Technical Spec Metrics */}
                <div
                  className={`grid grid-cols-3 gap-3 pt-4 border-t border-white/10 w-full max-w-md ${
                    stage.position === "center"
                      ? "mx-auto"
                      : stage.position === "right"
                      ? "md:ml-auto"
                      : ""
                  }`}
                >
                  {stage.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-zinc-950/60 backdrop-blur-md border border-white/10 rounded-xl p-3 text-left"
                    >
                      <div className="text-base sm:text-lg font-bold tracking-tight text-white">
                        {stat.value}
                      </div>
                      <div className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stage 4 Final Action CTA */}
                {stage.position === "center" && (
                  <div className="mt-8 flex items-center justify-center gap-4">
                    <button className="px-7 py-3 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-semibold tracking-wider uppercase transition-all duration-200 shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95">
                      Order Reserve Batch
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Scroll Hint on Stage 1 */}
        {activeStageIndex === 0 && (
          <div className="absolute bottom-28 inset-x-0 mx-auto flex flex-col items-center justify-center pointer-events-none z-20 transition-opacity duration-500 animate-pulse">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-zinc-400 mb-2">
              SCROLL / DRAG TO ROTATE
            </span>
            <svg
              className="w-4 h-4 text-emerald-400 animate-bounce"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        )}
      </div>

      {/* Floating Bottom HUD / Controller */}
      <div className="absolute bottom-8 inset-x-0 mx-auto max-w-xl px-4 z-30">
        <div className="bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-full px-5 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center justify-between gap-4">
          
          {/* Stage Buttons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {STAGES.map((s, idx) => {
              const isActive = activeStageIndex === idx;
              return (
                <button
                  key={s.id}
                  onClick={() => jumpToStage(idx)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full font-mono text-[11px] transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_15px_rgba(52,211,153,0.3)] font-semibold"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full transition-all ${
                      isActive ? "bg-emerald-400 scale-125" : "bg-zinc-600"
                    }`}
                  />
                  <span>{s.number}</span>
                </button>
              );
            })}
          </div>

          {/* Active Stage Label */}
          <div className="hidden sm:flex flex-col text-right">
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">
              CURRENT STAGE
            </span>
            <span className="text-xs font-mono font-medium text-white tracking-wide truncate max-w-[120px]">
              {STAGES[activeStageIndex].title}
            </span>
          </div>

          {/* Interactive Scrub Bar & Percentage */}
          <div className="flex items-center gap-3">
            <div
              onClick={handleScrubBarClick}
              className="w-16 sm:w-24 h-2 bg-white/10 hover:bg-white/20 rounded-full overflow-hidden cursor-pointer relative"
              title="Click to scrub"
            >
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-75 ease-out"
                style={{ width: `${displayProgress * 100}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-zinc-400 w-8 text-right">
              {Math.round(displayProgress * 100)}%
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}
