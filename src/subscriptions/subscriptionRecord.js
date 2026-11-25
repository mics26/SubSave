export const SUBSCRIPTION_CATEGORIES = Object.freeze([
  'Entertainment',
  'Music & Audio',
  'Developer Tools',
  'Cloud Storage',
  'Productivity',
  'General',
]);

export const BILLING_CYCLES = Object.freeze(['Monthly', 'Yearly']);
export const MAX_SUBSCRIPTION_ICON_BYTES = 1024 * 1024;

function isRenewalDate(value) {
  if (typeof value !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateSubscriptionFields({ name, category, cost, billingCycle, nextRenewal }) {
  const errors = {};
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName || Array.from(trimmedName).length > 120) {
    errors.name = 'Subscription name must be 1–120 characters.';
  }
  if (!SUBSCRIPTION_CATEGORIES.includes(category)) errors.category = 'Choose a supported category.';
  if (!Number.isFinite(cost) || cost <= 0 || cost > 9_999_999_999.99 || Number(cost.toFixed(2)) !== cost) {
    errors.cost = 'PHP cost must be between 0.01 and 9,999,999,999.99 with up to two decimal places.';
  }
  if (!BILLING_CYCLES.includes(billingCycle)) errors.billingCycle = 'Choose a supported billing cycle.';
  if (!isRenewalDate(nextRenewal)) errors.nextRenewal = 'Renewal date must be a valid YYYY-MM-DD date.';
  return errors;
}
