import { App } from "octokit";
import axios from "axios";
import logger from "../utils/logger.js";


// Axios instance pre-configured for GitHub API.
// Uses Node's native http stack — bypasses octokit's fetch-based
// request layer which hangs on this Lambda runtime.
const githubAxios = axios.create({
    baseURL: "https://api.github.com",
    timeout: 15000,
    headers: {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }
});


export async function createGitHubService(installationId) {

    // Create a fresh App per-invocation (avoids stale Lambda module-level state).
    const octokitApp = new App({
        appId: process.env.GITHUB_APP_ID,
        privateKey: process.env.GITHUB_AUTH_PRIVATE_KEY.replace(/\\n/g, "\n"),
        webhooks: {
            secret: process.env.GITHUB_WEBHOOK_SECRET
        }
    });

    logger.step("createGitHubService — fetching installation token", { installationId });

    // We only use octokit for token exchange — all subsequent calls go through axios.
    const octokit = await octokitApp.getInstallationOctokit(installationId);
    const { token } = await octokit.auth({ type: "installation", installationId });

    logger.success("Installation token acquired", { tokenPrefix: token.slice(0, 10) + "..." });

    // Auth header used for every axios request.
    const authHeader = { Authorization: `token ${token}` };


    return {

        async getPullRequest(owner, repo, prNumber) {
            logger.debug("GitHub API → GET pull request", { owner, repo, prNumber });
            const { data } = await githubAxios.get(
                `/repos/${owner}/${repo}/pulls/${prNumber}`,
                { headers: authHeader }
            );
            logger.debug("Pull request fetched", { title: data.title, state: data.state });
            return data;
        },


        async getPullRequestFiles(owner, repo, prNumber) {
            logger.debug("GitHub API → GET PR files", { owner, repo, prNumber });
            const { data } = await githubAxios.get(
                `/repos/${owner}/${repo}/pulls/${prNumber}/files`,
                { headers: authHeader }
            );
            logger.debug("PR files fetched", { count: data.length });
            return data;
        },


        async getPullRequestCommits(owner, repo, prNumber) {
            logger.debug("GitHub API → GET PR commits", { owner, repo, prNumber });
            const { data } = await githubAxios.get(
                `/repos/${owner}/${repo}/pulls/${prNumber}/commits`,
                { headers: authHeader }
            );
            logger.debug("PR commits fetched", { count: data.length });
            return data;
        },


        async createComment(owner, repo, prNumber, body) {
            logger.step("GitHub API → POST comment on PR", { owner, repo, prNumber });
            const { data } = await githubAxios.post(
                `/repos/${owner}/${repo}/issues/${prNumber}/comments`,
                { body },
                { headers: authHeader }
            );
            logger.success("Comment posted", { commentId: data.id, url: data.html_url });
            return data;
        }
    };
}