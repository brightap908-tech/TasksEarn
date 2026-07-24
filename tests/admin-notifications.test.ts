/**
 * Admin submission notification integration test.
 *
 * Run with the application already running:
 *   npx tsx tests/admin-notifications.test.ts
 *
 * The test submits one isolated task, verifies the persisted admin notification
 * shape, and verifies that the notification dedupe key rejects a second insert.
 */

import assert from "node:assert/strict";
import { Pool } from "pg";

const BASE_URL = "http://localhost:5000";
const TASK_ID = "task-notif-test";
const SUBMISSION_ID_PREFIX = "sub-notif-test";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function api(path: string, options: RequestInit & { auth?: string } = {}): Promise<any> {
  const { auth, ...rest } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(auth ? { Authorization: `Bearer ${auth}` } : {})
  };
  const response = await fetch(`${BASE_URL}${path}`, { ...rest, headers });
  return response.json();
}

async function userId(email: string): Promise<string> {
  const result = await pool.query("SELECT id FROM users WHERE LOWER(email)=LOWER($1)", [email]);
  assert.equal(result.rows.length, 1, `Missing seeded user: ${email}`);
  return result.rows[0].id;
}

async function cleanup(): Promise<void> {
  await pool.query(
    "DELETE FROM notifications WHERE task_title = 'Admin Notification Test Task' OR reference_id LIKE $1",
    [`${SUBMISSION_ID_PREFIX}%`]
  );
  await pool.query("DELETE FROM submissions WHERE task_id=$1", [TASK_ID]);
  await pool.query("DELETE FROM tasks WHERE id=$1", [TASK_ID]);
}

async function run(): Promise<void> {
  const earnerId = await userId("earner@tasksearn.com");
  const advertiserId = await userId("advertiser@tasksearn.com");
  await cleanup();

  try {
    await pool.query(`
      INSERT INTO tasks (
        id, title, description, category, proof_requirements, link,
        cost_per_slot, earning_per_slot, total_slots, filled_slots,
        status, advertiser_id, advertiser_name
      )
      VALUES ($1, 'Admin Notification Test Task', 'Isolated notification test',
              'YouTube Subscribe', 'Text proof', 'https://example.com',
              20, 15, 1, 0, 'Active', $2, 'Notification Test Advertiser')
    `, [TASK_ID, advertiserId]);

    const submission = await api(`/api/earner/tasks/${TASK_ID}/submit`, {
      method: "POST",
      auth: earnerId,
      body: JSON.stringify({ proofText: "notification test proof" })
    });
    assert.equal(submission.success, true, `Submission failed: ${JSON.stringify(submission)}`);

    const submissionId = submission.submission.id as string;
    assert.ok(submissionId.startsWith("sub-"), "Submission response did not include an ID");

    const notificationResult = await pool.query(
      "SELECT * FROM notifications WHERE reference_id=$1",
      [submissionId]
    );
    assert.equal(notificationResult.rows.length, 1, "Expected exactly one persisted admin notification");
    const notification = notificationResult.rows[0];
    assert.equal(notification.type, "submission");
    assert.equal(notification.message, "Tunde Bakare submitted a task for review.");
    assert.equal(notification.earner_name, "Tunde Bakare");
    assert.equal(notification.task_title, "Admin Notification Test Task");
    assert.equal(notification.review_url, `/admin/audits?submission=${encodeURIComponent(submissionId)}`);

    // Exercise the same conflict target used by notifyAdmin. A repeated event
    // must not create a second persisted notification.
    const duplicate = await pool.query(`
      INSERT INTO notifications
        (id, type, message, reference_id, dedupe_key, earner_name, task_title, submitted_at, review_url, read, created_at)
      VALUES ($1, 'submission', 'duplicate', $2, $3, 'Tunde Bakare',
              'Admin Notification Test Task', NOW(), $4, false, NOW())
      ON CONFLICT (dedupe_key) DO NOTHING
      RETURNING id
    `, [
      "notif-duplicate-test",
      submissionId,
      `submission:${submissionId}`,
      `/admin/audits?submission=${encodeURIComponent(submissionId)}`
    ]);
    assert.equal(duplicate.rows.length, 0, "Duplicate notification insert was not ignored");

    const count = await pool.query(
      "SELECT COUNT(*)::int AS count FROM notifications WHERE reference_id=$1",
      [submissionId]
    );
    assert.equal(count.rows[0].count, 1, "Duplicate notification changed the persisted count");
    console.log("Admin notification integration test: PASS");
  } finally {
    await cleanup();
    await pool.end();
  }
}

run().catch((error) => {
  console.error("Admin notification integration test: FAIL", error);
  pool.end().finally(() => process.exit(1));
});