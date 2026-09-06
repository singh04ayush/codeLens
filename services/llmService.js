import OpenAI from "openai";
import logger from "../utils/logger.js";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


export async function analyzeWithAI(data) {

    logger.step("analyzeWithAI — building prompt");

    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not set in environment");
    }

    if (!process.env.OPENAI_MODEL) {
        throw new Error("OPENAI_MODEL is not set in environment");
    }

    logger.info("OpenAI config", {
        model: process.env.OPENAI_MODEL,
        apiKeyPreview: process.env.OPENAI_API_KEY?.slice(0, 12) + "...",
    });

    const prompt = `
You are CodeLens, an AI-powered GitHub Pull Request reviewer.

Analyze this pull request using the supplied GitHub data and
preliminary static analysis.

Return a clear and concise review for a software developer.

IMPORTANT:
- Do not invent issues.
- Only report issues supported by the provided changes.
- Distinguish actual problems from possible concerns.
- Focus on meaningful correctness, security, maintainability,
  performance and architectural issues.
- Keep the review practical.

PULL REQUEST
Repository: ${data.repository}
Title: ${data.title}
Author: ${data.author}

Description:
${data.description}

CHANGE ANALYSIS
${JSON.stringify(data.changeAnalysis, null, 2)}

RISK ANALYSIS
${JSON.stringify(data.risk, null, 2)}

DEPENDENCY MAP
${JSON.stringify(data.dependencyMap, null, 2)}

LINTER CHECKS
${JSON.stringify(data.lintResults, null, 2)}

CHANGED FILES
${JSON.stringify(data.files, null, 2)}

COMMITS
${JSON.stringify(data.commits, null, 2)}

Produce the review using this structure:

## Summary

Give a plain-language explanation of what this PR does.

## Change Classification

Mention the important areas and types of changes.

## Key Files to Focus On

List the most important files for the reviewer and briefly explain why.

## Potential Issues

For each meaningful issue provide:

- Severity: Critical / High / Medium / Low
- Category
- File
- Explanation
- Recommendation

If no significant issue is found, explicitly say so.

## Risk

Give the overall risk level using the supplied risk analysis.
Do not arbitrarily change the calculated risk score.

## Dependencies & Related Context

Mention important affected or related files.

## Pre-Merge Checks

Summarize the supplied linter/static checks and identify
anything that requires attention.

## Estimated Review Effort

Estimate the review effort as:
- Quick (<10 minutes)
- Moderate (10-30 minutes)
- Extensive (>30 minutes)

Briefly explain the estimate.

Keep the final response concise and useful.
`;

    logger.info("Prompt built", {
        promptLength: prompt.length,
        estimatedTokens: Math.ceil(prompt.length / 4),
    });

    logger.step("Calling openai.chat.completions.create...");

    let response;
    try {
        response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are a senior software engineer specializing in code review, security, architecture and maintainability.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });
    } catch (err) {
        logger.error("openai.chat.completions.create threw an error", {
            message: err.message,
            status: err.status,
            code: err.code,
            type: err.type,
        });
        throw err;
    }

    logger.debug("OpenAI raw response", {
        id: response.id,
        model: response.model,
        usage: response.usage,
        finishReason: response.choices?.[0]?.finish_reason,
    });

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
        logger.error("OpenAI returned an empty response", { response });
        throw new Error("OpenAI returned empty content");
    }

    logger.success("OpenAI response received", {
        length: content.length,
        preview: content.slice(0, 300),
    });

    return content;
}