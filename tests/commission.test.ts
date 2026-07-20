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
 */

import assert from "node:assert/strict";
import { Pool } from "pg";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:5000";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/** Minimal wrapper — returns parsed JSON body. */
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

/** Reset a submission to Pending so a test can approve it. */
async function resetSubmission(id: string): Promise<void> {
  await pool.query(
    "UPDATE submissions SET status='Pending', approved_at=NULL, rejected_at=NULL, feedback='' WHERE id=$1",
    [id]
  );
  // Remove any existing commission record for this submission so the test is clean.
  await pool.query(
    "DELETE FROM admin_commissions WHERE reference IN ($1, $2)",
    [`COMM-TASK-${id}`, `COMM-ADMTASK-${id}`]
  );
}

/** Sum of task_commission records in admin_commissions. */
async function taskCommissionTotal(): Promise<number> {
  const r = await pool.query(
    "SELECT COALESCE(SUM(amount),0) AS total FROM admin_commissions WHERE type='task_commission'"
  );
  return parseFloat(r.rows[0].total);
}

/** Count commission rows for a given submission reference (either reviewer). */
async function commissionRowsForSub(submissionId: string): Promise<number> {
  const r = await pool.query(
    "SELECT COUNT(*) AS cnt FROM admin_commissions WHERE reference IN ($1,$2)",
    [`COMM-TASK-${submissionId}`, `COMM-ADMTASK-${submissionId}`]
  );
  return parseInt(r.rows[0].cnt);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

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

async function runAll(): Promise<void> {
  console.log("\n── Commission Tests ─────────────────────────────────────────\n");

  const adminId = await getUserId("admin@tasksearn.com");
  const advertiserId = await getUserId("advertiser@tasksearn.com");

  // ── Test 1: Admin approval credits exactly the right commission ──────────
  await test("Admin approval: commission = cost_per_slot − earner_reward", async () => {
    // Ensure sub-2 is pending (it is in seed data but may have been touched)
    await resetSubmission("sub-2");

    const subRow = await pool.query(
      "SELECT s.reward, t.cost_per_slot FROM submissions s JOIN tasks t ON s.task_id=t.id WHERE s.id='sub-2'"
    );
    assert.ok(subRow.rows.length, "sub-2 not found");
    const reward = parseFloat(subRow.rows[0].reward);
    const cost   = parseFloat(subRow.rows[0].cost_per_slot);
    const expectedCommission = cost - reward;
    assert.ok(expectedCommission > 0, `Expected commission > 0, got ${expectedCommission}`);

    const before = await taskCommissionTotal();

    const res = await api("/api/admin/submissions/sub-2/review", {
      method: "POST",
      auth: adminId,
      body: JSON.stringify({ status: "Approved" })
    });
    assert.ok(res.success, `Approval failed: ${JSON.stringify(res)}`);

    // Commission record must exist
    const rows = await commissionRowsForSub("sub-2");
    assert.equal(rows, 1, `Expected 1 commission row, got ${rows}`);

    // Amount must match
    const commRow = await pool.query(
      "SELECT amount FROM admin_commissions WHERE reference='COMM-ADMTASK-sub-2'"
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

    const res = await api("/api/admin/submissions/sub-2/review", {
      method: "POST",
      auth: adminId,
      body: JSON.stringify({ status: "Approved" })
    });
    // Server should reject second approval
    assert.ok(res.error, `Expected error on second approval, got: ${JSON.stringify(res)}`);

    const rows = await commissionRowsForSub("sub-2");
    assert.equal(rows, 1, `Expected still 1 commission row after duplicate attempt, got ${rows}`);

    const after = await taskCommissionTotal();
    assert.equal(after, before, `Commission total changed on duplicate attempt: before=${before}, after=${after}`);
  });

  // ── Test 3: Rejected task does NOT create a commission record ────────────
  await test("Rejected submission: no commission created", async () => {
    // Reset sub-2 to pending and remove its commission row so we can reject it
    await resetSubmission("sub-2");

    const before = await taskCommissionTotal();

    const res = await api("/api/admin/submissions/sub-2/review", {
      method: "POST",
      auth: adminId,
      body: JSON.stringify({ status: "Rejected", feedback: "Test rejection" })
    });
    assert.ok(res.success, `Rejection API call failed: ${JSON.stringify(res)}`);
    assert.equal(res.submission?.status, "Rejected", "Status not set to Rejected");

    const rows = await commissionRowsForSub("sub-2");
    assert.equal(rows, 0, `Expected 0 commission rows for rejected task, got ${rows}`);

    const after = await taskCommissionTotal();
    assert.equal(after, before, `Commission total changed after rejection: before=${before}, after=${after}`);
  });

  // ── Test 4: Advertiser approval credits the right commission ─────────────
  await test("Advertiser approval: commission = cost_per_slot − earner_reward", async () => {
    await resetSubmission("sub-2");

    const subRow = await pool.query(
      "SELECT s.reward, t.cost_per_slot FROM submissions s JOIN tasks t ON s.task_id=t.id WHERE s.id='sub-2'"
    );
    const reward = parseFloat(subRow.rows[0].reward);
    const cost   = parseFloat(subRow.rows[0].cost_per_slot);
    const expectedCommission = cost - reward;

    const before = await taskCommissionTotal();

    const res = await api("/api/advertiser/submissions/sub-2/review", {
      method: "POST",
      auth: advertiserId,
      body: JSON.stringify({ status: "Approved" })
    });
    assert.ok(res.success, `Advertiser approval failed: ${JSON.stringify(res)}`);

    const commRow = await pool.query(
      "SELECT amount FROM admin_commissions WHERE reference='COMM-TASK-sub-2'"
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

  // ── Test 6: Pending task produces no commission ──────────────────────────
  await test("Pending submission: no commission (never approved)", async () => {
    // Ensure sub-2 is back to pending for a clean state after test 4 & 5
    await resetSubmission("sub-2");

    const rows = await commissionRowsForSub("sub-2");
    assert.equal(rows, 0, `Expected 0 commission rows for pending task, got ${rows}`);
  });

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n── Results: ${passed} passed, ${failed} failed ─────────────────────────\n`);
  if (failed > 0) process.exit(1);
}

runAll().catch(err => {
  console.error("Unexpected test runner error:", err);
  process.exit(1);
}).finally(() => pool.end());
