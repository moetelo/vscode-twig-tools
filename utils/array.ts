
export const mapAsync = async <T, U>(arr: T[], fn: (item: T) => Promise<U>): Promise<U[]> => {
    const result: U[] = [];
    for (const item of arr) {
        result.push(await fn(item));
    }
    return result;
};
