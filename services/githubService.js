import { App } from "octokit";


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

    // getInstallationOctokit returns a fully authenticated Octokit
    // instance scoped to this installation — token refresh is automatic.
    const octokit = await octokitApp.getInstallationOctokit(installationId);


    return {

        async getPullRequest(owner, repo, prNumber) {

            const { data } = await octokit.request(
                "GET /repos/{owner}/{repo}/pulls/{pull_number}",
                {
                    owner,
                    repo,
                    pull_number: prNumber,
                    headers: {
                        "x-github-api-version": "2022-11-28"
                    }
                }
            );

            return data;
        },


        async getPullRequestFiles(owner, repo, prNumber) {

            const { data } = await octokit.request(
                "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
                {
                    owner,
                    repo,
                    pull_number: prNumber,
                    headers: {
                        "x-github-api-version": "2022-11-28"
                    }
                }
            );

            return data;
        },


        async getPullRequestCommits(owner, repo, prNumber) {

            const { data } = await octokit.request(
                "GET /repos/{owner}/{repo}/pulls/{pull_number}/commits",
                {
                    owner,
                    repo,
                    pull_number: prNumber,
                    headers: {
                        "x-github-api-version": "2022-11-28"
                    }
                }
            );

            return data;
        },


        async createComment(owner, repo, prNumber, body) {

            const { data } = await octokit.request(
                "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
                {
                    owner,
                    repo,
                    issue_number: prNumber,
                    body,
                    headers: {
                        "x-github-api-version": "2022-11-28"
                    }
                }
            );

            return data;
        }
    };
}