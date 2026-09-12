"use client";

import { Suspense } from "react";
import VideoClient from "./video-client";

export default function VideoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <VideoClient />
    </Suspense>
  );
}
