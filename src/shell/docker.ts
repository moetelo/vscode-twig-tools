export const enum SymfonyCommand {
    DebugTwig = 'debug:twig',
    DebugRouter = 'debug:router',
}

export const isDockerInstalled = async () => {
    const version = await $`docker --version`;

    return version.exitCode === 0;
};

export const executeSymfonyCommand = async (projectDir: string, command: SymfonyCommand) => within(async () => {
    cd(projectDir);
    const result = await $`docker compose exec php bin/console ${command}`;
    return result.stdout;
});
