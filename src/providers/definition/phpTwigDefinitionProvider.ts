import * as vscode from 'vscode';
import { LanguageId } from '../../constants';
import { Node, String as PhpString, Program } from 'php-parser';
import { PhpParserCached, findTraverse, getChildren } from '../../core/PhpParserCached';

export function findTokenAtPosition(program: Program, position: vscode.Position): Node {
    const token = findTraverse(
        program,
        (node: Node) => {
            return node.loc.start.line === position.line + 1
                && node.loc.start.column <= position.character
                && node.loc.end.column >= position.character
                && !getChildren(node);
        },
    );

    return token;
};

export const createPhpTwigDefinitionProvider = (phpParser: PhpParserCached) => vscode.languages.registerDefinitionProvider(LanguageId.Php, {
    provideDefinition(document, position, _token) {
        const token = findTokenAtPosition(phpParser.parseCode(document.fileName), position);

        if (!token || token.kind !== 'string') {
            return null;
        }

        const strToken = token as PhpString;
        console.log(strToken.value);

        const projectDir = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const file = projectDir + '/templates/' + strToken.value;

        return new vscode.Location(vscode.Uri.file(file), new vscode.Position(0, 0));
    },
});
