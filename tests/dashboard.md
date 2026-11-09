# Dashboard UI refresh verification

Branch: `feature/dashboard-ui-refresh`, based on merged `main` at `6f84421`.
Design reference: the supplied `subsave-mockup.html`.

## Automated checks

Run `npm test`, `npm run lint`, and `npm run build`.
The dashboard suite covers monthly/yearly normalization, grouped category totals,
chronological renewal selection, overdue dates, calendar-day comparisons, badge
thresholds, invalid dates, and empty data. The account regression suite remains.

## Manual browser checks

Browser testing is left to the user, as requested earlier in this session.

- Check the layout at 1440px, 1024px, 768px, 390px, and 320px. The sidebar should
  move below subscriptions on tablets and stack on mobile. Confirm no horizontal
  scrolling, clipped prices, or hidden account buttons.
- Compare the gradient expense card, logo, navigation tabs, category colors,
  doughnut chart, and renewal timeline with the reference.
- Open **Add Subscription** and save a monthly subscription with a custom icon.
  Confirm the card, count, total, chart, and timeline update together.
- Add a yearly subscription costing 1200. Its card should show 1200 per year;
  the monthly total/category should increase by 100 and the annual estimate by 1200.
- Add dates for yesterday, today, tomorrow, in five days, and in ten days. Check
  overdue/today/tomorrow wording, red/amber/green badges, chronological ordering,
  and that overdue records do not become the next future renewal.
- Confirm **Subscriptions** scrolls to the cards and **Reports** to the category
  breakdown, including when opened from the account page. The logo returns to
  the dashboard. Check keyboard focus and reduced-motion behavior.
- Confirm login/logout, account editing, refresh persistence, and password
  recovery still work. Check add-form validation, cancel/reset, and icon removal.
- Google Fonts should load when online; with fonts blocked the system fallbacks
  should keep the layout usable. Check for browser-console errors.

Subscriptions still live in React state and reset on refresh, matching the
merged implementation. Account persistence is unchanged. No local-demo notice
has been added to the UI.
