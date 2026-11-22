// Acceptance checks for the core rules. Run with:  node tests/logic.test.js
'use strict';
const assert = require('node:assert/strict');
const L = require('../js/logic.js');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok   ' + name); }
  catch (e) { console.error('  FAIL ' + name + '\n       ' + e.message); process.exitCode = 1; }
}

console.log('PB-01 joining');
test('poster code is accepted however it is typed', () => {
  assert.ok(L.isValidJoinCode('READ26'));
  assert.ok(L.isValidJoinCode(' read-26 '));
  assert.ok(L.isValidJoinCode('read 26'));
});
test('unknown or empty codes are rejected', () => {
  assert.equal(L.isValidJoinCode('READ27'), false);
  assert.equal(L.isValidJoinCode(''), false);
  assert.equal(L.isValidJoinCode(null), false);
});

console.log('PB-03 milestones');
test('milestone pages for a 300-page book', () => {
  assert.deepEqual(L.MILESTONES.map(m => L.milestonePage(m, 300)), [75, 150, 225, 300]);
});
test('milestone pages round up so 25% is never shown early', () => {
  assert.deepEqual(L.MILESTONES.map(m => L.milestonePage(m, 10)), [3, 5, 8, 10]);
});
test('a milestone is reached exactly on its page, not before', () => {
  assert.equal(L.milestoneStatus(74, 300)[0].reached, false);
  assert.equal(L.milestoneStatus(75, 300)[0].reached, true);
});
test('next milestone says how many pages to go', () => {
  assert.deepEqual(L.nextMilestone(0, 300), { milestone: 25, page: 75, pagesToGo: 75 });
  assert.deepEqual(L.nextMilestone(160, 300), { milestone: 75, page: 225, pagesToGo: 65 });
  assert.equal(L.nextMilestone(300, 300), null);
});
test('percent rounds down, so 99.7% never shows as 100%', () => {
  assert.equal(L.percent(299, 300), 99);
  assert.equal(L.percent(300, 300), 100);
  assert.equal(L.percent(5, 0), 0);
});
test('page input is clamped to the book', () => {
  assert.equal(L.clampPage('-4', 200), 0);
  assert.equal(L.clampPage('999', 200), 200);
  assert.equal(L.clampPage('abc', 200), 0);
  assert.equal(L.clampPage('42.9', 200), 42);
});

console.log('PB-04 badges');
const book = (pagesRead, totalPages = 200) => ({ pagesRead, totalPages });
test('signing up earns Welcome aboard; joining a club earns Club member', () => {
  assert.deepEqual(L.earnedBadges({ user: { name: 'A' }, joinedClubs: [], books: [] }), ['welcome']);
  assert.deepEqual(L.earnedBadges({ user: { name: 'A' }, joinedClubs: ['x'], books: [] }), ['welcome', 'first-club']);
});
test('milestone badges follow the furthest book', () => {
  const s = { user: { name: 'A' }, joinedClubs: [], books: [book(20), book(100)] };
  assert.deepEqual(L.earnedBadges(s), ['welcome', 'm25', 'm50']);
});
test('finishing three books earns Bookworm', () => {
  const s = { user: { name: 'A' }, joinedClubs: [], books: [book(200), book(200), book(200)] };
  assert.ok(L.earnedBadges(s).includes('three-books'));
});
test('only new badges are announced', () => {
  assert.deepEqual(L.newlyEarned(['welcome'], ['welcome', 'm25']), ['m25']);
  assert.deepEqual(L.newlyEarned(['welcome', 'm25'], ['welcome']), []);
});

console.log(process.exitCode ? '\nSome checks failed.' : '\nAll ' + passed + ' checks passed.');
