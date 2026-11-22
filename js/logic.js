/*
 * CityReads – core rules (no DOM). Shared by the app and the Node tests.
 * PB-01: join codes · PB-03: milestones · PB-04: badges
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CityReadsLogic = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- PB-01: joining ---------- */
  const JOIN_CODES = ['READ26'];

  // " read-26 " -> "READ26": forgiving of case, spaces and dashes typed off a poster
  function normaliseCode(input) {
    return String(input == null ? '' : input).toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  function isValidJoinCode(input) {
    return JOIN_CODES.includes(normaliseCode(input));
  }

  /* ---------- PB-03: milestones ---------- */
  const MILESTONES = [25, 50, 75, 100];

  // Page you must reach for a milestone. Rounded up, so 25% is never shown early.
  function milestonePage(milestone, totalPages) {
    return Math.ceil((totalPages * milestone) / 100);
  }

  function clampPage(page, totalPages) {
    const n = Math.floor(Number(page));
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(n, totalPages);
  }

  // Whole-number percent, rounded down so 99.6% never reads as "100%".
  function percent(pagesRead, totalPages) {
    if (!(totalPages > 0)) return 0;
    return Math.max(0, Math.min(100, Math.floor((pagesRead / totalPages) * 100)));
  }

  function milestoneStatus(pagesRead, totalPages) {
    return MILESTONES.map(function (m) {
      const page = milestonePage(m, totalPages);
      return { milestone: m, page: page, reached: totalPages > 0 && pagesRead >= page };
    });
  }

  function nextMilestone(pagesRead, totalPages) {
    const next = milestoneStatus(pagesRead, totalPages).find(function (s) { return !s.reached; });
    if (!next) return null;
    return { milestone: next.milestone, page: next.page, pagesToGo: next.page - pagesRead };
  }

  function highestMilestone(pagesRead, totalPages) {
    const reached = milestoneStatus(pagesRead, totalPages).filter(function (s) { return s.reached; });
    return reached.length ? reached[reached.length - 1].milestone : 0;
  }

  /* ---------- PB-04: badges ---------- */
  const BADGES = [
    { id: 'welcome',     name: 'Welcome aboard', icon: 'Hi',   how: 'Join the CityReads community' },
    { id: 'first-club',  name: 'Club member',    icon: 'Club', how: 'Join a book club' },
    { id: 'm25',         name: 'Off to a start', icon: '25%',  how: 'Reach 25% of any book' },
    { id: 'm50',         name: 'Halfway there',  icon: '50%',  how: 'Reach 50% of any book' },
    { id: 'm75',         name: 'Home stretch',   icon: '75%',  how: 'Reach 75% of any book' },
    { id: 'm100',        name: 'Book finished',  icon: '100%', how: 'Finish a book' },
    { id: 'three-books', name: 'Bookworm',       icon: '3',    how: 'Finish 3 books' }
  ];

  function badgeById(id) {
    return BADGES.find(function (b) { return b.id === id; });
  }

  // Badges the current state qualifies for, in display order.
  function earnedBadges(state) {
    const earned = [];
    const books = (state && state.books) || [];
    if (state && state.user) earned.push('welcome');
    if (state && state.joinedClubs && state.joinedClubs.length) earned.push('first-club');

    const best = books.reduce(function (max, b) {
      return Math.max(max, highestMilestone(b.pagesRead, b.totalPages));
    }, 0);
    MILESTONES.forEach(function (m) { if (best >= m) earned.push('m' + m); });

    const finished = books.filter(function (b) { return highestMilestone(b.pagesRead, b.totalPages) === 100; }).length;
    if (finished >= 3) earned.push('three-books');
    return earned;
  }

  // Badges are kept once earned, so only ever add.
  function newlyEarned(previous, current) {
    return current.filter(function (id) { return previous.indexOf(id) === -1; });
  }

  return {
    JOIN_CODES: JOIN_CODES,
    normaliseCode: normaliseCode,
    isValidJoinCode: isValidJoinCode,
    MILESTONES: MILESTONES,
    milestonePage: milestonePage,
    clampPage: clampPage,
    percent: percent,
    milestoneStatus: milestoneStatus,
    nextMilestone: nextMilestone,
    highestMilestone: highestMilestone,
    BADGES: BADGES,
    badgeById: badgeById,
    earnedBadges: earnedBadges,
    newlyEarned: newlyEarned
  };
});
