import * as vscode from 'vscode';
import { getSelectedTextIfOnlyOneSelection } from '../vscode-extensions';
import { PhpParserCached } from '../core/PhpParserCached';
import { TwigComponentUsageParser } from '../core/TwigComponentUsageParser';
import { findRoutes } from '../usage';
import { getFilesRecursively } from '../core/fs';

const IGNORED_PHP_FILE_PATHS = [
    '/var/cache/',
    '/vendor/',
    '/web/',
];


export async function findUsage(twigComponentUsageParser: TwigComponentUsageParser, phpParser: PhpParserCached) {
    const PROJECT_DIR = vscode.workspace.workspaceFolders[0].uri.fsPath;

    const selectedText = getSelectedTextIfOnlyOneSelection();

    if (!selectedText) {
        vscode.window.showErrorMessage('Please select a text to find usage of');
        return;
    }

    const files = await getFilesRecursively(PROJECT_DIR);
    const filesFromAllowedDirectories = files.filter(f => !IGNORED_PHP_FILE_PATHS.some(ip => f.includes(ip)));

    const routes = await findRoutes(phpParser, twigComponentUsageParser, filesFromAllowedDirectories, selectedText);

    const panel = vscode.window.createWebviewPanel(
        'catCoding', // Identifies the type of the webview. Used internally
        'Cat Coding', // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {} // Webview options. More on these later.
    );

    panel.webview.html = routes.join('\n');

    console.log(routes);

    vscode.window.showInformationMessage('Routes: ' + routes.join('\n'));
}
