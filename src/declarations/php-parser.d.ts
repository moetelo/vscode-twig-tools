export type Ast = any;

declare module 'php-parser' {
    export default class engine {
        constructor(args: Record<string, unknown>);

        parseCode(code: string): Ast;
    }
}
