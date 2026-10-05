import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import test from 'node:test';

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(resolve(site, file), 'utf8');
const html = read('index.html');
const css = read('styles.css');
const app = read('app.js');
const game = JSON.parse(read('game-data.json'));
const decode = text => text.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const normalized = text => decode(text).replace(/\s+/g, ' ').trim();

// This small HTML reader also provides the DOM surface used by the replay.
// It reads the actual markup, so missing controls or incorrect defaults fail.
class Element {
  constructor(tagName, attributes = {}, parent = null) {
    this.tagName = tagName;
    this.attributes = attributes;
    this.parent = parent;
    this.children = [];
    this.listeners = new Map();
    const classes = new Set((attributes.class || '').split(/\s+/).filter(Boolean));
    this.classList = {
      contains: name => classes.has(name),
      toggle: (name, force) => {
        const enabled = force ?? !classes.has(name);
        if (enabled) classes.add(name);
        else classes.delete(name);
        return enabled;
      },
    };
    this.dataset = Object.fromEntries(Object.entries(attributes)
      .filter(([name]) => name.startsWith('data-'))
      .map(([name, value]) => [name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), value]));
  }
  get textContent() { return this.children.map(child => child.textContent).join(''); }
  set textContent(value) { this.children = [{ textContent: String(value), parent: this }]; }
  get firstChild() { return this.children[0] || null; }
  get hidden() { return 'hidden' in this.attributes; }
  set hidden(value) {
    if (value) this.attributes.hidden = '';
    else delete this.attributes.hidden;
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  removeAttribute(name) { delete this.attributes[name]; }
  getAttribute(name) { return this.attributes[name] ?? null; }
  addEventListener(event, handler) {
    const handlers = this.listeners.get(event) || [];
    handlers.push(handler);
    this.listeners.set(event, handlers);
  }
  click() { for (const handler of this.listeners.get('click') || []) handler({ target: this }); }
}

function parseHtml(source) {
  const root = new Element('document');
  const elements = [];
  const stack = [root];
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  for (const token of source.match(/<!--[\s\S]*?-->|<![^>]*>|<[^>]+>|[^<]+/g) || []) {
    if (token.startsWith('<!')) continue;
    if (token.startsWith('</')) {
      const tag = token.slice(2).match(/^\w+/)?.[0].toLowerCase();
      const index = stack.findLastIndex(element => element.tagName === tag);
      if (index > 0) stack.length = index;
    } else if (token.startsWith('<')) {
      const tag = token.slice(1).match(/^\w+/)?.[0].toLowerCase();
      if (!tag) continue;
      const attributes = {};
      const content = token.slice(tag.length + 1, -1);
      for (const match of content.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
        attributes[match[1]] = decode(match[2] ?? match[3] ?? match[4] ?? '');
      }
      const parent = stack.at(-1);
      const element = new Element(tag, attributes, parent);
      parent.children.push(element);
      elements.push(element);
      if (!voidTags.has(tag) && !token.endsWith('/>')) stack.push(element);
    } else {
      const parent = stack.at(-1);
      parent.children.push({ textContent: decode(token), parent });
    }
  }
  const matches = (element, selector) => selector.startsWith('.')
    ? element.classList.contains(selector.slice(1))
    : selector.startsWith('#') ? element.attributes.id === selector.slice(1) : element.tagName === selector;
  return {
    elements,
    root,
    querySelectorAll: selector => elements.filter(element => matches(element, selector)),
    querySelector: selector => elements.find(element => matches(element, selector)) || null,
    getElementById: id => elements.find(element => element.attributes.id === id) || null,
  };
}

function assertVisibleWithoutScript(element, label) {
  assert.ok(element, `${label} exists in HTML`);
  for (let ancestor = element; ancestor; ancestor = ancestor.parent) {
    assert.equal(ancestor.hidden, false, `${label} has no hidden ancestor`);
    assert.equal(ancestor.classList?.contains('sr-only'), false, `${label} is visually available`);
    assert.notEqual(ancestor.tagName, 'details', `${label} does not require opening credits`);
  }
}

function assertLocalFile(url, origin) {
  if (!url || /^(?:https?:|data:|mailto:|tel:)/i.test(url)) return;
  assert.doesNotMatch(url, /^(?:javascript:|\/\/)/i, `Unexpected URL: ${url}`);
  const [file] = url.split(/[?#]/);
  if (!file) return;
  const absolute = resolve(dirname(resolve(site, origin)), decodeURIComponent(file));
  assert.ok(!relative(site, absolute).startsWith('..'), `Asset stays within site: ${url}`);
  assert.ok(statSync(absolute).isFile(), `Local file exists: ${url}`);
  assert.ok(statSync(absolute).size > 0, `Local file is not empty: ${url}`);
}

test('official game record preserves the six-pitch sequence and outcome', () => {
  assert.equal(game.date, '2026-10-04');
  assert.equal(game.gameId, 849825);
  assert.equal(game.venue, 'American Family Field');
  assert.deepEqual(game.initialState.score, { Padres: 3, Brewers: 2 });
  assert.equal(game.initialState.inning, 9);
  assert.equal(game.initialState.half, 'bottom');
  assert.equal(game.initialState.outs, 2);
  assert.deepEqual(game.initialState.bases, { first: 'Joey Ortiz', second: 'Sal Frelick', third: 'Christian Yelich' });
  assert.deepEqual(game.pitches.map(pitch => [pitch.number, pitch.speedMph, pitch.typeCode, pitch.description, pitch.countAfter.balls, pitch.countAfter.strikes]), [
    [1, 100.8, 'FF', 'Swinging Strike', 0, 1],
    [2, 102.2, 'FF', 'Ball', 1, 1],
    [3, 102.2, 'FF', 'Swinging Strike', 1, 2],
    [4, 103.5, 'FF', 'Foul', 1, 2],
    [5, 88.8, 'SL', 'Ball', 2, 2],
    [6, 101.3, 'FF', 'In play, run(s)', 2, 2],
  ]);
  assert.equal(game.result.event, 'Two-run walk-off single');
  assert.deepEqual(game.result.finalScore, { Brewers: 4, Padres: 3 });
  assert.deepEqual(game.result.seriesAfter, { Brewers: 2, Padres: 0 });
  assert.deepEqual(game.result.scoringRunners, ['Christian Yelich', 'Sal Frelick']);
  assert.equal(game.result.rbi, 2);
  assert.equal(game.result.exitVelocityMph, 109.5);
  assert.match(game.result.description, /center fielder Jackson Merrill/);
  assert.ok(game.sources.some(source => source.url === `https://statsapi.mlb.com/api/v1.1/game/${game.gameId}/feed/live`));
});

test('HTML pitch speeds, counts, and pitch types agree with the game record', () => {
  const document = parseHtml(html);
  const pitches = document.querySelectorAll('.pitch');
  assert.equal(pitches.length, game.pitches.length);
  pitches.forEach((button, index) => {
    const pitch = game.pitches[index];
    const count = `${pitch.countAfter.balls}–${pitch.countAfter.strikes}`;
    assert.equal(Number(button.dataset.speed), pitch.speedMph, `Pitch ${index + 1} speed`);
    assert.equal(button.dataset.count, count, `Pitch ${index + 1} count`);
    assert.equal(button.dataset.type.toLowerCase(), pitch.type.toLowerCase(), `Pitch ${index + 1} type`);
    const detail = button.children.find(child => child.classList?.contains('pitch-detail'));
    const number = button.children.find(child => child.classList?.contains('pitch-index'));
    assert.ok(detail, `Visible detail for pitch ${index + 1}`);
    assert.match(normalized(detail.textContent), new RegExp(`^${pitch.speedMph.toFixed(1).replace('.', '\\.')} mph\\b`));
    assert.equal(normalized(number?.textContent || ''), String(index + 1));
    if (index < 5) assert.ok(button.textContent.includes(count), `Visible pitch ${index + 1} count`);
  });
  assert.match(pitches[5].dataset.description, /outfield|center/i, 'Winning hit is an outfield single');
  assert.doesNotMatch(normalized(document.getElementById('ending').textContent), /into left(?: field)?/i);
});

test('local assets, fragments, original screenshots, and font licenses are complete', () => {
  const document = parseHtml(html);
  const ids = document.elements.map(element => element.attributes.id).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length, 'HTML IDs are unique');
  for (const element of document.elements) {
    for (const attribute of ['href', 'src']) {
      const url = element.attributes[attribute];
      if (url?.startsWith('#')) assert.ok(ids.includes(decodeURIComponent(url.slice(1))), `Fragment exists: ${url}`);
      else assertLocalFile(url, 'index.html');
    }
    if (element.attributes.srcset) {
      for (const candidate of element.attributes.srcset.split(',')) assertLocalFile(candidate.trim().split(/\s+/)[0], 'index.html');
    }
  }
  for (const match of css.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g)) assertLocalFile(match[1], 'styles.css');
  for (const name of ['07.47.25', '07.47.31', '07.47.58']) {
    const image = readFileSync(resolve(site, `assets/originals/Screenshot 2026-10-05 at ${name}.png`));
    assert.equal(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `Original ${name} is a PNG`);
    assert.ok(image.length > 100, `Original ${name} contains image data`);
  }
  for (const file of ['assets/fonts/OFL.txt', 'assets/fonts/Bricolage-OFL.txt']) assert.match(read(file), /SIL OPEN FONT LICENSE Version 1\.1/i);
  assert.match(read('assets/CREDITS.md'), /MLB.*FS1/);
  assert.match(read('assets/fonts/README.txt'), /Manrope[\s\S]*Bricolage/);
});

test('the outcome and complete at-bat remain available without JavaScript', () => {
  const document = parseHtml(html);
  assertVisibleWithoutScript(document.querySelector('.hero-caption'), 'Game date and venue');
  assertVisibleWithoutScript(document.querySelector('.game-strip'), 'Initial game situation');
  assertVisibleWithoutScript(document.querySelector('.pitch-list'), 'Complete six-pitch sequence');
  assertVisibleWithoutScript(document.getElementById('ending'), 'Game outcome');
  const ending = normalized(document.getElementById('ending').textContent);
  assert.match(ending, /Christian Yelich[\s\S]*Sal Frelick/);
  assert.match(ending, /San Diego\s*3[\s\S]*Milwaukee\s*4/);
  assert.match(ending, /Brewers lead the series 2–0/);
  assert.equal(document.querySelector('.replay-controls').hidden, true, 'Uninitialized replay controls are hidden');
  // Catch CSS rules that hide factual sections in the screen presentation.
  const screenCss = css.split('@media print')[0];
  for (const rule of screenCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!/display\s*:\s*none|visibility\s*:\s*hidden/.test(rule[2])) continue;
    assert.doesNotMatch(rule[1], /\.pitch-list\b|\.ending\b|#ending\b|\.final-score\b/, 'Critical facts are not hidden by screen CSS');
  }
});

test('replay advances six pitches, changes the score only on the hit, and can replay or go back', () => {
  const document = parseHtml(html);
  vm.runInNewContext(app, { document }, { filename: 'app.js', timeout: 1000 });
  const pitches = document.querySelectorAll('.pitch');
  const next = document.getElementById('next-pitch');
  const replay = document.querySelector('.replay');
  assert.equal(document.querySelector('.replay-controls').hidden, false);
  assert.equal(next.listeners.get('click')?.length, 1, 'Next control is connected');
  assert.ok(pitches.every(button => button.listeners.get('click')?.length === 1), 'Every pitch is directly selectable');

  function assertState(index, announced = true) {
    const winning = index === game.pitches.length - 1;
    const pitch = game.pitches[index];
    assert.equal(document.getElementById('pitch-number').textContent, `Pitch ${index + 1} of 6`);
    assert.equal(document.getElementById('pitch-count').textContent, `Count: ${pitch.countAfter.balls}–${pitch.countAfter.strikes}`);
    assert.equal(Number(document.getElementById('velocity').textContent), pitch.speedMph);
    assert.equal(document.getElementById('pitch-type').textContent, pitches[index].dataset.type);
    assert.equal(document.getElementById('pitch-description').textContent, pitches[index].dataset.description);
    assert.equal(document.getElementById('mil-score').textContent, winning ? '4' : '2');
    assert.equal(document.getElementById('stage-state').textContent, winning ? 'Final · Brewers win' : '2 outs · Bases loaded');
    assert.equal(replay.classList.contains('is-winning'), winning);
    assert.equal(pitches.filter(button => button.getAttribute('aria-current') === 'step').length, 1);
    assert.equal(pitches.filter(button => button.classList.contains('selected')).length, 1);
    assert.equal(pitches[index].getAttribute('aria-current'), 'step');
    assert.match(next.textContent, winning ? /Replay the at-bat/ : /Next pitch/);
    assert.ok(next.children.some(child => child.tagName === 'svg'), 'Replay label preserves the control icon');
    if (announced) {
      const announcement = document.getElementById('replay-announcement').textContent;
      assert.match(announcement, new RegExp(`^Pitch ${index + 1}:`));
      assert.ok(announcement.includes(`${pitch.speedMph} miles per hour`));
      if (winning) assert.match(announcement, /Final score: San Diego 3, Milwaukee 4/);
      else assert.doesNotMatch(announcement, /Final score/);
    }
  }

  assertState(0, false);
  for (let index = 1; index < game.pitches.length; index++) {
    next.click();
    assertState(index);
  }
  next.click();
  assertState(0);
  pitches[5].click();
  assertState(5);
  pitches[2].click();
  assertState(2);
  next.click();
  assertState(3);
  pitches[5].click();
  next.click();
  assertState(0);
});
