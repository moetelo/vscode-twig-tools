import * as vscode from 'vscode';
import { findUsage } from './commands/find-usage';
import { PhpParserCached } from './core/PhpParserCached';
import { TwigComponentUsageParser } from './core/TwigComponentUsageParser';
import { getCommitHash, getFilesByExtension } from './core/git';

const EXTENSION_ROOT = './.vscode/extensions/vue-twig';


export async function activate(context: vscode.ExtensionContext) {
    const PROJECT_DIR = vscode.workspace.workspaceFolders[0].uri.fsPath;

    const commitHash = await getCommitHash(PROJECT_DIR);

    const phpParser = new PhpParserCached(`${EXTENSION_ROOT}/cache/${commitHash}/phpAst.json`);

    const vueFiles = await getFilesByExtension(PROJECT_DIR, 'vue');
    const vueComponentNames = vueFiles.map(f => f.split('/').at(-1).split('.')[0]);
    await fs.mkdir(`${EXTENSION_ROOT}/cache/${commitHash}`, { recursive: true });

    const twigComponentUsageParser = new TwigComponentUsageParser(
        `${EXTENSION_ROOT}/cache/${commitHash}/twigComponentUsage.json`,
        vueComponentNames,
    );
    await twigComponentUsageParser.initialize(PROJECT_DIR + '/templates');

    vscode.window.showInformationMessage('Vue Twig extension is now active!');

	context.subscriptions.push(
		vscode.commands.registerCommand('vue-twig.find-usage', () => findUsage(twigComponentUsageParser, phpParser)),
	);

}

export function deactivate() {}
