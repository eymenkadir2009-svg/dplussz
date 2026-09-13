export const SITE = {
  name: "Goothiah TV",
  logoUrl:
    "https://wad.nyc3.digitaloceanspaces.com/yourfiles/uploads/1a6555bcf5f72a1c43ad29a08e449432/Goothiah-removebg-preview-1.png",
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
