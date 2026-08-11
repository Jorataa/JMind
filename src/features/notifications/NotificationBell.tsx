"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  useNotifications,
  useNotificationActions,
  useNotificationStore,
} from "@/stores/use-notification-store";
import { FeedbackModal } from "./FeedbackModal";
import { formatRelativeTime } from "@/lib/format-date";
import { Bell, CheckCheck, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/hooks/use-hydrated";

export function NotificationBell() {
  const hydrated = useHydrated();
  const notifications = useNotifications();
  const unreadCount = useNotificationStore((state) => state.unreadCount());
  const { markAllAsRead, markAsRead, removeNotification, dismissFeedbackPrompt } =
    useNotificationActions();

  const [open, setOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackInitialCategory, setFeedbackInitialCategory] = useState("Idea");
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Position popover anchored directly below the bell trigger
  const updateCoords = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const popoverWidth = 330;
    
    // Position below bell trigger, clamped inside viewport bounds
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - popoverWidth - 12));
    const top = Math.min(rect.bottom + 8, window.innerHeight - 440);

    setCoords({ top, left });
  };

  const handleToggle = () => {
    if (!open) {
      updateCoords();
    }
    setOpen((prev) => !prev);
  };

  // Close popover on outside click, window resize, or Escape
  useEffect(() => {
    if (!open) return;

    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    const handleResize = () => {
      updateCoords();
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
      window.removeEventListener("resize", handleResize);
    };
  }, [open]);

  const openFeedback = (category = "Idea") => {
    setFeedbackInitialCategory(category);
    setFeedbackModalOpen(true);
    setOpen(false);
  };

  const popoverContent = open && (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Notifications Panel"
      style={{
        position: "fixed",
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 150,
      }}
      className="w-[330px] max-w-[calc(100vw-24px)] rounded-card border border-line-hair bg-card shadow-float-3 text-ink-700 font-sans"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line-hair px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-serif text-[16px] font-normal text-ink-900">Notifications</span>
          {hydrated && unreadCount > 0 && (
            <span className="rounded-full bg-sage-surface px-2 py-0.5 font-mono text-[10.5px] font-medium text-green-800">
              {unreadCount} new
            </span>
          )}
        </div>

        {hydrated && unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-[11.5px] text-ink-600 hover:text-ink-900 transition-colors"
            title="Mark all notifications as read"
          >
            <CheckCheck size={13} />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="custom-scrollbar max-h-[260px] overflow-y-auto divide-y divide-line-soft">
        {!hydrated || notifications.length === 0 ? (
          <div className="p-6 text-center text-[13px] text-ink-500">
            No new notifications
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => markAsRead(item.id)}
              className={cn(
                "group relative flex flex-col gap-1 p-3.5 text-[13px] transition-colors cursor-pointer",
                !item.read ? "bg-sunken/40" : "hover:bg-sunken/20"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 font-medium text-ink-900 text-[13px]">
                  {!item.read && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                  )}
                  <span>{item.title}</span>
                </div>

                <span className="shrink-0 font-mono text-[10.5px] text-ink-400">
                  {formatRelativeTime(item.timestamp)}
                </span>
              </div>

              <p className="text-[12.5px] leading-relaxed text-ink-600 pl-3.5">
                {item.message}
              </p>

              {/* Feedback prompt notification actions */}
              {item.type === "prompt" && (
                <div className="mt-2.5 flex items-center gap-2 pl-3.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openFeedback("Improvement");
                    }}
                    className="rounded-full bg-evergreen-950 px-3 py-1 text-[12px] font-medium text-white hover:bg-evergreen-900 transition-colors"
                  >
                    Share feedback
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissFeedbackPrompt();
                    }}
                    className="rounded-full border border-line-hair px-3 py-1 text-[12px] text-ink-600 hover:text-ink-900 transition-colors"
                  >
                    Not now
                  </button>
                </div>
              )}

              {/* Dismiss button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(item.id);
                }}
                className="absolute right-3 top-3 hidden rounded p-0.5 text-ink-400 hover:text-ink-900 group-hover:block"
                title="Dismiss notification"
              >
                <X size={13} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Visually Secondary Feedback Entry Point */}
      <div className="border-t border-line-hair bg-card/60 p-4 rounded-b-card">
        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-medium text-ink-900">Help improve Jorata</p>
          <p className="text-[12px] leading-relaxed text-ink-600">
            Have an idea, found something confusing, or want a feature?
          </p>
          <button
            type="button"
            onClick={() => openFeedback("Idea")}
            className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-green-800 hover:underline"
          >
            Share feedback <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Bell Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-[11px] text-rail-muted transition-colors hover:bg-[rgba(233,237,224,0.07)] hover:text-rail-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
          open && "bg-[rgba(233,237,224,0.09)] text-rail-bright"
        )}
        aria-label="Notifications"
        title="Notifications & Feedback"
      >
        <Bell size={17} />
        {hydrated && unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-ochre-500 ring-2 ring-evergreen-950" />
        )}
      </button>

      {/* Portal Popover Panel to document.body to avoid parent overflow:hidden clipping */}
      {hydrated && open && createPortal(popoverContent, document.body)}

      {/* Shared Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        initialCategory={feedbackInitialCategory}
      />
    </>
  );
}
