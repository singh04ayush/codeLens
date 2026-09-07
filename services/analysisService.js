import { createGitHubService } from "./githubService.js";
import { analyzeChanges } from "./changeAnalyzer.js";
import { calculateRisk } from "./riskEngine.js";
import { buildDependencyMap } from "./dependencyMap.js";
import { runLinters } from "./linterService.js";
import { analyzeWithAI } from "./llmService.js";


export async function analyzePullRequest(payload) {

    const installationId = payload.installation.id;

    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const prNumber = payload.pull_request.number;

    console.log("🔍 Analyzing PR...");
    console.log(`Repository: ${owner}/${repo}`);
    console.log(`PR: #${prNumber}`);


    // GitHub service authenticated for this installation
    const github = await createGitHubService(installationId);


    // Get PR information
    const [pullRequest, files, commits] = await Promise.all([

        github.getPullRequest(
            owner,
            repo,
            prNumber
        ),

        github.getPullRequestFiles(
            owner,
            repo,
            prNumber
        ),

        github.getPullRequestCommits(
            owner,
            repo,
            prNumber
        )

    ]);


    console.log(`📁 Files changed: ${files.length}`);
    console.log(`📝 Commits: ${commits.length}`);


    // Analyze changes
    const changeAnalysis = analyzeChanges(files);


    // Calculate risk
    const risk = calculateRisk(changeAnalysis);


    // Build dependency information
    const dependencyMap = buildDependencyMap(files);


    // Run linter/check detection
    const lintResults = await runLinters({
        files
    });


    // Send everything to OpenAI
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

    await github.createComment(
    owner,
    repo,
    prNumber,
    analysis
);


console.log("💬 CodeLens comment posted");


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