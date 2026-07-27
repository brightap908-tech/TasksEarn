---
name: Proof submission upload performance
description: Performance constraints and response-path decisions for screenshot proof submissions.
---

Proof submission must treat the database commit as the synchronous boundary. Client-side canvas recompression, post-commit cleanup, admin notification persistence, push delivery, and extra readbacks must not delay the submission response.

**Why:** Small screenshots were stuck behind browser image processing and unrelated post-submit work, making the upload button appear hung even when the payload was already ready.

**How to apply:** Keep screenshot preparation bounded and observable, return the inserted/updated submission from the write query, run review cleanup and notifications asynchronously, and preserve request timing/correlation logs across browser and server.