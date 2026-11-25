import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateSubscriptionFields } from '../src/subscriptions/subscriptionRecord.js';

const valid = {
  name: 'Music plan', category: 'Music & Audio', cost: 149.25,
  billingCycle: 'Monthly', nextRenewal: '2028-02-29',
};

test('accepts valid subscriptions, including leap day and the PHP amount limits', () => {
  for (const cost of [0.01, valid.cost, 9_999_999_999.99]) {
    assert.deepEqual(validateSubscriptionFields({ ...valid, cost }), {});
  }
});

test('provides an error for every invalid subscription field', () => {
  const errors = validateSubscriptionFields({
    name: '  ', category: 'Unlisted', cost: 0, billingCycle: 'Weekly', nextRenewal: '',
  });
  assert.deepEqual(Object.keys(errors), ['name', 'category', 'cost', 'billingCycle', 'nextRenewal']);
  assert.ok(validateSubscriptionFields({ ...valid, name: 'a'.repeat(121) }).name);
});

test('rejects invalid billing amounts and calendar dates', () => {
  for (const cost of [-1, 149.251, Infinity, '149.25', 10_000_000_000]) {
    assert.ok(validateSubscriptionFields({ ...valid, cost }).cost);
  }
  for (const nextRenewal of ['2027-02-29', '2028-04-31', '2028-13-01', '0999-12-31', 'Feb 29, 2028']) {
    assert.ok(validateSubscriptionFields({ ...valid, nextRenewal }).nextRenewal);
  }
});
