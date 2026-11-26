# Dashboard UI refresh verification

Branch: `feature/dashboard-ui-refresh`, based on merged `main` at `6f84421`.
Design reference: the supplied `subsave-mockup.html`.

## Automated checks

Run `npm test`, `npm run lint`, and `npm run build`.
The dashboard suite covers monthly/yearly normalization, grouped category totals,
chronological renewal selection, overdue dates, calendar-day comparisons, badge
thresholds, invalid dates, and empty data.

## Manual browser checks

- Check the layout at 1440px, 1024px, 768px, 390px, and 320px. The sidebar should
  move below subscriptions on tablets and stack on mobile. Confirm no horizontal
  scrolling, clipped prices, or hidden account buttons.
- Compare the gradient expense card, logo, category colors,
  doughnut chart, and renewal timeline with the reference.
- Open **Add Subscription** and save a monthly subscription with a custom icon.
  Confirm the card, count, total, chart, and timeline update together.
- In the add form, enter Spotify, Netflix, GitHub, or Google One names with
  **Automatic** selected and check the preview. Try an unrelated name and check
  the initial fallback.
- Choose each explicit preset with a custom subscription name. Save and confirm
  the chosen icon appears. Try **No icon**, a custom upload, and icon removal.
  Switching presets or closing the form while an upload reads must not restore
  the old upload. Reopening the form should reset the choice to **Automatic**.
- Add a yearly subscription costing 1200. Its card should show 1200 per year;
  the monthly total/category should increase by 100 and the annual estimate by 1200.
- Add dates for yesterday, today, tomorrow, in five days, and in ten days. Check
  overdue/today/tomorrow wording, red/amber/green badges, chronological ordering,
  and that overdue records do not become the next future renewal.
- Open **Your account**, then use the SubSave logo or **Back to dashboard** to
  return to the dashboard. Check the logo and account menu with keyboard and touch.
- Confirm login/logout, account editing, and refresh persistence. Check
  add-form validation, cancel/reset, and icon removal.
- Google Fonts should load when online; with fonts blocked the system fallbacks
  should keep the layout usable. Check for browser-console errors.

## Demo Mode

Open SubSave using the usual [startup steps](../README.md). Sign in and add a
test subscription that renews on December 15, 2026. Open the account menu and
choose **Demo Mode**. Pick each date in the calendar card.

| Simulated date | Expected result |
| --- | --- |
| December 11 | The card has its regular styling and the amber **In 4 days** badge. |
| December 12 | The card turns red and appears in **Due soon** with **In 3 days**. |
| December 15 | The card stays in **Due soon** and **Upcoming renewals**, and its badge reads **Today**. |
| December 16 | The card moves to **Overdue** with **1 day overdue** and leaves **Upcoming renewals**. |

Use **Reset to today** to restore the real date. Select **Demo Mode** again to hide
the card. Turn it on, pick another date, and refresh. The mode should turn off and
the saved renewal date should still be December 15.
