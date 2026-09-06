import jwt from "jsonwebtoken";

const GITHUB_API = process.env.GITHUB_API;


function generateAppJWT() {
    const now = Math.floor(Date.now() / 1000);

    const payload = {
        iat: now - 60,
        exp: now + 540,
        iss: process.env.GITHUB_APP_ID
    };

    return jwt.sign(
        payload,
        process.env.GITHUB_PRIVATE_KEY,
        {
            algorithm: "RS256"
        }
    );
}


async function getInstallationToken(installationId) {

    const appJWT = generateAppJWT();

    const response = await fetch(
        `${GITHUB_API}/app/installations/${installationId}/access_tokens`,
        {
            method: "POST",

            headers: {
                "Accept": "application/vnd.github+json",
                "Authorization": `Bearer ${appJWT}`,
                "X-GitHub-Api-Version": "2026-03-10"
            }
        }
    );

    if (!response.ok) {
        const error = await response.text();

        throw new Error(
            `Failed to get installation token: ${response.status} ${error}`
        );
    }

    const data = await response.json();

    return data.token;
}


export async function createGitHubService(installationId) {

    const installationToken =
        await getInstallationToken(installationId);

    const headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${installationToken}`,
        "X-GitHub-Api-Version": "2026-03-10"
    };


    async function githubRequest(url, options = {}) {

        const response = await fetch(url, {
            ...options,
            headers: {
                ...headers,
                ...(options.headers || {})
            }
        });

        if (!response.ok) {
            const error = await response.text();

            throw new Error(
                `GitHub API Error: ${response.status} ${error}`
            );
        }

        return response.json();
    }


    return {

        async getPullRequest(owner, repo, prNumber) {

            return githubRequest(
                `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}`
            );
        },


        async getPullRequestFiles(owner, repo, prNumber) {

            return githubRequest(
                `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/files`
            );
        },


        async getPullRequestCommits(owner, repo, prNumber) {

            return githubRequest(
                `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/commits`
            );
        },


        async createComment(owner, repo, prNumber, body) {

            return githubRequest(
                `${GITHUB_API}/repos/${owner}/${repo}/issues/${prNumber}/comments`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        body
                    })
                }
            );
        }
    };
}