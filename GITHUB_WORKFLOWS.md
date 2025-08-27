# GitHub Actions Workflows

This project includes several GitHub Actions workflows for automated testing, validation, and publishing.

## Available Workflows

### 1. CI/CD Pipeline (`ci.yml`)

**Triggers:** Push to `main`/`develop`, Pull Requests, Releases

**What it does:**
- Runs tests on Node.js 18.x and 20.x
- Performs security audits
- Validates package contents
- Tests npm publishing (dry run)
- Automatically publishes on GitHub releases

**Jobs:**
- `test` - Runs linting, tests, and build
- `security-audit` - Checks for vulnerabilities
- `package-validation` - Validates package structure
- `publish-test` - Tests publishing process (dry run)
- `publish` - Publishes to npm (on releases only)

### 2. Manual Publish (`manual-publish.yml`)

**Triggers:** Manual workflow dispatch

**What it does:**
- Allows manual version bumping and publishing
- Updates CHANGELOG.md automatically
- Creates GitHub releases
- Publishes to npm registry

**Inputs:**
- `version_type` - patch/minor/major/prerelease
- `publish_to_npm` - Actually publish (not just test)
- `create_release` - Create GitHub release

**Usage:**
1. Go to Actions tab in GitHub
2. Select "Manual Publish" workflow
3. Click "Run workflow"
4. Choose your options and run

### 3. Test NPM Publish (`test-publish.yml`)

**Triggers:** Manual workflow dispatch

**What it does:**
- Comprehensive testing of the npm publishing process
- Package validation and analysis
- Installation testing
- Registry connectivity checks
- Quality checks

**Inputs:**
- `test_installation` - Test package installation
- `validate_package` - Validate package contents  
- `check_npm_registry` - Check npm registry connectivity

**Usage:**
Perfect for testing before actual publishing. Run this workflow to ensure everything is ready.

### 4. PR Checks (`pr-check.yml`)

**Triggers:** Pull Requests to `main`/`develop`

**What it does:**
- Validates PR changes
- Runs linting and tests
- Checks for breaking changes
- Comments on PR with results

## Setup Instructions

### 1. Required Secrets

Add these secrets to your GitHub repository:

```
NPM_TOKEN - Your npm authentication token
```

To get an NPM token:
1. Go to [npmjs.com](https://www.npmjs.com)
2. Login to your account
3. Go to Access Tokens
4. Generate a new token with "Automation" type
5. Copy the token to GitHub Secrets

### 2. Repository Settings

1. **Enable Actions:**
   - Go to Settings → Actions → General
   - Allow all actions and reusable workflows

2. **Branch Protection:**
   - Go to Settings → Branches
   - Add protection rule for `main` branch
   - Require status checks to pass
   - Require PR reviews

3. **Permissions:**
   - Go to Settings → Actions → General
   - Set Workflow permissions to "Read and write permissions"

## Usage Examples

### Publishing a New Version

#### Option 1: Manual Workflow
1. Go to Actions → Manual Publish
2. Select version type (patch/minor/major)
3. Enable "publish_to_npm" and "create_release"
4. Run workflow

#### Option 2: GitHub Release
1. Create a new release on GitHub
2. Use version tag (e.g., `v0.1.1`)
3. Publish the release
4. CI/CD pipeline will automatically publish to npm

#### Option 3: Command Line
```bash
# Bump version
npm version patch

# Push changes and tag
git push origin main --tags

# Create GitHub release (triggers auto-publish)
gh release create v0.1.1 --generate-notes
```

### Testing Before Publishing

```bash
# Run test publish workflow
# Go to Actions → Test NPM Publish → Run workflow
```

Or locally:
```bash
npm run validate
npm pack
npm publish --dry-run
```

### Development Workflow

1. Create feature branch
2. Make changes
3. Push branch (triggers PR checks)
4. Create PR (triggers validation)
5. Merge PR (triggers CI/CD)

## Workflow Status Badges

Add these badges to your README.md:

```markdown
[![CI/CD](https://github.com/OfficialMoAdel/n8n-nodes-tumblr/actions/workflows/ci.yml/badge.svg)](https://github.com/OfficialMoAdel/n8n-nodes-tumblr/actions/workflows/ci.yml)
[![Test Publish](https://github.com/OfficialMoAdel/n8n-nodes-tumblr/actions/workflows/test-publish.yml/badge.svg)](https://github.com/OfficialMoAdel/n8n-nodes-tumblr/actions/workflows/test-publish.yml)
```

## Troubleshooting

### Common Issues

1. **NPM_TOKEN not working:**
   - Ensure token has "Automation" scope
   - Check token hasn't expired
   - Verify secret name is exactly `NPM_TOKEN`

2. **Tests failing in CI:**
   - Check Node.js version compatibility
   - Ensure all dependencies are in package.json
   - Check for environment-specific issues

3. **Package validation failing:**
   - Ensure `dist/` directory is built correctly
   - Check `files` array in package.json
   - Verify n8n configuration is correct

4. **Publish failing:**
   - Check package name availability on npm
   - Ensure version number is incremented
   - Verify npm authentication

### Getting Help

1. Check workflow logs in Actions tab
2. Review the specific job that failed
3. Check package.json configuration
4. Verify all required files are present

## Security Considerations

- NPM tokens are stored as GitHub secrets
- Workflows only run on trusted branches
- Package validation prevents malicious content
- Security audits check for vulnerabilities
- Dry runs test publishing without actual deployment

## Monitoring

- All workflows provide detailed logs
- Failed workflows send notifications
- Package artifacts are stored for review
- Coverage reports are generated
- Security audit results are tracked