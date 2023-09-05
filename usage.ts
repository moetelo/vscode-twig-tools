import 'zx/globals';

import { PhpParserCached, Ast } from './core/PhpParserCached';
import { findFilesAndRead } from './core/fs';
import { TwigComponentUsageParser } from './core/TwigComponentUsageParser';


export const findRoutes = async (
    phpParser: PhpParserCached,
    twigComponentUsageParser: TwigComponentUsageParser,
    files: string[],
    componentName: string,
): Promise<string[]> => {
    const twigPathsContainingComponent = twigComponentUsageParser.getPathsContainingComponent(componentName);

    // console.time('phpFilesContainingTwig');
    const phpFilesContainingTwig = findFilesAndRead(files, 'Controller.php')
        .filter(php =>
            twigPathsContainingComponent.some(twig => php.content.includes(twig)),
        );
    // console.timeEnd('phpFilesContainingTwig');

    const routes: string[] = phpFilesContainingTwig.flatMap(phpFile => {
        const phpAst = phpParser.parseCode(phpFile.file);

        return extractRoutesFromClass(phpAst, twigPathsContainingComponent);
    });

    return routes;
};

const extractRoutesFromClass = (phpAst: Ast, twigPathsContainingComponent: string[]) => {
    const namespace = phpAst.children.find(x => x.kind === 'namespace');
    if (!namespace) {
        console.error('no namespace found for file');
        return [];
    }

    const classes = namespace.children.filter(x => x.kind === 'class');
    const methods = classes.flatMap(cls => cls.body.filter(x => x.kind === 'method'));

    return methods
        .map(parseRouteAndRenderedTemplate)
        .filter(Boolean)
        .filter(methodInfo => twigPathsContainingComponent.includes(methodInfo.renderedTemplate))
        .map(methodInfo => methodInfo.route);
};

const parseRouteAndRenderedTemplate = (method: any) => {
    const routeAttr = method.attrGroups.flatMap(x => x.attrs).find(x => x.name === 'Route');
    const ret = method.body.children.find(x => x.kind === 'return');

    if (!ret || ret.expr.kind !== 'call' || !routeAttr) {
        return null;
    }

    const route: string = routeAttr.args[0].value;
    const renderedTemplate: string = ret.expr.arguments[0]?.value;

    return {
        route,
        renderedTemplate,
    };
};