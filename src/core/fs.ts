
export const getFilesRecursively = (
    cwd: string,
    options?: { ignoredPaths?: string[], extensions?: string[] },
): Promise<string[]> => {
    const extensionsPartGlob = options?.extensions.length
        ? `*{${options.extensions.join(',')}}`
        : '*';

    return glob('**/' + extensionsPartGlob, { cwd, absolute: true, dot: true, onlyFiles: true });
};
