import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function compile(path) {
  return ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
}
const languageCode = compile('../src/scripts/language.ts');
const analyticsCode = compile('../src/scripts/analytics.ts');

test('home language respects manual choice, browser priority, regional tags and English fallback', () => {
  const sandbox = { exports: {} };
  vm.runInNewContext(languageCode, sandbox);
  const select = sandbox.exports.preferredLanguage;
  assert.equal(select(null, ['es-MX', 'en-US']), 'es');
  assert.equal(select(null, ['en-US', 'es']), 'en');
  assert.equal(select(null, ['fr-FR', 'es-ES']), 'es');
  assert.equal(select(null, ['fr-FR']), 'en');
  assert.equal(select(null, []), 'en');
  assert.equal(select('en', ['es-US']), 'en');
  assert.equal(select('es', ['en-US']), 'es');
  assert.equal(select('invalid', ['en-US']), 'en');
});

function setup({ stored = null, blocked = false, ga = 'G-TEST123', autoPrompt = true } = {}) {
  const scripts = [];
  const listeners = {};
  let reloads = 0;
  let saved = stored;
  const dialog = { open: false, dataset: { autoPrompt: String(autoPrompt) },
    showModal() { this.open = true; }, close() { this.open = false; } };
  const nodes = { consent: dialog };
  for (const id of ['consent-yes', 'consent-no', 'analytics-settings']) {
    nodes[id] = { addEventListener(type, callback) { listeners[`${id}:${type}`] = callback; } };
  }
  const sandbox = {
    exports: {}, URLSearchParams, Date,
    window: {},
    localStorage: {
      getItem() { if (blocked) throw Error('blocked'); return saved; },
      setItem(key, value) { if (blocked) throw Error('blocked'); saved = value; },
    },
    sessionStorage: { getItem: () => null, setItem() {} },
    location: { search: '', origin: 'https://celebratinglife.betesdachurchmiami.com', pathname: '/en/', reload() { reloads++; } },
    document: {
      body: { dataset: { ga } }, documentElement: { lang: 'en' }, title: 'Celebrating Life',
      getElementById: id => nodes[id] || null,
      createElement: () => ({}), head: { append: script => scripts.push(script) },
    },
  };
  vm.runInNewContext(analyticsCode, sandbox);
  return { dialog, scripts, sandbox, saved: () => saved, reloads: () => reloads,
    click: id => listeners[`${id}:click`](),
    events: () => (sandbox.window.dataLayer || []).map(args => Array.from(args)).filter(args => args[0] === 'event') };
}

test('new visitor can reject analytics, reopen preferences, then accept exactly once', () => {
  const p = setup();
  assert.equal(p.dialog.open, true);
  assert.equal(p.scripts.length, 0);
  p.click('consent-no');
  assert.equal(p.saved(), 'no');
  assert.equal(p.dialog.open, false);
  assert.equal(p.scripts.length, 0);
  p.click('analytics-settings');
  assert.equal(p.dialog.open, true);
  p.click('consent-yes');
  assert.equal(p.saved(), 'yes');
  assert.equal(p.scripts.length, 1);
  assert.equal(p.scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-TEST123');
  assert.equal(p.events().filter(e => e[1] === 'page_view').length, 1);
  p.click('analytics-settings'); p.click('consent-yes');
  assert.equal(p.scripts.length, 1);
  assert.equal(p.events().filter(e => e[1] === 'page_view').length, 1);
});

test('saved choices survive page loads and withdrawal stops tracked form events', () => {
  const rejected = setup({ stored: 'no' });
  assert.equal(rejected.dialog.open, false);
  assert.equal(rejected.scripts.length, 0);
  const accepted = setup({ stored: 'yes' });
  assert.equal(accepted.dialog.open, false);
  assert.equal(accepted.scripts.length, 1);
  accepted.click('analytics-settings'); accepted.click('consent-no');
  assert.equal(accepted.reloads(), 1);
  accepted.sandbox.window.clTrack('generate_lead');
  assert.equal(accepted.events().filter(e => e[1] === 'generate_lead').length, 0);
});

test('blocked storage still allows a current-page choice and form conversion; other activity does not opt in', () => {
  const p = setup({ blocked: true });
  p.sandbox.window.clTrack('form_start');
  assert.equal(p.scripts.length, 0);
  // Closing a native dialog (including Escape) is not a consent action.
  p.dialog.close();
  assert.equal(p.scripts.length, 0);
  p.click('analytics-settings'); p.click('consent-yes');
  p.sandbox.window.clTrack('generate_lead');
  assert.equal(p.events().filter(e => e[1] === 'generate_lead').length, 1);
});

test('privacy page stays readable; missing or invalid GA IDs never load a tag', () => {
  const privacy = setup({ autoPrompt: false });
  assert.equal(privacy.dialog.open, false);
  privacy.click('analytics-settings');
  assert.equal(privacy.dialog.open, true);
  for (const ga of ['', 'invalid']) {
    const p = setup({ ga });
    assert.equal(p.dialog.open, false);
    p.click('analytics-settings'); p.click('consent-yes');
    assert.equal(p.scripts.length, 0);
  }
});
