export function analyzeChanges(files) {

    const result = {
        areas: new Set(),
        types: [],
        importantFiles: [],
        additions: 0,
        deletions: 0
    };

    for (const file of files) {

        result.additions += file.additions;
        result.deletions += file.deletions;

        const path = file.filename.toLowerCase();

        if (
            path.includes("controller") ||
            path.includes("route")
        ) {
            result.areas.add("CONTROLLER");
        }

        if (
            path.includes("middleware") ||
            path.includes("auth")
        ) {
            result.areas.add("MIDDLEWARE");
        }

        if (
            path.includes("schema") ||
            path.includes("migration") ||
            path.includes("prisma")
        ) {
            result.areas.add("DATABASE");
        }

        if (
            path.includes(".env") ||
            path.includes("config")
        ) {
            result.areas.add("CONFIG");
        }

        if (
            path.endsWith("package.json") ||
            path.endsWith("package-lock.json")
        ) {
            result.areas.add("DEPENDENCY");
        }

        if (
            path.includes(".tsx") ||
            path.includes(".jsx") ||
            path.includes("/components/")
        ) {
            result.areas.add("UI");
        }

        if (
            path.includes("test") ||
            path.includes("spec")
        ) {
            result.areas.add("TEST");
        }

        if (file.changes > 100) {
            result.importantFiles.push(file.filename);
        }
    }

    result.types = [...result.areas];
    result.areas = [...result.areas];

    return result;
}