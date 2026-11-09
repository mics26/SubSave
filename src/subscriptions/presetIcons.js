export const PRESET_ICONS = [
  { id: 'spotify', label: 'Spotify', src: new URL('../assets/brands/spotify.svg', import.meta.url).href, match: /^spotify\b/i },
  { id: 'netflix', label: 'Netflix', src: new URL('../assets/brands/netflix.svg', import.meta.url).href, match: /^netflix\b/i },
  { id: 'github', label: 'GitHub', src: new URL('../assets/brands/github.svg', import.meta.url).href, match: /^git\s*hub\b/i },
  { id: 'google-one', label: 'Google One', src: new URL('../assets/brands/google-one.svg', import.meta.url).href, match: /^google\s*one\b/i },
];

export function getSubscriptionIcon({ name = '', icon, iconPreset = 'auto' }) {
  if (icon) return icon;
  if (iconPreset === 'none') return undefined;
  const preset = iconPreset === 'auto'
    ? PRESET_ICONS.find((item) => item.match.test(name.trim()))
    : PRESET_ICONS.find((item) => item.id === iconPreset);
  return preset?.src;
}
