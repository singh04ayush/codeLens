import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

const GITHUB_API = process.env.GITHUB_API;


function generateAppJWT() {
    logger.step("generateAppJWT — generating GitHub App JWT");

    if (!process.env.GITHUB_APP_ID) {
        throw new Error("GITHUB_APP_ID is not set in environment");
    }

    if (!process.env.GITHUB_AUTH_PRIVATE_KEY) {
        throw new Error("GITHUB_AUTH_PRIVATE_KEY is not set in environment");
    }

    const now = Math.floor(Date.now() / 1000);

    const payload = {
        iat: now - 60,
        exp: now + 540,
        iss: process.env.GITHUB_APP_ID,
    };

    logger.debug("JWT payload", { iss: payload.iss, iat: payload.iat, exp: payload.exp });

    const privateKey = process.env.GITHUB_AUTH_PRIVATE_KEY.replace(/\\n/g, "\n");

    const token = jwt.sign(payload, privateKey, { algorithm: "RS256" });

    logger.success("App JWT generated", { preview: token.slice(0, 30) + "..." });

    return token;
}


async function getInstallationToken(installationId) {
    logger.step(`getInstallationToken — installation: ${installationId}`);

    const appJWT = generateAppJWT();

    const url = `${GITHUB_API}/app/installations/${installationId}/access_tokens`;
    logger.info("Requesting installation access token", { url });

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Accept": "application/vnd.github+json",
            "Authorization": `Bearer ${appJWT}`,
            "X-GitHub-Api-Version": "2022-11-28",
        },
    });

    logger.debug("Installation token response", {
        status: response.status,
        statusText: response.statusText,
    });

    if (!response.ok) {
        const error = await response.text();
        logger.error("Failed to get installation token", {
            status: response.status,
            body: error,
        });
        throw new Error(`Failed to get installation token: ${response.status} ${error}`);
    }

    const data = await response.json();
    logger.success("Installation token obtained", {
        expiresAt: data.expires_at,
        permissions: data.permissions,
    });

    return data.token;
}


export async function createGitHubService(installationId) {
    logger.step(`createGitHubService — installationId: ${installationId}`);

    const installationToken = await getInstallationToken(installationId);

    const headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${installationToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
    };


    async function githubRequest(url, options = {}) {
        logger.info(`GitHub API request: ${options.method || "GET"} ${url}`);

        const response = await fetch(url, {
            ...options,
            headers: {
                ...headers,
                ...(options.headers || {}),
            },
        });

        logger.debug("GitHub API response", {
            url,
            status: response.status,
            statusText: response.statusText,
        });

        if (!response.ok) {
            const error = await response.text();
            logger.error("GitHub API request failed", {
                url,
                status: response.status,
                body: error,
            });
            throw new Error(`GitHub API Error: ${response.status} ${error}`);
        }

        const result = await response.json();
        logger.debug("GitHub API response body", {
            url,
            resultType: Array.isArray(result) ? `array[${result.length}]` : typeof result,
        });

        return result;
    }


    return {

        async getPullRequest(owner, repo, prNumber) {
            logger.step(`getPullRequest — ${owner}/${repo}#${prNumber}`);
            return githubRequest(
                `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}`
            );
        },


        async getPullRequestFiles(owner, repo, prNumber) {
            logger.step(`getPullRequestFiles — ${owner}/${repo}#${prNumber}`);
            return githubRequest(
                `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/files`
            );
        },


        async getPullRequestCommits(owner, repo, prNumber) {
            logger.step(`getPullRequestCommits — ${owner}/${repo}#${prNumber}`);
            return githubRequest(
                `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/commits`
            );
        },


        async createComment(owner, repo, prNumber, body) {
            logger.step(`createComment — ${owner}/${repo}#${prNumber}`);
            logger.debug("Comment body preview", {
                length: body?.length,
                preview: body?.slice(0, 200),
            });

            return githubRequest(
                `${GITHUB_API}/repos/${owner}/${repo}/issues/${prNumber}/comments`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ body }),
                }
            );
        },
    };
}