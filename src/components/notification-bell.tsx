"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";

export interface Notification {
  id: string;
  movieId: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

// Sample notification feed — in a real app this would come from an API.
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    movieId: "midnight-protocol",
    title: "New chapter available",
    body: "Midnight Protocol — Chapter 8 is now streaming.",
    time: "2h ago",
    unread: true,
  },
  {
    id: "n2",
    movieId: "neon-requiem",
    title: "New release",
    body: "Neon Requiem — Director's Cut has arrived.",
    time: "6h ago",
    unread: true,
  },
  {
    id: "n3",
    movieId: "the-frost-king",
    title: "Coming soon",
    body: "The Frost King returns next month with a brand new season.",
    time: "1d ago",
    unread: true,
  },
  {
    id: "n4",
    movieId: "shadow-empire",
    title: "Top 10 today",
    body: "Shadow Empire is trending in your region.",
    time: "2d ago",
    unread: false,
  },
  {
    id: "n5",
    movieId: "echoes-of-tomorrow",
    title: "Continue watching",
    body: "You left off at Echoes of Tomorrow — Chapter 4.",
    time: "3d ago",
    unread: false,
  },
];

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = "" }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(
    INITIAL_NOTIFICATIONS,
  );
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-neutral-300 hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 max-w-[90vw] bg-neutral-950 ring-1 ring-white/10 rounded-lg shadow-2xl shadow-black/60 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-[10px] text-neutral-400">
                  {unreadCount} new
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-neutral-400 hover:text-white transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[60vh] overflow-y-auto dsz-scroll">
            {notifications.length === 0 && (
              <div className="px-4 py-10 text-center text-neutral-500 text-sm">
                No notifications yet
              </div>
            )}
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={`/video?id=${n.movieId}`}
                onClick={() => {
                  setNotifications((prev) =>
                    prev.map((x) =>
                      x.id === n.id ? { ...x, unread: false } : x,
                    ),
                  );
                  setOpen(false);
                }}
                className={`group flex items-start gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors relative ${
                  n.unread ? "bg-white/[0.03]" : ""
                }`}
              >
                {n.unread && (
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-red-500" />
                )}
                <div className="flex-1 min-w-0 pl-2">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <p className="text-[11px] uppercase tracking-wider text-neutral-400">
                      {n.title}
                    </p>
                    <span className="text-[10px] text-neutral-500 shrink-0">
                      {n.time}
                    </span>
                  </div>
                  <p className="text-sm text-white leading-snug line-clamp-2">
                    {n.body}
                  </p>
                </div>
                <button
                  aria-label="Dismiss"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dismiss(n.id);
                  }}
                  className="shrink-0 p-1 text-neutral-500 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </Link>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/5 text-center">
            <button
              onClick={() => setOpen(false)}
              className="text-[11px] text-neutral-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
