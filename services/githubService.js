import { App } from "octokit";
import logger from "../utils/logger.js";


// Octokit App instance — created once and reused across all requests.
// It handles JWT generation and installation token exchange internally.
const octokitApp = new App({
    appId: process.env.GITHUB_APP_ID,
    privateKey: process.env.GITHUB_AUTH_PRIVATE_KEY.replace(/\\n/g, "\n"),
    webhooks: {
        secret: process.env.GITHUB_WEBHOOK_SECRET
    }
});


export async function createGitHubService(installationId) {

    logger.step("createGitHubService — fetching installation token", { installationId });

    // getInstallationOctokit returns a fully authenticated Octokit
    // instance scoped to this installation — token refresh is automatic.
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
                    headers: { "x-github-api-version": "2022-11-28" }
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
                    headers: { "x-github-api-version": "2022-11-28" }
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
                    headers: { "x-github-api-version": "2022-11-28" }
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
                    headers: { "x-github-api-version": "2022-11-28" }
                }
            );

            logger.success("Comment posted", { commentId: data.id, url: data.html_url });
            return data;
        }
    };
}