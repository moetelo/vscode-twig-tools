import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export const getModifiedVueFiles = async (gitProjectPath: string, comparedBranches: [string, string] | [] = []): Promise<string[]> => {
    try {
        const { stdout } = await execPromise('git diff --name-only ' + comparedBranches.join(' '), { cwd: gitProjectPath });

        const modifiedFiles = stdout.split('\n')
            .filter(fileName => fileName.endsWith('.vue'));

        return modifiedFiles;
    } catch (error) {
        throw new Error(error);
    }
};