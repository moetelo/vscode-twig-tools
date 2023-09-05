import 'zx/globals';
$.verbose = false;

import { getCommitHash, getModifiedVueFiles } from './core/git';
import { findRoutes } from './usage';
import { PhpParserCached } from './core/PhpParserCached';
import { TwigComponentUsageParser } from './core/TwigComponentUsageParser';
import { getFilesRecursively } from './core/fs';
import { customSpinner } from './console-extensions/spinner';

const PROJECT_DIR = '/home/mikhail/projects/some-proj/';

const IGNORED_PHP_FILE_PATHS = [
    '/var/cache/',
    '/vendor/',
    '/web/',
];

const mapAsync = async <T, U>(arr: T[], fn: (item: T) => Promise<U>): Promise<U[]> => {
    const result: U[] = [];
    for (const item of arr) {
        result.push(await fn(item));
    }
    return result;
};


const main = async () => {
    // const vueFiles = await getFilesByExtension(PROJECT_DIR, 'vue');
    const vueFiles = await getModifiedVueFiles(PROJECT_DIR, ['some-edited-branch', 'origin/master']);
    const vueComponentNames = vueFiles.map(f => f.split('/').at(-1).split('.')[0]);

    const files = await getFilesRecursively(PROJECT_DIR);
    const filesFromAllowedDirectories = files.filter(f => !IGNORED_PHP_FILE_PATHS.some(ip => f.includes(ip)));

    const commitHash = await getCommitHash(PROJECT_DIR);

    fs.mkdir(`./cache/${commitHash}`, { recursive: true });
    const twigComponentUsageParser = new TwigComponentUsageParser(
        `./cache/${commitHash}/twigComponentUsage.json`,
        vueComponentNames,
    );

    await customSpinner(
        'Initializing twig component usage...',
        async () => await twigComponentUsageParser.initialize(PROJECT_DIR + 'templates'),
    );

    const phpParser = new PhpParserCached(`./cache/${commitHash}/phpAst.json`);

    const componentsWithAffectedRoutes = await customSpinner(
        'Finding affected routes...',
        () => mapAsync(
            vueComponentNames,
            async componentName => ({
                componentName,
                routes: await findRoutes(phpParser, twigComponentUsageParser, filesFromAllowedDirectories, componentName),
            }),
        ),
    );

    const affectedRouteToComponent = componentsWithAffectedRoutes.map(
        u => u.routes.map(r => ({ route: r, component: u.componentName }))
    )
        .flat()
        .reduce(
            (acc, { route, component }) => ({
            ...acc,
            [route]: [
                ...(acc[route] || []),
                component,
            ]}),
            {},
        );

    console.log();
    console.log('Affected routes:');
    console.log(affectedRouteToComponent);
};


main();
