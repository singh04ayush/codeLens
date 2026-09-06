export function buildDependencyMap(files) {

    const map = {};

    for (const file of files) {

        const imports = extractImports(file.patch);

        map[file.filename] = imports;
    }

    return map;
}


function extractImports(patch) {

    const imports = [];

    const regex = /(?:import .* from ['"](.+?)['"]|require\(['"](.+?)['"]\))/g;

    let match;

    while ((match = regex.exec(patch)) !== null) {
        imports.push(match[1] || match[2]);
    }

    return imports;
}