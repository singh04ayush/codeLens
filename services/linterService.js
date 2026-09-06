const LINTERS = {
    eslint: {
        name: "ESLint",
        files: [".js", ".jsx", ".ts", ".tsx"]
    },

    ruff: {
        name: "Ruff",
        files: [".py"]
    },

    checkstyle: {
        name: "Checkstyle",
        files: [".java"]
    },

    clangTidy: {
        name: "clang-tidy",
        files: [".c", ".cpp", ".cc", ".h", ".hpp"]
    },

    semgrep: {
        name: "Semgrep",
        files: [
            ".js",
            ".jsx",
            ".ts",
            ".tsx",
            ".py",
            ".java",
            ".c",
            ".cpp",
            ".go"
        ]
    }
};


function getExtension(filename) {
    const index = filename.lastIndexOf(".");

    if (index === -1) {
        return "";
    }

    return filename.slice(index).toLowerCase();
}


function supportsFile(linter, filename) {
    const extension = getExtension(filename);

    return linter.files.includes(extension);
}


export async function runLinters({ files }) {

    const results = [];

    for (const [key, linter] of Object.entries(LINTERS)) {

        const applicableFiles = files
            .filter(file => supportsFile(linter, file.filename))
            .map(file => file.filename);

        results.push({
            name: linter.name,
            applicable: applicableFiles.length > 0,
            files: applicableFiles,
            status: applicableFiles.length > 0
                ? "READY"
                : "SKIPPED",
            findings: []
        });
    }

    return results;
}