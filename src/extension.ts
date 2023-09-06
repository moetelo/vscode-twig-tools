import * as vscode from 'vscode';
import { findUsage } from './commands/findUsage';
import { PhpParserCached } from './core/PhpParserCached';
import { TwigComponentUsageParser } from './core/TwigComponentUsageParser';
import { getCommitHash, getFilesByExtension } from './core/git';
import { getAffectedRoutesCommand } from './commands/getAffectedRoutes';

const EXTENSION_ROOT = './.vscode/extensions/vue-twig';


export const activate = (context: vscode.ExtensionContext) => vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Twig Extension',
    cancellable: false,
}, async (progress) => {
    const PROJECT_DIR = vscode.workspace.workspaceFolders[0].uri.fsPath;

    progress.report({ message: 'commit hash' });
    const commitHash = await getCommitHash(PROJECT_DIR);

    progress.report({ message: 'php parser' });
    const phpParser = new PhpParserCached(`${EXTENSION_ROOT}/cache/${commitHash}/phpAst.json`);

    progress.report({ message: 'vue files' });
    const vueFiles = await getFilesByExtension(PROJECT_DIR, 'vue');
    const vueComponentNames = vueFiles.map(f => f.split('/').at(-1).split('.')[0]);
    await fs.mkdir(`${EXTENSION_ROOT}/cache/${commitHash}`, { recursive: true });

    progress.report({ message: 'twigComponentUsageParser' });
    const twigComponentUsageParser = new TwigComponentUsageParser(
        `${EXTENSION_ROOT}/cache/${commitHash}/twigComponentUsage.json`,
        vueComponentNames,
    );
    await twigComponentUsageParser.initialize(PROJECT_DIR + '/templates');

	context.subscriptions.push(
		vscode.commands.registerCommand('vue-twig.find-usage', () => findUsage(twigComponentUsageParser, phpParser)),
        vscode.commands.registerCommand('vue-twig.get-affected-routes', () => getAffectedRoutesCommand(twigComponentUsageParser, phpParser)),
	);
});


export function deactivate() {}
