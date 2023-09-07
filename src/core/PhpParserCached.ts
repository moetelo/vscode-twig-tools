import { Engine } from 'php-parser';
import type { Ast } from '../declarations/php-parser';

export { Ast };


export class PhpParserCached {
    private readonly _cache = new Map<string, Ast>();

    private readonly _engine = new Engine({
        parser: {
            extractDoc: true,
            suppressErrors: true,
        },
        ast: {
            withPositions: true,
        },
    });

    invalidate(filename: string) {
        this._cache.delete(filename);

        const ast = this._parseWithoutCache(filename);
        this._cache.set(filename, ast);
    }

    parseCode(filename: string): Ast {
        const cachedAst = this._cache.get(filename);
        if (cachedAst) {
            return cachedAst;
        }

        const ast = this._parseWithoutCache(filename);
        this._cache.set(filename, ast);
        return ast;
    }

    _parseWithoutCache(filename: string): Ast {
        const code = fs.readFileSync(filename, 'utf8');
        return this._engine.parseCode(code, filename);
    }
}
