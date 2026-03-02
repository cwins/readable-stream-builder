import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        reporters: 'verbose',
        watch: false,
        expect: {
            requireAssertions: true
        },
        snapshotSerializers: ['jest-serializer-html'],
        name: {
            label: process.versions?.bun ? 'Bun' : 'Node'
        }
    }
})