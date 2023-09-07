import filtersArr from '../twig/snippets/filters.json';
import functionsArr from '../twig/snippets/functions.json';
import twigArr from '../twig/snippets/twig.json';

export const enum LanguageId {
    Twig = 'twig',
    Php = 'php',
}

export const snippets = [
    ...filtersArr,
    ...functionsArr,
    ...twigArr,
];
