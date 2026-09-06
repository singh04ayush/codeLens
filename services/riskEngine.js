export function calculateRisk(change) {

    let score = 0;
    const reasons = [];

    if (change.additions + change.deletions > 500) {
        score += 30;
        reasons.push("Large change size");
    } else if (change.additions + change.deletions > 200) {
        score += 20;
        reasons.push("Moderately large change");
    }

    const criticalAreas = [
        "DATABASE",
        "SECURITY",
        "AUTHENTICATION",
        "TRANSACTION",
        "MIDDLEWARE"
    ];

    for (const area of change.areas) {

        if (criticalAreas.includes(area)) {
            score += 15;
            reasons.push(`Critical area: ${area}`);
        }
    }

    if (change.areas.includes("DEPENDENCY")) {
        score += 10;
        reasons.push("Dependency changed");
    }

    if (change.importantFiles.length > 0) {
        score += 10;
        reasons.push("Large/important files modified");
    }

    score = Math.min(score, 100);

    let level = "LOW";

    if (score >= 70) {
        level = "HIGH";
    } else if (score >= 40) {
        level = "MEDIUM";
    }

    return {
        score,
        level,
        reasons
    };
}