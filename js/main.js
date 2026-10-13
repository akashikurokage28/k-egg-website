/*
  K-Egg Maybunga - site script

  - The menu is loaded from data/menu.json, so open the site through a local
    server (VS Code Live Server, `npx serve`, or any web host). Opening
    index.html by double-clicking blocks fetch() in most browsers.
  - Pre-orders are a demo until you set ORDER_ENDPOINT below.
*/
(function () {
  'use strict';

  // Paste a Google Apps Script web app URL here to send pre-orders to a Google Sheet.
  var ORDER_ENDPOINT = '';
  var PESO = '\u20b1';

  var cart = {};
  var tab = 'all';
  var cards = [];

  function $(id) { return document.getElementById(id); }
  function money(n) { return PESO + n; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Menu rendering ---------- */

  function controls() {
    return '<div class="ctl">' +
      '<button type="button" class="minus" aria-label="Remove one" hidden>&minus;</button>' +
      '<button type="button" class="add">+ Add</button></div>';
  }

  function foodCard(it) {
    var attrs = ' data-cat="' + esc(it.category) + '" data-name="' + esc(it.name) + '" data-price="' + it.price + '"';
    if (it.style === 'addon') {
      return '<div class="m m--addon"' + attrs + '>' +
        '<div class="nm nm--lg"><span>' + esc(it.name) + '</span><span class="pr">+' + money(it.price) + '</span></div>' +
        '<p class="m-note">' + esc(it.note || '') + '</p>' + controls() + '</div>';
    }
    var label = (it.priceLabel ? it.priceLabel + ' ' : '') + money(it.price);
    var tag = it.tag ? '<span class="tag">' + esc(it.tag) + '</span>' : '';
    return '<div class="m"' + attrs + '>' +
      '<img class="ph" loading="lazy" src="' + esc(it.image) + '" alt="' + esc(it.name) + '">' +
      '<div class="nm"><span>' + esc(it.name) + '</span><span class="pr">' + label + '</span></div>' +
      tag + controls() + '</div>';
  }

  function drinkCard(it) {
    return '<div class="m" data-cat="drink" data-name="' + esc(it.name) + '" data-p12="' + it.sizes['12'] +
      '" data-p16="' + it.sizes['16'] + '" data-size="12">' +
      '<img class="ph sq" loading="lazy" src="' + esc(it.image) + '" alt="' + esc(it.name) + '">' +
      '<span class="tag">' + esc(it.group) + '</span>' +
      '<div class="nm"><span>' + esc(it.name) + '</span><span class="pr">' + money(it.sizes['12']) + '</span></div>' +
      '<div class="szs">' +
      '<button type="button" class="sz on" data-s="12" aria-pressed="true">12 oz</button>' +
      '<button type="button" class="sz" data-s="16" aria-pressed="false">16 oz</button></div>' +
      controls() + '</div>';
  }

  function featuredCard(it, text) {
    return '<div class="m feat" data-cat="' + esc(it.category) + '" data-name="' + esc(it.name) + '" data-price="' + it.price + '">' +
      '<img class="ph" src="' + esc(it.image) + '" alt="' + esc(it.name) + '">' +
      '<div class="fi"><span class="script feat-kicker">Featured at opening</span>' +
      '<h3 class="h feat-title">' + esc(it.name) + '</h3>' +
      '<div class="feat-meta"><span class="pr">' + money(it.price) + '</span>' +
      (it.tag ? '<span class="tag">' + esc(it.tag) + '</span>' : '') + '</div>' +
      '<p class="feat-text">' + esc(text || '') + '</p>' + controls() + '</div></div>';
  }

  function buildMenu(menu) {
    var html = '';
    var featured = menu.items.filter(function (i) { return i.id === menu.featured; })[0];
    if (featured) html += featuredCard(featured, menu.featuredText);
    menu.items.forEach(function (it) {
      html += it.category === 'drink' ? drinkCard(it) : foodCard(it);
    });
    $('mg').innerHTML = html;

    var addons = $('addons');
    if (addons && menu.drinkAddOns) {
      addons.textContent = 'Add-ons +' + PESO + menu.drinkAddOns.price + ' each: ' + menu.drinkAddOns.items.join(', ');
    }
  }

  /* ---------- Order logic ---------- */

  function keyOf(c) { return c.dataset.p12 ? c.dataset.name + ' (' + c.dataset.size + ' oz)' : c.dataset.name; }
  function priceOf(c) { return c.dataset.p12 ? +c.dataset['p' + c.dataset.size] : +c.dataset.price; }

  function totals() {
    var n = 0, t = 0, parts = [];
    for (var k in cart) {
      n += cart[k].q;
      t += cart[k].q * cart[k].p;
      parts.push(cart[k].q + ' x ' + k);
    }
    return { count: n, total: t, text: parts.join(', ') };
  }

  function render() {
    var s = totals();
    cards.forEach(function (c) {
      var q = cart[keyOf(c)] ? cart[keyOf(c)].q : 0;
      c.querySelector('.add').textContent = q ? '+ Add \u00b7 ' + q : '+ Add';
      c.querySelector('.minus').hidden = !q;
      if (c.dataset.p12) c.querySelector('.pr').innerHTML = '&#8369;' + priceOf(c);
      c.hidden = !(tab === 'all' || c.dataset.cat === tab);
    });
    $('rjg').hidden = tab !== 'drink';
    $('bar').classList.toggle('show', s.count > 0);
    $('bsum').textContent = s.count + (s.count === 1 ? ' item' : ' items') + ' \u00b7 ' + money(s.total);
  }

  function setTab(t) {
    tab = t;
    [].forEach.call(document.querySelectorAll('.tab'), function (b) {
      var on = b.dataset.t === t;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
    });
    render();
  }

  function scrollToOrder() {
    var o = $('order');
    var y = o.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || 0) - 84;
    try { window.scrollTo({ top: y, behavior: 'smooth' }); } catch (_) { window.scrollTo(0, y); }
  }

  /* ---------- Events ---------- */

  function navOpen(open) {
    var nv = $('nv'), mb = $('mb');
    nv.classList.toggle('open', open);
    mb.setAttribute('aria-expanded', open);
    mb.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  function bind() {
    document.addEventListener('click', function (e) {
      var tb = e.target.closest('.tab');
      if (tb) { setTab(tb.dataset.t); return; }

      var nav = e.target.closest('[data-tab]');
      if (nav) { setTab(nav.dataset.tab); return; }

      var sz = e.target.closest('.sz');
      if (sz) {
        var card = sz.closest('.m');
        card.dataset.size = sz.dataset.s;
        [].forEach.call(card.querySelectorAll('.sz'), function (b) {
          var on = b === sz;
          b.classList.toggle('on', on);
          b.setAttribute('aria-pressed', on);
        });
        render();
        return;
      }

      var add = e.target.closest('.add'), minus = e.target.closest('.minus');
      if (add || minus) {
        var c = (add || minus).closest('.m'), k = keyOf(c);
        if (add) {
          cart[k] = cart[k] || { q: 0, p: priceOf(c) };
          cart[k].q++;
        } else if (cart[k]) {
          cart[k].q--;
          if (cart[k].q <= 0) delete cart[k];
        }
        render();
      }
    });

    $('bclr').addEventListener('click', function () { cart = {}; render(); });

    $('bgo').addEventListener('click', function () {
      var s = totals();
      $('orderf').value = s.text + ' (total ' + money(s.total) + ')';
      scrollToOrder();
    });

    $('f').addEventListener('submit', function (e) {
      e.preventDefault();
      var form = e.target, ok = $('ok');
      var payload = {
        name: form.elements.n.value,
        phone: form.elements.p.value,
        order: form.elements.o.value,
        pickup: form.elements.t.value,
        total: totals().total,
        createdAt: new Date().toISOString()
      };

      function done(message) {
        ok.textContent = message;
        ok.classList.add('show');
        form.reset();
        cart = {};
        render();
      }

      if (!ORDER_ENDPOINT) {
        done('Thanks! This is a demo, so no order was sent. In the live site, it goes to your Google Sheet.');
        return;
      }
      fetch(ORDER_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      }).then(function () {
        done('Thanks! Your pre-order was sent. We will confirm it by message.');
      }).catch(function () {
        ok.textContent = 'Sorry, the order could not be sent. Please try again.';
        ok.classList.add('show');
      });
    });

    $('mb').addEventListener('click', function () { navOpen(!$('nv').classList.contains('open')); });
    $('nv').addEventListener('click', function (e) { if (e.target.closest('a')) navOpen(false); });
  }

  /* ---------- Scroll animation (replays when scrolling up and down) ---------- */

  function scrollAnimations() {
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!('IntersectionObserver' in window) || reduce) return;

    var selector = '.hero-in > *:not(.badge), .top .wrap > *, #menu .wrap > div:not(.grid), #mg > .m, ' +
      '#order .wrap > *, #faq h2, #faq details, #story .wrap > *, #visit .wrap > *';

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var el = en.target;
        if (en.isIntersecting) {
          el.classList.add('in');
        } else {
          el.classList.remove('in');
          el.classList.toggle('above', en.boundingClientRect.top < 0);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    var heroIndex = 0, cardIndex = 0;
    [].forEach.call(document.querySelectorAll(selector), function (el) {
      el.classList.add('rv');
      if (el.matches('.hero-in > *')) el.style.setProperty('--d', (heroIndex++ * 0.1) + 's');
      else if (el.matches('#mg > .m')) el.style.setProperty('--d', ((cardIndex++ % 3) * 0.08) + 's');
      io.observe(el);
    });
  }

  /* ---------- Start ---------- */

  function start(menu) {
    if (menu) buildMenu(menu);
    cards = [].slice.call(document.querySelectorAll('#mg .m'));
    bind();
    scrollAnimations();
    render();
  }

  fetch('data/menu.json')
    .then(function (r) {
      if (!r.ok) throw new Error('menu.json: ' + r.status);
      return r.json();
    })
    .then(start)
    .catch(function (err) {
      console.error(err);
      $('mg').innerHTML = '<p class="menu-error">The menu could not load. Open this site through a local server (see README.md).</p>';
      start(null);
    });
})();