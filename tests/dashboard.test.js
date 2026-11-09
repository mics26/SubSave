import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildDashboard, parseRenewalDate, renewalStatus } from '../src/dashboard/dashboardModel.js';

const subscription = (id, nextRenewal, overrides = {}) => ({
  id, name: id, category: 'General', cost: 100, billingCycle: 'Monthly', nextRenewal, ...overrides,
});

test('next renewal and timeline use chronological future dates while preserving overdue dates', () => {
  const source = [
    subscription('later', 'Nov 24, 2026'),
    subscription('overdue', 'Nov 05, 2026'),
    subscription('next', 'Nov 12, 2026'),
  ];
  const result = buildDashboard(source, new Date(2026, 10, 9));
  assert.equal(result.nextUpcoming.id, 'next');
  assert.deepEqual(result.upcoming.map((entry) => entry.id), ['next', 'later']);
  assert.equal(result.overdueCount, 1);
  assert.equal(result.entries[0].daysUntil, -4);
  assert.equal(result.entries[0].status.label, '4 days overdue');
  assert.deepEqual(source.map((entry) => entry.id), ['later', 'overdue', 'next']);
});

test('monthly totals and category shares normalize yearly costs and combine matching categories', () => {
  const result = buildDashboard([
    subscription('monthly', '2026-11-12', { cost: 100, category: 'Productivity' }),
    subscription('annual', '2027-11-12', { cost: 2400, billingCycle: 'Yearly', category: 'Productivity' }),
    subscription('other', '2026-12-01', { cost: 50, category: 'Entertainment' }),
  ], new Date(2026, 10, 9));
  assert.equal(result.totalMonthly, 350);
  assert.equal(result.categories.length, 2);
  assert.equal(result.categories[0].cost, 300);
  assert.equal(result.categories[0].name, 'Productivity');
  assert.equal(result.largest.id, 'annual');
  assert.equal(result.largest.monthlyCost, 200);
  assert.equal(result.largest.cost, 2400);
});

test('relative dates compare local calendar days rather than the current time of day', () => {
  const result = buildDashboard([
    subscription('today', '2026-11-09'), subscription('tomorrow', '2026-11-10'),
  ], new Date(2026, 10, 9, 23, 59));
  assert.equal(result.nextUpcoming.id, 'today');
  assert.equal(result.entries[0].daysUntil, 0);
  assert.equal(result.entries[1].daysUntil, 1);
  // The US DST transition is November 1; elapsed-hour rounding must not matter.
  const dst = buildDashboard([subscription('after-dst', '2026-11-02')], new Date(2026, 9, 31, 23));
  assert.equal(dst.nextUpcoming.daysUntil, 2);
});

test('renewal badges distinguish overdue, today, tomorrow, urgent, soon, and later dates', () => {
  assert.deepEqual(renewalStatus(-1), { tone: 'urgent', label: '1 day overdue' });
  assert.deepEqual(renewalStatus(0), { tone: 'urgent', label: 'Today' });
  assert.deepEqual(renewalStatus(1), { tone: 'urgent', label: 'Tomorrow' });
  assert.equal(renewalStatus(3).tone, 'urgent');
  assert.equal(renewalStatus(4).tone, 'soon');
  assert.equal(renewalStatus(7).tone, 'soon');
  assert.equal(renewalStatus(8).tone, 'ok');
});

test('handles empty lists, all-past renewals, and invalid dates without selecting a fake next renewal', () => {
  const empty = buildDashboard([], new Date(2026, 10, 9));
  assert.equal(empty.totalMonthly, 0);
  assert.equal(empty.nextUpcoming, null);
  assert.equal(empty.largest, null);
  assert.deepEqual(empty.categories, []);
  const result = buildDashboard([
    subscription('past', '2026-01-01'), subscription('invalid', 'not-a-date'),
  ], new Date(2026, 10, 9));
  assert.equal(result.nextUpcoming, null);
  assert.equal(result.upcoming.length, 0);
  assert.equal(result.entries[1].status.tone, 'neutral');
  assert.equal(result.totalMonthly, 200);
});

test('parses existing and ISO dates locally and rejects impossible dates', () => {
  assert.equal(parseRenewalDate('Nov 12, 2026').getDate(), 12);
  assert.equal(parseRenewalDate('2026-11-12').getMonth(), 10);
  assert.equal(parseRenewalDate('2024-02-29').getDate(), 29);
  for (const value of ['2026-02-29', '2026-13-01', '2026-11-31', 'Foo 12, 2026', '']) {
    assert.equal(parseRenewalDate(value), null);
  }
});
