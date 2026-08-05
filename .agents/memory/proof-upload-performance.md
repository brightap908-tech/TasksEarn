---
name: Proof submission upload performance
description: Performance constraints and response-path decisions for screenshot proof submissions.
---

Proof submission must treat the database commit as the synchronous boundary. Client-side canvas recompression, post-commit cleanup, admin notification persistence, push delivery, and extra readbacks must not delay the submission response.

**Why:** Small screenshots were stuck behind browser image processing and unrelated post-submit work, making the upload button appear hung even when the payload was already ready.

**How to apply:** Keep screenshot preparation bounded and observable, return the inserted/updated submission from the write query, run review cleanup and notifications asynchronously, and preserve request timing/correlation logs across browser and server.

For admin review, store a separate small thumbnail with each new proof and serve it before the full image; retain the full proof only for the lightbox and cache it client-side for the session.

**Why:** Proofs are data URLs in PostgreSQL rather than a transform-capable remote object store, so a dedicated thumbnail avoids downloading the original just to open the viewer while preserving readable full-resolution evidence.

**How to apply:** Keep thumbnail/full retrieval behind the admin-only screenshot endpoint, fall back to the full proof for legacy rows, and clear both columns together during proof cleanup.