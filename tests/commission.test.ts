/**
 * Commission integration tests
 *
 * Verifies that every approved task correctly increases platform earnings in
 * the admin_commissions table, and that rejected / duplicate approvals do NOT
 * create commission records.
 *
 * Run with:  npm test
 *
 * The server must already be running on port 5000 (npm run dev or the
 * "Start application" workflow).  The tests use the seeded demo accounts:
 *   admin:      admin@tasksearn.com   / password123   (id: u-admin-1)
 *   advertiser: advertiser@tasksearn.com / password123 (id: u-advertiser-1)
 *
 * ISOLATION: Tests create their own task and submission records with unique IDs
 * (task-comm-test-001 / sub-comm-admin-001 / sub-comm-adv-001) that are deleted
 * in teardown. Real seeded submissions (sub-1, sub-2) are never touched, so
 * running the test suite never corrupts live commission data.
 */

import assert from "node:assert/strict";
import { Pool } from "pg";

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:5000";

// Isolated test-fixture IDs — never overlap with real seed data.
const TEST_TASK_ID   = "task-comm-test-001";
const TEST_SUB_ADMIN = "sub-comm-admin-001"; // used for admin-approval tests
const TEST_SUB_ADV   = "sub-comm-adv-001";   // used for advertiser-approval test

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Minimal fetch wrapper — returns parsed JSON body. */
async function api(
  path: string,
  options: RequestInit & { auth?: string } = {}
): Promise<any> {
  const { auth, ...rest } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(auth ? { Authorization: `Bearer ${auth}` } : {})
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers });
  return res.json();
}

/** Look up a user's DB id by email. */
async function getUserId(email: string): Promise<string> {
  const r = await pool.query("SELECT id FROM users WHERE LOWER(email)=LOWER($1)", [email]);
  if (!r.rows.length) throw new Error(`User not found: ${email}`);
  return r.rows[0].id;
}

/** Look up a user's name by id. */
async function getUserName(id: string): Promise<string> {
  const r = await pool.query("SELECT name FROM users WHERE id=$1", [id]);
  if (!r.rows.length) throw new Error(`User not found: ${id}`);
  return r.rows[0].name;
}

/** Create the isolated test task + two submissions. Cleans up leftovers first. */
async function createTestFixtures(
  advertiserId: string,
  advertiserName: string,
  earnerId: string,
  earnerName: string
): Promise<void> {
  await cleanupTestFixtures(earnerId);

  // Isolated test task — cost ₦20, reward ₦15, commission ₦5 per approval.
  await pool.query(`
    INSERT INTO tasks (id, title, description, category, proof_requirements, link,
                       cost_per_slot, earning_per_slot, total_slots, filled_slots,
                       status, advertiser_id, advertiser_name, created_at)
    VALUES ($1, 'Commission Test Task [auto]',
            'Automated test task — safe to delete at any time.',
            'YouTube Subscribe', 'Screenshot required', 'https://example.com',
            20, 15, 10, 0, 'Active', $2, $3, NOW())
  `, [TEST_TASK_ID, advertiserId, advertiserName]);

  // Two pending submissions — one for the admin-approval tests, one for the advertiser test.
  await pool.query(`
    INSERT INTO submissions (id, task_id, task_title, category, earner_id, earner_name,
                             proof_text, status, reward, submitted_at)
    VALUES
      ($1, $3, 'Commission Test Task [auto]', 'YouTube Subscribe',
       $4, $5, 'Test proof A — admin approval', 'Pending', 15, NOW()),
      ($2, $3, 'Commission Test Task [auto]', 'YouTube Subscribe',
       $4, $5, 'Test proof B — advertiser approval', 'Pending', 15, NOW())
  `, [TEST_SUB_ADMIN, TEST_SUB_ADV, TEST_TASK_ID, earnerId, earnerName]);
}

/** Remove all test fixtures and reverse any wallet credits granted during tests. */
async function cleanupTestFixtures(earnerId: string): Promise<void> {
  // 1. Reverse earner wallet credits from test approvals (may be 0 if tests didn't run).
  await pool.query(`
    UPDATE users
    SET wallet_balance = wallet_balance
        - COALESCE((
            SELECT SUM(amount)
            FROM transactions
            WHERE user_id = $1
              AND description LIKE '%Commission Test Task [auto]%'
              AND status = 'Success'
          ), 0)
    WHERE id = $1
  `, [earnerId]);

  // 2. Delete test-generated commission rows.
  await pool.query(
    "DELETE FROM admin_commissions WHERE reference IN ($1,$2,$3,$4)",
    [
      `COMM-ADMTASK-${TEST_SUB_ADMIN}`,
      `COMM-TASK-${TEST_SUB_ADMIN}`,
      `COMM-ADMTASK-${TEST_SUB_ADV}`,
      `COMM-TASK-${TEST_SUB_ADV}`,
    ]
  );

  // 3. Delete test-generated transactions.
  await pool.query(
    "DELETE FROM transactions WHERE description LIKE '%Commission Test Task [auto]%'"
  );

  // 4. Delete the test submissions and task (in that order for FK safety).
  await pool.query("DELETE FROM submissions WHERE id IN ($1,$2)", [TEST_SUB_ADMIN, TEST_SUB_ADV]);
  await pool.query("DELETE FROM tasks WHERE id=$1", [TEST_TASK_ID]);
}

/** Reset a test submission back to Pending and delete its commission row. */
async function resetTestSubmission(id: string): Promise<void> {
  await pool.query(
    "UPDATE submissions SET status='Pending', approved_at=NULL, rejected_at=NULL, feedback='' WHERE id=$1",
    [id]
  );
  await pool.query(
    "DELETE FROM admin_commissions WHERE reference IN ($1,$2)",
    [`COMM-TASK-${id}`, `COMM-ADMTASK-${id}`]
  );
  // Also reverse the earner wallet credit that the approval granted.
  await pool.query(
    "DELETE FROM transactions WHERE description LIKE '%Commission Test Task [auto]%'"
  );
  // Re-calculate and reverse wallet (delete transactions first, then adjust wallet).
  // Because we deleted the transactions above, we need a different approach:
  // just check whether the submission reward was credited and subtract it.
  // Simpler: we track the reward amount (always 15 for our fixture) and reverse it.
  await pool.query(
    `UPDATE users
     SET wallet_balance = wallet_balance - 15
     WHERE id = (SELECT earner_id FROM submissions WHERE id=$1)
       AND wallet_balance >= 15`,
    [id]
  );
}

/** Sum of task_commission records in admin_commissions. */
async function taskCommissionTotal(): Promise<number> {
  const r = await pool.query(
    "SELECT COALESCE(SUM(amount),0) AS total FROM admin_commissions WHERE type='task_commission'"
  );
  return parseFloat(r.rows[0].total);
}

/** Count commission rows for a given test submission (either reviewer reference). */
async function commissionRowsForSub(submissionId: string): Promise<number> {
  const r = await pool.query(
    "SELECT COUNT(*) AS cnt FROM admin_commissions WHERE reference IN ($1,$2)",
    [`COMM-TASK-${submissionId}`, `COMM-ADMTASK-${submissionId}`]
  );
  return parseInt(r.rows[0].cnt);
}

// ─── Test runner ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  process.stdout.write(`  ${name} … `);
  try {
    await fn();
    console.log("PASS");
    passed++;
  } catch (err: any) {
    console.log(`FAIL\n    ${err.message}`);
    failed++;
  }
}

// ─── Test suite ───────────────────────────────────────────────────────────────

async function runAll(): Promise<void> {
  console.log("\n── Commission Tests ─────────────────────────────────────────\n");

  const adminId      = await getUserId("admin@tasksearn.com");
  const advertiserId = await getUserId("advertiser@tasksearn.com");
  const earnerId     = await getUserId("earner@tasksearn.com");
  const advertiserName = await getUserName(advertiserId);
  const earnerName     = await getUserName(earnerId);

  // Set up isolated test fixtures before any test runs.
  await createTestFixtures(advertiserId, advertiserName, earnerId, earnerName);
  console.log("  [setup] Isolated test fixtures created.\n");

  // ── Test 1: Admin approval credits exactly the right commission ──────────
  await test("Admin approval: commission = cost_per_slot − earner_reward", async () => {
    const subRow = await pool.query(
      "SELECT s.reward, t.cost_per_slot FROM submissions s JOIN tasks t ON s.task_id=t.id WHERE s.id=$1",
      [TEST_SUB_ADMIN]
    );
    assert.ok(subRow.rows.length, `${TEST_SUB_ADMIN} not found`);
    const reward             = parseFloat(subRow.rows[0].reward);
    const cost               = parseFloat(subRow.rows[0].cost_per_slot);
    const expectedCommission = cost - reward;
    assert.ok(expectedCommission > 0, `Expected commission > 0, got ${expectedCommission}`);

    const before = await taskCommissionTotal();

    const res = await api(`/api/admin/submissions/${TEST_SUB_ADMIN}/review`, {
      method: "POST",
      auth: adminId,
      body: JSON.stringify({ status: "Approved" })
    });
    assert.ok(res.success, `Approval failed: ${JSON.stringify(res)}`);

    // Commission row must exist
    const rows = await commissionRowsForSub(TEST_SUB_ADMIN);
    assert.equal(rows, 1, `Expected 1 commission row, got ${rows}`);

    // Amount must match
    const commRow = await pool.query(
      "SELECT amount FROM admin_commissions WHERE reference=$1",
      [`COMM-ADMTASK-${TEST_SUB_ADMIN}`]
    );
    assert.equal(commRow.rows.length, 1, "Commission row not found");
    const recorded = parseFloat(commRow.rows[0].amount);
    assert.equal(recorded, expectedCommission, `Expected ₦${expectedCommission}, got ₦${recorded}`);

    // Total must have increased by exactly the commission
    const after = await taskCommissionTotal();
    assert.equal(
      +(after - before).toFixed(2),
      +expectedCommission.toFixed(2),
      `Total increased by ₦${(after - before).toFixed(2)}, expected ₦${expectedCommission.toFixed(2)}`
    );
  });

  // ── Test 2: Duplicate approval is blocked — no extra commission ──────────
  await test("Duplicate approval blocked: no extra commission row created", async () => {
    const before = await taskCommissionTotal();

    const res = await api(`/api/admin/submissions/${TEST_SUB_ADMIN}/review`, {
      method: "POST",
      auth: adminId,
      body: JSON.stringify({ status: "Approved" })
    });
    // Server should reject second approval
    assert.ok(res.error, `Expected error on second approval, got: ${JSON.stringify(res)}`);

    const rows = await commissionRowsForSub(TEST_SUB_ADMIN);
    assert.equal(rows, 1, `Expected still 1 commission row after duplicate attempt, got ${rows}`);

    const after = await taskCommissionTotal();
    assert.equal(after, before, `Commission total changed on duplicate attempt: before=${before}, after=${after}`);
  });

  // ── Test 3: Rejected task does NOT create a commission record ────────────
  await test("Rejected submission: no commission created", async () => {
    // Reset the admin sub back to Pending so we can reject it cleanly
    await resetTestSubmission(TEST_SUB_ADMIN);

    const before = await taskCommissionTotal();

    const res = await api(`/api/admin/submissions/${TEST_SUB_ADMIN}/review`, {
      method: "POST",
      auth: adminId,
      body: JSON.stringify({ status: "Rejected", feedback: "Test rejection" })
    });
    assert.ok(res.success, `Rejection API call failed: ${JSON.stringify(res)}`);
    assert.equal(res.submission?.status, "Rejected", "Status not set to Rejected");

    const rows = await commissionRowsForSub(TEST_SUB_ADMIN);
    assert.equal(rows, 0, `Expected 0 commission rows for rejected task, got ${rows}`);

    const after = await taskCommissionTotal();
    assert.equal(after, before, `Commission total changed after rejection: before=${before}, after=${after}`);
  });

  // ── Test 4: Advertiser approval credits the right commission ─────────────
  await test("Advertiser approval: commission = cost_per_slot − earner_reward", async () => {
    const subRow = await pool.query(
      "SELECT s.reward, t.cost_per_slot FROM submissions s JOIN tasks t ON s.task_id=t.id WHERE s.id=$1",
      [TEST_SUB_ADV]
    );
    const reward             = parseFloat(subRow.rows[0].reward);
    const cost               = parseFloat(subRow.rows[0].cost_per_slot);
    const expectedCommission = cost - reward;

    const before = await taskCommissionTotal();

    const res = await api(`/api/advertiser/submissions/${TEST_SUB_ADV}/review`, {
      method: "POST",
      auth: advertiserId,
      body: JSON.stringify({ status: "Approved" })
    });
    assert.ok(res.success, `Advertiser approval failed: ${JSON.stringify(res)}`);

    const commRow = await pool.query(
      "SELECT amount FROM admin_commissions WHERE reference=$1",
      [`COMM-TASK-${TEST_SUB_ADV}`]
    );
    assert.equal(commRow.rows.length, 1, "Commission row not found after advertiser approval");
    const recorded = parseFloat(commRow.rows[0].amount);
    assert.equal(recorded, expectedCommission, `Expected ₦${expectedCommission}, got ₦${recorded}`);

    const after = await taskCommissionTotal();
    assert.equal(
      +(after - before).toFixed(2),
      +expectedCommission.toFixed(2),
      `Total mismatch: expected +₦${expectedCommission.toFixed(2)}, got +₦${(after - before).toFixed(2)}`
    );
  });

  // ── Test 5: platform-earnings stats reflect new commission totals ─────────
  await test("Platform stats endpoint reflects updated commission total", async () => {
    const stats = await api("/api/admin/owner-earnings/stats", { auth: adminId });
    assert.ok(!stats.error, `Stats fetch failed: ${JSON.stringify(stats)}`);

    const dbTotal = await taskCommissionTotal();
    assert.equal(
      +stats.totalCommission.toFixed(2),
      +dbTotal.toFixed(2),
      `stats.totalCommission (${stats.totalCommission}) !== DB total (${dbTotal})`
    );
    assert.ok(stats.lifetimeRevenue >= stats.totalCommission, "lifetimeRevenue < totalCommission");
  });

  // ── Test 6: Pending submission produces no commission ────────────────────
  await test("Pending submission: no commission (never approved)", async () => {
    // The advertiser sub (TEST_SUB_ADV) is now Approved from Test 4.
    // Create a brand-new pending-only submission for this check.
    const PENDING_SUB = "sub-comm-pending-001";
    await pool.query("DELETE FROM submissions WHERE id=$1", [PENDING_SUB]);
    const earnRow = await pool.query("SELECT earner_id, earner_name FROM submissions WHERE id=$1", [TEST_SUB_ADV]);
    await pool.query(`
      INSERT INTO submissions (id, task_id, task_title, category, earner_id, earner_name,
                               proof_text, status, reward, submitted_at)
      VALUES ($1, $2, 'Commission Test Task [auto]', 'YouTube Subscribe',
              $3, $4, 'Pending-only proof', 'Pending', 15, NOW())
    `, [PENDING_SUB, TEST_TASK_ID, earnRow.rows[0].earner_id, earnRow.rows[0].earner_name]);

    const rows = await commissionRowsForSub(PENDING_SUB);
    assert.equal(rows, 0, `Expected 0 commission rows for pending task, got ${rows}`);

    // Cleanup the extra pending submission.
    await pool.query("DELETE FROM submissions WHERE id=$1", [PENDING_SUB]);
  });

  // ─── Teardown ─────────────────────────────────────────────────────────────

  console.log("\n  [teardown] Removing isolated test fixtures…");
  await cleanupTestFixtures(earnerId);
  console.log("  [teardown] Done — real seed commission data untouched.\n");

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log(`── Results: ${passed} passed, ${failed} failed ─────────────────────────\n`);
  if (failed > 0) process.exit(1);
}

runAll().catch(err => {
  console.error("Unexpected test runner error:", err);
  process.exit(1);
}).finally(() => pool.end());
