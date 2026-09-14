"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for offline support.
 * Mounted once in the root layout.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
      } catch {
        // Service worker registration failed — silently ignore
      }
    };

    // Register after page load to not block initial render
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
