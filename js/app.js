/*
 * CityReads – app shell, views and events.
 * Story map: PB-01 welcome/signup · PB-02 home/club · PB-03 reading
 *            PB-04 badges + toast · PB-08 settings
 */
(function () {
  'use strict';

  var L = window.CityReadsLogic;
  var D = window.CityReadsData;
  var KEY = 'cityreads.v1';

  var main = document.getElementById('main');
  var nav = document.getElementById('nav');
  var toastEl = document.getElementById('toast');

  /* ---------- state ---------- */
  function defaultState() {
    return {
      user: null,
      joinedClubs: [],
      books: [],
      badges: [],
      settings: { textSize: 'standard', contrast: false }
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var s = JSON.parse(raw);
        var base = defaultState();
        return Object.assign(base, s, { settings: Object.assign(base.settings, s.settings || {}) });
      }
    } catch (e) { /* private mode or blocked storage: start fresh */ }
    return defaultState();
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  var state = load();
  var pendingJoin = null;   // { via: 'qr' | 'code' | 'link' } until signup is finished
  var joinError = '';

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function clubById(id) {
    return D.clubs.find(function (c) { return c.id === id; });
  }

  function bookById(id) {
    return state.books.find(function (b) { return b.id === id; });
  }

  function membersOf(club) {
    return club.members + (state.joinedClubs.indexOf(club.id) !== -1 ? 1 : 0);
  }

  function booksByRecent() {
    return state.books.slice().sort(function (a, b) { return b.updatedAt - a.updatedAt; });
  }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  /* ---------- PB-08: display settings ---------- */
  function applySettings() {
    document.documentElement.dataset.text = state.settings.textSize;
    document.documentElement.classList.toggle('hc', !!state.settings.contrast);
  }

  /* ---------- PB-04: badges ---------- */
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 4500);
  }

  function refreshBadges() {
    var fresh = L.newlyEarned(state.badges, L.earnedBadges(state));
    if (!fresh.length) return;
    state.badges = state.badges.concat(fresh);
    toast('New badge: ' + fresh.map(function (id) { return L.badgeById(id).name; }).join(', '));
  }

  // Every change goes through here: mutate, award badges, save, redraw.
  function commit(mutate, redraw) {
    mutate();
    refreshBadges();
    save();
    if (redraw !== false) render(false);
  }

  /* ---------- PB-01: arriving from a poster QR or the web link ---------- */
  function readJoinParam() {
    var params = new URLSearchParams(location.search);
    if (!params.has('join')) return;
    var ok = L.isValidJoinCode(params.get('join'));
    if (ok) pendingJoin = { via: params.get('via') === 'qr' ? 'qr' : 'link' };
    else joinError = 'That join link has a code we don’t recognise. Try typing the code from the poster.';
    var target = (ok && !state.user) ? '#/signup' : '#/home';
    try { history.replaceState(null, '', location.pathname + target); }
    catch (e) { location.hash = target; }
  }

  /* ---------- small view parts ---------- */
  function qrGraphic() {
    // Decorative stand-in for the poster QR code (fixed pattern, not scannable).
    var n = 21, cells = '', seed = 7;
    function finder(x, y) {
      return '<rect x="' + x + '" y="' + y + '" width="7" height="7" fill="currentColor"/>' +
             '<rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="var(--surface)"/>' +
             '<rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" fill="currentColor"/>';
    }
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        var inFinder = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
        seed = (seed * 9301 + 49297) % 233280;
        if (!inFinder && seed / 233280 > 0.52) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
      }
    }
    return '<svg class="qr" viewBox="-1 -1 23 23" aria-hidden="true" fill="currentColor">' +
           finder(0, 0) + finder(14, 0) + finder(0, 14) + cells + '</svg>';
  }

  // Decorative welcome illustration: a stack of books and a steaming mug.
  function heroArt() {
    return '<svg class="hero-art" viewBox="0 0 220 150" aria-hidden="true">' +
      '<rect class="book-1" x="14" y="112" width="122" height="22" rx="4"/>' +
      '<line class="spine" x1="30" y1="112" x2="30" y2="134"/>' +
      '<rect class="book-2" x="24" y="90" width="104" height="22" rx="4"/>' +
      '<line class="spine" x1="112" y1="90" x2="112" y2="112"/>' +
      '<rect class="book-3" x="18" y="68" width="112" height="22" rx="4"/>' +
      '<line class="spine" x1="34" y1="68" x2="34" y2="90"/>' +
      '<ellipse class="saucer" cx="176" cy="134" rx="38" ry="6"/>' +
      '<path class="mug" d="M146 82h56v32a18 18 0 0 1-18 18h-20a18 18 0 0 1-18-18z"/>' +
      '<path class="mug" d="M202 92h4a11 11 0 0 1 0 22h-5" fill="none"/>' +
      '<ellipse class="coffee" cx="174" cy="84" rx="25" ry="4"/>' +
      '<path class="steam" d="M162 70c-6-8 6-12 0-22"/>' +
      '<path class="steam" d="M175 70c-6-8 6-12 0-22"/>' +
      '<path class="steam" d="M188 70c-6-8 6-12 0-22"/>' +
    '</svg>';
  }

  function simpleBar(pct, label) {
    return '<div class="bar" role="progressbar" aria-label="' + esc(label) + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '">' +
           '<div class="bar-fill" style="width:' + pct + '%"></div></div>';
  }

  // PB-03: the progress bar with four milestone markers, plus the checkpoint row under it.
  function milestoneBar(book) {
    var pct = L.percent(book.pagesRead, book.totalPages);
    var status = L.milestoneStatus(book.pagesRead, book.totalPages);
    var reached = status.filter(function (s) { return s.reached; }).length;
    var marks = status.map(function (s) {
      return '<span class="mbar-mark' + (s.reached ? ' reached' : '') + '" style="left:' + s.milestone + '%"></span>';
    }).join('');
    var steps = status.map(function (s) {
      return '<li class="' + (s.reached ? 'reached' : '') + '">' +
               '<span class="dot" aria-hidden="true">' + (s.reached ? '✓' : '') + '</span>' +
               '<span><strong>' + s.milestone + '%</strong><span class="muted small">page ' + s.page + '</span></span>' +
               '<span class="sr-only">' + (s.reached ? 'reached' : 'not reached yet') + '</span>' +
             '</li>';
    }).join('');
    return '<div class="mbar" role="progressbar" aria-label="Reading progress for ' + esc(book.title) + '"' +
             ' aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"' +
             ' aria-valuetext="' + pct + '%, ' + reached + ' of 4 milestones reached">' +
             '<div class="mbar-track"><div class="mbar-fill" style="width:' + pct + '%"></div>' + marks + '</div>' +
           '</div>' +
           '<ol class="milestones" aria-label="Milestones">' + steps + '</ol>';
  }

  function nextLine(book) {
    var next = L.nextMilestone(book.pagesRead, book.totalPages);
    if (!next) return '<p class="next done"><strong>Finished!</strong> You reached every milestone.</p>';
    return '<p class="next">Next milestone: <strong>' + next.milestone + '%</strong> at page ' + next.page +
           '. <strong>' + plural(next.pagesToGo, 'page', 'pages') + '</strong> to go.</p>';
  }

  function clubCard(c) {
    var joined = state.joinedClubs.indexOf(c.id) !== -1;
    return '<article class="card club">' +
             '<h3><a class="stretched" href="#/club/' + c.id + '">' + esc(c.name) + '</a></h3>' +
             '<p class="muted small">' + esc(c.location) + '</p>' +
             '<p>Reading <cite>' + esc(c.book.title) + '</cite></p>' +
             '<p class="meta">' + membersOf(c) + ' members · ' + esc(c.meets) + '</p>' +
             (joined ? '<span class="pill">Joined</span>' : '') +
           '</article>';
  }

  function greeting(level) {
    if (level === 'returning') return 'Welcome back to reading. Pull up a chair: the Easy Reads Circle is a friendly place to start.';
    if (level === 'sometimes') return 'No rush. A few pages with a coffee still counts.';
    return 'Put the kettle on. Here’s what’s brewing in the city’s reading community.';
  }

  /* ---------- views ---------- */
  var views = {};

  // PB-01
  views.welcome = function () {
    return '' +
      '<section class="hero">' +
        '<div>' +
          '<p class="eyebrow">Backed by your city library and council</p>' +
          '<h1>Grab a cuppa and a good book</h1>' +
          '<p class="lead">Cosy book clubs in libraries and cafés across the city. Read at your own pace, and collect a stamp for every milestone.</p>' +
        '</div>' +
        heroArt() +
      '</section>' +
      '<section aria-labelledby="join-h">' +
        '<h2 id="join-h">Join in the way that suits you</h2>' +
        '<div class="join-grid">' +
          '<article class="card option">' +
            qrGraphic() +
            '<h3>Scan a poster</h3>' +
            '<p>Look for our posters in libraries, cafés and community centres.</p>' +
            '<a class="btn" href="?join=' + D.joinCode + '&amp;via=qr">Simulate scanning a poster</a>' +
          '</article>' +
          '<article class="card option">' +
            '<h3>Type the short code</h3>' +
            '<p>No QR scanner? Every poster also shows a short code.</p>' +
            '<form id="code-form" novalidate>' +
              '<label for="code">Join code</label>' +
              '<div class="row">' +
                '<input id="code" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. READ26" aria-describedby="code-error"' + (joinError ? ' aria-invalid="true"' : '') + '>' +
                '<button class="btn" type="submit">Join</button>' +
              '</div>' +
              '<p id="code-error" class="error" role="alert">' + esc(joinError) + '</p>' +
            '</form>' +
          '</article>' +
          '<article class="card option">' +
            '<h3>Open the web link</h3>' +
            '<p>Type <strong>cityreads.example/join</strong> into any browser, or ask library staff to help.</p>' +
            '<a class="btn secondary" href="?join=' + D.joinCode + '&amp;via=link">Open the join link</a>' +
          '</article>' +
        '</div>' +
        '<p class="hint">Demo: the code on the posters is <strong>' + D.joinCode + '</strong>.</p>' +
      '</section>';
  };

  // PB-01: the same sign-up screen whichever way people join
  views.signup = function () {
    var via = { qr: 'the poster QR code', code: 'the poster code', link: 'the web link' }[pendingJoin.via];
    function radio(value, text, checked) {
      return '<label class="choice"><input type="radio" name="level" value="' + value + '"' + (checked ? ' checked' : '') + '> ' + text + '</label>';
    }
    return '' +
      '<section class="narrow">' +
        '<p class="eyebrow">Almost there</p>' +
        '<h1>Create your reader profile</h1>' +
        '<p class="muted">You’re joining with ' + via + '.</p>' +
        '<form id="signup-form" class="card stack" novalidate>' +
          '<div><label for="name">What should we call you?</label>' +
            '<input id="name" name="name" maxlength="40" autocomplete="given-name" aria-describedby="signup-error"></div>' +
          '<fieldset><legend>How would you describe your reading?</legend>' +
            radio('avid', 'I read a lot', true) +
            radio('sometimes', 'I read sometimes') +
            radio('returning', 'I’m getting back into reading') +
          '</fieldset>' +
          '<p id="signup-error" class="error" role="alert"></p>' +
          '<button class="btn" type="submit">Join CityReads</button>' +
        '</form>' +
      '</section>';
  };

  // PB-02 (+ a PB-03 summary card)
  views.home = function () {
    var current = booksByRecent()[0];
    var summary = current
      ? '<section class="card highlight" aria-labelledby="now-h">' +
          '<p class="eyebrow">On your nightstand</p>' +
          '<h2 id="now-h"><cite>' + esc(current.title) + '</cite></h2>' +
          milestoneBar(current) + nextLine(current) +
          '<a class="btn" href="#/reading">Update my reading</a>' +
        '</section>'
      : '<section class="card highlight">' +
          '<h2>Track your first book</h2>' +
          '<p>Add any book, or join a club and track its book. We’ll show you clear milestones as you go.</p>' +
          '<a class="btn" href="#/reading">Start tracking</a>' +
        '</section>';

    return '' +
      '<h1>Hi, ' + esc(state.user.name) + '</h1>' +
      '<p class="lead">' + greeting(state.user.level) + '</p>' +
      summary +
      '<section aria-labelledby="clubs-h">' +
        '<h2 id="clubs-h">Starter book clubs</h2>' +
        '<p class="muted">Friendly groups run by local libraries and volunteers. There’s always a seat free.</p>' +
        '<div class="club-grid">' + D.clubs.map(clubCard).join('') + '</div>' +
      '</section>' +
      '<section aria-labelledby="updates-h">' +
        '<h2 id="updates-h">Notes from the noticeboard</h2>' +
        '<ul class="updates">' + D.updates.map(function (u) {
          return '<li class="card"><p class="eyebrow">' + esc(u.from) + '</p><p>' + esc(u.text) + '</p></li>';
        }).join('') + '</ul>' +
      '</section>';
  };

  // PB-02
  views.club = function (id) {
    var c = clubById(id);
    if (!c) return views.notFound();
    var joined = state.joinedClubs.indexOf(c.id) !== -1;
    var tracking = state.books.some(function (b) { return b.clubId === c.id; });
    var follow = '';
    if (joined) {
      follow = tracking
        ? '<a class="btn secondary" href="#/reading">See my progress</a>'
        : '<button class="btn secondary" type="button" data-action="track-club-book" data-id="' + c.id + '">Track this book</button>';
    }
    return '' +
      '<p><a class="back" href="#/home">← Back to home</a></p>' +
      '<h1>' + esc(c.name) + '</h1>' +
      '<p class="lead">' + esc(c.description) + '</p>' +
      '<section class="card stack">' +
        '<dl class="facts">' +
          '<div><dt>Where</dt><dd>' + esc(c.location) + '</dd></div>' +
          '<div><dt>When</dt><dd>' + esc(c.meets) + '</dd></div>' +
          '<div><dt>Members</dt><dd>' + membersOf(c) + '</dd></div>' +
          '<div><dt>Now reading</dt><dd><cite>' + esc(c.book.title) + '</cite> by ' + esc(c.book.author) + ' (' + c.book.pages + ' pages)</dd></div>' +
        '</dl>' +
        '<div><p class="label">Most members are about ' + c.clubProgress + '% through the book</p>' +
          simpleBar(c.clubProgress, 'Club reading progress') + '</div>' +
        (joined ? '<p class="success">You’re a member. See you at the next meetup.</p>' : '') +
        '<div class="actions">' +
          '<button class="btn' + (joined ? ' secondary' : '') + '" type="button" data-action="toggle-club" data-id="' + c.id + '">' +
            (joined ? 'Leave club' : 'Join this club') + '</button>' +
          follow +
        '</div>' +
      '</section>';
  };

  // PB-03
  views.reading = function () {
    var books = booksByRecent();
    var list = books.length
      ? books.map(function (b) {
          var club = b.clubId ? clubById(b.clubId) : null;
          return '<article class="card book" aria-labelledby="t-' + b.id + '">' +
                   '<div class="book-head"><h2 id="t-' + b.id + '"><cite>' + esc(b.title) + '</cite></h2>' +
                     '<span class="pct">' + L.percent(b.pagesRead, b.totalPages) + '%</span></div>' +
                   '<p class="muted">Page ' + b.pagesRead + ' of ' + b.totalPages + (club ? ' · ' + esc(club.name) : '') + '</p>' +
                   milestoneBar(b) + nextLine(b) +
                   '<form class="log-form" data-id="' + b.id + '" novalidate>' +
                     '<label for="p-' + b.id + '">I’m on page</label>' +
                     '<div class="row">' +
                       '<input id="p-' + b.id + '" name="page" type="number" min="0" max="' + b.totalPages + '" value="' + b.pagesRead + '" inputmode="numeric">' +
                       '<button class="btn" type="submit">Save</button>' +
                     '</div>' +
                     '<div class="quick">' +
                       '<button type="button" class="btn small secondary" data-action="add-pages" data-id="' + b.id + '" data-n="10">+10 pages</button>' +
                       '<button type="button" class="btn small secondary" data-action="add-pages" data-id="' + b.id + '" data-n="25">+25 pages</button>' +
                     '</div>' +
                   '</form>' +
                   '<button type="button" class="link danger" data-action="remove-book" data-id="' + b.id + '">Remove this book</button>' +
                 '</article>';
        }).join('')
      : '<div class="card empty"><p>You’re not tracking a book yet. Add one below, or join a club and track its book.</p></div>';

    return '' +
      '<h1>My reading</h1>' +
      '<p class="lead">Each book has four milestones: 25%, 50%, 75% and finished. Reach one to earn a badge.</p>' +
      list +
      '<form id="add-book" class="card stack" aria-labelledby="add-h" novalidate>' +
        '<h2 id="add-h">Add a book</h2>' +
        '<div class="row2">' +
          '<div><label for="bt">Title</label><input id="bt" name="title" maxlength="80"></div>' +
          '<div><label for="bp">Total pages</label><input id="bp" name="pages" type="number" min="1" max="5000" inputmode="numeric"></div>' +
        '</div>' +
        '<p id="add-error" class="error" role="alert"></p>' +
        '<button class="btn" type="submit">Add book</button>' +
      '</form>';
  };

  // PB-04
  views.badges = function () {
    var items = L.BADGES.map(function (b) {
      var earned = state.badges.indexOf(b.id) !== -1;
      return '<li class="badge ' + (earned ? 'earned' : 'locked') + '">' +
               '<span class="medal" aria-hidden="true">' + b.icon + '</span>' +
               '<strong>' + b.name + '</strong>' +
               '<span class="muted small">' + (earned ? 'Earned' : 'To earn: ' + b.how) + '</span>' +
             '</li>';
    }).join('');
    return '' +
      '<h1>Badges</h1>' +
      '<p class="lead">Like a café loyalty card: a stamp for every milestone. You’ve collected ' + state.badges.length + ' of ' + L.BADGES.length + '.</p>' +
      '<ul class="badge-grid">' + items + '</ul>';
  };

  // PB-08
  views.settings = function () {
    function size(value, text, scale) {
      return '<label class="choice size-choice"><input type="radio" name="textSize" value="' + value + '"' +
             (state.settings.textSize === value ? ' checked' : '') + '> ' +
             '<span style="font-size:' + scale + 'em">Aa</span> ' + text + '</label>';
    }
    return '' +
      (state.user ? '' : '<p><a class="back" href="#/welcome">← Back</a></p>') +
      '<h1>Display settings</h1>' +
      '<p class="lead">Make CityReads easier to read. Your choices are saved on this device.</p>' +
      '<form id="settings-form" class="card stack">' +
        '<fieldset><legend>Text size</legend>' +
          size('standard', 'Standard', 1) + size('large', 'Large', 1.2) + size('xlarge', 'Extra large', 1.4) +
        '</fieldset>' +
        '<label class="choice toggle"><input type="checkbox" name="contrast"' + (state.settings.contrast ? ' checked' : '') + '> High-contrast colours</label>' +
      '</form>' +
      (state.user
        ? '<section class="card stack"><h2>Demo data</h2>' +
            '<p class="muted">Clear your profile, clubs, books and badges to run the demo again. Display settings stay.</p>' +
            '<div><button class="btn secondary danger" type="button" data-action="reset">Reset demo</button></div></section>'
        : '');
  };

  views.notFound = function () {
    return '<h1>Page not found</h1><p><a href="#/home">Go to home</a></p>';
  };

  /* ---------- routing ---------- */
  function route() {
    var parts = location.hash.replace(/^#\/?/, '').split('/');
    return { name: parts[0] || '', id: parts[1] };
  }

  function go(path) { location.hash = '#/' + path; }

  function render(moveFocus) {
    applySettings();
    var r = route();
    var name = r.name;
    var signedIn = !!state.user;

    if (!signedIn && ['welcome', 'signup', 'settings'].indexOf(name) === -1) name = 'welcome';
    if (!signedIn && name === 'signup' && !pendingJoin) name = 'welcome';
    if (signedIn && ['', 'welcome', 'signup'].indexOf(name) !== -1) name = 'home';

    var view = views[name] || views.notFound;
    main.innerHTML = view(r.id);
    if (name === 'welcome') joinError = '';

    nav.hidden = !signedIn;
    var section = name === 'club' ? 'home' : name;
    Array.prototype.forEach.call(nav.querySelectorAll('a'), function (a) {
      if (a.dataset.route === section) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    if (moveFocus) {
      var h1 = main.querySelector('h1');
      if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
      window.scrollTo(0, 0);
    }
  }

  function refocus(selector) {
    var el = main.querySelector(selector);
    if (el) el.focus();
  }

  /* ---------- events ---------- */
  main.addEventListener('submit', function (e) {
    var form = e.target;
    e.preventDefault();

    if (form.id === 'code-form') {                     // PB-01
      var input = form.elements.code;
      if (L.isValidJoinCode(input.value)) {
        pendingJoin = { via: 'code' };
        go('signup');
      } else {
        input.setAttribute('aria-invalid', 'true');
        form.querySelector('.error').textContent = input.value.trim()
          ? 'We don’t recognise that code. Check the poster, or ask library staff.'
          : 'Enter the code from the poster.';
        input.focus();
      }
      return;
    }

    if (form.id === 'signup-form') {                   // PB-01
      var name = form.elements.name.value.trim();
      if (!name) {
        form.elements.name.setAttribute('aria-invalid', 'true');
        form.querySelector('.error').textContent = 'Please tell us what to call you.';
        form.elements.name.focus();
        return;
      }
      var via = pendingJoin ? pendingJoin.via : 'code';
      commit(function () {
        state.user = { name: name, level: form.elements.level.value, joinedVia: via, joinedAt: Date.now() };
        pendingJoin = null;
      }, false);
      go('home');
      return;
    }

    if (form.id === 'add-book') {                      // PB-03
      var title = form.elements.title.value.trim();
      var pages = Math.floor(Number(form.elements.pages.value));
      var err = !title ? 'Enter the book’s title.'
              : !(pages >= 1 && pages <= 5000) ? 'Enter the total number of pages (1 to 5000).' : '';
      if (err) { form.querySelector('.error').textContent = err; return; }
      commit(function () {
        state.books.push({ id: 'b' + Date.now(), title: title, totalPages: pages, pagesRead: 0, clubId: null, updatedAt: Date.now() });
      });
      return;
    }

    if (form.classList.contains('log-form')) {         // PB-03
      var id = form.dataset.id;
      commit(function () {
        var b = bookById(id);
        b.pagesRead = L.clampPage(form.elements.page.value, b.totalPages);
        b.updatedAt = Date.now();
      });
      refocus('#p-' + id);
    }
  });

  main.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var id = btn.dataset.id;

    switch (btn.dataset.action) {
      case 'toggle-club':                              // PB-02
        commit(function () {
          var i = state.joinedClubs.indexOf(id);
          if (i === -1) state.joinedClubs.push(id);
          else state.joinedClubs.splice(i, 1);
        });
        refocus('[data-action="toggle-club"]');
        break;

      case 'track-club-book':                          // PB-02 -> PB-03
        var c = clubById(id);
        commit(function () {
          state.books.push({ id: 'b' + Date.now(), title: c.book.title, totalPages: c.book.pages, pagesRead: 0, clubId: c.id, updatedAt: Date.now() });
        }, false);
        go('reading');
        break;

      case 'add-pages':                                // PB-03
        var n = Number(btn.dataset.n);
        commit(function () {
          var b = bookById(id);
          b.pagesRead = Math.min(b.totalPages, b.pagesRead + n);
          b.updatedAt = Date.now();
        });
        refocus('[data-action="add-pages"][data-id="' + id + '"][data-n="' + n + '"]');
        break;

      case 'remove-book':                              // PB-03
        var book = bookById(id);
        if (book && window.confirm('Remove “' + book.title + '” from your reading? Badges you’ve earned stay.')) {
          commit(function () { state.books = state.books.filter(function (b) { return b.id !== id; }); });
        }
        break;

      case 'reset':                                    // demo helper
        if (window.confirm('Reset the demo? This clears your profile, clubs, books and badges on this device.')) {
          var keep = state.settings;
          state = defaultState();
          state.settings = keep;
          save();
          go('welcome');
        }
        break;
    }
  });

  main.addEventListener('change', function (e) {         // PB-08: applies instantly
    var form = e.target.form;
    if (!form || form.id !== 'settings-form') return;
    state.settings.textSize = form.querySelector('input[name="textSize"]:checked').value;
    state.settings.contrast = form.elements.contrast.checked;
    save();
    applySettings();
  });

  window.addEventListener('hashchange', function () { render(true); });

  /* ---------- start ---------- */
  readJoinParam();
  render(false);
})();
