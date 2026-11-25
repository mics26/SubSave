import { randomUUID } from 'node:crypto';
import { PRESET_ICONS } from '../../src/subscriptions/presetIcons.js';
import { MAX_SUBSCRIPTION_ICON_BYTES, validateSubscriptionFields } from '../../src/subscriptions/subscriptionRecord.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATA_URL = /^data:image\/(?:png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/;
const MAX_ICON_DATA_URL_LENGTH = Math.ceil(MAX_SUBSCRIPTION_ICON_BYTES / 3) * 4 + 'data:image/jpeg;base64,'.length;
const ICON_PRESETS = new Set(['auto', 'none', ...PRESET_ICONS.map(({ id }) => id)]);

export class SubscriptionInputError extends TypeError {}

function normalizeId(value, label) {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new SubscriptionInputError(`${label} must be a UUID.`);
  }
  return value.toLowerCase();
}

function validateSubscription(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new SubscriptionInputError('Subscription details must be an object.');
  }
  if ('id' in input || 'ownerId' in input) {
    throw new SubscriptionInputError('The subscription ID and owner cannot be set in the subscription details.');
  }

  const { name, category, cost, billingCycle, nextRenewal, iconPreset = 'auto', icon = null } = input;
  const [fieldError] = Object.values(validateSubscriptionFields(input));
  if (fieldError) throw new SubscriptionInputError(fieldError);
  if (iconPreset === 'custom') {
    const payload = typeof icon === 'string' && icon.length <= MAX_ICON_DATA_URL_LENGTH ? DATA_URL.exec(icon)?.[1] : undefined;
    if (!payload || payload.length % 4 !== 0 || Buffer.byteLength(payload, 'base64') > MAX_SUBSCRIPTION_ICON_BYTES) {
      throw new SubscriptionInputError('Custom icons must be PNG or JPEG data URLs up to 1 MiB.');
    }
  } else if (!ICON_PRESETS.has(iconPreset) || icon !== null) {
    throw new SubscriptionInputError('Choose a supported icon preset or a custom icon.');
  }

  return { name: name.trim(), category, cost, billingCycle, nextRenewal, iconPreset, icon };
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
