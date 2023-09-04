import { getModifiedVueFiles } from './diff';
import { findRoutes } from './usage';

const PROJECT_DIR = '/home/mikhail/projects/some-proj/';

const main = async () => {
    const vueFiles = await getModifiedVueFiles(PROJECT_DIR, ['some-edited-branch', 'origin/master']);
    const vueComponentNames = vueFiles.map(f => f.split('/').at(-1).split('.')[0]);
    console.log(vueComponentNames);

    const affectedRoutes = vueComponentNames.flatMap(componentName => ({ componentName, routes: findRoutes(PROJECT_DIR, componentName) }));

    console.log();
    console.log('Affected routes:');
    console.log(
        affectedRoutes.map(
            u => u.componentName + ': ' + u.routes.join(', ')
        ).join('\n')
    );
};


main();
