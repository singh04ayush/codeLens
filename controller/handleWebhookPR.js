import { createGitHubService } from "../services/githubService.js";


export async function handleWebhookPR(req, res) {

    const eventType = req.headers["x-github-event"];

    if (eventType === "ping") {
        return res.json({
            status: "pong"
        });
    }


    if (eventType === "pull_request") {

        const action = req.body.action;

        if (["opened", "synchronize", "reopened"].includes(action)) {

            // Respond immediately to GitHub
            res.status(202).json({
                status: "accepted"
            });


            setImmediate(async () => {

                try {

                    const installationId =
                        req.body.installation?.id;

                    const repository =
                        req.body.repository;

                    const owner =
                        repository.owner.login;

                    const repo =
                        repository.name;

                    const prNumber =
                        req.body.pull_request.number;


                    console.log("========== CodeLens ==========");
                    console.log("Action:", action);
                    console.log("Installation:", installationId);
                    console.log("Repository:", `${owner}/${repo}`);
                    console.log("PR:", prNumber);
                    console.log("==============================");


                    // Create authenticated GitHub service
                    const github =
                        await createGitHubService(
                            installationId
                        );


                    // Get PR
                    const pr =
                        await github.getPullRequest(
                            owner,
                            repo,
                            prNumber
                        );


                    // Get changed files
                    const files =
                        await github.getPullRequestFiles(
                            owner,
                            repo,
                            prNumber
                        );


                    // Get commits
                    const commits =
                        await github.getPullRequestCommits(
                            owner,
                            repo,
                            prNumber
                        );


                    console.log(
                        "PR Title:",
                        pr.title
                    );

                    console.log(
                        "Files:",
                        files.length
                    );

                    console.log(
                        "Commits:",
                        commits.length
                    );


                } catch (err) {

                    console.error(
                        "❌ CodeLens Error:",
                        err
                    );

                }

            });

            return;
        }
    }


    return res.json({
        status: "ignored"
    });
}