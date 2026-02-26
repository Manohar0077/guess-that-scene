/**
 * Photo library for the guessing game.
 * Each entry has a `src` (image URL or path) and `answer` (the person's name).
 * 
 * To add your own photos:
 * 1. Place images in the `public/photos/` folder
 * 2. Name them with the person's name (e.g., "John.jpg", "Sarah.png")
 * 3. Add entries below
 * 
 * For now, we use placeholder URLs. Replace with your own photos!
 */

export interface PhotoEntry {
  src: string;
  answer: string;
}

const photoLibrary: PhotoEntry[] = [
  { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop", answer: "alex" },
  { src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=400&fit=crop", answer: "sarah" },
  { src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=400&fit=crop", answer: "mike" },
  { src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=400&fit=crop", answer: "emma" },
  { src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=400&fit=crop", answer: "david" },
  { src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=400&fit=crop", answer: "lily" },
];

export function getRandomPhotos(count: number): PhotoEntry[] {
  const shuffled = [...photoLibrary].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export default photoLibrary;
