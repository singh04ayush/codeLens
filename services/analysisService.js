import { createGitHubService } from "./githubService.js";
import { analyzeChanges } from "./changeAnalyzer.js";
import { calculateRisk } from "./riskEngine.js";
import { buildDependencyMap } from "./dependencyMap.js";
import { runLinters } from "./linterService.js";
import { analyzeWithAI } from "./llmService.js";
import logger from "../utils/logger.js";


export async function analyzePullRequest(payload) {

    const installationId = payload.installation.id;
    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const prNumber = payload.pull_request.number;

    logger.step("analyzePullRequest — pipeline started", {
        repo: `${owner}/${repo}`,
        pr: prNumber,
        installationId
    });


    // GitHub service authenticated for this installation
    const github = await createGitHubService(installationId);


    // Fetch PR data in parallel
    logger.step("Fetching PR data from GitHub (parallel)");

    const [pullRequest, files, commits] = await Promise.all([
        github.getPullRequest(owner, repo, prNumber),
        github.getPullRequestFiles(owner, repo, prNumber),
        github.getPullRequestCommits(owner, repo, prNumber)
    ]);

    logger.info("GitHub data fetched", {
        filesChanged: files.length,
        commits: commits.length,
        prTitle: pullRequest.title
    });


    // Static analysis
    logger.step("Running static analysis");
    const changeAnalysis = analyzeChanges(files);
    logger.debug("Change analysis complete", {
        areas: changeAnalysis.areas,
        additions: changeAnalysis.additions,
        deletions: changeAnalysis.deletions
    });


    // Risk calculation
    logger.step("Calculating risk score");
    const risk = calculateRisk(changeAnalysis);
    logger.info("Risk calculated", { level: risk.level, score: risk.score, reasons: risk.reasons });


    // Dependency map
    logger.step("Building dependency map");
    const dependencyMap = buildDependencyMap(files);
    logger.debug("Dependency map built", { fileCount: Object.keys(dependencyMap).length });


    // Linter detection
    logger.step("Running linter detection");
    const lintResults = await runLinters({ files });
    logger.debug("Linter detection complete", {
        linters: lintResults.map(l => `${l.name}:${l.status}`)
    });


    // AI analysis
    logger.step("Sending data to Gemini for review");

    const analysis = await analyzeWithAI({
        repository: `${owner}/${repo}`,
        title: pullRequest.title,
        author: pullRequest.user.login,
        description: pullRequest.body || "",
        files,
        commits,
        changeAnalysis,
        risk,
        dependencyMap,
        lintResults
    });

    logger.success("AI analysis received", {
        responseLength: analysis?.length
    });


    // Post comment
    logger.step("Posting CodeLens comment to PR");
    await github.createComment(owner, repo, prNumber, analysis);
    logger.success(`💬 CodeLens comment posted on PR #${prNumber}`);


    return {
        owner,
        repo,
        prNumber,
        changeAnalysis,
        risk,
        dependencyMap,
        lintResults,
        analysis
    };
}