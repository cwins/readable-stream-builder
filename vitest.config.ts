import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        reporters: 'verbose',
        watch: false,
        expect: {
            requireAssertions: true
        },
        name: {
            label: process.versions?.bun ? 'Bun' : 'Node'
        },
        include: ['./__tests__/*'],
        coverage: {
            provider: 'v8',
            thresholds: {
                branches: 100,
                functions: 100,
                lines: 100,
                statements: 100,
                perFile: true,
                autoUpdate: true
            }
        }   
    }
})