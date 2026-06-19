"use client";

import { useRef } from "react";
import { Check, Upload, Trash2, RotateCcw, Sun, Aperture } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useToast } from "@/stores/use-toast-store";
import {
  WISDOM_BACKGROUNDS,
  CUSTOM_IMAGE_ACCEPT,
  CUSTOM_IMAGE_TYPES,
  CUSTOM_IMAGE_MAX_BYTES,
} from "../data/backgrounds";
import {
  useWisdomBackgroundStore,
  useWisdomBackgroundActions,
} from "@/stores/use-wisdom-background-store";

interface BackgroundSelectorProps {
  onClose: () => void;
}

export function BackgroundSelector({ onClose }: BackgroundSelectorProps) {
  const { selection, customImage, darkness, blur } = useWisdomBackgroundStore();
  const {
    setBackground,
    setCustomImage,
    clearCustomImage,
    setDarkness,
    setBlur,
    reset,
  } = useWisdomBackgroundActions();
  const addToast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;

    if (!CUSTOM_IMAGE_TYPES.includes(file.type)) {
      addToast("Please choose a JPG, PNG, or WEBP image", "error");
      return;
    }
    if (file.size > CUSTOM_IMAGE_MAX_BYTES) {
      addToast("Image must be 5MB or smaller", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCustomImage(reader.result as string);
      addToast("Custom background applied", "success");
    };
    reader.onerror = () => addToast("Couldn't read that image", "error");
    reader.readAsDataURL(file);
  };

  return (
    <Modal
      title="Daily Wisdom Background"
      description="A small peaceful corner inside JMind."
      onClose={onClose}
      className="max-w-lg"
    >
      <div className="flex flex-col gap-6">
        {/* Preset grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {WISDOM_BACKGROUNDS.map((bg) => {
            const isActive = selection === bg.id;
            const Icon = bg.icon;
            return (
              <button
                key={bg.id}
                type="button"
                onClick={() => setBackground(bg.id)}
                aria-pressed={isActive}
                className={cn(
                  "group relative aspect-video overflow-hidden rounded-xl border text-left transition-all",
                  isActive
                    ? "border-transparent ring-2 ring-offset-2 ring-offset-zinc-900"
                    : "border-white/10 hover:border-white/25"
                )}
                style={
                  isActive
                    ? ({ "--tw-ring-color": bg.tint } as React.CSSProperties)
                    : undefined
                }
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{
                    background: bg.gradient,
                    backgroundImage: `url("${bg.image}"), ${bg.gradient}`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-2.5">
                  <span className="flex items-center gap-1.5">
                    <Icon size={12} className="text-white/90 drop-shadow" />
                    <span className="text-[11px] font-semibold text-white/95 drop-shadow">
                      {bg.label}
                    </span>
                  </span>
                  <span className="text-[9px] leading-tight text-white/60 drop-shadow">
                    {bg.scene.mood}
                  </span>
                </div>
                {isActive && (
                  <span
                    className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-zinc-950 shadow-lg"
                    style={{ backgroundColor: bg.tint }}
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}

          {/* Custom slot mirrors the preset tiles */}
          <button
            type="button"
            onClick={() =>
              customImage ? setBackground("custom") : fileInputRef.current?.click()
            }
            aria-pressed={selection === "custom"}
            className={cn(
              "group relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border transition-all",
              selection === "custom"
                ? "border-emerald-400/60 ring-2 ring-emerald-400/40 ring-offset-2 ring-offset-zinc-900"
                : "border-dashed border-white/15 hover:border-white/30"
            )}
          >
            {customImage ? (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url("${customImage}")` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-2 text-[11px] font-semibold text-white/95 drop-shadow">
                  Custom
                </span>
                {selection === "custom" && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-zinc-950 shadow-lg">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 text-zinc-500 transition-colors group-hover:text-zinc-300">
                <Upload size={16} />
                <span className="text-[11px] font-medium">Upload</span>
              </div>
            )}
          </button>
        </div>

        {/* Upload controls */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <div className="flex flex-col">
            <span className="text-[12px] font-semibold text-zinc-300">
              Upload custom image
            </span>
            <span className="text-[11px] text-zinc-500">
              JPG, PNG or WEBP · max 5MB · 16:9 (1920×1080) recommended
            </span>
          </div>
          <div className="flex items-center gap-2">
            {customImage && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-zinc-500 hover:text-rose-400"
                onClick={() => {
                  clearCustomImage();
                  addToast("Custom image removed", "info");
                }}
                title="Remove custom image"
              >
                <Trash2 size={14} />
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </Button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={CUSTOM_IMAGE_ACCEPT}
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        {/* Overlay controls */}
        <div className="flex flex-col gap-4 border-t border-white/5 pt-5">
          <SliderRow
            icon={<Sun size={13} />}
            label="Background darkness"
            value={darkness}
            min={0}
            max={100}
            suffix="%"
            onChange={setDarkness}
          />
          <SliderRow
            icon={<Aperture size={13} />}
            label="Blur"
            value={blur}
            min={0}
            max={20}
            suffix="px"
            onChange={setBlur}
          />
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              reset();
              addToast("Reset to defaults", "info");
            }}
          >
            <RotateCcw size={13} />
            Reset
          </Button>
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface SliderRowProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
}

function SliderRow({ icon, label, value, min, max, suffix, onChange }: SliderRowProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-[12px]">
        <span className="flex items-center gap-1.5 font-medium text-zinc-300">
          <span className="text-zinc-500">{icon}</span>
          {label}
        </span>
        <span className="font-mono text-[11px] tabular-nums text-zinc-500">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-emerald-400"
      />
    </div>
  );
}
