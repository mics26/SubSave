import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { createPool } from 'mysql2/promise';
import { createSubscriptionStore } from '../../server/subscriptions/subscriptionStore.js';

const annualPlan = {
  name: 'Dropbox Plus', category: 'Cloud Storage', cost: 1200.25,
  billingCycle: 'Yearly', nextRenewal: '2028-02-29', iconPreset: 'none', icon: null,
};

test('MySQL subscription operations isolate two application accounts', async (t) => {
  const url = process.env.SUBSAVE_MYSQL_TEST_URL;
  assert.ok(url, 'Set SUBSAVE_MYSQL_TEST_URL for a MySQL test schema with migration 001 applied.');

  const database = createPool(url);
  const firstOwner = randomUUID();
  const secondOwner = randomUUID();
  t.after(async () => {
    try {
      await database.execute('DELETE FROM accounts WHERE id IN (UUID_TO_BIN(?), UUID_TO_BIN(?))', [firstOwner, secondOwner]);
    } finally {
      await database.end();
    }
  });
  await database.execute('INSERT INTO accounts (id) VALUES (UUID_TO_BIN(?)), (UUID_TO_BIN(?))', [firstOwner, secondOwner]);

  const first = createSubscriptionStore(database, firstOwner);
  const second = createSubscriptionStore(database, secondOwner);
  assert.deepEqual(await first.list(), []);
  assert.deepEqual(await second.list(), []);

  const firstRecord = await first.add({ ...annualPlan, name: "  Michael’s 'Cloud'  " });
  const secondRecord = await second.add({ ...annualPlan, name: 'France’s Cloud' });
  assert.equal(firstRecord.ownerId, firstOwner);
  assert.equal(firstRecord.name, "Michael’s 'Cloud'");
  assert.equal(secondRecord.ownerId, secondOwner);
  assert.notEqual(firstRecord.id, secondRecord.id);
  assert.deepEqual(await first.list(), [firstRecord]);
  assert.deepEqual(await second.list(), [secondRecord]);

  assert.equal(await first.edit(secondRecord.id, annualPlan), null);
  assert.equal(await second.edit(firstRecord.id, annualPlan), null);
  assert.equal(await first.delete(secondRecord.id), false);
  assert.equal(await second.delete(firstRecord.id), false);
  await assert.rejects(first.add({ ...annualPlan, ownerId: secondOwner }), /owner cannot be set/);
  await assert.rejects(first.edit(firstRecord.id, { ...annualPlan, ownerId: secondOwner }), /owner cannot be set/);
  assert.deepEqual(await first.list(), [firstRecord]);
  assert.deepEqual(await second.list(), [secondRecord]);

  const edited = await first.edit(firstRecord.id, { ...annualPlan, cost: 25.90, nextRenewal: '2027-11-01' });
  assert.deepEqual(edited, { ...annualPlan, id: firstRecord.id, ownerId: firstOwner, cost: 25.90, nextRenewal: '2027-11-01' });
  const { cost, nextRenewal } = edited;
  assert.deepEqual(await first.edit(firstRecord.id, { ...annualPlan, cost, nextRenewal }), edited);
  assert.deepEqual(await first.list(), [edited]);

  assert.equal(await first.delete(firstRecord.id), true);
  assert.equal(await first.delete(firstRecord.id), false);
  assert.deepEqual(await first.list(), []);
  assert.deepEqual(await second.list(), [secondRecord]);

  await assert.rejects(second.add({ ...annualPlan, nextRenewal: '2027-02-29' }), /valid YYYY-MM-DD/);
  await assert.rejects(second.add({ ...annualPlan, cost: 12.345 }), /up to two decimal places/);
  await assert.rejects(createSubscriptionStore(database, randomUUID()).add(annualPlan), { code: 'ER_NO_REFERENCED_ROW_2' });
  await assert.rejects(database.execute('UPDATE subscriptions SET cost = 0 WHERE id = UUID_TO_BIN(?)', [secondRecord.id]), {
    code: 'ER_CHECK_CONSTRAINT_VIOLATED',
  });
  await database.execute('DELETE FROM accounts WHERE id = UUID_TO_BIN(?)', [secondOwner]);
  assert.deepEqual(await second.list(), []);
});
