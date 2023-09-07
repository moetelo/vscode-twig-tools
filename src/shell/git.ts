
export const getFilesByExtension = (gitProjectPath: string, ext: string): Promise<string[]> => within(async () => {
    cd(gitProjectPath);
    const files = await $`find . -name '*.${ext}'`;

    return files.stdout.match(/[^\n]+/g);
});

export const getModifiedVueFiles = (gitProjectPath: string, comparedBranch: string, sourceBranch: string): Promise<string[]> => within(async () => {
    cd(gitProjectPath);
    const modifiedFiles = await $`git diff --name-only ${[comparedBranch, sourceBranch]} | grep vue$`;

    return modifiedFiles.stdout.match(/[^\n]+/g);
});

export const getCommitHash = (gitProjectPath: string): Promise<string> => within(async () => {
    cd(gitProjectPath);
    const commitHash = await $`git rev-parse HEAD`;

    return commitHash.stdout.trim();
});

export const getBranches = (gitProjectPath: string): Promise<string[]> => within(async () => {
    cd(gitProjectPath);
    const branches = await $`git for-each-ref --sort -committerdate --format "%(refname:short)"`;

    return branches.stdout.split('\n').filter(Boolean).map(x => x.replace(/^\* /g, '').trim());
});
