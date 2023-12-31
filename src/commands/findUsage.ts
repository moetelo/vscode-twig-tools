import * as vscode from 'vscode';
import { getSelectedTextIfOnlyOneSelection } from '../vscode-extensions';
import { PhpParserCached } from '../core/PhpParserCached';
import { TwigComponentUsageParser } from '../core/TwigComponentUsageParser';
import { findRoutes } from '../usage';


export async function findUsage(twigComponentUsageParser: TwigComponentUsageParser, phpParser: PhpParserCached) {
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
        const filesFromAllowedDirectories = await vscode.workspace.findFiles('**/*{Controller.php,.html.twig}');

        progress.report({ message: `Found ${filesFromAllowedDirectories.length} files.\n Searching routes` });
        const routes = await findRoutes(phpParser, twigComponentUsageParser, filesFromAllowedDirectories.map(x => x.fsPath), componentName);

        if (!routes.length) {
            vscode.window.showErrorMessage(`No routes found for ${componentName}`);
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
