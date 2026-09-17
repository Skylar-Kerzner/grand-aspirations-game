const jpgImages = import.meta.glob("/src/assets/game/*.jpg", { eager: true, import: "default" });
const pngImages = import.meta.glob("/src/assets/game/*.png", { eager: true, import: "default" });

const allImages: Record<string, string> = {};
for (const [path, url] of Object.entries(jpgImages)) {
  const name = path.split("/").pop()?.replace(".jpg", "") || "";
  allImages[name] = url as string;
}
for (const [path, url] of Object.entries(pngImages)) {
  const name = path.split("/").pop()?.replace(".png", "") || "";
  allImages[name] = url as string;
}

export function getImage(name: string): string {
  return allImages[name] || "";
}

export function hasImage(name: string): boolean {
  return Boolean(allImages[name]);
}

/** First artwork key that actually exists, so missing variants fall back gracefully. */
export function pickImage(...names: string[]): string {
  return names.find((name) => name && allImages[name]) || "";
}
