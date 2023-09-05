
export const findFilesAndRead = (
    filePaths: string[],
    fileExt: string,
) => {
    return filePaths
        .filter(file => file.endsWith(fileExt))
        .map(file => ({
            file,
            content: fs.readFileSync(file, 'utf8'),
        }));
};

export const getFilesRecursively = async (dir: string): Promise<string[]> => {
    return (await $`find ${dir} -type f`).stdout.split('\n').filter(Boolean);
};
