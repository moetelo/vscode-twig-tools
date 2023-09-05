import 'zx/globals';

export const getFilesByExtension = (gitProjectPath: string, ext: string): Promise<string[]> => {
    return within(async () => {
        cd(gitProjectPath);
        const files = await $`find . -name '*.${ext}'`;

        return files.stdout.match(/[^\n]+/g);
    });
};

export const getModifiedVueFiles = (gitProjectPath: string, comparedBranches: [string, string] | [] = []): Promise<string[]> => {
    return within(async () => {
        cd(gitProjectPath);
        const modifiedFiles = await $`git diff --name-only ${comparedBranches} | grep vue$`;

        return modifiedFiles.stdout.match(/[^\n]+/g);
    });
};

export const getCommitHash = (gitProjectPath: string): Promise<string> => {
    return within(async () => {
        cd(gitProjectPath);
        const commitHash = await $`git rev-parse HEAD`;

        return commitHash.stdout.trim();
    });
};
