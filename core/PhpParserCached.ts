import { CachedMap } from './CachedMap';

import { Engine } from 'php-parser';
import type { Ast } from '../declarations/php-parser';

export { Ast };


export class PhpParserCached {
    _cache: CachedMap<string, Ast>;
    _engine: Engine;

    constructor(cacheJsonFilePath: string) {
        this._cache = new CachedMap(cacheJsonFilePath);
        this._engine = new Engine({
            parser: {
                extractDoc: true,
                suppressErrors: true,
            },
            ast: {
                withPositions: true,
            },
        });
    }

    isCached(): boolean {
        return this._cache.hasAnyKeys();
    }

    getCached(filename: string): Ast | undefined {
        if (!this._cache.get(filename)) {
            throw new Error(`File ${filename} is not cached`);
        }

        return this._cache.get(filename);
    }

    parseCode(filename: string): Ast {
        const cachedAst = this._cache.get(filename);
        if (cachedAst) {
            return cachedAst;
        }

        const code = fs.readFileSync(filename, 'utf8');
        const ast = this._engine.parseCode(code, filename);
        this._cache.set(filename, ast);
        return ast;
    }
}
