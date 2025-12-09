/**
 * Generates a consistent pastel HSL color based on a string input.
 * The same string will always produce the same color.
 */
export function getStringColor(str: string): string {
  // Generate a hash from the string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use the hash to generate a hue (0-360)
  const hue = Math.abs(hash) % 360;
  
  // Pastel colors: high lightness (85-92%), moderate saturation (45-65%)
  const saturation = 45 + (Math.abs(hash >> 8) % 20); // 45-65%
  const lightness = 85 + (Math.abs(hash >> 16) % 7);  // 85-92%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Returns a contrasting text color (dark) for readability on pastel backgrounds.
 */
export function getContrastTextColor(): string {
  return "hsl(0, 0%, 15%)"; // Dark gray for readability
}
