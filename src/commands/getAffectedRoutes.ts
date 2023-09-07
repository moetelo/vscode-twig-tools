import * as vscode from 'vscode';
import { PhpParserCached } from '../core/PhpParserCached';
import { TwigComponentUsageParser } from '../core/TwigComponentUsageParser';
import { getFilesRecursively } from '../shell/fs';
import { getModifiedVueFiles, getCommitHash, getBranches } from '../shell/git';
import { findRoutes } from '../usage';
import { mapAsync } from '../utils/array';

const IGNORED_PHP_FILE_PATHS = [
    '/var/cache/',
    '/vendor/',
    '/web/',
];

export const getAffectedRoutesCommand = async (twigComponentUsageParser: TwigComponentUsageParser, phpParser: PhpParserCached) => {
    const projectDir = vscode.workspace.workspaceFolders[0].uri.fsPath;

    const branches = await getBranches(projectDir);

    const comparedBranch = await vscode.window.showQuickPick(
        branches,
        { title: 'Compared branch' },
    );

    if (!comparedBranch) {
        return;
    }

    const sourceBranch = await vscode.window.showQuickPick(
        branches.filter(b => b !== comparedBranch),
        { title: 'Source branch' },
    );

    if (!sourceBranch) {
        return;
    }

    console.log({ comparedBranch, sourceBranch });

    const affectedRoutes = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Twig Extension',
        cancellable: false,
    }, async (progress) => {
        progress.report({ message: 'Getting affected routes...' });
        return getAffectedRoutes(twigComponentUsageParser, phpParser, comparedBranch, sourceBranch);
    });

    const panel = vscode.window.createWebviewPanel(
        `routes:${comparedBranch}:${sourceBranch}`,
        `Affected routes`,
        vscode.ViewColumn.One,
    );

    panel.webview.html = `
        <h1>Affected routes<h1>
        <div>${
            Object.entries(affectedRoutes).map(([route, components]) => `
                <div>
                    <h2>${route}</h2>
                    <ol>
                        ${components.map((c) => `<li>${c}</li>`).join('')}
                    </ol>
                </div>
                `
            ).join('')
        }</div>
    `;
};


const getAffectedRoutes = async (
    twigComponentUsageParser: TwigComponentUsageParser,
    phpParser: PhpParserCached,
    comparedBranch: string,
    sourceBranch: string,
) => {
    const projectDir = vscode.workspace.workspaceFolders[0].uri.fsPath;

    const vueFiles = await getModifiedVueFiles(projectDir, comparedBranch, sourceBranch);
    const vueComponentNames = vueFiles.map(f => f.split('/').at(-1).split('.')[0]);

    const files = await getFilesRecursively(projectDir);
    const filesFromAllowedDirectories = files.filter(f => !IGNORED_PHP_FILE_PATHS.some(ip => f.includes(ip)));

    const commitHash = await getCommitHash(projectDir);

    fs.mkdir(`./cache/${commitHash}`, { recursive: true });

    const componentsWithAffectedRoutes = await mapAsync(
        vueComponentNames,
        async componentName => ({
            componentName,
            routes: await findRoutes(phpParser, twigComponentUsageParser, filesFromAllowedDirectories, componentName),
        }),
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
            {} as Record<string, string[]>,
        );

    return affectedRouteToComponent;
};
