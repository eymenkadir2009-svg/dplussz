"use client";

import { Suspense } from "react";
import WatchClient from "./watch-client";

export default function WatchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <WatchClient />
    </Suspense>
  );
}
