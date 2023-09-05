
// https://github.com/google/zx/blob/7b97d2e175b4da09f0635c194fa8fa11de7b0246/src/goods.ts#L181
export async function customSpinner<T>(
    title: string | (() => T),
    callback: () => T,
    options: {
        clear?: boolean,
        timed?: boolean,
    } = { clear: true, timed: true },
): Promise<T> {
    let i = 0;
    const spin = () => process.stderr.write(`  ${'⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'[i++ % 10]} ${title}\r`);

    return within(async () => {
        $.verbose = false;

        const startTime = performance.now();

        const id = setInterval(spin, 100);
        let result: T;
        try {
            result = await callback!();
        } finally {
            clearInterval(id);

            options?.clear && process.stderr.write(' '.repeat(process.stdout.columns - 1) + '\r');

            options?.timed && console.log(`  ${title} (${(performance.now() - startTime).toFixed(2)}ms)`);
        }

        return result;
    })
}
