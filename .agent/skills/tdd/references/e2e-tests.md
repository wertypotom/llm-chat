# E2E Tests

Testing complete user journeys with Playwright.

## Tools

- **Playwright** - Browser automation and testing

## Setup

```bash
npm install -D @playwright/test
npx playwright install
npx playwright init
```

## Configuration

Create `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // Start dev server
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

## Basic Tests

### Navigation Test

```typescript
import { test, expect } from '@playwright/test';

test('navigate through pages', async ({ page }) => {
  await page.goto('/');

  // Click navigation link
  await page.getByRole('link', { name: 'Jobs' }).click();
  await expect(page).toHaveURL('/jobs');

  // Click another link
  await page.getByRole('link', { name: 'About' }).click();
  await expect(page).toHaveURL('/about');
});
```

### Form Submission

```typescript
test('submit job application', async ({ page }) => {
  await page.goto('/jobs/123/apply');

  // Fill form
  await page.getByLabel('Name').fill('John Doe');
  await page.getByLabel('Email').fill('john@example.com');
  await page.getByLabel('Cover Letter').fill('I am interested...');

  // Upload resume
  await page.getByLabel('Resume').setInputFiles('./fixtures/resume.pdf');

  // Submit
  await page.getByRole('button', { name: 'Submit Application' }).click();

  // Verify success
  await expect(page.getByText('Application submitted successfully')).toBeVisible();
});
```

### Authentication Flow

```typescript
test.describe('authentication', () => {
  test('user can login', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});
```

## Advanced Patterns

### Using Fixtures (Authenticated State)

```typescript
import { test as base } from '@playwright/test';

// Extend base test with authenticated user
const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();

    // Wait for redirect
    await page.waitForURL('/dashboard');

    await use(page);
  },
});

test('access protected page', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard/settings');
  await expect(authenticatedPage.getByText('User Settings')).toBeVisible();
});
```

### Storage State (Reuse Authentication)

Save authentication state:

```typescript
// auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.waitForURL('/dashboard');

  // Save storage state
  await page.context().storageState({ path: 'auth.json' });
});
```

Use saved state:

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'authenticated',
      testMatch: /.*\.spec\.ts/,
      use: { storageState: 'auth.json' },
      dependencies: ['setup'],
    },
  ],
});
```

### Page Object Model

```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Login' }).click();
  }

  async expectError(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }
}

// Use in test
test('login with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login('user@example.com', 'password123');

  await expect(page).toHaveURL('/dashboard');
});
```

### API Mocking

```typescript
test('handles API error gracefully', async ({ page }) => {
  // Mock API response
  await page.route('/api/jobs', (route) => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    });
  });

  await page.goto('/jobs');

  await expect(page.getByText(/error loading jobs/i)).toBeVisible();
});
```

### Network Waiting

```typescript
test('waits for API call', async ({ page }) => {
  await page.goto('/jobs');

  // Wait for specific network request
  const responsePromise = page.waitForResponse('/api/jobs');

  await page.getByRole('button', { name: 'Refresh' }).click();

  const response = await responsePromise;
  expect(response.status()).toBe(200);
});
```

## UI Interactions

### Dropdowns

```typescript
await page.getByLabel('Country').selectOption('United States');
```

### Checkboxes

```typescript
await page.getByLabel('I accept terms').check();
expect(await page.getByLabel('I accept terms').isChecked()).toBeTruthy();
```

### Radio Buttons

```typescript
await page.getByLabel('Full-time').check();
```

### File Upload

```typescript
await page.getByLabel('Upload').setInputFiles('./file.pdf');
```

### Drag and Drop

```typescript
await page.getByText('Item 1').dragTo(page.getByText('Drop Zone'));
```

## Assertions

### Visibility

```typescript
await expect(page.getByText('Welcome')).toBeVisible();
await expect(page.getByText('Hidden')).toBeHidden();
```

### Text Content

```typescript
await expect(page.getByRole('heading')).toHaveText('Dashboard');
await expect(page.getByRole('heading')).toContainText('Dash');
```

### URL

```typescript
await expect(page).toHaveURL('/dashboard');
await expect(page).toHaveURL(/dashboard/);
```

### Count

```typescript
await expect(page.getByRole('listitem')).toHaveCount(5);
```

## Running Tests

```bash
# Run all tests
npx playwright test

# Run specific file
npx playwright test auth.spec.ts

# Debug mode
npx playwright test --debug

# UI mode
npx playwright test --ui

# Headed mode (see browser)
npx playwright test --headed

# Specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Best Practices

### Do

- ✅ Test critical user journeys
- ✅ Use data-test IDs for stability
- ✅ Keep tests independent
- ✅ Use Page Object Model for complex flows
- ✅ Run against staging/production-like environment

### Don't

- ❌ Test every feature with E2E
- ❌ Depend on test execution order
- ❌ Use hardcoded waits (use waitFor)
- ❌ Test implementation details
- ❌ Share state between tests

## Debugging

### Screenshots

```typescript
await page.screenshot({ path: 'screenshot.png' });
await page.screenshot({ path: 'screenshot.png', fullPage: true });
```

### Video

```typescript
// playwright.config.ts
use: {
  video: 'on-first-retry',
}
```

### Trace

```typescript
// playwright.config.ts
use: {
  trace: 'on-first-retry',
}
```

View trace:

```bash
npx playwright show-trace trace.zip
```

### Pause

```typescript
await page.pause(); // Opens Playwright Inspector
```

## CI/CD Integration

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run tests
        run: npx playwright test
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```
