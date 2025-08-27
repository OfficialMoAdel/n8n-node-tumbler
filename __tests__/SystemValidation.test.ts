import * as fs from 'fs';
import * as path from 'path';

describe('System Validation Tests', () => {
    describe('File Structure Validation', () => {
        it('should have all required main files', () => {
            const requiredFiles = [
                'package.json',
                'tsconfig.json',
                'gulpfile.js',
                'jest.config.js',
                '.eslintrc.js',
                '.gitignore',
            ];

            requiredFiles.forEach(file => {
                expect(fs.existsSync(file)).toBe(true);
            });
        });

        it('should have proper node structure', () => {
            const nodeFiles = [
                'nodes/Tumblr/Tumblr.node.ts',
                'nodes/Tumblr/TumblrAuthenticator.ts',
                'nodes/Tumblr/OperationRouter.ts',
                'nodes/Tumblr/ErrorHandler.ts',
                'nodes/Tumblr/RateLimitHandler.ts',
                'nodes/Tumblr/DataValidator.ts',
                'nodes/Tumblr/NetworkErrorHandler.ts',
                'nodes/Tumblr/ValidationSchemas.ts',
                'nodes/Tumblr/loadOptions.ts',
                'nodes/Tumblr/listSearch.ts',
            ];

            nodeFiles.forEach(file => {
                expect(fs.existsSync(file)).toBe(true);
            });
        });

        it('should have all description files', () => {
            const descriptionFiles = [
                'nodes/Tumblr/descriptions/BlogDescription.ts',
                'nodes/Tumblr/descriptions/PostDescription.ts',
                'nodes/Tumblr/descriptions/UserDescription.ts',
                'nodes/Tumblr/descriptions/QueueDescription.ts',
                'nodes/Tumblr/descriptions/SearchDescription.ts',
            ];

            descriptionFiles.forEach(file => {
                expect(fs.existsSync(file)).toBe(true);
            });
        });

        it('should have all operation files', () => {
            const operationFiles = [
                'nodes/Tumblr/operations/BlogOperations.ts',
                'nodes/Tumblr/operations/PostOperations.ts',
                'nodes/Tumblr/operations/QueueOperations.ts',
                'nodes/Tumblr/operations/DraftOperations.ts',
                'nodes/Tumblr/operations/SearchOperations.ts',
                'nodes/Tumblr/operations/SocialOperations.ts',
            ];

            operationFiles.forEach(file => {
                expect(fs.existsSync(file)).toBe(true);
            });
        });

        it('should have credential configuration', () => {
            expect(fs.existsSync('credentials/TumblrOAuth2Api.credentials.ts')).toBe(true);
        });

        it('should have comprehensive test coverage', () => {
            const testFiles = [
                '__tests__/Tumblr.node.test.ts',
                '__tests__/TumblrAuthenticator.test.ts',
                '__tests__/BlogOperations.test.ts',
                '__tests__/PostOperations.test.ts',
                '__tests__/QueueOperations.test.ts',
                '__tests__/DraftOperations.test.ts',
                '__tests__/SearchOperations.test.ts',
                '__tests__/SocialOperations.test.ts',
                '__tests__/ErrorHandler.test.ts',
                '__tests__/RateLimitHandler.test.ts',
                '__tests__/DataValidator.test.ts',
                '__tests__/NetworkErrorHandler.test.ts',
                '__tests__/ValidationSchemas.test.ts',
                '__tests__/credentials.test.ts',
                '__tests__/loadOptions.test.ts',
                '__tests__/listSearch.test.ts',
                '__tests__/BlogDescription.test.ts',
                '__tests__/PostDescription.test.ts',
                '__tests__/UserDescription.test.ts',
                '__tests__/QueueDescription.test.ts',
                '__tests__/SearchDescription.test.ts',
            ];

            testFiles.forEach(file => {
                expect(fs.existsSync(file)).toBe(true);
            });
        });
    });

    describe('Package Configuration Validation', () => {
        let packageJson: any;

        beforeAll(() => {
            const packageContent = fs.readFileSync('package.json', 'utf8');
            packageJson = JSON.parse(packageContent);
        });

        it('should have correct package metadata', () => {
            expect(packageJson.name).toBe('n8n-nodes-tumblr');
            expect(packageJson.version).toBeDefined();
            expect(packageJson.description).toBe('n8n node for Tumblr integration');
            expect(packageJson.keywords).toContain('n8n-community-node-package');
            expect(packageJson.license).toBe('MIT');
        });

        it('should have required dependencies', () => {
            expect(packageJson.dependencies).toBeDefined();
            expect(packageJson.dependencies['tumblr.js']).toBe('5.0.1');
            expect(packageJson.peerDependencies).toBeDefined();
            expect(packageJson.peerDependencies['n8n-workflow']).toBeDefined();
        });

        it('should have proper n8n configuration', () => {
            expect(packageJson.n8n).toBeDefined();
            expect(packageJson.n8n.n8nNodesApiVersion).toBe(1);
            expect(packageJson.n8n.credentials).toContain('dist/credentials/TumblrOAuth2Api.credentials.js');
            expect(packageJson.n8n.nodes).toContain('dist/nodes/Tumblr/Tumblr.node.js');
        });

        it('should have proper build scripts', () => {
            expect(packageJson.scripts).toBeDefined();
            expect(packageJson.scripts.build).toBeDefined();
            expect(packageJson.scripts.test).toBeDefined();
            expect(packageJson.scripts.lint).toBeDefined();
            expect(packageJson.scripts.prepublishOnly).toBeDefined();
        });

        it('should have proper file inclusion', () => {
            expect(packageJson.files).toContain('dist');
        });
    });

    describe('TypeScript Configuration Validation', () => {
        let tsConfig: any;

        beforeAll(() => {
            const tsConfigContent = fs.readFileSync('tsconfig.json', 'utf8');
            tsConfig = JSON.parse(tsConfigContent);
        });

        it('should have proper compilation settings', () => {
            expect(tsConfig.compilerOptions.target).toBe('ES2019');
            expect(tsConfig.compilerOptions.module).toBe('commonjs');
            expect(tsConfig.compilerOptions.outDir).toBe('./dist');
            expect(tsConfig.compilerOptions.strict).toBe(true);
            expect(tsConfig.compilerOptions.declaration).toBe(true);
        });

        it('should include proper source directories', () => {
            expect(tsConfig.include).toContain('credentials/**/*');
            expect(tsConfig.include).toContain('nodes/**/*');
        });

        it('should exclude proper directories', () => {
            expect(tsConfig.exclude).toContain('dist');
            expect(tsConfig.exclude).toContain('node_modules');
            expect(tsConfig.exclude).toContain('**/*.test.ts');
        });
    });

    describe('Build System Validation', () => {
        it('should have proper gulp configuration', () => {
            expect(fs.existsSync('gulpfile.js')).toBe(true);

            const gulpContent = fs.readFileSync('gulpfile.js', 'utf8');
            expect(gulpContent).toContain('buildIcons');
            expect(gulpContent).toContain('nodes/**/*.{png,svg}');
            expect(gulpContent).toContain('dist/');
        });

        it('should have proper Jest configuration', () => {
            expect(fs.existsSync('jest.config.js')).toBe(true);

            const jestContent = fs.readFileSync('jest.config.js', 'utf8');
            expect(jestContent).toContain('preset');
            expect(jestContent).toContain('testEnvironment');
        });

        it('should have proper ESLint configuration', () => {
            expect(fs.existsSync('.eslintrc.js')).toBe(true);
        });
    });

    describe('Component Integration Validation', () => {
        it('should have proper imports in main node file', () => {
            const nodeContent = fs.readFileSync('nodes/Tumblr/Tumblr.node.ts', 'utf8');

            // Check for required imports
            expect(nodeContent).toContain('IExecuteFunctions');
            expect(nodeContent).toContain('INodeExecutionData');
            expect(nodeContent).toContain('INodeType');
            expect(nodeContent).toContain('INodeTypeDescription');
            expect(nodeContent).toContain('TumblrAuthenticator');
            expect(nodeContent).toContain('OperationRouter');
        });

        it('should have proper credential imports', () => {
            const credentialContent = fs.readFileSync('credentials/TumblrOAuth2Api.credentials.ts', 'utf8');

            expect(credentialContent).toContain('ICredentialType');
            expect(credentialContent).toContain('INodeProperties');
            expect(credentialContent).toContain('tumblrOAuth2Api');
            expect(credentialContent).toContain('OAuth2');
        });

        it('should have consistent naming conventions', () => {
            const nodeContent = fs.readFileSync('nodes/Tumblr/Tumblr.node.ts', 'utf8');
            const credentialContent = fs.readFileSync('credentials/TumblrOAuth2Api.credentials.ts', 'utf8');

            // Check that credential name matches between files
            expect(nodeContent).toContain('tumblrOAuth2Api');
            expect(credentialContent).toContain('tumblrOAuth2Api');
        });
    });

    describe('Documentation Validation', () => {
        it('should have README file', () => {
            const readmeExists = fs.existsSync('README.md') || fs.existsSync('readme.md');
            expect(readmeExists).toBe(true);
        });

        it('should have proper git configuration', () => {
            expect(fs.existsSync('.gitignore')).toBe(true);

            const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
            expect(gitignoreContent).toContain('node_modules');
            expect(gitignoreContent).toContain('dist');
        });

        it('should have specification documents', () => {
            expect(fs.existsSync('.kiro/specs/tumblr-integration/requirements.md')).toBe(true);
            expect(fs.existsSync('.kiro/specs/tumblr-integration/design.md')).toBe(true);
            expect(fs.existsSync('.kiro/specs/tumblr-integration/tasks.md')).toBe(true);
        });
    });

    describe('Security Validation', () => {
        it('should not contain hardcoded credentials', () => {
            const sensitiveFiles = [
                'nodes/Tumblr/Tumblr.node.ts',
                'nodes/Tumblr/TumblrAuthenticator.ts',
                'credentials/TumblrOAuth2Api.credentials.ts',
            ];

            sensitiveFiles.forEach(file => {
                if (fs.existsSync(file)) {
                    const content = fs.readFileSync(file, 'utf8');

                    // Check for common patterns that might indicate hardcoded credentials
                    expect(content).not.toMatch(/password\s*[:=]\s*['"][^'"]+['"]/i);
                    expect(content).not.toMatch(/secret\s*[:=]\s*['"][^'"]+['"]/i);
                    expect(content).not.toMatch(/token\s*[:=]\s*['"][^'"]+['"]/i);
                    expect(content).not.toMatch(/key\s*[:=]\s*['"][^'"]+['"]/i);
                }
            });
        });

        it('should have proper credential handling', () => {
            const credentialContent = fs.readFileSync('credentials/TumblrOAuth2Api.credentials.ts', 'utf8');

            expect(credentialContent).toContain('password: true');
            expect(credentialContent).toContain('required: true');
            expect(credentialContent).toContain('OAuth2');
        });
    });

    describe('Performance Validation', () => {
        it('should have rate limiting implementation', () => {
            expect(fs.existsSync('nodes/Tumblr/RateLimitHandler.ts')).toBe(true);
        });

        it('should not have performance monitoring components (removed for performance)', () => {
            // These components were removed to improve performance
            expect(fs.existsSync('nodes/Tumblr/PerformanceMonitor.ts')).toBe(false);
            expect(fs.existsSync('nodes/Tumblr/CacheManager.ts')).toBe(false);
            expect(fs.existsSync('nodes/Tumblr/MemoryManager.ts')).toBe(false);
            expect(fs.existsSync('nodes/Tumblr/RequestBatcher.ts')).toBe(false);
            expect(fs.existsSync('nodes/Tumblr/SecurityAuditor.ts')).toBe(false);
            expect(fs.existsSync('nodes/Tumblr/SecurityManager.ts')).toBe(false);
        });
    });

    describe('Error Handling Validation', () => {
        it('should have comprehensive error handling components', () => {
            expect(fs.existsSync('nodes/Tumblr/ErrorHandler.ts')).toBe(true);
            expect(fs.existsSync('nodes/Tumblr/NetworkErrorHandler.ts')).toBe(true);
        });

        it('should have data validation components', () => {
            expect(fs.existsSync('nodes/Tumblr/DataValidator.ts')).toBe(true);
            expect(fs.existsSync('nodes/Tumblr/ValidationSchemas.ts')).toBe(true);
        });
    });
});