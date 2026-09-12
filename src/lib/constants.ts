export const SITE = {
  name: "D+SZ",
  logoUrl:
    "https://wad.nyc3.digitaloceanspaces.com/yourfiles/uploads/c88918a7996db3a88593b37770f73fd5/S-13-1.png",
  tagline: "Stream the stories you love.",
};

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}
