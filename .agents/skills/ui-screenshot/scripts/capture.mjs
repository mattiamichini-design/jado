#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { inflateSync } from 'node:zlib';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const COMMAND_PROBE_TIMEOUT_MS = 5000;
const GIT_COMMAND_TIMEOUT_MS = 10000;
const PLAYWRIGHT_CLI_TIMEOUT_MS = 150000;
const HELP = `
Capture clean UI screenshot archives with Playwright CLI.

Required:
  --url URL                         Repeatable absolute URL
  --viewport NAME=WIDTHxHEIGHT@DPR Repeatable; append ,mobile for touch/mobile semantics
  --out DIR                         Output archive directory

Optional:
  --target NAME=CSS                 Repeatable component target; default is viewport/page
  --label TEXT                      Manifest label
  --full-page                       Capture full scrollable page
  --segments                        Capture consecutive viewport-height scroll segments
  --scroll-y PX                     Capture one viewport starting at a scroll offset
  --color-scheme VALUE              light, dark, or no-preference (default: light)
  --locale LOCALE                   Browser locale (default: en-US)
  --timezone ZONE                   IANA timezone (default: UTC)
  --browser NAME                    chromium, firefox, or webkit (default: chromium)
  --storage-state FILE              Playwright storage state
  --wait-for CSS                    Wait for a meaningful element
  --wait-until-hidden CSS           Repeatable blocker that must disappear before capture
  --reject-selector CSS             Repeatable visible selector that fails the capture
  --reject-visible-text TEXT        Repeatable visible text fragment that fails the capture
  --accept-analytics                Require verified accepted or preaccepted analytics consent
  --readiness-timeout MS            Maximum readiness wait (default: 30000)
  --stability-ms MS                 Readiness settle window (default: 1000)
  --delay MS                        Extra settling delay (default: 250)
  --hide CSS                        Repeatable app-specific overlay selector
  --header NAME=VALUE               Repeatable extra HTTP header
  --page-label TEXT                 Override the route label in the frame footer
  --source-at ISO                   Historical source timestamp shown in frame and filename
  --source-revision REF             Historical source revision shown in filename and manifest
  --keep-animations                 Do not disable animations for the screenshot
  --overwrite                       Allow writing into a non-empty archive directory
  --dry-run                         Print capture matrix only
  --help                            Show this help
`;

function fail(message) {
  throw new Error(message);
}

function splitOnce(raw, label) {
  const index = raw.indexOf('=');
  if (index < 1 || index === raw.length - 1) fail(`${label} must use name=value: ${raw}`);
  return [raw.slice(0, index), raw.slice(index + 1)];
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64) || 'capture';
}

function parseViewport(raw) {
  const [name, dimensions] = splitOnce(raw, '--viewport');
  const match = dimensions.match(/^(\d+)x(\d+)(?:@([0-9]+(?:\.[0-9]+)?))?(?:,(mobile))?$/i);
  if (!match) fail(`Invalid viewport '${raw}'. Use name=WIDTHxHEIGHT@DPR[,mobile].`);
  const width = Number(match[1]);
  const height = Number(match[2]);
  const mobile = Boolean(match[4]);
  const dpr = Number(match[3] || (mobile ? 3 : 2));
  if (width < 200 || height < 200 || dpr <= 0 || dpr > 4) fail(`Unsafe viewport values in '${raw}'.`);
  return { name: slug(name), width, height, dpr, mobile };
}

function takeValue(argv, index, flag) {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) fail(`${flag} requires a value.`);
  return value;
}

function parseArgs(argv) {
  const options = {
    urls: [], viewports: [], targets: [], hide: [], waitUntilHidden: [], rejectSelectors: [], rejectVisibleText: [], headers: {}, out: '', label: '',
    fullPage: false, segments: false, scrollY: null, colorScheme: 'light', locale: 'en-US', timezone: 'UTC',
    browser: 'chromium', storageState: '', waitFor: '', pageLabel: '', sourceAt: '', sourceRevision: '', delay: 250,
    readinessTimeout: 30000, stabilityMs: 1000, acceptAnalytics: false,
    keepAnimations: false, overwrite: false, dryRun: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === '--help' || flag === '-h') return { help: true };
    if (flag === '--full-page') { options.fullPage = true; continue; }
    if (flag === '--segments') { options.segments = true; continue; }
    if (flag === '--keep-animations') { options.keepAnimations = true; continue; }
    if (flag === '--accept-analytics') { options.acceptAnalytics = true; continue; }
    if (flag === '--overwrite') { options.overwrite = true; continue; }
    if (flag === '--dry-run') { options.dryRun = true; continue; }
    const value = takeValue(argv, i, flag);
    i += 1;
    if (flag === '--url') options.urls.push(value);
    else if (flag === '--viewport') options.viewports.push(parseViewport(value));
    else if (flag === '--target') {
      const [name, selector] = splitOnce(value, '--target');
      options.targets.push({ name: slug(name), selector });
    } else if (flag === '--hide') options.hide.push(value);
    else if (flag === '--wait-until-hidden') options.waitUntilHidden.push(value);
    else if (flag === '--reject-selector') options.rejectSelectors.push(value);
    else if (flag === '--reject-visible-text') options.rejectVisibleText.push(value);
    else if (flag === '--header') {
      const [name, headerValue] = splitOnce(value, '--header');
      options.headers[name] = headerValue;
    } else if (flag === '--out') options.out = value;
    else if (flag === '--label') options.label = value;
    else if (flag === '--color-scheme') options.colorScheme = value;
    else if (flag === '--locale') options.locale = value;
    else if (flag === '--timezone') options.timezone = value;
    else if (flag === '--browser') options.browser = value;
    else if (flag === '--storage-state') options.storageState = value;
    else if (flag === '--wait-for') options.waitFor = value;
    else if (flag === '--scroll-y') options.scrollY = Number(value);
    else if (flag === '--page-label') options.pageLabel = value;
    else if (flag === '--source-at') options.sourceAt = value;
    else if (flag === '--source-revision') options.sourceRevision = value;
    else if (flag === '--delay') options.delay = Number(value);
    else if (flag === '--readiness-timeout') options.readinessTimeout = Number(value);
    else if (flag === '--stability-ms') options.stabilityMs = Number(value);
    else fail(`Unknown option: ${flag}`);
  }

  if (!options.urls.length) fail('At least one --url is required.');
  if (!options.viewports.length) fail('At least one --viewport is required.');
  if (!options.out) fail('--out is required so archives are never written to an ambiguous location.');
  if (!['light', 'dark', 'no-preference'].includes(options.colorScheme)) fail('Invalid --color-scheme.');
  if (!['chromium', 'firefox', 'webkit'].includes(options.browser)) fail('Invalid --browser.');
  if (!Number.isFinite(options.delay) || options.delay < 0 || options.delay > 60000) fail('Invalid --delay.');
  if (!Number.isFinite(options.readinessTimeout) || options.readinessTimeout < 1000 || options.readinessTimeout > 120000) fail('Invalid --readiness-timeout.');
  if (!Number.isFinite(options.stabilityMs) || options.stabilityMs < 250 || options.stabilityMs > 10000) fail('Invalid --stability-ms.');
  if (options.scrollY !== null && (!Number.isFinite(options.scrollY) || options.scrollY < 0)) fail('Invalid --scroll-y.');
  if (options.segments && options.fullPage) fail('--segments and --full-page are mutually exclusive.');
  if (options.scrollY !== null && (options.segments || options.fullPage)) fail('--scroll-y cannot be combined with --segments or --full-page.');
  if (options.storageState && !existsSync(resolve(options.storageState))) fail(`Storage state not found: ${options.storageState}`);
  if (options.sourceAt && Number.isNaN(Date.parse(options.sourceAt))) fail('--source-at must be an ISO date-time.');
  options.urls = options.urls.map((raw) => {
    try { return new URL(raw).toString(); } catch { fail(`Invalid absolute URL: ${raw}`); }
  });
  if (!options.targets.length) options.targets.push({ name: options.fullPage ? 'full-page' : 'viewport', selector: '' });
  if (options.segments && options.targets.some((target) => target.selector)) fail('--segments cannot be combined with --target.');
  options.out = resolve(options.out);
  return options;
}

function commandExists(command) {
  const probe = spawnSync(process.platform === 'win32' ? 'where' : 'sh', process.platform === 'win32' ? [command] : ['-c', `command -v ${command}`], {
    stdio: 'ignore', timeout: COMMAND_PROBE_TIMEOUT_MS,
  });
  return probe.status === 0;
}

function cliCommand() {
  if (process.env.PWCLI) return { command: process.env.PWCLI, prefix: [] };
  const sibling = resolve(SCRIPT_DIR, '../../playwright/scripts/playwright_cli.sh');
  if (process.platform !== 'win32' && existsSync(sibling)) return { command: sibling, prefix: [] };
  if (commandExists('playwright-cli')) return { command: 'playwright-cli', prefix: [] };
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  if (!commandExists(npx)) fail('npx is required. Install Node.js 18+ and npm, then retry.');
  return { command: npx, prefix: ['--yes', '--package', '@playwright/cli', 'playwright-cli'] };
}

function runCli(cli, args, timeout = PLAYWRIGHT_CLI_TIMEOUT_MS) {
  const result = spawnSync(cli.command, [...cli.prefix, ...args], {
    cwd: process.cwd(), encoding: 'utf8', env: process.env, maxBuffer: 20 * 1024 * 1024, timeout,
  });
  if (result.error) fail(`Could not run Playwright CLI: ${result.error.message}`);
  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    fail(`Playwright CLI failed (${result.status}).${detail ? `\n${detail}` : ''}`);
  }
  return `${result.stdout || ''}\n${result.stderr || ''}`;
}

function isBrowserSessionNotOpenError(error) {
  return /The browser .* is not open, please run open first/i.test(error?.message || '');
}

function gitMetadata() {
  const git = (args) => spawnSync('git', args, {
    cwd: process.cwd(), encoding: 'utf8', timeout: GIT_COMMAND_TIMEOUT_MS,
  });
  const root = git(['rev-parse', '--show-toplevel']);
  if (root.status !== 0) return null;
  const commit = git(['rev-parse', 'HEAD']);
  const branch = git(['branch', '--show-current']);
  const status = git(['status', '--porcelain']);
  return {
    root: root.stdout.trim(), commit: commit.stdout.trim(), branch: branch.stdout.trim() || null,
    dirty: Boolean(status.stdout.trim()),
  };
}

function pngDimensions(path) {
  const bytes = readFileSync(path);
  if (bytes.length < 24 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') fail(`Not a valid PNG: ${path}`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), bytes: statSync(path).size };
}

function pngCornerAlpha(path) {
  const bytes = readFileSync(path);
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const bitDepth = bytes[24];
  const colorType = bytes[25];
  if (bitDepth !== 8 || colorType !== 6) fail(`Framed PNG must be 8-bit RGBA: ${path}`);
  const chunks = [];
  for (let offset = 8; offset < bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString('ascii');
    if (type === 'IDAT') chunks.push(bytes.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
    if (type === 'IEND') break;
  }
  const packed = inflateSync(Buffer.concat(chunks));
  const stride = width * 4;
  const pixels = Buffer.alloc(stride * height);
  const paeth = (a, b, c) => {
    const estimate = a + b - c;
    const distanceA = Math.abs(estimate - a);
    const distanceB = Math.abs(estimate - b);
    const distanceC = Math.abs(estimate - c);
    return distanceA <= distanceB && distanceA <= distanceC ? a : distanceB <= distanceC ? b : c;
  };
  for (let y = 0; y < height; y += 1) {
    const filter = packed[y * (stride + 1)];
    const source = y * (stride + 1) + 1;
    const target = y * stride;
    for (let x = 0; x < stride; x += 1) {
      const raw = packed[source + x];
      const left = x >= 4 ? pixels[target + x - 4] : 0;
      const above = y > 0 ? pixels[target + x - stride] : 0;
      const upperLeft = y > 0 && x >= 4 ? pixels[target + x - stride - 4] : 0;
      if (filter === 0) pixels[target + x] = raw;
      else if (filter === 1) pixels[target + x] = (raw + left) & 255;
      else if (filter === 2) pixels[target + x] = (raw + above) & 255;
      else if (filter === 3) pixels[target + x] = (raw + Math.floor((left + above) / 2)) & 255;
      else if (filter === 4) pixels[target + x] = (raw + paeth(left, above, upperLeft)) & 255;
      else fail(`Unsupported PNG filter ${filter}: ${path}`);
    }
  }
  const alphaAt = (x, y) => pixels[y * stride + x * 4 + 3];
  const alpha = [alphaAt(0, 0), alphaAt(width - 1, 0), alphaAt(0, height - 1), alphaAt(width - 1, height - 1)];
  if (alpha.some((value) => value !== 0)) fail(`Framed PNG corners are not transparent (${alpha.join(', ')}): ${path}`);
  return alpha;
}

function shortHash(value) {
  return createHash('sha256').update(value).digest('hex').slice(0, 8);
}

function captureDateLabel(isoDate, locale, timezone) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    hour12: false, timeZone: timezone,
  }).format(new Date(isoDate)).replace(',', ' ·').toUpperCase();
}

function archiveTimestamp(isoDate, timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, hourCycle: 'h23', timeZone: timezone,
  }).formatToParts(new Date(isoDate));
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}_${value.hour}-${value.minute}-${value.second}`;
}

function captureFilename(url, viewport, target, sourceAt, sourceRevision, timezone) {
  const parsed = new URL(url);
  const page = slug(`${parsed.hostname}-${parsed.pathname === '/' ? 'home' : parsed.pathname}-${parsed.search}`);
  const revision = sourceRevision ? slug(sourceRevision).slice(0, 12) : 'unversioned';
  return `${archiveTimestamp(sourceAt, timezone)}--${revision}--${page}-${shortHash(url)}--${viewport.name}--${target.name}.png`;
}

function captureFunction(config) {
  return `async (page) => {
  const cfg = ${JSON.stringify(config)};
  const readinessStartedAt = Date.now();
  const readinessDeadline = readinessStartedAt + cfg.readinessTimeout;
  const readinessReserve = cfg.stabilityMs + cfg.delay + 1000;
  const consentNames = /^(consenti analytics|consent analytics|allow analytics|allow insights|accept analytics|accetta analytics)$/i;
  const blockerSnapshot = async () => page.evaluate(({ hiddenSelectors, rejectSelectors, rejectText }) => {
    const isVisible = element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity || 1) > 0 && rect.width > 1 && rect.height > 1;
    };
    const visibleFor = selector => {
      try { return Array.from(document.querySelectorAll(selector)).filter(isVisible).slice(0, 5).map(element => (element.textContent || selector).replace(/\\s+/g, ' ').trim().slice(0, 160)); }
      catch (error) { throw new Error('Invalid readiness selector ' + selector + ': ' + error.message); }
    };
    const waiting = hiddenSelectors.flatMap(selector => visibleFor(selector).map(text => ({ selector, text })));
    const rejected = rejectSelectors.flatMap(selector => visibleFor(selector).map(text => ({ selector, text })));
    const visibleText = (document.body.innerText || '').replace(/\\s+/g, ' ').trim().toLocaleLowerCase();
    const rejectedText = rejectText.filter(fragment => visibleText.includes(fragment.replace(/\\s+/g, ' ').trim().toLocaleLowerCase()));
    return { waiting, rejected, rejectedText };
  }, { hiddenSelectors: cfg.waitUntilHidden, rejectSelectors: cfg.rejectSelectors, rejectText: cfg.rejectVisibleText });
  const assertReady = async phase => {
    const blockers = await blockerSnapshot();
    if (blockers.waiting.length || blockers.rejected.length || blockers.rejectedText.length) {
      throw new Error('Screenshot readiness failed during ' + phase + ': ' + JSON.stringify(blockers).slice(0, 1200));
    }
    const finalAddress = page.url();
    if (!cfg.requestedUrl.includes('/auth/') && /\\/auth\\/login(?:[/?#]|$)/.test(finalAddress)) {
      throw new Error('Screenshot readiness failed: protected route redirected to login (' + finalAddress + ').');
    }
  };
  await page.waitForLoadState('domcontentloaded');
  let consentAction = 'not-requested';
  if (cfg.acceptAnalytics) {
    const analyticsGranted = () => page.evaluate(() => {
      const entry = document.cookie.split('; ').find(row => row.startsWith('app-consent='));
      if (!entry) return false;
      try { return JSON.parse(decodeURIComponent(entry.slice(entry.indexOf('=') + 1))).analytics === true; }
      catch { return false; }
    });
    const analyticsAlreadyGranted = await analyticsGranted();
    consentAction = analyticsAlreadyGranted ? 'preaccepted' : 'not-present';
    const consentDeadline = Math.min(readinessDeadline - readinessReserve, Date.now() + 10000);
    while (!analyticsAlreadyGranted && Date.now() < consentDeadline) {
      const buttons = page.getByRole('button');
      const count = await buttons.count();
      let clicked = false;
      for (let index = 0; index < count; index += 1) {
        const button = buttons.nth(index);
        if (!(await button.isVisible().catch(() => false))) continue;
        const name = ((await button.innerText().catch(() => '')) || '').replace(/\\s+/g, ' ').trim();
        if (!consentNames.test(name)) continue;
        await button.click({ timeout: Math.min(5000, consentDeadline - Date.now()) });
        consentAction = 'accepted';
        clicked = true;
        break;
      }
      if (clicked) break;
      await page.waitForTimeout(250);
    }
    while (consentAction === 'accepted' && !(await analyticsGranted()) && Date.now() < consentDeadline) {
      await page.waitForTimeout(100);
    }
    if (!(await analyticsGranted())) {
      throw new Error('Analytics consent was requested but could not be verified as accepted or preaccepted. Omit --accept-analytics only when consent is not applicable to this page.');
    }
    const consentStillVisible = await page.evaluate(() => Array.from(document.querySelectorAll('button')).some(button => {
      const style = getComputedStyle(button);
      const rect = button.getBoundingClientRect();
      const visible = style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 1 && rect.height > 1;
      return visible && /^(consenti analytics|consent analytics|allow analytics|allow insights|accept analytics|accetta analytics)$/i.test((button.textContent || '').replace(/\\s+/g, ' ').trim());
    }));
    if (consentStillVisible) throw new Error('Analytics consent action remained visible after the acceptance attempt.');
  }
  const networkBudget = readinessDeadline - Date.now() - readinessReserve;
  if (networkBudget > 0) {
    try { await page.waitForLoadState('networkidle', { timeout: Math.min(10000, networkBudget) }); } catch {}
  }
  if (cfg.waitFor) {
    const remaining = readinessDeadline - Date.now() - readinessReserve;
    if (remaining <= 0) throw new Error('Readiness budget was exhausted before --wait-for became visible.');
    await page.locator(cfg.waitFor).first().waitFor({ state: 'visible', timeout: remaining });
  }
  const assetTimeout = Math.max(0, readinessDeadline - Date.now() - readinessReserve);
  const assetWaitTimedOut = assetTimeout === 0 || await page.evaluate(async timeout => {
    const settleAssets = async () => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const images = Array.from(document.images).filter(image => !image.complete);
      await Promise.all(images.map(image => new Promise(resolveImage => {
        const done = () => resolveImage();
        image.addEventListener('load', done, { once: true });
        image.addEventListener('error', done, { once: true });
      })));
    };
    return await new Promise(resolveAssets => {
      let finished = false;
      const timer = setTimeout(() => {
        finished = true;
        resolveAssets(true);
      }, timeout);
      void settleAssets().then(() => {
        if (finished) return;
        clearTimeout(timer);
        resolveAssets(false);
      });
    });
  }, assetTimeout);
  let blockers = await blockerSnapshot();
  while (blockers.waiting.length && Date.now() < readinessDeadline - readinessReserve) {
    await page.waitForTimeout(250);
    blockers = await blockerSnapshot();
  }
  if (blockers.waiting.length) throw new Error('Timed out waiting for screenshot blockers to disappear: ' + JSON.stringify(blockers.waiting).slice(0, 1200));
  let settledSince = 0;
  while (Date.now() < readinessDeadline) {
    const ready = await page.evaluate(() =>
      document.readyState === 'interactive' || document.readyState === 'complete'
    );
    if (ready) {
      if (!settledSince) settledSince = Date.now();
      if (Date.now() - settledSince >= cfg.stabilityMs) break;
    } else {
      settledSince = 0;
    }
    await page.waitForTimeout(250);
  }
  if (!settledSince || Date.now() - settledSince < cfg.stabilityMs) throw new Error('Page did not complete the readiness settle window before the timeout.');
  if (cfg.delay) await page.waitForTimeout(cfg.delay);
  await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
  await assertReady('pre-capture');

  const frameworkErrors = await page.evaluate(() => {
    const roots = [document];
    for (let index = 0; index < roots.length; index += 1) {
      for (const element of roots[index].querySelectorAll('*')) if (element.shadowRoot) roots.push(element.shadowRoot);
    }
    const pattern = /(Unhandled Runtime Error|Build Error|Application error|Failed to compile|Runtime Error|Hydration failed|Module not found|Cannot read properties)/i;
    const selectors = ['nextjs-portal', '[data-nextjs-dialog-overlay]', '[data-nextjs-error-overlay]', '#nextjs__container_errors'];
    const found = [];
    for (const root of roots) for (const selector of selectors) {
      for (const element of root.querySelectorAll(selector)) {
        const text = (element.textContent || '').replace(/\\s+/g, ' ').trim();
        if (pattern.test(text)) found.push(text.slice(0, 240));
      }
    }
    return Array.from(new Set(found));
  });
  if (frameworkErrors.length) {
    throw new Error('Framework error overlay detected: ' + frameworkErrors.join(' | ').slice(0, 1200));
  }
  const removed = await page.evaluate((extraSelectors) => {
    const selectors = [
      'vercel-live-feedback', '#vercel-live-feedback', '[data-vercel-toolbar]', '[data-vercel-feedback]',
      '[data-testid="vercel-toolbar"]', 'iframe[src*="vercel.live"]', 'iframe[src*="/_vercel/"]',
      '[id^="vercel-toolbar"]', 'nextjs-portal', ...extraSelectors,
    ];
    const roots = [document];
    for (let index = 0; index < roots.length; index += 1) {
      for (const element of roots[index].querySelectorAll('*')) if (element.shadowRoot) roots.push(element.shadowRoot);
    }
    let count = 0;
    for (const root of roots) for (const selector of selectors) {
      try {
        for (const element of Array.from(root.querySelectorAll(selector))) { element.remove(); count += 1; }
      } catch (error) { throw new Error('Invalid cleanup selector ' + selector + ': ' + error.message); }
    }
    return count;
  }, cfg.hide);
  await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));

  const pageDimensions = await page.evaluate(() => ({
    viewportWidth: window.innerWidth, viewportHeight: window.innerHeight,
    contentWidth: document.documentElement.scrollWidth, contentHeight: document.documentElement.scrollHeight,
  }));
  const finalUrl = page.url();
  const title = await page.title();
  const pathname = await page.evaluate(() => location.pathname || '/');
  const mobile = cfg.mobile;
  const chrome = mobile
    ? { side: 12, top: 14, bottom: 88, radius: 46, screenRadius: 34 }
    : { side: 14, top: 14, bottom: 94, radius: 24, screenRadius: 12 };
  const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[character]);
  const routeLabel = cfg.pageLabel || (pathname === '/' ? '/' : pathname.replace(/\\/+$/, ''));
  const deviceLabel = mobile ? 'MOBILE' : 'DESKTOP';
  const namedViewport = cfg.viewportName.toUpperCase();
  const marker = mobile ? '' : '<div class="camera" aria-hidden="true"></div>';
  const numberedPath = (path, index, total) => total === 1
    ? path
    : path.replace(/\\.png$/i, '--segment-' + String(index + 1).padStart(2, '0') + '-of-' + String(total).padStart(2, '0') + '.png');

  let scrollPositions = [Math.min(cfg.scrollY || 0, Math.max(0, pageDimensions.contentHeight - pageDimensions.viewportHeight))];
  if (cfg.segments) {
    const maxScroll = Math.max(0, pageDimensions.contentHeight - pageDimensions.viewportHeight);
    scrollPositions = [0];
    for (let y = pageDimensions.viewportHeight; y < maxScroll; y += pageDimensions.viewportHeight) scrollPositions.push(y);
    if (scrollPositions[scrollPositions.length - 1] !== maxScroll) scrollPositions.push(maxScroll);
  }
  if (scrollPositions.length > 30) throw new Error('Segment capture exceeds the safe limit of 30 images. Split the page into named ranges.');

  const rawCaptures = [];
  const total = scrollPositions.length;
  for (let index = 0; index < total; index += 1) {
    const rawPath = numberedPath(cfg.rawPath, index, total);
    const framePath = numberedPath(cfg.path, index, total);
    if (!cfg.fullPage && !cfg.targetSelector) {
      await page.evaluate(y => scrollTo(0, y), scrollPositions[index]);
      await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
    }
    await assertReady('segment ' + String(index + 1));
    const screenshotOptions = {
      path: rawPath, type: 'png', animations: cfg.keepAnimations ? 'allow' : 'disabled', caret: 'hide', scale: 'device',
    };
    let buffer;
    if (cfg.targetSelector) {
      const target = page.locator(cfg.targetSelector).first();
      await target.waitFor({ state: 'visible', timeout: 15000 });
      buffer = await target.screenshot(screenshotOptions);
    } else {
      buffer = await page.screenshot({ ...screenshotOptions, fullPage: cfg.fullPage });
    }
    const actualScrollY = cfg.fullPage || cfg.targetSelector ? 0 : await page.evaluate(() => scrollY);
    rawCaptures.push({ buffer, rawPath, framePath, scrollY: actualScrollY });
  }

  const artifacts = [];
  for (let index = 0; index < rawCaptures.length; index += 1) {
    const capture = rawCaptures[index];
    const rawWidth = capture.buffer.readUInt32BE(16);
    const rawHeight = capture.buffer.readUInt32BE(20);
    const screenWidth = Math.max(1, Math.round(rawWidth / cfg.dpr));
    const screenHeight = Math.max(1, Math.round(rawHeight / cfg.dpr));
    const frameWidth = screenWidth + chrome.side * 2;
    const frameHeight = screenHeight + chrome.top + chrome.bottom;
    const segmentLabel = total > 1 ? ' · ' + String(index + 1).padStart(2, '0') + '/' + String(total).padStart(2, '0') : '';
    const viewportLabel = deviceLabel + (namedViewport === deviceLabel ? '' : ' · ' + namedViewport) + ' · ' + cfg.viewportWidth + '×' + cfg.viewportHeight + segmentLabel;
    const css = [
      'html,body{margin:0;background:transparent;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
      'body{display:flex;align-items:flex-start;justify-content:flex-start}',
      '.device{box-sizing:border-box;position:relative;margin:0;width:' + frameWidth + 'px;height:' + frameHeight + 'px;padding:' + chrome.top + 'px ' + chrome.side + 'px ' + chrome.bottom + 'px;background:#050505;border:1px solid rgba(255,255,255,.16);border-radius:' + chrome.radius + 'px;overflow:hidden}',
      '.screen{position:relative;width:' + screenWidth + 'px;height:' + screenHeight + 'px;overflow:hidden;border-radius:' + chrome.screenRadius + 'px;background:#111;box-shadow:0 0 0 1px rgba(255,255,255,.09)}',
      '.screen img{display:block;width:100%;height:100%;object-fit:fill}',
      '.footer{box-sizing:border-box;position:absolute;left:' + chrome.side + 'px;right:' + chrome.side + 'px;bottom:0;height:' + chrome.bottom + 'px;padding:0 ' + (mobile ? 20 : 0) + 'px;display:flex;flex-direction:column;justify-content:center;gap:7px;color:#fff}',
      '.route{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:' + (mobile ? 15 : 18) + 'px;font-weight:650;letter-spacing:-.02em}',
      '.meta{min-width:0;display:flex;align-items:baseline;justify-content:space-between;gap:24px}',
      '.viewport,.date{font-size:' + (mobile ? 9 : 10) + 'px;font-weight:650;letter-spacing:.12em;color:rgba(255,255,255,.48)}',
      '.viewport{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.date{flex:0 0 auto;text-align:right;white-space:nowrap}',
      '.camera{position:absolute;z-index:4;top:5px;left:50%;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:#16202b;box-shadow:0 0 0 1px rgba(255,255,255,.12)}',
    ].join('');
    const frameHtml = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + css + '</style></head><body>'
      + '<figure class="device" id="device-frame">' + marker
      + '<div class="screen"><img alt="" src="data:image/png;base64,' + capture.buffer.toString('base64') + '"></div>'
      + '<figcaption class="footer"><div class="route">' + escapeHtml(routeLabel) + '</div><div class="meta"><div class="viewport">' + escapeHtml(viewportLabel) + '</div>'
      + '<time class="date">' + escapeHtml(cfg.capturedLabel) + '</time></div></figcaption></figure></body></html>';
    await page.setViewportSize({ width: Math.ceil(frameWidth + 32), height: Math.ceil(frameHeight + 32) });
    await page.setContent(frameHtml, { waitUntil: 'load' });
    await page.locator('#device-frame img').evaluate(image => image.decode());
    await page.locator('#device-frame').screenshot({
      path: capture.framePath, type: 'png', animations: 'disabled', caret: 'hide', scale: 'device', omitBackground: true,
    });
    artifacts.push({
      path: capture.framePath, rawPath: capture.rawPath, rawWidth, rawHeight,
      scrollY: capture.scrollY, segmentIndex: index + 1, segmentCount: total,
    });
    capture.buffer = null;
  }

  const metadata = {
    requestedUrl: cfg.requestedUrl, finalUrl, title,
    browserVersion: page.context().browser()?.version() || null,
    removed, frameworkErrors, consentAction,
    readiness: {
      waitedMs: Date.now() - readinessStartedAt, timeoutMs: cfg.readinessTimeout,
      stabilityMs: cfg.stabilityMs, assetWaitTimedOut,
    },
    frame: mobile ? 'iphone' : 'macbook', routeLabel,
    captureMode: cfg.segments ? 'segments' : cfg.fullPage ? 'full-page' : cfg.scrollY ? 'scroll-offset' : 'viewport',
    artifacts, ...pageDimensions,
  };
  await page.evaluate(value => { window.__CODEX_SCREENSHOT_METADATA__ = value; }, metadata);
  return 'SCREENSHOT_META::' + JSON.stringify(metadata);
}`;
}

function extractMetadata(output, fallback) {
  const matches = [...output.matchAll(/SCREENSHOT_META::(\{[^\n]*\})/g)];
  if (!matches.length) return fallback;
  try { return JSON.parse(matches.at(-1)[1]); } catch { return fallback; }
}

function summarizeCaptureError(output) {
  const lines = output.split('\n').map((line) => line.trim()).filter(Boolean);
  const framework = lines.find((line) => line.includes('Framework error overlay detected'));
  if (framework) return framework.slice(0, 600);
  const errorBlock = output.indexOf('### Error');
  if (errorBlock >= 0) return output.slice(errorBlock, errorBlock + 1200).replace(/\s+/g, ' ').trim();
  const explicit = lines.find((line) => /^Error:/.test(line));
  return explicit ? explicit.slice(0, 600) : '';
}

function extractEvalMetadata(output, fallback) {
  try {
    const envelope = JSON.parse(output.trim());
    if (!Object.hasOwn(envelope, 'result')) return fallback;
    return typeof envelope.result === 'string' ? JSON.parse(envelope.result) : envelope.result;
  } catch {
    return fallback;
  }
}

function relativeSafe(from, path) {
  const value = relative(from, path);
  return value.startsWith('..') ? basename(path) : value;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) { process.stdout.write(HELP); return; }
  const matrix = [];
  for (const url of options.urls) for (const viewport of options.viewports) for (const target of options.targets) {
    matrix.push({ url, viewport, target });
  }
  if (options.dryRun) {
    process.stdout.write(`${JSON.stringify({
      output: options.out,
      source: { at: options.sourceAt || 'capture-time', revision: options.sourceRevision || 'current-git-revision' },
      captures: matrix,
    }, null, 2)}\n`);
    return;
  }

  if (existsSync(options.out) && readdirSync(options.out).length && !options.overwrite) {
    fail(`Archive directory is not empty: ${options.out}. Choose a new dated directory or pass --overwrite explicitly.`);
  }
  mkdirSync(options.out, { recursive: true });
  const rawDirectory = join(options.out, 'raw');
  mkdirSync(rawDirectory, { recursive: true });
  const work = mkdtempSync(join(tmpdir(), 'codex-screenshot-'));
  const cli = cliCommand();
  const generatedAt = new Date().toISOString();
  const git = gitMetadata();
  const manifest = {
    schemaVersion: 4, status: 'running', label: options.label || basename(options.out),
    generatedAt, workingDirectory: process.cwd(), git,
    source: {
      at: options.sourceAt || generatedAt,
      revision: options.sourceRevision || git?.commit || null,
      explicit: Boolean(options.sourceAt || options.sourceRevision),
    },
    settings: {
      browser: options.browser, colorScheme: options.colorScheme, locale: options.locale,
      timezone: options.timezone, fullPage: options.fullPage, segments: options.segments,
      scrollY: options.scrollY, frame: 'digital-polaroid',
      pageLabel: options.pageLabel || null, sourceAt: options.sourceAt || null,
      sourceRevision: options.sourceRevision || null,
      headerNames: Object.keys({ ...options.headers, 'x-vercel-skip-toolbar': '1' }),
      storageState: options.storageState ? basename(options.storageState) : null,
      acceptAnalytics: options.acceptAnalytics, readinessTimeout: options.readinessTimeout,
      stabilityMs: options.stabilityMs, waitUntilHidden: options.waitUntilHidden,
      rejectSelectors: options.rejectSelectors, rejectVisibleText: options.rejectVisibleText,
    },
    captures: [], failures: [],
  };

  try {
    let sequence = 0;
    for (const item of matrix) {
      sequence += 1;
      const startedAt = new Date().toISOString();
      const sourceAt = options.sourceAt || startedAt;
      const sourceRevision = options.sourceRevision || git?.commit || '';
      const filename = captureFilename(item.url, item.viewport, item.target, sourceAt, sourceRevision, options.timezone);
      const imagePath = join(options.out, filename);
      const rawPath = join(rawDirectory, filename);
      let session = '';
      const configPath = join(work, `config-${sequence}.json`);
      const codePath = join(work, `capture-${sequence}.js`);
      const contextOptions = {
        viewport: { width: item.viewport.width, height: item.viewport.height },
        deviceScaleFactor: item.viewport.dpr, colorScheme: options.colorScheme,
        locale: options.locale, timezoneId: options.timezone,
        reducedMotion: options.keepAnimations ? 'no-preference' : 'reduce',
        extraHTTPHeaders: { ...options.headers, 'x-vercel-skip-toolbar': '1' },
      };
      if (item.viewport.mobile) Object.assign(contextOptions, { isMobile: true, hasTouch: true });
      if (options.storageState) contextOptions.storageState = resolve(options.storageState);
      writeFileSync(configPath, JSON.stringify({
        browser: { browserName: options.browser, isolated: true, contextOptions },
        outputMode: 'stdout', codegen: 'none', timeouts: { action: 15000, navigation: 120000 },
      }, null, 2));
      writeFileSync(codePath, captureFunction({
        path: imagePath, rawPath, requestedUrl: item.url, targetSelector: item.target.selector,
        fullPage: options.fullPage, segments: options.segments, scrollY: options.scrollY,
        waitFor: options.waitFor, delay: options.delay,
        waitUntilHidden: options.waitUntilHidden, rejectSelectors: options.rejectSelectors,
        rejectVisibleText: options.rejectVisibleText, acceptAnalytics: options.acceptAnalytics,
        readinessTimeout: options.readinessTimeout, stabilityMs: options.stabilityMs,
        hide: options.hide, keepAnimations: options.keepAnimations, mobile: item.viewport.mobile,
        dpr: item.viewport.dpr, viewportName: item.viewport.name,
        viewportWidth: item.viewport.width, viewportHeight: item.viewport.height,
        pageLabel: options.pageLabel, capturedLabel: captureDateLabel(sourceAt, options.locale, options.timezone),
      }));

      try {
        let output = '';
        let evalOutput = '';
        const maximumOpenAttempts = 3;
        for (let attempt = 1; attempt <= maximumOpenAttempts; attempt += 1) {
          session = `screenshot-${process.pid}-${sequence}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${attempt}`;
          try {
            runCli(cli, [`--session=${session}`, '--config', configPath, 'open', item.url]);
            output = runCli(cli, [`--session=${session}`, 'run-code', `--filename=${codePath}`]);
            evalOutput = runCli(cli, [
              `--session=${session}`, 'eval', '--json', '() => window.__CODEX_SCREENSHOT_METADATA__',
            ]);
            break;
          } catch (error) {
            const canRetry = attempt < maximumOpenAttempts && isBrowserSessionNotOpenError(error);
            if (!canRetry) throw error;
            try { runCli(cli, [`--session=${session}`, 'close'], 15000); } catch {}
            session = '';
          }
        }
        const fallback = { requestedUrl: item.url, finalUrl: item.url, title: null, removed: null, frameworkErrors: [], artifacts: [] };
        const metadata = extractEvalMetadata(evalOutput, extractMetadata(output, fallback));
        const { artifacts = [], ...sharedMetadata } = metadata;
        if (!artifacts.length) {
          const detail = summarizeCaptureError(output);
          fail(`Capture script produced no artifacts for ${imagePath}.${detail ? ` ${detail}` : ''}`);
        }
        for (const artifact of artifacts) {
          const framedPath = resolve(artifact.path);
          const sourcePath = resolve(artifact.rawPath);
          if (!existsSync(framedPath) || !existsSync(sourcePath)) fail(`Capture artifact is missing: ${framedPath}`);
          const png = pngDimensions(framedPath);
          const rawPng = pngDimensions(sourcePath);
          const cornerAlpha = pngCornerAlpha(framedPath);
          const digest = createHash('sha256').update(readFileSync(framedPath)).digest('hex');
          const rawDigest = createHash('sha256').update(readFileSync(sourcePath)).digest('hex');
          manifest.captures.push({
            file: relativeSafe(options.out, framedPath), sha256: digest, capturedAt: startedAt,
            sourceAt, sourceRevision: sourceRevision || null,
            rawFile: relativeSafe(options.out, sourcePath), rawSha256: rawDigest,
            viewport: item.viewport, target: item.target, output: png, rawOutput: rawPng,
            cornerAlpha, scrollY: artifact.scrollY, segmentIndex: artifact.segmentIndex,
            segmentCount: artifact.segmentCount, ...sharedMetadata,
          });
          process.stdout.write(`captured ${basename(framedPath)} (framed ${png.width}x${png.height}; raw ${rawPng.width}x${rawPng.height})\n`);
        }
      } catch (error) {
        manifest.failures.push({ url: item.url, viewport: item.viewport, target: item.target, error: error.message });
        process.stderr.write(`failed ${item.url} / ${item.viewport.name} / ${item.target.name}: ${error.message}\n`);
      } finally {
        if (session) {
          try { runCli(cli, [`--session=${session}`, 'close'], 15000); } catch {}
        }
      }
      writeFileSync(join(options.out, 'manifest.json'), JSON.stringify(manifest, null, 2));
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }

  manifest.completedAt = new Date().toISOString();
  manifest.status = manifest.failures.length ? 'partial' : 'complete';
  writeFileSync(join(options.out, 'manifest.json'), JSON.stringify(manifest, null, 2));
  if (manifest.failures.length) {
    process.stderr.write(`Capture completed with ${manifest.failures.length} failure(s). See ${join(options.out, 'manifest.json')}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`archive ${options.out}\nmanifest ${join(options.out, 'manifest.json')}\n`);
  }
}

main().catch((error) => {
  process.stderr.write(`ui-screenshot: ${error.message}\n`);
  process.exitCode = 1;
});
