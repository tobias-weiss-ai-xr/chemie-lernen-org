# CI/CD Pipeline Documentation

This document describes the continuous integration and continuous deployment (CI/CD) pipeline for the hugo-chemie-lernen-org project.

## Overview

The CI/CD pipeline automates the testing, building, and deployment process using GitHub Actions. It ensures code quality, runs automated tests, and deploys to production.

**Workflow File**: `.github/workflows/ci-cd.yml`

## Pipeline Architecture

```
┌─────────────┐
│   Push/PR   │
└──────┬──────┘
       │
       ├──────────────────────────────────────┐
       │                                      │
       ▼                                      ▼
┌──────────────┐                    ┌──────────────┐
│  Job 1: Lint │                    │ Job 2: Test  │
└──────┬───────┘                    └──────┬───────┘
       │                                    │
       └────────────┬───────────────────────┘
                    │
                    ▼
           ┌────────────────┐
           │ Job 3: Build  │
           └────────┬───────┘
                    │
       ┌────────────┴────────────┐
       │                         │
       ▼                         ▼
┌──────────────┐      ┌────────────────┐
│Job 4: Integ. │      │ Job 5: Deploy │
│   Tests      │      │  (main only)  │
└──────────────┘      └───────┬────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │Job 6: Notify   │
                    │   (on failure) │
                    └────────────────┘
```

## Jobs

### Job 1: Code Quality Checks (`lint`)

**Purpose**: Ensure code meets quality standards before testing

**Steps**:
1. Checkout code
2. Setup Node.js v20
3. Install dependencies
4. Run ESLint
5. Check Prettier formatting
6. Upload lint results (on failure)

**Duration**: ~30 seconds

**Cache**: Node modules cached for faster builds

### Job 2: Unit Tests (`test`)

**Purpose**: Run unit tests and verify coverage thresholds

**Dependencies**: Requires `lint` job to pass

**Steps**:
1. Checkout code
2. Setup Node.js v20
3. Install dependencies
4. Run tests with coverage
5. Check coverage thresholds (70% minimum)
6. Upload coverage artifacts
7. Generate coverage summary (Codecov)

**Coverage Requirements**:
- Branches: ≥70%
- Functions: ≥70%
- Lines: ≥70%
- Statements: ≥70%

**Duration**: ~1 minute

### Job 3: Build Hugo Site (`build`)

**Purpose**: Build the Hugo static site

**Dependencies**: Requires `lint` and `test` jobs to pass

**Steps**:
1. Checkout code
2. Setup Hugo v0.153.3 (extended)
3. Setup Node.js v20
4. Install dependencies
5. Build Hugo site with minification
6. Check for broken internal links
7. Verify calculator files exist
8. Upload build artifacts (retained for 7 days)

**Duration**: ~1 minute

**Build Command**: `hugo --minify --baseURL https://chemie-lernen.org`

### Job 4: Playwright Integration Tests (`integration-test`)

**Purpose**: Run end-to-end browser tests

**Dependencies**: Requires `build` job to pass

**Triggers**:
- Push events
- Manual workflow dispatch

**Steps**:
1. Checkout code
2. Setup Node.js v20
3. Install dependencies
4. Install Playwright browsers
5. Run Playwright tests
6. Upload Playwright report
7. Upload screenshots on failure

**Duration**: ~3-5 minutes

**Note**: Continues on error (doesn't block deployment)

### Job 5: Deploy to Production (`deploy`)

**Purpose**: Deploy built site to production server

**Dependencies**: Requires `build` and `integration-test` jobs to pass

**Conditions**:
- Only runs on `main` branch
- Only on `push` events

**Environment**: Production (`https://chemie-lernen.org`)

**Steps**:
1. Checkout code
2. Download build artifacts
3. Deploy via SFTP
4. Verify deployment (curl check)
5. Create deployment summary

**Duration**: ~30 seconds

**Required Secrets**:
- `DEPLOY_SERVER` - Server hostname/IP
- `DEPLOY_PORT` - SSH port (default: 22)
- `DEPLOY_USER` - SSH username
- `DEPLOY_KEY` - SSH private key
- `DEPLOY_PATH` - Remote deployment path

### Job 6: Notify on Failure (`notify-failure`)

**Purpose**: Create GitHub summary on pipeline failure

**Dependencies**: Runs after `lint`, `test`, or `build` jobs fail

**Steps**:
1. Create failure summary with details
2. Include workflow run ID and repository info

## Triggers

### Automatic Triggers
- **Push to branches**: `main`, `master`, `develop`
- **Pull requests**: To `main`, `master`, `develop`

### Manual Trigger
- **Workflow dispatch**: Can be triggered manually from GitHub Actions UI

## Environment Variables

```yaml
HUGO_VERSION: 0.153.3
NODE_VERSION: '20'
```

## Secrets Configuration

### Production Deployment Secrets

Configure these in GitHub repository settings → Secrets and variables → Actions:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DEPLOY_SERVER` | Server hostname or IP | `chemie-lernen.org` |
| `DEPLOY_PORT` | SSH port | `22` |
| `DEPLOY_USER` | SSH username | `deploy` |
| `DEPLOY_KEY` | SSH private key | (PEM format) |
| `DEPLOY_PATH` | Remote deployment path | `/var/www/html/` |

### Adding Secrets

1. Go to: Repository → Settings → Secrets and variables → Actions
2. Click: "New repository secret"
3. Name: e.g., `DEPLOY_SERVER`
4. Value: e.g., `chemie-lernen.org`
5. Click: "Add secret"

## Caching Strategy

The pipeline uses GitHub Actions caching for faster builds:

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'  # Caches node_modules
```

**Cache Key**: Based on `package-lock.json` hash
**Cache Duration**: 7 days (default)

## Artifacts

### Build Artifacts
- **Name**: `hugo-site`
- **Contents**: Built Hugo site (`myhugoapp/public/`)
- **Retention**: 7 days
- **Used by**: Deployment job

### Coverage Reports
- **Name**: `coverage-report`
- **Contents**: Jest coverage output
- **Retention**: 7 days
- **Used by**: Codecov integration

### Playwright Reports
- **Name**: `playwright-report`
- **Contents**: HTML test reports
- **Retention**: 7 days
- **Used by**: Developers for debugging

## Status Badges

Add these badges to your README:

```markdown
![CI/CD Pipeline](https://github.com/YOUR_USERNAME/hugo-chemie-lernen-org/actions/workflows/ci-cd.yml/badge.svg)
![Test Coverage](https://codecov.io/gh/YOUR_USERNAME/hugo-chemie-lernen-org/branch/main/graph/badge.svg)
```

## Local Testing

### Test Linting
```bash
npm run lint
npm run format:check
```

### Run Tests
```bash
npm test
npm run test:coverage
```

### Build Site Locally
```bash
# Using Docker
docker run --rm -v "$(pwd)/myhugoapp:/src" -w /src hugomods/hugo:exts hugo --minify

# Or using Hugo CLI (if installed)
cd myhugoapp && hugo --minify
```

### Run Playwright Tests
```bash
npx playwright test
```

## Workflow Runs

### Viewing Workflow Runs

1. Go to: Repository → Actions
2. Select workflow: "CI/CD Pipeline"
3. View runs for each commit/PR

### Workflow Logs

Each job produces detailed logs:
- Step-by-step execution
- Command output
- Error messages
- Links to artifacts

### Downloading Artifacts

1. Go to: Actions → Workflow Run
2. Scroll to: "Artifacts" section
3. Click: Download arrow
4. Extract and view locally

## Troubleshooting

### Lint Failures
```bash
# Check locally before pushing
npm run lint:fix
npm run format
```

### Test Failures
```bash
# Run tests locally
npm test

# Run with verbose output
npm run test:verbose

# Check specific test
npm test -- --testNamePattern="should calculate"
```

### Build Failures

Common issues:
1. **Hugo version mismatch** - Check `HUGO_VERSION` env var
2. **Missing dependencies** - Run `npm ci`
3. **Broken internal links** - Check link references in content

### Deployment Failures

Check:
1. Secrets are configured correctly
2. SSH key has proper permissions
3. Server is accessible from GitHub Actions
4. Deploy path exists on server

### Integration Test Failures

```bash
# Run Playwright locally
npx playwright test

# Debug with headed mode
npx playwright test --headed

# Run specific test
npx playwright test tests/calculator.spec.js
```

## Performance

### Typical Pipeline Duration

| Job | Duration |
|-----|----------|
| Lint | ~30s |
| Test | ~1m |
| Build | ~1m |
| Integration Test | ~3-5m |
| Deploy | ~30s |
| **Total** | **~3-7 minutes** |

### Optimization Tips

1. **Use cache**: Node modules are cached automatically
2. **Parallel jobs**: Lint and Test run in parallel
3. **Conditional jobs**: Integration tests only run on push/manual
4. **Artifact retention**: 7 days to save storage

## Security

### Secret Management

- Secrets are encrypted in GitHub
- Never logged in workflow runs
- Only accessible to repository with write access

### Dependency Updates

The project uses Dependabot for automated dependency updates:
- **Config**: `.github/dependabot.yml`
- **Runs**: Weekly checks for outdated packages
- **Creates**: PRs for security updates

## Branch Protection Rules

Recommended GitHub settings:

**Settings → Branches → Add rule**

- Branch name pattern: `main` or `master`
- ✅ Require status checks to pass before merging
  - `Code Quality Checks`
  - `Unit Tests`
  - `Build Hugo Site`
- ✅ Require branches to be up to date before merging
- ✅ Require pull request reviews before merging
- ✅ Enable status checks (for CI)

## Monitoring

### Pipeline Success Rate

Monitor in:
- GitHub Actions dashboard
- Repository insights
- Commit status badges

### Alerts

Enable notifications for:
- Failed workflows
- Deployment failures
- Test failures
- Security vulnerabilities

## Rollback Procedure

If deployment fails:

1. **Identify issue**: Check workflow logs
2. **Fix locally**: Create hotfix branch
3. **Test**: Run tests locally
4. **Deploy**: Push hotfix to main
5. **Verify**: Check production site

For immediate rollback:
```bash
# Revert last commit
git revert HEAD
git push origin main

# Or reset to previous commit (use with caution)
git reset --hard HEAD~1
git push --force origin main
```

## Maintenance

### Updating Workflow

1. Edit `.github/workflows/ci-cd.yml`
2. Test in feature branch
3. Create PR
4. Verify workflow passes
5. Merge to main

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update packages
npm update

# Update to latest
npm install package@latest

# Run tests after update
npm test
```

## CI/CD Best Practices

✅ **DO**:
- Run tests on every commit
- Fail fast (lint before test)
- Use caching for dependencies
- Keep workflow logs clear
- Monitor pipeline performance
- Update dependencies regularly

❌ **DON'T**:
- Skip linting on PRs
- Allow tests to fail silently
- Commit secrets to repository
- Use `--force` push on main
- Ignore failing tests
- Deploy without testing

## Related Documentation

- [Unit Tests](tests/README.md)
- [Code Linting](LINTING.md)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Hugo Documentation](https://gohugo.io/)

---

**Last Updated**: 2026-01-01
**Phase 4, Feature 3**: CI/CD Pipeline Setup
