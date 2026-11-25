import { randomUUID } from 'node:crypto';
import { PRESET_ICONS } from '../../src/subscriptions/presetIcons.js';
import { BILLING_CYCLES, SUBSCRIPTION_CATEGORIES } from '../../src/subscriptions/subscriptionRecord.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^[1-9]\d{3}-\d{2}-\d{2}$/;
const DATA_URL = /^data:image\/(?:png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/;
const MAX_ICON_BYTES = 1024 * 1024;
const ICON_PRESETS = new Set(['auto', 'none', ...PRESET_ICONS.map(({ id }) => id)]);

function normalizeId(value, label) {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new TypeError(`${label} must be a UUID.`);
  }
  return value.toLowerCase();
}

function validateSubscription(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Subscription details must be an object.');
  }
  if ('id' in input || 'ownerId' in input) {
    throw new TypeError('The subscription ID and owner cannot be set in the subscription details.');
  }

  const { name, category, cost, billingCycle, nextRenewal, iconPreset = 'auto', icon = null } = input;
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName || Array.from(trimmedName).length > 120) {
    throw new TypeError('Subscription name must be 1–120 characters.');
  }
  if (!SUBSCRIPTION_CATEGORIES.includes(category) || !BILLING_CYCLES.includes(billingCycle)) {
    throw new TypeError('Choose a supported category and billing cycle.');
  }
  if (!Number.isFinite(cost) || cost <= 0 || cost > 9_999_999_999.99 || Number(cost.toFixed(2)) !== cost) {
    throw new TypeError('PHP cost must be between 0.01 and 9,999,999,999.99 with up to two decimal places.');
  }
  if (typeof nextRenewal !== 'string' || !ISO_DATE.test(nextRenewal)) {
    throw new TypeError('Renewal date must be a valid YYYY-MM-DD date.');
  }
  const date = new Date(`${nextRenewal}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== nextRenewal) {
    throw new TypeError('Renewal date must be a valid YYYY-MM-DD date.');
  }
  if (iconPreset === 'custom') {
    const payload = typeof icon === 'string' && icon.length <= 1_398_127 ? DATA_URL.exec(icon)?.[1] : undefined;
    if (!payload || payload.length % 4 !== 0 || Buffer.byteLength(payload, 'base64') > MAX_ICON_BYTES) {
      throw new TypeError('Custom icons must be PNG or JPEG data URLs up to 1 MiB.');
    }
  } else if (!ICON_PRESETS.has(iconPreset) || icon !== null) {
    throw new TypeError('Choose a supported icon preset or a custom icon.');
  }

  return { name: trimmedName, category, cost, billingCycle, nextRenewal, iconPreset, icon };
}

function subscriptionValues({ name, category, cost, billingCycle, nextRenewal, iconPreset, icon }) {
  return [name, category, cost.toFixed(2), billingCycle, nextRenewal, iconPreset, icon];
}

// Bind this store to the account ID from the trusted server session.
export function createSubscriptionStore(database, authenticatedOwnerId) {
  const ownerId = normalizeId(authenticatedOwnerId, 'Authenticated account ID');

  return {
    async list() {
      const [rows] = await database.execute(`
        SELECT BIN_TO_UUID(id) AS id, name, category, cost, billing_cycle AS billingCycle,
               DATE_FORMAT(next_renewal, '%Y-%m-%d') AS nextRenewal, icon_preset AS iconPreset, icon
        FROM subscriptions
        WHERE owner_id = UUID_TO_BIN(?)
        ORDER BY next_renewal, id
      `, [ownerId]);
      return rows.map((row) => ({ ...row, ownerId, cost: Number(row.cost) }));
    },

    async add(input) {
      const subscription = validateSubscription(input);
      const id = randomUUID();
      await database.execute(`
        INSERT INTO subscriptions (id, owner_id, name, category, cost, billing_cycle, next_renewal, icon_preset, icon)
        VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, ?)
      `, [id, ownerId, ...subscriptionValues(subscription)]);
      return { ...subscription, id, ownerId };
    },

    async edit(subscriptionId, input) {
      const id = normalizeId(subscriptionId, 'Subscription ID');
      const subscription = validateSubscription(input);
      // mysql2 reports matched rows with its default FOUND_ROWS client flag.
      const [result] = await database.execute(`
        UPDATE subscriptions
        SET name = ?, category = ?, cost = ?, billing_cycle = ?, next_renewal = ?, icon_preset = ?, icon = ?
        WHERE owner_id = UUID_TO_BIN(?) AND id = UUID_TO_BIN(?)
      `, [...subscriptionValues(subscription), ownerId, id]);
      return result.affectedRows ? { ...subscription, id, ownerId } : null;
    },

    async delete(subscriptionId) {
      const id = normalizeId(subscriptionId, 'Subscription ID');
      const [result] = await database.execute(`
        DELETE FROM subscriptions WHERE owner_id = UUID_TO_BIN(?) AND id = UUID_TO_BIN(?)
      `, [ownerId, id]);
      return result.affectedRows === 1;
    },
  };
}
