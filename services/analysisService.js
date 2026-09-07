import { createGitHubService } from "./githubService.js";
import logger from "../utils/logger.js";

// ─── DIAGNOSTIC MODE ──────────────────────────────────────────────────────────
// All GitHub data fetching, static analysis, and LLM are bypassed.
// We just post a hardcoded comment to verify:
//   (a) createGitHubService works
//   (b) createComment works
// Once both log ✅, restore the full pipeline.
// ─────────────────────────────────────────────────────────────────────────────

const HARDCODED_COMMENT = `## 🤖 CodeLens — Diagnostic Test

This is a **hardcoded test comment** posted by CodeLens to verify the GitHub comment API is working end-to-end.

> If you see this comment, the webhook → GitHub App → comment pipeline is healthy.
> The full AI review pipeline will be restored once connectivity is confirmed.

---
*CodeLens diagnostic mode — ${new Date().toISOString()}*`;


export async function analyzePullRequest(payload) {

    const installationId = payload.installation.id;
    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const prNumber = payload.pull_request.number;

    logger.step("[DIAG] analyzePullRequest — DIAGNOSTIC MODE (skipping data fetch + LLM)", {
        repo: `${owner}/${repo}`,
        pr: prNumber,
        installationId
    });

    // Step 1: authenticate
    logger.step("[DIAG] Creating GitHub service...");
    const github = await createGitHubService(installationId);
    logger.success("[DIAG] GitHub service created");

    // Step 2: post hardcoded comment — skip all data fetching & LLM
    logger.step("[DIAG] Posting hardcoded comment to PR...");
    await github.createComment(owner, repo, prNumber, HARDCODED_COMMENT);
    logger.success(`[DIAG] ✅ Hardcoded comment posted on PR #${prNumber}`);

    return { owner, repo, prNumber };
}