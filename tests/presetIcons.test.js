import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { getSubscriptionIcon, PRESET_ICONS } from '../src/subscriptions/presetIcons.js';

test('automatically matches supported service names while keeping unrelated names as initials', () => {
  for (const [name, id] of [[' Spotify Premium ', 'spotify'], ['NETFLIX Standard', 'netflix'], ['GitHub Pro', 'github'], ['Google One (100GB)', 'google-one']]) {
    assert.equal(getSubscriptionIcon({ name }), PRESET_ICONS.find((preset) => preset.id === id).src);
  }
  for (const name of ['', 'Google Drive', 'My Netflix alternative', 'Spotifyish', 'Canva Pro']) {
    assert.equal(getSubscriptionIcon({ name }), undefined);
  }
});

test('explicit presets and uploaded images override automatic matching and no-icon disables it', () => {
  const spotify = PRESET_ICONS.find((preset) => preset.id === 'spotify').src;
  assert.equal(getSubscriptionIcon({ name: 'My music plan', iconPreset: 'spotify' }), spotify);
  assert.equal(getSubscriptionIcon({ name: 'Spotify Premium', iconPreset: 'none' }), undefined);
  assert.equal(getSubscriptionIcon({ name: 'Spotify Premium', iconPreset: 'unknown' }), undefined);
  assert.equal(getSubscriptionIcon({ name: 'Spotify', iconPreset: 'spotify', icon: 'data:image/png;base64,custom' }), 'data:image/png;base64,custom');
});

test('all preset assets are local SVGs with no scripts or external resource references', () => {
  assert.equal(PRESET_ICONS.length, 4);
  for (const preset of PRESET_ICONS) {
    const svg = readFileSync(new URL(preset.src), 'utf8');
    assert.match(svg, /<svg[\s>]/);
    assert.match(svg, /viewBox=/);
    assert.doesNotMatch(svg, /<script|<foreignObject|\bon\w+=|(?:href|src)=/i);
  }
});
