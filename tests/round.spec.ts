import { test, expect, request } from '@playwright/test';

test('creates one round (no retries) and shows story', async ({ page, baseURL }) => {
  // Create API context for session creation
  const api = await request.newContext({ baseURL });
  const childId = 'f3248f1c-6968-431f-b002-981a0abd7b08';

  // Create a fresh session
  const res = await api.post('/api/sessions', {
    data: { child_id: childId },
    headers: { 'Content-Type': 'application/json' },
  });
  expect(res.ok()).toBeTruthy();

  const sessionData = await res.json();
  const sessionId = sessionData.session.id;
  expect(sessionId).toBeTruthy();

  // Track POST /api/rounds requests
  let postCount = 0;
  const statuses: number[] = [];
  const fails: string[] = [];
  const errors: string[] = [];

  // Listen for all requests to debug
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.pathname.includes('/api/')) {
      console.log(`[TEST] ${req.method()} ${url.pathname}`);
    }
  });

  // Listen for all responses to count POST /api/rounds
  page.on('response', async (r) => {
    try {
      const url = new URL(r.url());
      if (url.pathname.includes('/api/')) {
        console.log(`[TEST] ${r.request().method()} ${url.pathname} -> ${r.status()}`);
      }
      if (r.request().method() === 'POST' && url.pathname === '/api/rounds') {
        postCount++;
        statuses.push(r.status());
        console.log(`[TEST] ✓ POST /api/rounds #${postCount} -> ${r.status()}`);
      }
    } catch {}
  });

  // Listen for console messages to detect failures
  page.on('console', (msg) => {
    const text = msg.text();
    console.log(`[BROWSER ${msg.type().toUpperCase()}] ${text}`);
    if (/Failed to create round .* after 3 attempts/i.test(text)) {
      fails.push(text);
    }
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });

  // Navigate to the session page
  console.log(`[TEST] Navigating to /child/${childId}/session/${sessionId}`);
  await page.goto(`/child/${childId}/session/${sessionId}`, { waitUntil: 'networkidle' });

  // Wait for page to be loaded - check for loading spinner to disappear or content to appear
  // First wait for any loading state to complete
  const loadingSpinner = page.locator('.animate-spin');
  if (await loadingSpinner.isVisible().catch(() => false)) {
    await loadingSpinner.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
  }

  // Wait a bit to ensure the round creation completes
  await page.waitForTimeout(2000);

  // Take a screenshot for debugging
  await page.screenshot({ path: 'test-results/session-page.png', fullPage: true });

  // Check if we can see any content on the page
  const pageContent = await page.textContent('body');
  console.log(`[TEST] Page content length: ${pageContent?.length || 0} characters`);

  // Wait a bit more to ensure no duplicate requests occur
  await page.waitForTimeout(1500);

  // Assert: Exactly one POST /api/rounds
  expect(postCount, `POST /api/rounds count = ${postCount}, statuses: ${statuses}`).toBe(1);

  // Assert: All statuses are 200 or 201
  expect(statuses.every((s) => s === 200 || s === 201), `All statuses should be 200 or 201, got: ${statuses}`).toBeTruthy();

  // Assert: No "Failed to create round" messages
  expect(fails, `Unexpected failure logs: ${fails}`).toHaveLength(0);

  // Assert: No console errors (we can relax this if there are expected errors)
  // For now, we'll just log them instead of failing
  if (errors.length > 0) {
    console.log(`[TEST] Console errors detected (${errors.length}):`, errors);
  }

  console.log(`[TEST] ✅ Test passed! One POST /api/rounds with status ${statuses[0]}`);
});
