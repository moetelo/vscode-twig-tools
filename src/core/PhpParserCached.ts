import { Engine, Program } from 'php-parser';


export class PhpParserCached {
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

    invalidate(filename: string) {
        this._cache.delete(filename);

        const ast = this._parseWithoutCache(filename);
        this._cache.set(filename, ast);
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
}
