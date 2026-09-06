import logger from "../utils/logger.js";
import { createGitHubService } from "./githubService.js";
import { analyzeChanges } from "./changeAnalyzer.js";
import { calculateRisk } from "./riskEngine.js";
import { buildDependencyMap } from "./dependencyMap.js";
import { runLinters } from "./linterService.js";
import { analyzeWithAI } from "./llmService.js";


export async function analyzePullRequest(payload) {

    // ── Payload validation ──────────────────────────────────────────────────
    if (!payload.installation) {
        throw new Error("payload.installation is missing — is this a GitHub App webhook? Personal access token webhooks don't include installation data.");
    }

    const installationId = payload.installation.id;
    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const prNumber = payload.pull_request.number;

    logger.info("═══════════════════════════════════════════");
    logger.info("🔍 Analyzing PR...");
    logger.info(`Repository: ${owner}/${repo}`);
    logger.info(`PR: #${prNumber}`);
    logger.info(`Installation ID: ${installationId}`);
    logger.info("═══════════════════════════════════════════");


    // ── GitHub service ──────────────────────────────────────────────────────
    logger.step("[1/6] Creating authenticated GitHub service...");
    let github;
    try {
        github = await createGitHubService(installationId);
        logger.success("[1/6] GitHub service ready");
    } catch (err) {
        logger.error("[1/6] ❌ Failed to create GitHub service", {
            message: err.message,
        });
        throw err;
    }


    // ── Fetch PR data ───────────────────────────────────────────────────────
    logger.step("[2/6] Fetching PR data (pullRequest, files, commits) in parallel...");
    let pullRequest, files, commits;
    try {
        [pullRequest, files, commits] = await Promise.all([
            github.getPullRequest(owner, repo, prNumber),
            github.getPullRequestFiles(owner, repo, prNumber),
            github.getPullRequestCommits(owner, repo, prNumber),
        ]);
        logger.success("[2/6] PR data fetched", {
            title: pullRequest.title,
            author: pullRequest.user?.login,
            filesChanged: files.length,
            commits: commits.length,
        });
        logger.debug("Files changed", files.map((f) => ({
            filename: f.filename,
            status: f.status,
            additions: f.additions,
            deletions: f.deletions,
            hasPatch: !!f.patch,
        })));
    } catch (err) {
        logger.error("[2/6] ❌ Failed to fetch PR data from GitHub", {
            message: err.message,
        });
        throw err;
    }


    // ── Change analysis ─────────────────────────────────────────────────────
    logger.step("[3/6] Running change analysis...");
    let changeAnalysis;
    try {
        changeAnalysis = analyzeChanges(files);
        logger.success("[3/6] Change analysis complete", changeAnalysis);
    } catch (err) {
        logger.error("[3/6] ❌ Change analysis failed", { message: err.message });
        throw err;
    }


    // ── Risk engine ─────────────────────────────────────────────────────────
    logger.step("[3/6] Calculating risk...");
    let risk;
    try {
        risk = calculateRisk(changeAnalysis);
        logger.success("[3/6] Risk calculated", risk);
    } catch (err) {
        logger.error("[3/6] ❌ Risk calculation failed", { message: err.message });
        throw err;
    }


    // ── Dependency map ──────────────────────────────────────────────────────
    logger.step("[4/6] Building dependency map...");
    let dependencyMap;
    try {
        dependencyMap = buildDependencyMap(files);
        logger.success("[4/6] Dependency map built", dependencyMap);
    } catch (err) {
        logger.error("[4/6] ❌ Dependency map failed", { message: err.message });
        throw err;
    }


    // ── Linters ─────────────────────────────────────────────────────────────
    logger.step("[5/6] Running linter detection...");
    let lintResults;
    try {
        lintResults = await runLinters({ files });
        logger.success("[5/6] Linter detection complete", lintResults);
    } catch (err) {
        logger.error("[5/6] ❌ Linter detection failed", { message: err.message });
        throw err;
    }


    // ── AI analysis ─────────────────────────────────────────────────────────
    logger.step("[6/6] Sending data to OpenAI for analysis...");
    let analysis;
    try {
        analysis = await analyzeWithAI({
            repository: `${owner}/${repo}`,
            title: pullRequest.title,
            author: pullRequest.user.login,
            description: pullRequest.body || "",
            files,
            commits,
            changeAnalysis,
            risk,
            dependencyMap,
            lintResults,
        });
        logger.success("[6/6] AI analysis received", {
            responseLength: analysis?.length,
            preview: analysis?.slice(0, 300),
        });
    } catch (err) {
        logger.error("[6/6] ❌ OpenAI analysis failed", { message: err.message });
        throw err;
    }


    // ── Post comment ─────────────────────────────────────────────────────────
    logger.step("Posting comment to PR...");
    try {
        await github.createComment(owner, repo, prNumber, analysis);
        logger.success("💬 CodeLens comment posted successfully!");
    } catch (err) {
        logger.error("❌ Failed to post comment to PR", { message: err.message });
        throw err;
    }


    return {
        owner,
        repo,
        prNumber,
        changeAnalysis,
        risk,
        dependencyMap,
        lintResults,
        analysis,
    };
}