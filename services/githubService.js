import { App } from "octokit";
import logger from "../utils/logger.js";


// Helper: creates a fresh AbortSignal that times out after `ms` milliseconds.
// AbortSignal.timeout() is the correct octokit v5 cancellation mechanism —
// the legacy `request: { timeout }` option is silently ignored in v5.
function signal(ms) {
    return AbortSignal.timeout(ms);
}


export async function createGitHubService(installationId) {

    // ⚠️  Intentionally created INSIDE this function, not at module scope.
    //
    //     On Lambda (and similar serverless runtimes) the process is "frozen"
    //     between invocations. A module-level Octokit App instance caches HTTP
    //     connection state that becomes stale after thawing, causing every
    //     subsequent `octokit.request()` to hang indefinitely.
    //
    //     Creating the App per-invocation ensures a fresh connection pool each
    //     time and is cheap — the App constructor is synchronous.
    const octokitApp = new App({
        appId: process.env.GITHUB_APP_ID,
        privateKey: process.env.GITHUB_AUTH_PRIVATE_KEY.replace(/\\n/g, "\n"),
        webhooks: {
            secret: process.env.GITHUB_WEBHOOK_SECRET
        }
    });

    logger.step("createGitHubService — fetching installation token", { installationId });

    const octokit = await octokitApp.getInstallationOctokit(installationId);

    logger.success("Installation token acquired");


    return {

        async getPullRequest(owner, repo, prNumber) {
            logger.debug("GitHub API → GET pull request", { owner, repo, prNumber });

            const { data } = await octokit.request(
                "GET /repos/{owner}/{repo}/pulls/{pull_number}",
                {
                    owner,
                    repo,
                    pull_number: prNumber,
                    headers: { "x-github-api-version": "2022-11-28" },
                    request: { signal: signal(10000) }
                }
            );

            logger.debug("Pull request fetched", { title: data.title, state: data.state });
            return data;
        },


        async getPullRequestFiles(owner, repo, prNumber) {
            logger.debug("GitHub API → GET PR files", { owner, repo, prNumber });

            const { data } = await octokit.request(
                "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
                {
                    owner,
                    repo,
                    pull_number: prNumber,
                    headers: { "x-github-api-version": "2022-11-28" },
                    request: { signal: signal(10000) }
                }
            );

            logger.debug("PR files fetched", { count: data.length });
            return data;
        },


        async getPullRequestCommits(owner, repo, prNumber) {
            logger.debug("GitHub API → GET PR commits", { owner, repo, prNumber });

            const { data } = await octokit.request(
                "GET /repos/{owner}/{repo}/pulls/{pull_number}/commits",
                {
                    owner,
                    repo,
                    pull_number: prNumber,
                    headers: { "x-github-api-version": "2022-11-28" },
                    request: { signal: signal(10000) }
                }
            );

            logger.debug("PR commits fetched", { count: data.length });
            return data;
        },


        async createComment(owner, repo, prNumber, body) {
            logger.step("GitHub API → POST comment on PR", { owner, repo, prNumber });

            const { data } = await octokit.request(
                "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
                {
                    owner,
                    repo,
                    issue_number: prNumber,
                    body,
                    headers: { "x-github-api-version": "2022-11-28" },
                    request: { signal: signal(10000) }
                }
            );

            logger.success("Comment posted", { commentId: data.id, url: data.html_url });
            return data;
        }
    };
}