import * as vscode from 'vscode';
import { Class, Engine, Method, Namespace, Program, Node as PhpNode, Block } from 'php-parser';

import { DisposableLike } from '../vscode-extensions';

export const getChildren = (node: PhpNode) => {
    const anyNode = node as any;
    return anyNode.children
        || anyNode.body?.children
        || Array.isArray(anyNode.body) && anyNode.body
        || anyNode.arguments
        || anyNode.expr && [ anyNode.expr ];
};

export const findTraverse = (node: PhpNode, condition: (node: PhpNode) => boolean) => {
    if (condition(node)) {
        return node;
    }

    const children = getChildren(node);

    if (!children) {
        return null;
    }

    for (const child of children) {
        const found = findTraverse(child, condition);
        if (found) {
            return found;
        }
    }

    return null;
};


export class PhpParserCached implements DisposableLike {
    private readonly _cache = new Map<string, Program>();

    private readonly _engine = new Engine({
        parser: {
            extractDoc: true,
            suppressErrors: true,
        },
        ast: {
            withPositions: true,
        },
    });

    private readonly _disposables: vscode.Disposable[] = [];

    constructor() {
        this._disposables.push(
            vscode.workspace.onDidSaveTextDocument((document) => {
                const { fsPath } = document.uri;

                if (fsPath.endsWith('.php') && this._cache.has(fsPath)) {
                    this.invalidate(fsPath);
                }
            })
        );
    }

    invalidate(filename: string) {
        console.log(`Invalidating cache for ${filename}`);

        try {
            const ast = this._parseWithoutCache(filename);
            this._cache.set(filename, ast);
        } catch (err) {
            console.error(`Failed to invalidate cache for ${filename}`, err);
        }
    }

    parseCode(filename: string) {
        const cachedAst = this._cache.get(filename);
        if (cachedAst) {
            return cachedAst;
        }

        const ast = this._parseWithoutCache(filename);
        this._cache.set(filename, ast);
        return ast;
    }

    _parseWithoutCache(filename: string) {
        const code = fs.readFileSync(filename, 'utf8');
        return this._engine.parseCode(code, filename);
    }

    dispose(): void {
        this._disposables.forEach(x => x.dispose());
    }
}
