
export const getFilesRecursively = async (dir: string): Promise<string[]> => {
    return (await $`find ${dir} -type f`).stdout.split('\n').filter(Boolean);
};
