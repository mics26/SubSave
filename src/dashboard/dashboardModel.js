const CATEGORY_COLORS = {
  'Music & Audio': '#8b5cf6',
  Entertainment: '#e5484d',
  'Developer Tools': '#475569',
  'Cloud Storage': '#3b82f6',
  Productivity: '#d97706',
  General: '#059669',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const RENEWAL_WARNING_DAYS = 3;
const dayNumber = (date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000;

export const formatMoney = (amount) => new Intl.NumberFormat('en-PH', {
  style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(amount);

export function formatCalendarDate(date) {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseRenewalDate(value) {
  // Support legacy formatted dates and ISO date-only records.
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const legacy = /^([A-Z][a-z]{2}) (\d{2}), (\d{4})$/.exec(value);
  if (!iso && !legacy) return null;
  const year = Number(iso ? iso[1] : legacy[3]);
  const month = iso ? Number(iso[2]) - 1 : MONTHS.indexOf(legacy[1]);
  const day = Number(iso ? iso[3] : legacy[2]);
  const date = new Date(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? date : null;
}

export function renewalStatus(days) {
  if (days === null) return { tone: 'neutral', label: 'Date unavailable' };
  if (days < 0) return { tone: 'urgent', label: `${Math.abs(days)} ${days === -1 ? 'day' : 'days'} overdue` };
  if (days === 0) return { tone: 'urgent', label: 'Today' };
  if (days === 1) return { tone: 'urgent', label: 'Tomorrow' };
  return { tone: days <= RENEWAL_WARNING_DAYS ? 'urgent' : days <= 7 ? 'soon' : 'ok', label: `In ${days} days` };
}

export function buildDashboard(subscriptions, today = new Date()) {
  const categories = new Map();
  const entries = subscriptions.map((subscription) => {
    const date = parseRenewalDate(subscription.nextRenewal);
    const daysUntil = date ? dayNumber(date) - dayNumber(today) : null;
    let warning = null;
    if (daysUntil !== null && daysUntil <= RENEWAL_WARNING_DAYS) {
      warning = daysUntil < 0 ? 'overdue' : 'due-soon';
    }
    const monthlyCost = subscription.billingCycle === 'Yearly' ? subscription.cost / 12 : subscription.cost;
    const color = CATEGORY_COLORS[subscription.category] || CATEGORY_COLORS.General;
    const category = categories.get(subscription.category) || { name: subscription.category, cost: 0, color };
    category.cost += monthlyCost;
    categories.set(subscription.category, category);
    return { ...subscription, date, daysUntil, monthlyCost, color, warning, status: renewalStatus(daysUntil) };
  }).sort((a, b) => (a.date?.getTime() ?? Infinity) - (b.date?.getTime() ?? Infinity));
  const totalMonthly = entries.reduce((sum, entry) => sum + entry.monthlyCost, 0);
  const upcoming = entries.filter((entry) => entry.daysUntil !== null && entry.daysUntil >= 0);
  const dueSoon = upcoming.filter((entry) => entry.warning === 'due-soon');
  const overdue = entries.filter((entry) => entry.warning === 'overdue');
  const largest = entries.reduce((biggest, entry) => !biggest || entry.monthlyCost > biggest.monthlyCost ? entry : biggest, null);
  return {
    entries, upcoming, dueSoon, overdue, totalMonthly, largest,
    nextUpcoming: upcoming[0] || null,
    categories: [...categories.values()].sort((a, b) => b.cost - a.cost),
  };
}
