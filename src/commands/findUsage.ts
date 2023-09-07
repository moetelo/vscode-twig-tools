import * as vscode from 'vscode';
import { getSelectedTextIfOnlyOneSelection } from '../vscode-extensions';
import { PhpParserCached } from '../core/PhpParserCached';
import { TwigComponentUsageParser } from '../core/TwigComponentUsageParser';
import { findRoutes } from '../usage';
import { getFilesRecursively } from '../shell/fs';

const IGNORED_PHP_FILE_PATHS = [
    '/var/cache/',
    '/vendor/',
    '/web/',
];


export async function findUsage(twigComponentUsageParser: TwigComponentUsageParser, phpParser: PhpParserCached) {
    const projectDir = vscode.workspace.workspaceFolders[0].uri.fsPath;

    const componentName = getSelectedTextIfOnlyOneSelection();

    if (!componentName) {
        vscode.window.showErrorMessage('Please select a text to find usage of');
        return;
    }

    const title = `Routes for ${componentName}`;

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title,
        cancellable: false,
    }, async (progress) => {
        progress.report({ message: 'Getting files' });

        const files = await getFilesRecursively(projectDir);
        const filesFromAllowedDirectories = files.filter(f => !IGNORED_PHP_FILE_PATHS.some(ip => f.includes(ip)));

        progress.report({ message: `Found ${filesFromAllowedDirectories.length} files.\n Searching routes` });
        const routes = await findRoutes(phpParser, twigComponentUsageParser, filesFromAllowedDirectories, componentName);

        if (!routes.length) {
            vscode.window.showErrorMessage(`No routes found for ${componentName}`, {
                modal: true,
            });
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            `routes:${componentName}`,
            title,
            vscode.ViewColumn.One,
        );

        panel.webview.html = `
            <h1>${title}<h1>
            <div>${routes.join('<br>')}</div>
        `;
    });
}
