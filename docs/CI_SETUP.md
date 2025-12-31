# Continuous Integration (CI) Setup

This repository uses GitHub Actions for automated testing and build verification.

## Workflows

### 1. Playwright Tests (`playwright-tests.yml`)

Automated end-to-end testing using Playwright across three major browser engines.

**Triggers:**
- Push to `main`/`master` branches
- Pull requests to `main`/`master` branches
- Manual workflow dispatch

**Test Matrix:**
- ✅ Chromium (85 tests)
- ✅ Firefox (85 tests)
- ✅ WebKit (85 tests)

**Total: 255 tests** validating:
- KaTeX formula rendering
- Interactive tools (pH calculator, molar mass calculator, 3D periodic table)
- Molecule Studio 3D visualization
- Responsive layout (mobile, tablet, desktop)
- Accessibility features
- Dark mode theming
- Performance benchmarks

**Artifacts:**
- Test results (retained for 30 days)
- Playwright HTML reports (retained for 30 days)

### 2. Hugo Build (`hugo-build.yml`)

Validates that the Hugo site builds successfully.

**Triggers:**
- Push to `main`/`master` branches
- Pull requests to `main`/`master` branches
- Manual workflow dispatch

**Steps:**
1. Setup Hugo (extended version with Sass/SCSS support)
2. Build site with minification
3. Verify `index.html` is generated
4. Upload build artifacts (retained for 7 days)

## Badges

Add these badges to your README:

```markdown
![Playwright Tests](https://github.com/tobias-weiss-ai-xr/hugo-chemie-lernen-org/actions/workflows/playwright-tests.yml/badge.svg)
![Hugo Build](https://github.com/tobias-weiss-ai-xr/hugo-chemie-lernen-org/actions/workflows/hugo-build.yml/badge.svg)
```

## Local Testing

Before pushing, run tests locally to ensure CI will pass:

```bash
cd tests
npm install
npx playwright install
npx playwright test
```

Run specific browser tests:

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Environment Variables

The Playwright tests use the following environment variable:

- `BASE_URL`: Default is `https://chemie-lernen.org`
  - Can be overridden for testing against different environments

## Troubleshooting

### Tests Failing in CI but Passing Locally

1. **Check browser versions**: CI may use different browser versions
2. **Timing issues**: CI runs on shared resources, may be slower
3. **Network issues**: CI tests against live site, check connectivity

### View Test Results

1. Go to the **Actions** tab in GitHub
2. Click on the failed workflow run
3. Download artifacts:
   - `playwright-results-chromium/firefox/webkit`
   - `playwright-report-chromium/firefox/webkit`
4. Open HTML report in browser

### Build Failures

If Hugo build fails:

1. Check for syntax errors in Markdown files
2. Verify all images referenced exist
3. Check for broken internal links
4. Review build logs for specific errors

## Performance

**Typical CI execution times:**
- Playwright tests: ~15-20 minutes (parallel across 3 browsers)
- Hugo build: ~1-2 minutes

## Maintenance

### Update Playwright

```bash
cd tests
npm install @playwright/test@latest
npx playwright install --with-deps
```

### Update Hugo

The workflow uses `peaceiris/actions-hugo@v2` with `hugo-version: 'latest'`.
Hugo version updates are automatic.

### Update Node.js

Update the Node version in `.github/workflows/playwright-tests.yml`:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # Update this as needed
```

## Contributing

When adding new tests:

1. Ensure tests pass locally on all three browsers
2. Update test counts in documentation
3. Follow naming conventions in existing test files
4. Add appropriate timeouts for async operations
5. Include helpful comments for complex test logic

## Future Improvements

Potential enhancements to CI/CD:

- [ ] Automated deployment to production
- [ ] Performance regression testing
- [ ] Accessibility auditing (axe-core)
- [ ] Visual regression testing (Percy/Chromatic)
- [ ] Lighthouse CI for performance metrics
- [ ] Security scanning (Dependabot, CodeQL)
- [ ] Scheduled nightly builds
- [ ] Test coverage reporting
