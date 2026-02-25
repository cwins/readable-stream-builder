import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const labelColors = new Map<string, string>();
const getLabelColor = (label: string) => {
    if (labelColors.has(label)) {
        return labelColors.get(label);
    }

    // a few basic color options with varying brightness
    const color = ['\x1b[1;', Math.random() < 0.5 ? 3 : 9, Math.round(Math.random() * 4) + 2, 'm%s\x1b[0m'].join('');
    labelColors.set(label, color);

    return color;
}

fs.readdir(path.join(process.cwd(), 'examples'), { withFileTypes: true}, (err, children) => {
    if (err) {
        console.error(err);

        process.exit(1);
    }

    const exampleDirs = children.filter((child) => child.isDirectory());
    const skipInstall = process.env.SKIP_EXAMPLES_INSTALL === '1';

    const errors: Array<[string, Error]> = [];
    const results: Array<[string, boolean]> = [];

    exampleDirs.forEach((dir) => {
        const dirPath = path.join(dir.parentPath, dir.name);
        console.log(getLabelColor(dir.name), `${dir.name} Running tests for examples/${dir.name}`);

        try {
            [
            () => {
                if (skipInstall) {
                    console.log(getLabelColor(dir.name), `${dir.name} skipping install (SKIP_EXAMPLES_INSTALL=1)`);
                    return '';
                }

                return execSync('rm -rf node_modules && pnpm install --no-lockfile', { cwd: dirPath, encoding: 'utf8' });
            },
            () => execSync('pnpm run test', { cwd: dirPath, encoding: 'utf8' })

            ].forEach((cmd) => {
                const output = cmd();

                output.trim().split('\n').forEach((outputLine) => {
                    console.log(getLabelColor(dir.name), `${dir.name}`, outputLine);
                });
            });

            results.push([dir.name, true]);
        }
        catch (error) {
            errors.push([dir.name, error as Error]);
            results.push([dir.name, false]);
        }

        if (!skipInstall) {
            try {
                execSync('rm -rf node_modules', { cwd: dirPath, stdio: 'pipe' });
            }
            catch (error) {
                // this is a cleanup phase, so we'll just log the error, but not fail
                console.error(error);
            }
        }
    });

    if (errors.length > 0) {
        console.info(`!!! Encountered ${errors.length} errors !!!`);

        errors.forEach((err) => {
            const [label, error] = err;

            console.warn((error as any).stderr.toString());

            // we don't need signal, pid, status, etc.
            const simplifiedError = { message: error.message, name: error.name, cause: error.cause, stack: error.stack };

            console.log(getLabelColor(label), `\n${label}`);
            console.error(error.name, error.message, error.stack);
        });
    };

    console.log('\n### Results ###');

    results.forEach((result) => {
        const [label, passed] = result;

        console.log(label, '--', passed ? '✅ PASS' : '❌ FAIL');
    });

    if (errors.length > 0) {
        process.exit(1);
    }
});
