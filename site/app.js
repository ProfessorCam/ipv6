/* app.js - wires the left column to the right column. No frameworks.
   The shell (site menu, nav, lesson layout, reading level, theme) is the same as the other
   Packet Lessons sites. The widgets here are IPv6-specific: the hex/bit strip, the RFC 5952
   compressor, the prefix anatomy and slider, the subnet splitter, the address classifier,
   the EUI-64 builder, the practice quiz and the per-row checks. All numbers come from ipv6.js. */
(function () {
  'use strict';

  var I = IP6;
  var nav = document.getElementById('nav');
  var main = document.getElementById('main');
  var content = document.getElementById('content');

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function pickLevel(x) {
    if (x !== null && typeof x === 'object' && !Array.isArray(x) && ('s' in x || 'm' in x || 'e' in x)) {
      if (LEVEL in x) return x[LEVEL];
      if ('m' in x) return x.m;
      return ('e' in x) ? x.e : x.s;
    }
    return x;
  }

  function paras(x) {
    var r = lv(x);
    if (r === null || r === undefined || r === '') return [];
    return Array.isArray(r) ? r : [r];
  }

  function fmtN(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function big(p2) { return p2.number !== null ? fmtN(p2.number) : '2<sup>' + p2.bits + '</sup>' + (p2.human ? ' <span class="dim">(' + p2.human + ')</span>' : ''); }

  /* ---------- expanding site menu ---------- */

  function buildMenu() {
    var panel = document.getElementById('sitemenu'), btn = document.getElementById('menu-btn');
    if (!panel || !btn || !SITE.menu) return;
    panel.innerHTML = '<div class="sitemenu-title">Sites</div>' + SITE.menu.map(function (m) {
      if (!m.href) return '<span class="menu-item soon"><span>' + esc(m.label) + '</span><small>coming soon</small></span>';
      return '<a class="menu-item' + (m.current ? ' current' : '') + '" href="' + esc(m.href) + '"' + (m.current ? ' aria-current="page"' : '') + '>' + esc(m.label) + (m.current ? '<small>you are here</small>' : '') + '</a>';
    }).join('') + '<div class="sitemenu-foot">Click anywhere else, or press Escape, to close.</div>';
    var leaveTimer = null;
    function setOpen(open) {
      panel.classList.toggle('open', open); btn.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close site menu' : 'Open site menu');
      if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
    }
    function isOpen() { return panel.classList.contains('open'); }
    btn.addEventListener('click', function (e) { e.stopPropagation(); setOpen(!isOpen()); });
    panel.addEventListener('click', function (e) { e.stopPropagation(); if (e.target.closest('a.menu-item')) setOpen(false); });
    document.addEventListener('click', function () { if (isOpen()) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen()) { setOpen(false); btn.focus(); } });
    panel.addEventListener('mouseleave', function () { if (isOpen()) leaveTimer = setTimeout(function () { setOpen(false); }, 1200); });
    panel.addEventListener('mouseenter', function () { if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; } });
    panel.addEventListener('focusout', function (e) { if (!panel.contains(e.relatedTarget) && e.relatedTarget !== btn) setOpen(false); });
  }

  /* ---------- left column ---------- */

  var STACK_GROUPS = { basics: 'Foundations', cidr: 'Prefixes', kinds: 'Kinds of address', practice: 'Practice' };

  function buildNav() {
    var last = null;
    LESSONS.forEach(function (l) {
      if (l.stack !== undefined && l.stack !== last) {
        var g = document.createElement('div'); g.className = 'nav-group'; g.textContent = STACK_GROUPS[l.stack] || String(l.stack); nav.appendChild(g); last = l.stack;
      }
      var b = document.createElement('button');
      b.className = 'row'; b.type = 'button'; b.dataset.id = l.id;
      b.title = l.subtitle;
      b.innerHTML = '<span class="text"><span class="title">' + esc(l.title) + '</span></span>' + (l.chip ? '<span class="lay">' + esc(l.chip) + '</span>' : '');
      b.addEventListener('click', function () { location.hash = l.id; });
      nav.appendChild(b);
    });
  }

  function setActive(id) {
    Array.prototype.forEach.call(nav.querySelectorAll('.row'), function (b) { b.classList.toggle('active', b.dataset.id === id); });
  }

  /* ---------- shared drawing helpers ---------- */

  /* 32 hex digits in eight hextets, coloured by where the cuts fall.
     cuts: [{ to: bit, cls }] in increasing order; the last should reach 128. */
  function nibbleStripHtml(ip, cuts, opts) {
    opts = opts || {};
    var nib = I.nibbles(ip), h = ['<div class="nibstrip" aria-label="' + esc(I.fmt(ip)) + ' as 32 hex digits">'];
    function roleOf(start, end) {
      var prev = 0;
      for (var i = 0; i < cuts.length; i++) {
        var to = Math.max(prev, Math.min(128, cuts[i].to));
        if (to <= prev) continue;
        if (end <= to) return start >= prev ? cuts[i].cls : 'mixed';
        if (start < to && end > to) return 'mixed';
        prev = to;
      }
      return cuts[cuts.length - 1].cls;
    }
    for (var g = 0; g < 8; g++) {
      h.push('<span class="hextet"><span class="cells">');
      for (var d = 0; d < 4; d++) {
        var j = g * 4 + d, role = roleOf(j * 4, j * 4 + 4);
        h.push('<i class="nib ' + role + '" title="hex digit ' + (j + 1) + ' of 32, bits ' + (j * 4) + '–' + (j * 4 + 3) + ': ' + I.nibbleBits(nib[j]) + '">' + nib[j] + '</i>');
      }
      h.push('</span>' + (opts.values !== false ? '<span class="hextet-val">' + I.groups(ip)[g].toString(16) + '</span>' : '') + '</span>');
    }
    h.push('</div>');
    if (opts.legend) h.push('<div class="anatomy-legend">' + opts.legend.map(function (l) { return '<span><i class="sw ' + l[0] + '"></i><b>' + l[1] + ':</b> ' + l[2] + '</span>'; }).join('') + '</div>');
    return h.join('');
  }

  function prefixCuts(prefix) {
    if (prefix < 64) return [{ to: prefix, cls: 'net' }, { to: 64, cls: 'sub' }, { to: 128, cls: 'host' }];
    return [{ to: prefix, cls: 'net' }, { to: 128, cls: 'host' }];
  }

  /* ---------- widget: hex digits over their bits ---------- */

  function hexbitsHtml(b) {
    var ip = I.parse(b.value);
    return '<div class="hexbits" data-ip="' + esc(b.value) + '">' +
      (b.edit ? '<div class="widget-row"><label>Address <input class="ip-input mono wide" type="text" value="' + esc(b.value) + '" size="40" spellcheck="false" autocomplete="off" aria-label="IPv6 address to show in binary"></label><span class="widget-err" hidden>That is not a valid IPv6 address.</span></div>' : '') +
      '<div class="hexbits-body">' + hexbitsBody(ip) + '</div></div>';
  }

  function hexbitsBody(ip) {
    var gs = I.groups(ip), h = ['<div class="hextets">'];
    gs.forEach(function (g, gi) {
      var hex = I.hex4(g);
      h.push('<div class="hextet-box"><div class="cells big">');
      hex.split('').forEach(function (c, di) {
        var weight = 15 - di * 4;
        h.push('<span class="bit hexd' + (c !== '0' ? ' on' : '') + '" title="hextet ' + (gi + 1) + ', digit ' + (di + 1) + ': ' + c + ' = ' + I.nibbleBits(c) + ' (bits weighted 2^' + weight + ' down to 2^' + (weight - 3) + ')"><b>' + c + '</b><small>' + I.nibbleBits(c) + '</small></span>');
      });
      h.push('</div><div class="octet-sum">' + hex + (hex !== g.toString(16) ? ' <span class="dim">= ' + g.toString(16) + '</span>' : '') + ' <span class="dim">= ' + g + '</span></div></div>');
    });
    h.push('</div>');
    return h.join('');
  }

  function wireHexbits(el) {
    var input = el.querySelector('.ip-input'), err = el.querySelector('.widget-err'), body = el.querySelector('.hexbits-body');
    if (!input) return;
    input.addEventListener('input', function () {
      var ip = I.parse(input.value);
      err.hidden = ip !== null || input.value.trim() === '';
      if (ip !== null) body.innerHTML = hexbitsBody(ip);
    });
  }

  /* ---------- widget: RFC 5952 compression, step by step ---------- */

  function compressHtml(c) {
    return '<div class="compress">' +
      '<div class="widget-row"><label>Address <input class="ip-input mono wide" type="text" value="' + esc(c.value) + '" size="40" spellcheck="false" autocomplete="off" aria-label="IPv6 address to compress"></label><span class="widget-err" hidden>That is not a valid IPv6 address.</span></div>' +
      '<div class="presets">' + (c.presets || []).map(function (p) { return '<button type="button" class="fold-btn preset" data-ip="' + esc(p) + '">' + esc(p) + '</button>'; }).join('') + '</div>' +
      '<div class="compress-out"></div></div>';
  }

  function compressSteps(ip) {
    var gs = I.groups(ip), full = I.expand(ip), hx = gs.map(function (g) { return g.toString(16); }), run = I.zeroRun(gs);
    var fullMarked = gs.map(function (g) { var s = I.hex4(g), m = /^(0*)(.*)$/.exec(s); return m[1] && m[2] ? '<s>' + m[1] + '</s>' + m[2] : (m[1] && !m[2] ? '<s>000</s>0' : s); }).join(':');
    var stripped = hx.map(function (x, i) { return run && i >= run.start && i < run.start + run.len ? '<mark>' + x + '</mark>' : x; }).join(':');
    var runs = [], cur = 0;
    for (var i = 0; i <= 8; i++) { if (i < 8 && gs[i] === 0) cur++; else { if (cur >= 2) runs.push(cur); cur = 0; } }
    var note;
    if (!run) note = gs.indexOf(0) >= 0 ? 'There is a zero group, but only one in a row. <code>::</code> must stand for at least two groups, so a lone zero is written as <code>0</code>.' : 'No zero groups at all, so there is nothing to compress.';
    else if (runs.length > 1 && runs.filter(function (r) { return r === run.len; }).length > 1) note = 'Two runs of ' + run.len + ' zero groups. On a tie the <b>left</b> one is compressed (RFC 5952 §4.2.3); the other stays written out.';
    else if (runs.length > 1) note = 'More than one run of zeros. The longest (' + run.len + ' groups, starting at group ' + (run.start + 1) + ') becomes <code>::</code>; shorter runs are written as zeros.';
    else note = 'One run of ' + run.len + ' zero groups (groups ' + (run.start + 1) + ' to ' + (run.start + run.len) + ') becomes <code>::</code>.';
    return '<table class="kv steps6">' +
      '<tr><th>Full form</th><td class="mono">' + fullMarked + '</td><td class="dim">' + full.length + ' characters. Struck-out zeros are the leading zeros of each group.</td></tr>' +
      '<tr><th>1. Leading zeros dropped</th><td class="mono">' + stripped + '</td><td class="dim">Each group keeps at least one digit.' + (run ? ' Highlighted: the run that will become <code>::</code>.' : '') + '</td></tr>' +
      '<tr><th>2. Longest zero run → ::</th><td class="mono result">' + I.compress(ip) + '</td><td class="dim">' + note + '</td></tr>' +
      '</table>';
  }

  function wireCompress(el) {
    var input = el.querySelector('.ip-input'), err = el.querySelector('.widget-err'), out = el.querySelector('.compress-out');
    function run(v) {
      var ip = I.parse(v);
      err.hidden = ip !== null || !v.trim();
      if (ip !== null) out.innerHTML = compressSteps(ip);
    }
    input.addEventListener('input', function () { run(input.value); });
    el.addEventListener('click', function (e) { var b = e.target.closest('.preset'); if (!b) return; input.value = b.dataset.ip; run(b.dataset.ip); });
    run(input.value);
  }

  /* ---------- widget: address anatomy (routing prefix, subnet ID, interface ID) ---------- */

  function anatomyHtml(a) {
    var ip = I.parse(a.value), gs = I.groups(ip), h = [];
    var cuts = [{ to: a.site, cls: 'net' }, { to: a.prefix, cls: 'sub' }, { to: 128, cls: 'host' }];
    function role(gi) {
      var start = gi * 16, end = start + 16;
      if (end <= a.site) return 'net';
      if (start >= a.site && end <= a.prefix) return 'sub';
      if (start >= a.prefix) return 'host';
      return 'mixed';
    }
    h.push('<div class="anatomy" aria-label="IPv6 address ' + esc(a.value) + '/' + a.prefix + '">');
    gs.forEach(function (g, i) { h.push('<span class="byte wide ' + role(i) + '">' + I.hex4(g) + '</span>'); });
    h.push('<span class="byte slash">/' + a.prefix + '</span></div>');
    h.push('<div class="anatomy-legend"><span><i class="sw net"></i><b>Routing prefix (/' + a.site + '):</b> ' + esc(a.left) + '</span><span><i class="sw sub"></i><b>Subnet ID (' + (a.prefix - a.site) + ' bits):</b> ' + esc(a.mid) + '</span><span><i class="sw host"></i><b>Interface ID (' + (128 - a.prefix) + ' bits):</b> ' + esc(a.right) + '</span></div>');
    h.push('<p class="hint">The same address as 32 hex digits. Each digit is four bits, so every boundary here is a whole digit:</p>');
    h.push(nibbleStripHtml(ip, cuts));
    return h.join('');
  }

  /* ---------- widget: the prefix slider ---------- */

  var sliderMemory = {};

  function cidrHtml(c) {
    var start = sliderMemory[c.value] !== undefined ? sliderMemory[c.value] : c.start;
    return '<div class="cidr" data-ip="' + esc(c.value) + '" data-caption="' + esc(JSON.stringify(c.caption || '')) + '">' +
      '<div class="cidr-head"><div class="cidr-ip">' + esc(c.value) + '<span class="cidr-readout">/' + start + '</span></div><div class="cidr-size"><span class="cidr-n"></span></div></div>' +
      '<input class="cidr-range" type="range" min="' + c.min + '" max="' + c.max + '" value="' + start + '" step="1" aria-label="Prefix length">' +
      '<div class="cidr-ticks">' + tickHtml(c.min, c.max) + '</div>' +
      '<div class="cidr-tiles"></div>' +
      '<div class="cidr-strip"></div>' +
      '<p class="cidr-caption"></p></div>';
  }

  function tickHtml(min, max) {
    var h = [];
    for (var p = min; p <= max; p++) { var major = p % 16 === 0 || p === 48 || p === 56; h.push('<span' + (major ? ' class="major"' : '') + '>' + (major ? '/' + p : '') + '</span>'); }
    return h.join('');
  }

  function tiles6(d) {
    var t = [
      ['/64 subnets in it', d.prefix <= 64 ? '<b>' + big(d.subnets64) + '</b>' : '<span class="dim">none: past /64</span>'],
      ['Subnet-ID bits', d.prefix <= 64 ? '<b>' + d.subnetBits + '</b> <span class="dim">(' + (d.subnetBits / 4 % 1 === 0 ? d.subnetBits / 4 + ' hex digit' + (d.subnetBits / 4 === 1 ? '' : 's') : 'not a whole digit') + ')</span>' : '<span class="dim">0</span>'],
      ['Addresses in block', big(d.size)],
      ['Prefix mask', I.fmt(d.mask)],
      ['Network address', I.fmt(d.network)],
      ['Last address', I.fmt(d.last)]
    ];
    return '<div class="facts netfacts tiles">' + t.map(function (f) { return '<div><span class="k">' + f[0] + '</span><span class="v">' + f[1] + '</span></div>'; }).join('') + '</div>';
  }

  function fillTemplate(t, d) {
    var p = d.prefix, sb = d.subnetBits, subtext, slaac = '';
    if (p < 64) subtext = 'That leaves <b>' + sb + ' bits</b> (' + (sb % 4 === 0 ? sb / 4 + ' hex digit' + (sb === 4 ? '' : 's') : 'not a whole number of hex digits') + ') for subnet IDs: 2<sup>' + sb + '</sup> = <b>' + big(d.subnets64) + '</b> networks of /64.';
    else if (p === 64) subtext = 'This is <b>one /64 subnet</b>: no bits left for subnetting, 64 bits (16 hex digits) for interface IDs.';
    else { subtext = 'Past /64: only <b>' + d.hostBits + ' bits</b> remain for interface IDs.'; slaac = 'SLAAC needs a 64-bit interface ID, so prefixes longer than /64 are used only on router links (/127) and for single hosts (/128).'; }
    var map = { p: p, hb: d.hostBits, sb: sb, subtext: subtext, slaac: slaac, mask: I.fmt(d.mask), net: I.fmt(d.network), last: I.fmt(d.last), next: d.next === null ? 'none' : I.fmt(d.next) };
    return String(t).replace(/\{(\w+)\}/g, function (all, k) { return k in map ? map[k] : all; });
  }

  function wireCidr(el) {
    var ip = I.parse(el.dataset.ip), caption = JSON.parse(el.dataset.caption || '""');
    var range = el.querySelector('.cidr-range'), readout = el.querySelector('.cidr-readout'), n = el.querySelector('.cidr-n');
    var tilesEl = el.querySelector('.cidr-tiles'), strip = el.querySelector('.cidr-strip'), cap = el.querySelector('.cidr-caption');
    function apply() {
      var p = +range.value, d = I.describe(ip, p);
      sliderMemory[el.dataset.ip] = p;
      readout.textContent = '/' + p;
      n.innerHTML = p <= 64 ? '<b>' + big(d.subnets64) + '</b> /64 subnet' + (d.subnets64.number === 1 ? '' : 's') : '<b>2<sup>' + d.hostBits + '</sup></b> addresses, no /64s';
      range.setAttribute('aria-valuetext', '/' + p + (p <= 64 ? ', ' + (d.subnets64.number !== null ? fmtN(d.subnets64.number) : d.subnets64.exp) + ' /64 subnets' : ', past /64'));
      tilesEl.innerHTML = tiles6(d);
      strip.innerHTML = nibbleStripHtml(ip, prefixCuts(p), { legend: [['net', 'Routing prefix', p + ' bits'], ['sub', 'Subnet ID', Math.max(0, 64 - p) + ' bits'], ['host', 'Interface ID', Math.min(64, 128 - p) + ' bits']] });
      cap.innerHTML = caption ? fillTemplate(lv(caption), d) : '';
    }
    range.addEventListener('input', apply);
    apply();
  }

  /* ---------- widget: split a prefix ---------- */

  function splitHtml(s) {
    function opts(from, to, sel, step) { var h = []; for (var p = from; p <= to; p += (step || 1)) h.push('<option value="' + p + '"' + (p === sel ? ' selected' : '') + '>/' + p + '</option>'); return h.join(''); }
    return '<div class="split" data-ip="' + esc(s.value) + '">' +
      '<div class="widget-row"><label>Parent prefix <input class="ip-input mono wide" type="text" value="' + esc(s.value) + '" size="24" spellcheck="false" autocomplete="off" aria-label="Parent network address"></label>' +
      '<label>Length <select class="split-parent">' + opts(32, 63, s.parent) + '</select></label>' +
      '<label>Split into <select class="split-child">' + opts(s.parent + 1, 64, s.child) + '</select></label>' +
      '<span class="widget-err" hidden>That is not a valid IPv6 address.</span></div>' +
      '<p class="split-summary"></p><div class="split-table"></div></div>';
  }

  function wireSplit(el) {
    var ipIn = el.querySelector('.ip-input'), parent = el.querySelector('.split-parent'), child = el.querySelector('.split-child');
    var err = el.querySelector('.widget-err'), summary = el.querySelector('.split-summary'), table = el.querySelector('.split-table');
    function apply() {
      var ip = I.parse(ipIn.value), pp = +parent.value, cp = +child.value;
      err.hidden = ip !== null;
      if (ip === null) return;
      if (cp <= pp) cp = Math.min(64, pp + 4);
      var h = []; for (var p = pp + 1; p <= 64; p++) h.push('<option value="' + p + '"' + (p === cp ? ' selected' : '') + '>/' + p + '</option>');
      child.innerHTML = h.join('');
      var net = I.network(ip, pp);
      if (net !== ip) ipIn.value = I.fmt(net);
      var r = I.subnetsOf(net, pp, cp), b = cp - pp, aligned = b % 4 === 0;
      summary.innerHTML = '<code>' + I.fmt(net) + '/' + pp + '</code> split into <b>' + big(r.total) + '</b> subnets of <code>/' + cp + '</code>: ' + b + ' bit' + (b === 1 ? '' : 's') + ' borrowed' +
        (aligned ? ', ' + (b / 4) + ' hex digit' + (b === 4 ? '' : 's') + ', so the subnet IDs simply count in hex' : ', which is <b>not</b> a whole number of hex digits: the IDs no longer line up with the digits, which is why plans avoid this') +
        '. Each child still has 2<sup>' + (128 - cp) + '</sup> addresses' + (cp === 64 ? ' and can use SLAAC' : '') + '.' + (r.shown < (r.total.number || Infinity) ? ' <span class="dim">Showing the first ' + r.shown + '.</span>' : '');
      var t = ['<div class="table-wrap"><table class="lab hosts split-rows"><tr><th>#</th><th>Subnet ID</th><th>Network</th><th>First host (::1)</th><th>Last address</th></tr>'];
      r.subnets.forEach(function (d) {
        t.push('<tr><td>' + (d.index + 1) + '</td><td class="sub-id">' + d.id + '</td><td>' + I.fmt(d.network) + '/' + cp + '</td><td>' + I.fmt(d.first) + '</td><td>' + I.fmt(d.last) + '</td></tr>');
      });
      t.push('</table></div>');
      table.innerHTML = t.join('');
    }
    ipIn.addEventListener('change', apply); parent.addEventListener('change', apply); child.addEventListener('change', apply);
    apply();
  }

  /* ---------- widget: which kind of address is this? ---------- */

  var KIND_TEXT = {
    global: { cls: '', s: 'A <b>global</b> address: a real internet address that the whole world can reach.', m: '<b>Global unicast</b> (2000::/3). Internet-routable, allocated through your ISP. The first hextet is between 2000 and 3fff.', e: 'GUA, 2000::/3, routable in the DFZ. Allocated IANA → RIR → LIR → site; typically a /48 or /56 per site.' },
    doc: { cls: 'warn', s: 'An <b>example</b> address from the range reserved for books and manuals. It looks global but nobody may use it for real.', m: '<b>Documentation</b> range 2001:db8::/32 (RFC 3849). Shaped like a global address, reserved so that examples never hit a real network. Every address on this site is in it.', e: 'RFC 3849 documentation prefix inside 2000::/3. Not routed; filter at borders. 3fff::/20 is the newer, larger documentation block (RFC 9637).' },
    linklocal: { cls: 'warn', s: '<b>Link-local</b>: for talking to neighbours on the same cable or Wi-Fi only. Every device makes one by itself; it never crosses a router.', m: '<b>Link-local</b> (fe80::/10). Auto-configured on every interface, valid only on that link, never forwarded. Used by Neighbor Discovery and as the default gateway address. Written with a zone, <code>%eth0</code>, to say which link.', e: 'LLA, fe80::/10 (fe80::/64 in practice). Mandatory per interface; scope = link; requires a zone index in text and in sockets. Next hops in IPv6 routing tables are usually LLAs.' },
    ula: { cls: 'ok', s: '<b>Unique local</b>: the IPv6 version of a private address, like 10.x.x.x. Fine inside a building, not on the internet.', m: '<b>Unique local</b> (fc00::/7, in practice fd00::/8, RFC 4193). Private, not routed on the internet. The 40 bits after fd are meant to be random so two organisations rarely clash.', e: 'ULA, fc00::/7 with L=1 → fd00::/8, 40-bit pseudo-random global ID + 16-bit subnet ID. Not globally routed; usually deployed alongside GUA (RFC 6724 prefers GUA for global destinations).' },
    multicast: { cls: 'warn', s: '<b>Multicast</b>: a group, not one device. This is how IPv6 says "everyone here" or "every router here"; there is no broadcast.', m: '<b>Multicast</b> (ff00::/8). One packet to every member of the group. The fourth hex digit is the scope: 2 = this link only, 5 = this site, e = the whole internet. Replaces broadcast.', e: 'ff00::/8: ff, flags nibble, scope nibble, 112-bit group ID. Maps to Ethernet 33:33 + low 32 bits. Link-scope groups are never forwarded.' },
    loopback: { cls: 'warn', s: '<b>Loopback</b>: this computer talking to itself, the IPv6 version of 127.0.0.1. Just one address.', m: '<b>Loopback</b> ::1/128. The host itself; never appears on a network. Unlike IPv4 there is only one loopback address, not a whole /8.', e: '::1/128 (RFC 4291 §2.5.3). Node-internal; must be dropped if seen on a wire.' },
    unspecified: { cls: 'warn', s: '<b>No address</b>: what a device uses before it has one, like 0.0.0.0.', m: '<b>Unspecified</b> ::/128. "I have no address yet": the source of the first Duplicate Address Detection probe. As ::/0 it is the default route. Never a destination.', e: '::/128, source-only during DAD; ::/0 default route; IN6ADDR_ANY in bind().' },
    v4mapped: { cls: 'warn', s: 'An <b>IPv4 address wrapped in IPv6 form</b>, so that one program can handle both kinds. The IPv4 address is in the last part.', m: '<b>IPv4-mapped</b> (::ffff:0:0/96). Dual-stack software represents an IPv4 peer this way: the last 32 bits are the IPv4 address. It is never sent on the wire as IPv6.', e: 'RFC 4291 §2.5.5.2; API-level representation of v4 peers on dual-stack sockets. Must not appear in IPv6 packets (RFC 4038 §4.2).' },
    nat64: { cls: 'warn', s: 'An IPv4 address reachable from an IPv6-only network through a translator. The IPv4 address is hidden in the last part.', m: '<b>NAT64 well-known prefix</b> 64:ff9b::/96 (RFC 6052). IPv6-only clients reach IPv4 servers by sending to this prefix plus the IPv4 address; a NAT64 gateway translates.', e: 'RFC 6052 WKP with DNS64 (RFC 6147) synthesis; translator per RFC 6146. 64:ff9b:1::/48 for local-use.' },
    teredo: { cls: 'warn', s: 'An old tunnelling address that carries IPv6 inside IPv4 to get through home routers.', m: '<b>Teredo</b> (2001::/32, RFC 4380). IPv6 tunnelled over UDP/IPv4 through NAT. Still on by default in some Windows versions; rarely wanted.', e: 'Teredo: server IPv4, flags, obfuscated client port and IPv4 embedded in the address. Deprecated in practice; Microsoft has retired its public relays.' },
    '6to4': { cls: 'warn', s: 'An old tunnelling address, now switched off. It contained an IPv4 address in disguise.', m: '<b>6to4</b> (2002::/16). A deprecated tunnel: 2002 followed by the IPv4 address in hex. RFC 7526 retired it in 2015.', e: '2002:V4ADDR::/48; anycast relays (RFC 3068) withdrawn by RFC 7526. Filter.' },
    discard: { cls: 'warn', s: 'A <b>black hole</b>: traffic sent here is thrown away on purpose.', m: '<b>Discard-only</b> 100::/64 (RFC 6666). Routed to nowhere, for remotely triggered black holes during attacks.', e: 'RFC 6666 RTBH prefix.' },
    sitelocal: { cls: 'warn', s: 'A <b>retired</b> kind of private address from before 2004. If you see it, something is old.', m: '<b>Site-local</b> fec0::/10, deprecated by RFC 3879 in 2004 and replaced by unique local addresses. Still appears as old default DNS addresses on Windows.', e: 'fec0::/10 deprecated (RFC 3879): ambiguous across sites. Treat as reserved.' },
    reserved: { cls: 'warn', s: '<b>Reserved</b>: not handed out for anything yet.', m: '<b>Reserved</b> by IANA; not allocated for any use. Most of the IPv6 space is like this.', e: 'Unassigned per IANA IPv6 address space registry. Only 2000::/3 is currently allocated for global unicast.' }
  };

  function classifyHtml(c) {
    return '<div class="classify">' +
      '<div class="widget-row"><label>Address <input class="ip-input mono wide" type="text" placeholder="e.g. fe80::1" size="40" spellcheck="false" autocomplete="off" aria-label="IPv6 address to classify"></label><button type="button" class="btn classify-go">Check</button></div>' +
      '<div class="presets">' + (c.presets || []).map(function (p) { return '<button type="button" class="fold-btn preset" data-ip="' + esc(p) + '">' + esc(p) + '</button>'; }).join('') + '</div>' +
      '<div class="classify-out" aria-live="polite"></div></div>';
  }

  function classifyResult(ip) {
    var k = I.classify(ip), t = KIND_TEXT[k.kind] || KIND_TEXT.reserved;
    var h = ['<div class="banner ' + t.cls + '"><div class="cls-head"><span class="mono">' + I.fmt(ip) + '</span> <span class="tag' + (k.routable ? '' : ' off') + '">' + esc(k.name) + '</span></div>'];
    h.push('<p>' + lv({ s: t.s, m: t.m, e: t.e }) + '</p>');
    var facts = [];
    if (k.cidr) facts.push('Range <code>' + k.cidr + '</code>');
    if (k.scope) facts.push('Scope: <b>' + k.scope + '</b> (digit ' + I.nibbles(ip)[3] + ')' + (LEVEL === 'e' ? ', flags ' + k.flags : ''));
    if (k.kind === 'multicast' && LEVEL !== 's') facts.push('Ethernet ' + I.multicastMac(ip));
    if (k.kind === 'v4mapped' || k.kind === 'nat64') { var low = Number(ip & BigInt(0xffffffff)); facts.push('Embedded IPv4 ' + [(low >>> 24) & 255, (low >>> 16) & 255, (low >>> 8) & 255, low & 255].join('.')); }
    if (k.rfc) facts.push(esc(k.rfc));
    facts.push(k.routable ? 'Forwarded beyond the link' : 'Not forwarded beyond the link / site');
    h.push('<p class="cls-facts">' + facts.join(' · ') + '</p></div>');
    return h.join('');
  }

  function wireClassify(el) {
    var input = el.querySelector('.ip-input'), out = el.querySelector('.classify-out');
    function run(v) {
      var ip = I.parse(v);
      if (ip === null) { out.innerHTML = v.trim() ? '<div class="banner warn">That is not a valid IPv6 address: up to eight hex groups separated by colons, with at most one <code>::</code>.</div>' : ''; return; }
      out.innerHTML = classifyResult(ip);
    }
    el.querySelector('.classify-go').addEventListener('click', function () { run(input.value); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(input.value); });
    el.addEventListener('click', function (e) { var b = e.target.closest('.preset'); if (!b) return; input.value = b.dataset.ip; run(b.dataset.ip); });
  }

  /* ---------- widget: EUI-64, SLAAC addresses ---------- */

  function eui64Html(w) {
    return '<div class="eui" data-prefix="' + esc(w.prefix) + '">' +
      '<div class="widget-row"><label>MAC address <input class="mac-input mono" type="text" value="' + esc(w.mac) + '" size="18" spellcheck="false" autocomplete="off" aria-label="MAC address"></label>' +
      '<label>On-link prefix <input class="pfx-input mono wide" type="text" value="' + esc(w.prefix) + '" size="22" spellcheck="false" autocomplete="off" aria-label="Global /64 prefix"></label>' +
      '<span class="widget-err" hidden>Enter a 6-byte MAC (any separator) and a valid IPv6 prefix.</span></div>' +
      '<div class="eui-out"></div></div>';
  }

  function euiSteps(mac, prefixIp) {
    var e = I.eui64(mac), gua = I.withPrefix(prefixIp, e.iid), sn = I.solicitedNode(gua);
    function bits(s) { return s.slice(0, 6) + '<mark>' + s.slice(6, 7) + '</mark>' + s.slice(7); }
    return '<table class="kv steps6">' +
      '<tr><th>1. Split the MAC</th><td class="mono"><span class="byte-oui">' + e.oui + '</span> | <span class="byte-nic">' + e.nic + '</span></td><td class="dim">24-bit maker prefix (OUI), 24-bit serial.</td></tr>' +
      '<tr><th>2. Insert ff:fe</th><td class="mono">' + e.oui + ':<mark>ff:fe</mark>:' + e.nic + '</td><td class="dim">48 bits become 64.</td></tr>' +
      '<tr><th>3. Flip the U/L bit</th><td class="mono">' + (e.firstByte < 16 ? '0' : '') + e.firstByte.toString(16) + ' = ' + bits(e.firstByteBits) + ' → ' + bits(e.flippedBits) + ' = ' + (e.flippedByte < 16 ? '0' : '') + e.flippedByte.toString(16) + '</td><td class="dim">Bit 7 of the first byte, value 0x02. 1 now means "globally unique".</td></tr>' +
      '<tr><th>Interface ID</th><td class="mono result">' + e.iidGroups.join(':') + '</td><td class="dim">64 bits, written as four hextets.</td></tr>' +
      '<tr><th>Link-local address</th><td class="mono result">' + I.fmt(e.linkLocal) + '</td><td class="dim">fe80::/64 + interface ID. Every interface gets one of these first.</td></tr>' +
      '<tr><th>Global address</th><td class="mono result">' + I.fmt(gua) + '</td><td class="dim">The /64 from the router advertisement + the same interface ID.</td></tr>' +
      '<tr><th>Solicited-node group</th><td class="mono result">' + I.fmt(sn) + '</td><td class="dim">ff02::1:ff + the last 24 bits (<code>' + I.nibbles(gua).slice(26).join('') + '</code>). Ethernet <code>' + I.multicastMac(sn) + '</code>. Neighbours ask for this MAC here instead of broadcasting.</td></tr>' +
      '</table>';
  }

  function wireEui(el) {
    var macIn = el.querySelector('.mac-input'), pfxIn = el.querySelector('.pfx-input'), err = el.querySelector('.widget-err'), out = el.querySelector('.eui-out');
    function run() {
      var mac = I.parseMac(macIn.value), pfx = I.parse(pfxIn.value);
      err.hidden = mac !== null && pfx !== null;
      if (mac && pfx !== null) out.innerHTML = euiSteps(mac, pfx);
    }
    macIn.addEventListener('input', run); pfxIn.addEventListener('input', run);
    run();
  }

  /* ---------- widget: the practice quiz ---------- */

  var QUIZ_KINDS = [
    { id: 'compress', label: 'Shorten' }, { id: 'expand', label: 'Write in full' }, { id: 'subnets', label: 'Count subnets' }, { id: 'kth', label: 'Find a subnet' },
    { id: 'kind', label: 'Kind of address' }, { id: 'linklocal', label: 'EUI-64' }, { id: 'network', label: 'Network address' }, { id: 'mixed', label: 'Mixed' }
  ];
  var QUIZ_LEVELS = [{ id: 'easy', label: 'Easy' }, { id: 'medium', label: 'Medium' }, { id: 'hard', label: 'Hard' }];
  var quizState = { kind: 'compress', difficulty: 'easy', q: null, answered: false, correct: 0, total: 0 };
  try { var saved = JSON.parse(sessionStorage.getItem('ipv6-quiz-score') || 'null'); if (saved && typeof saved.correct === 'number') { quizState.correct = saved.correct; quizState.total = saved.total; } } catch (e) { /* no storage */ }
  function saveScore() { try { sessionStorage.setItem('ipv6-quiz-score', JSON.stringify({ correct: quizState.correct, total: quizState.total })); } catch (e) { /* ignore */ } }

  function quizHtml(q) {
    var kinds = q.kinds ? QUIZ_KINDS.filter(function (k) { return k.id === 'mixed' || q.kinds.indexOf(k.id) >= 0; }) : QUIZ_KINDS;
    return '<div class="quiz">' +
      '<div class="quiz-bar"><div class="quiz-chips" role="group" aria-label="Question type">' + kinds.map(function (k) { return '<button type="button" class="chip" data-kind="' + k.id + '" aria-pressed="' + (k.id === quizState.kind) + '">' + k.label + '</button>'; }).join('') + '</div>' +
      '<div class="quiz-chips" role="group" aria-label="Difficulty">' + QUIZ_LEVELS.map(function (l) { return '<button type="button" class="chip diff" data-diff="' + l.id + '" aria-pressed="' + (l.id === quizState.difficulty) + '">' + l.label + '</button>'; }).join('') + '</div></div>' +
      '<div class="quiz-card"></div>' +
      '<div class="quiz-foot"><span class="quiz-score"></span><button type="button" class="btn ghost quiz-reset" title="Reset the score">Reset score</button></div></div>';
  }

  function questionPrompt(q) {
    switch (q.kind) {
      case 'compress': return lv({ s: 'Write <code class="q-cidr">' + q.shown + '</code> in its shortest form.', m: 'Write <code class="q-cidr">' + q.shown + '</code> in its shortest (RFC 5952) form.', e: 'Canonical RFC 5952 form of <code class="q-cidr">' + q.shown + '</code>?' });
      case 'expand': return lv({ s: 'Write <code class="q-cidr">' + q.shown + '</code> out in full: eight groups of four characters.', m: 'Expand <code class="q-cidr">' + q.shown + '</code> to its full form: eight groups of four hex digits.', e: 'Full 8 × 4 form of <code class="q-cidr">' + q.shown + '</code>?' });
      case 'subnets': return lv({ s: 'How many <b>/' + q.child + '</b> networks fit inside a <b>/' + q.parent + '</b>?', m: 'How many <b>/' + q.child + '</b> subnets fit in a <b>/' + q.parent + '</b>?', e: '/' + q.child + ' subnets per /' + q.parent + '?' });
      case 'kth': return lv({ s: 'The block <code class="q-cidr">' + q.site + '</code> is being cut into /' + q.child + ' networks. What is the address of network number <code>' + q.id + '</code> (in hex)?', m: 'Inside <code class="q-cidr">' + q.site + '</code>, what is the network address of the /' + q.child + ' with subnet ID <code>' + q.id + '</code> (hex)?', e: 'Network address of subnet ID 0x' + q.id + ' (/' + q.child + ') in <code class="q-cidr">' + q.site + '</code>?' });
      case 'kind': return lv({ s: 'What kind of address is <code class="q-cidr">' + I.fmt(q.ip) + '</code>? (global, link-local, unique local, multicast, loopback, unspecified, IPv4-mapped, documentation)', m: 'What kind of address is <code class="q-cidr">' + I.fmt(q.ip) + '</code>? Answer with the type: global, link-local, unique local, multicast, loopback, unspecified, IPv4-mapped, NAT64, documentation.', e: 'Classify <code class="q-cidr">' + I.fmt(q.ip) + '</code> (global / ULA / link-local / multicast / loopback / unspecified / v4-mapped / NAT64 / documentation).' });
      case 'linklocal': return lv({ s: 'A device\'s MAC address is <code class="q-cidr">' + I.fmtMac(q.mac) + '</code>. What link-local address does it build from it (EUI-64)?', m: 'A host has MAC <code class="q-cidr">' + I.fmtMac(q.mac) + '</code>. What is its EUI-64 link-local address?', e: 'EUI-64 LLA for MAC <code class="q-cidr">' + I.fmtMac(q.mac) + '</code>?' });
      default: return lv({ s: 'The device <code class="q-cidr">' + I.fmt(q.ip) + '/' + q.prefix + '</code> is on a network. What is the network\'s address?', m: 'What is the network address of <code class="q-cidr">' + I.fmt(q.ip) + '/' + q.prefix + '</code>?', e: 'Prefix of <code class="q-cidr">' + I.fmt(q.ip) + '/' + q.prefix + '</code>?' });
    }
  }

  function worked(q) {
    var f = q.fields[0];
    switch (q.kind) {
      case 'compress': return compressSteps(q.ip);
      case 'expand': return '<p>Put back the leading zeros in every group and replace <code>::</code> with enough <code>0000</code> groups to make eight: <code>' + I.expand(q.ip) + '</code>. (<code>::</code> stood for ' + (8 - q.shown.replace(/^::|::$/g, '').split('::').join(':').split(':').filter(Boolean).length) + ' groups here.)</p>';
      case 'subnets': return '<p>' + q.child + ' − ' + q.parent + ' = ' + (q.child - q.parent) + ' bits borrowed' + ((q.child - q.parent) % 4 === 0 ? ' (' + (q.child - q.parent) / 4 + ' hex digit' + (q.child - q.parent === 4 ? '' : 's') + ')' : '') + '; 2<sup>' + (q.child - q.parent) + '</sup> = <b>' + fmtN(f.answer) + '</b>.</p>';
      case 'kth': { var sp = +q.site.split('/')[1]; return '<p>The subnet-ID field is bits ' + sp + ' to ' + (q.child - 1) + ' (' + ((q.child - sp) / 4) + ' hex digit' + (q.child - sp === 4 ? '' : 's') + ' starting at digit ' + (sp / 4 + 1) + '). Write <code>' + q.id + '</code> there, zeros after it: <code>' + I.expand(q.ip) + '</code>, which shortens to <b>' + f.answer + '</b>.</p>'; }
      case 'kind': { var k = I.classify(q.ip), t = KIND_TEXT[k.kind] || KIND_TEXT.reserved; return '<p>' + lv({ s: t.s, m: t.m, e: t.e }) + (k.cidr ? ' Range <code>' + k.cidr + '</code>.' : '') + '</p>'; }
      case 'linklocal': return euiSteps(q.mac, I.parse('2001:db8:acad:1::'));
      default: return '<p>Keep the first ' + q.prefix + ' bits (' + (q.prefix / 4) + ' hex digits) and zero the rest: <code>' + I.expand(I.network(q.ip, q.prefix)) + '</code> = <b>' + f.answer + '</b>.</p>';
    }
  }

  function renderQuestion(el) {
    var card = el.querySelector('.quiz-card'), q = quizState.q;
    var h = ['<p class="q-prompt">' + questionPrompt(q) + '</p><form class="q-form">'];
    q.fields.forEach(function (f, i) {
      h.push('<label class="q-field"><span>' + esc(f.label) + '</span><input class="quiz-input wide" type="text" data-i="' + i + '" autocomplete="off" spellcheck="false" placeholder="' + (f.type === 'number' ? 'number' : f.type === 'kind' ? 'kind' : 'address') + '"' + (quizState.answered ? ' disabled' : '') + '></label>');
    });
    h.push('<div class="q-actions"><button type="submit" class="btn q-check"' + (quizState.answered ? ' disabled' : '') + '>Check</button><button type="button" class="btn ghost q-how" aria-expanded="false">Show me how</button><button type="button" class="btn ghost q-next">Next question</button></div></form>' +
      '<div class="q-feedback" aria-live="polite"></div><div class="q-how-box" hidden></div>');
    card.innerHTML = h.join('');
    var first = card.querySelector('.quiz-input');
    if (first && !quizState.answered) first.focus({ preventScroll: true });
    el.querySelector('.quiz-score').innerHTML = quizState.total ? 'Correct <b>' + quizState.correct + '</b> of ' + quizState.total : 'No answers yet';
  }

  function newQuestion(el) { quizState.q = I.randomQuestion(quizState.kind, quizState.difficulty); quizState.answered = false; renderQuestion(el); }

  function howBox(q) {
    if (q.kind === 'compress' || q.kind === 'expand') return '<p class="hint">Every group, four digits each. Groups that are all zero are candidates for <code>::</code>.</p>' + nibbleStripHtml(q.ip, [{ to: 128, cls: 'net' }], { legend: false });
    if (q.kind === 'subnets') return '<p class="hint">Bits ' + q.parent + ' to ' + (q.child - 1) + ' are the subnet ID (green): ' + (q.child - q.parent) + ' bits.</p>' + nibbleStripHtml(I.parse('2001:db8:acad::'), [{ to: q.parent, cls: 'net' }, { to: q.child, cls: 'sub' }, { to: 128, cls: 'host' }], { values: false });
    if (q.kind === 'kth') { var sp = +q.site.split('/')[1]; return '<p class="hint">Blue is the site prefix, green the subnet ID <code>' + q.id + '</code>, pink the interface ID (all zero for a network address).</p>' + nibbleStripHtml(q.ip, [{ to: sp, cls: 'net' }, { to: q.child, cls: 'sub' }, { to: 128, cls: 'host' }]); }
    if (q.kind === 'linklocal') return euiSteps(q.mac, I.parse('2001:db8:acad:1::'));
    if (q.kind === 'network') return '<p class="hint">Blue digits stay, pink digits become zero.</p>' + nibbleStripHtml(q.ip, [{ to: q.prefix, cls: 'net' }, { to: 128, cls: 'host' }]);
    return '<p class="hint">The first hextet decides:</p>' + nibbleStripHtml(q.ip, [{ to: 16, cls: 'net' }, { to: 128, cls: 'host' }]);
  }

  function wireQuiz(el) {
    if (!quizState.q) quizState.q = I.randomQuestion(quizState.kind, quizState.difficulty);
    renderQuestion(el);
    el.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (chip) {
        if (chip.dataset.kind) quizState.kind = chip.dataset.kind; else quizState.difficulty = chip.dataset.diff;
        Array.prototype.forEach.call(el.querySelectorAll('.chip'), function (c) { if (c.dataset.kind) c.setAttribute('aria-pressed', c.dataset.kind === quizState.kind); else c.setAttribute('aria-pressed', c.dataset.diff === quizState.difficulty); });
        newQuestion(el); return;
      }
      if (e.target.closest('.q-next')) { newQuestion(el); return; }
      if (e.target.closest('.quiz-reset')) { quizState.correct = 0; quizState.total = 0; saveScore(); el.querySelector('.quiz-score').textContent = 'No answers yet'; return; }
      var how = e.target.closest('.q-how');
      if (how) { var box = el.querySelector('.q-how-box'); box.hidden = !box.hidden; how.setAttribute('aria-expanded', String(!box.hidden)); if (!box.hidden) box.innerHTML = howBox(quizState.q); }
    });
    el.addEventListener('submit', function (e) {
      e.preventDefault();
      if (quizState.answered) return;
      var q = quizState.q, inputs = el.querySelectorAll('.quiz .quiz-input'), allOk = true, anyText = false, rows = [];
      Array.prototype.forEach.call(inputs, function (inp) {
        var f = q.fields[+inp.dataset.i], ok = I.checkAnswer(f, inp.value);
        if (inp.value.trim()) anyText = true;
        inp.classList.toggle('ok', ok); inp.classList.toggle('bad', !ok);
        if (!ok) allOk = false;
        var shown = f.type === 'number' ? fmtN(f.answer) : f.type === 'kind' ? (I.KIND_WORDS[f.answer] || [f.answer])[0] : f.answer;
        rows.push('<tr><th>' + esc(f.label) + '</th><td class="' + (ok ? 'ok' : 'bad') + '">' + (ok ? '✓ ' : '✗ ') + esc(inp.value.trim() || '(blank)') + '</td><td>' + (ok ? '' : 'answer: <b class="mono">' + esc(shown) + '</b>') + '</td></tr>');
      });
      if (!anyText) { el.querySelector('.q-feedback').innerHTML = '<div class="banner warn">Type an answer first.</div>'; return; }
      quizState.answered = true; quizState.total++; if (allOk) quizState.correct++; saveScore();
      Array.prototype.forEach.call(inputs, function (inp) { inp.disabled = true; });
      el.querySelector('.q-check').disabled = true;
      el.querySelector('.quiz-score').innerHTML = 'Correct <b>' + quizState.correct + '</b> of ' + quizState.total;
      var note = '';
      if (!allOk && q.kind === 'compress' && I.parse(inputs[0].value) === q.ip) note = '<p>Your address is the same one, but not in the shortest form.</p>';
      if (!allOk && q.kind === 'expand' && I.parse(inputs[0].value) === q.ip) note = '<p>Your address is the same one, but not written as eight groups of four digits.</p>';
      el.querySelector('.q-feedback').innerHTML = '<div class="banner ' + (allOk ? 'ok' : 'warn') + '"><p class="q-verdict"><b>' + (allOk ? 'Correct.' : 'Not quite.') + '</b></p>' + note + (!allOk ? '<table class="kv q-table">' + rows.join('') + '</table>' : '') + '<div class="q-worked">' + worked(q) + '</div></div>';
      el.querySelector('.q-next').focus({ preventScroll: true });
    });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' && quizState.answered && !e.target.closest('button')) { e.preventDefault(); newQuestion(el); } });
  }

  /* ---------- check your understanding ---------- */

  var checkMemory = {};

  function checkHtml(rowId) {
    var st = checkMemory[rowId];
    if (!st) { st = checkMemory[rowId] = { qs: CHECKS.questions(rowId), answers: ['', '', ''], graded: false }; }
    if (!st.qs) return '';
    var h = ['<section class="check-sec"><h2>Check your understanding</h2><p class="hint">' + lv({ s: 'Three quick questions on this row. Type each answer and press Check. New numbers every time.', m: 'Three questions on this row, with fresh numbers each time. Type your answers and press Check; the working is shown for any you miss. Addresses are accepted in any valid spelling unless the question asks for the shortest or full form.', e: 'Three generated questions on this row. Any valid text form is accepted for addresses unless canonical or expanded form is requested.' }) + '</p><div class="check" data-row="' + esc(rowId) + '"><ol>'];
    st.qs.forEach(function (q, i) {
      h.push('<li><p class="cq">' + q.prompt + '</p><div class="ca"><input class="quiz-input wide" type="text" data-i="' + i + '" autocomplete="off" spellcheck="false" value="' + esc(st.answers[i]) + '" placeholder="' + (q.type === 'number' ? 'number' : q.type === 'text' || q.type === 'kind' ? 'one word' : q.type === 'bits' ? 'binary' : q.type === 'hex' ? 'hex' : 'address') + '" aria-label="Answer ' + (i + 1) + '"></div><p class="cf" hidden></p></li>');
    });
    h.push('</ol><div class="check-foot"><span class="check-result"></span><div class="check-actions"><button type="button" class="btn check-go">Check</button><button type="button" class="btn ghost check-new">New questions</button></div></div></div></section>');
    return h.join('');
  }

  function wireCheck(el) {
    var rowId = el.dataset.row, st = checkMemory[rowId];
    var inputs = el.querySelectorAll('.quiz-input'), fbs = el.querySelectorAll('.cf'), result = el.querySelector('.check-result');
    function grade() {
      var right = 0, any = false;
      Array.prototype.forEach.call(inputs, function (inp, i) {
        var q = st.qs[i], v = inp.value; st.answers[i] = v;
        if (v.trim()) any = true;
        var ok = CHECKS.grade(q, v);
        if (ok) right++;
        inp.classList.toggle('ok', ok); inp.classList.toggle('bad', !ok);
        fbs[i].hidden = false; fbs[i].className = 'cf ' + (ok ? 'ok' : 'bad');
        fbs[i].innerHTML = ok ? '✓ Correct. <span class="why">' + q.explain + '</span>' : '✗ ' + (v.trim() ? 'Not quite.' : 'No answer.') + ' The answer is <b>' + esc(CHECKS.shown(q)) + '</b>. <span class="why">' + q.explain + '</span>';
      });
      if (!any) { result.innerHTML = 'Type at least one answer first.'; Array.prototype.forEach.call(fbs, function (f) { f.hidden = true; }); Array.prototype.forEach.call(inputs, function (inp) { inp.classList.remove('ok', 'bad'); }); return; }
      st.graded = true;
      result.innerHTML = '<b>' + right + ' of ' + st.qs.length + '</b> correct' + (right === st.qs.length ? '. Nice.' : '. Try "New questions" for another go.');
    }
    el.querySelector('.check-go').addEventListener('click', grade);
    el.querySelector('.check-new').addEventListener('click', function () {
      checkMemory[rowId] = null;
      var sec = el.closest('.check-sec'), tmp = document.createElement('div');
      tmp.innerHTML = checkHtml(rowId); sec.replaceWith(tmp.firstChild);
      var fresh = main.querySelector('.check[data-row="' + rowId + '"]'); wireCheck(fresh); fresh.querySelector('.quiz-input').focus({ preventScroll: true });
    });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.classList.contains('quiz-input')) { e.preventDefault(); grade(); } });
    Array.prototype.forEach.call(inputs, function (inp) { inp.addEventListener('input', function () { st.answers[+inp.dataset.i] = inp.value; }); });
    if (st.graded) grade();
  }

  /* ---------- collapsible sidebar ---------- */

  var NAV_KEY = 'packet-lessons-nav';
  function navCollapsed() { return document.querySelector('.app').classList.contains('nav-collapsed'); }
  function paintNavBtn(btn) {
    var c = navCollapsed();
    btn.innerHTML = c ? '&#8250; <span>Lessons</span>' : '&#8249; <span>Hide</span>';
    btn.title = c ? 'Show the lesson list' : 'Hide the lesson list';
    btn.setAttribute('aria-label', btn.title);
    btn.setAttribute('aria-expanded', c ? 'false' : 'true');
  }
  function wireNavToggle(wrap) {
    if (!wrap) return;
    var app = document.querySelector('.app'), saved = null;
    try { saved = localStorage.getItem(NAV_KEY); } catch (e) { /* no storage */ }
    if (saved === 'collapsed') app.classList.add('nav-collapsed');
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'side-toggle'; btn.setAttribute('aria-controls', 'nav');
    paintNavBtn(btn);
    btn.addEventListener('click', function () {
      app.classList.toggle('nav-collapsed');
      try { localStorage.setItem(NAV_KEY, navCollapsed() ? 'collapsed' : 'open'); } catch (e) { /* ignore */ }
      paintNavBtn(btn);
    });
    wrap.insertBefore(btn, wrap.firstChild);
  }

  /* ---------- light / dark ---------- */

  var THEME_KEY = 'packet-lessons-theme';
  function currentTheme() { return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'; }
  function paintThemeBtn(btn) { var dark = currentTheme() === 'dark'; btn.innerHTML = dark ? '&#9788;' : '&#9790;'; btn.title = dark ? 'Switch to light mode' : 'Switch to dark mode'; btn.setAttribute('aria-label', btn.title); btn.setAttribute('aria-pressed', dark ? 'true' : 'false'); }
  function wireThemeBtn(wrap) {
    if (!wrap) return;
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'theme-btn'; paintThemeBtn(btn);
    btn.addEventListener('click', function () { var next = currentTheme() === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* private mode */ } paintThemeBtn(btn); });
    wrap.appendChild(btn);
  }

  /* ---------- welcome page ---------- */

  function renderWelcome() {
    var ref = [32, 40, 44, 48, 52, 56, 60, 64].map(function (p) { var d = I.describe(I.parse('2001:db8::'), p); return '<tr><td>/' + p + '</td><td>' + (p / 4) + '</td><td>' + d.subnetBits + '</td><td>' + big(d.subnets64) + '</td><td>' + esc({ 32: 'an ISP', 40: 'a large enterprise or region', 44: 'a large campus', 48: 'a site (the classic end-site allocation)', 52: 'a large home or branch', 56: 'a home (common ISP delegation)', 60: 'a small home (some ISPs)', 64: 'one subnet: a LAN, a VLAN, a link' }[p]) + '</td></tr>'; }).join('');
    content.innerHTML =
      '<article class="welcome"><h1>' + esc(SITE.title) + '</h1>' +
      '<p class="lead">' + lv({
        s: 'An IPv6 address is 128 switches written in hex. The first half names the network, the second half names the device, and the provider gives you a block big enough to number thousands of networks. This site is that idea from every angle.',
        m: 'IPv6 addresses are 128 bits written in hexadecimal, split at /64 into a network prefix and an interface identifier. Subnetting means numbering the /64s inside the prefix your ISP delegated; nobody counts hosts. Every row here makes one part of that visible.',
        e: 'IPv6 subnetting is nibble arithmetic on a 128-bit integer: the delegated prefix fixes the high bits, the subnet ID fills the bits to /64, and the IID takes the rest. This site makes the arithmetic visible and drills it.'
      }) + '</p>' +
      '<h2>How to use this page</h2><ol>' +
      '<li><b>Hex and hextets.</b> Why a hex digit is four bits and a colon comes every sixteen.</li>' +
      '<li><b>Writing it short.</b> Leading zeros, the double colon, and the one right way (RFC 5952), step by step.</li>' +
      '<li><b>Prefix and interface ID.</b> The line at /64: routing prefix, subnet ID, interface ID, in colour.</li>' +
      '<li><b>The prefix slider.</b> Drag from /32 to /128 and watch the number of /64 subnets change by 16 for every hex digit.</li>' +
      '<li><b>Splitting a prefix.</b> A /48 into /52s, /56s or /64s, with every subnet ID listed in hex.</li>' +
      '<li><b>Kinds of address.</b> Global, unique local, link-local, multicast and the special blocks, plus a classifier.</li>' +
      '<li><b>Interface IDs and SLAAC.</b> MAC to EUI-64 to link-local, global and solicited-node addresses, and why devices now use random IDs instead.</li>' +
      '<li><b>Try it yourself.</b> Random questions of seven kinds, checked as you go, with the working shown.</li></ol>' +
      '<p class="hint"><b>Reading level.</b> The <b>Simple</b>, <b>Moderate</b> and <b>Engineer</b> buttons at the top right change how deep every explanation goes. Your choice is remembered on this browser, and a link with <code>?level=simple</code> (or moderate, engineer) opens the site at that level. The sun/moon button switches between dark and light.</p>' +
      '<p>Every widget is live: type a different address into any of them and every number is recomputed on the spot. Every row ends with three fresh check questions.</p>' +
      '<h2>Quick reference</h2><div class="table-wrap"><table class="lab hosts"><tr><th>Prefix</th><th>Fixed hex digits</th><th>Subnet-ID bits to /64</th><th>/64 subnets</th><th>Typically</th></tr>' + ref + '</table></div>' +
      '<p class="hint">Generated from the same arithmetic the widgets use (<code>ipv6.js</code>). Every /64 holds 2<sup>64</sup> ≈ 18.4 quintillion addresses, which is why host counts never appear in an IPv6 plan.</p>' +
      '<h2>Run it on your own machine</h2><p class="hint">The site is plain HTML, CSS and JavaScript; open <code>site/index.html</code> straight from disk, or run the Docker image:</p>' +
      '<pre class="cmd">docker run --rm -it --name ipv6 -p ' + SITE.port + ':' + SITE.port + ' ' + esc(SITE.image) + '</pre>' +
      '<p class="hint">Then open <a href="http://127.0.0.1:' + SITE.port + '/">http://127.0.0.1:' + SITE.port + '/</a>. Ctrl+C stops it, and it removes itself.</p></article>';
  }

  /* ---------- lesson sections ---------- */

  function columnsHtml(cols) {
    return '<div class="cols">' + cols.map(function (c) { var after = lv(c.after); return '<div class="col"><h3>' + esc(c.h) + '</h3>' + paras(c.p).map(function (p) { return '<p>' + p + '</p>'; }).join('') + (c.cmd ? '<pre class="cmd">' + esc(c.cmd) + '</pre>' : '') + (after ? '<p>' + after + '</p>' : '') + '</div>'; }).join('') + '</div>';
  }

  function tableHtml(table, cls) {
    var rows = pickLevel(table);
    if (!rows || !rows.length) return '';
    var h = ['<div class="table-wrap"><table class="lab ' + (cls || 'compare') + '">'];
    rows.forEach(function (row, i) { h.push('<tr>' + lv(row).map(function (c, j) { return (i === 0 || j === 0 ? '<th>' : '<td>') + c + (i === 0 || j === 0 ? '</th>' : '</td>'); }).join('') + '</tr>'); });
    h.push('</table></div>');
    return h.join('');
  }

  function sectionHtml(s) {
    var h = ['<section><h2>' + esc(s.h) + '</h2>'];
    paras(s.p).forEach(function (p) { h.push('<p>' + p + '</p>'); });
    if (s.hexbits) h.push(hexbitsHtml(s.hexbits));
    if (s.compress) h.push(compressHtml(s.compress));
    if (s.anatomy) h.push(anatomyHtml(s.anatomy));
    if (s.cidr) h.push(cidrHtml(s.cidr));
    if (s.split) h.push(splitHtml(s.split));
    if (s.classify) h.push(classifyHtml(s.classify));
    if (s.eui64) h.push(eui64Html(s.eui64));
    if (s.quiz) h.push(quizHtml(s.quiz));
    if (s.steps) { h.push('<ol class="steps">'); paras(s.steps).forEach(function (t) { h.push('<li>' + t + '</li>'); }); h.push('</ol>'); }
    if (s.columns) h.push(columnsHtml(s.columns));
    if (s.table) h.push(tableHtml(s.table, s.tableClass));
    paras(s.after).forEach(function (p) { h.push('<p>' + p + '</p>'); });
    h.push('</section>');
    return h.join('');
  }

  function wireWidgets() {
    Array.prototype.forEach.call(main.querySelectorAll('.check'), wireCheck);
    Array.prototype.forEach.call(main.querySelectorAll('.hexbits'), wireHexbits);
    Array.prototype.forEach.call(main.querySelectorAll('.compress'), wireCompress);
    Array.prototype.forEach.call(main.querySelectorAll('.cidr'), wireCidr);
    Array.prototype.forEach.call(main.querySelectorAll('.split'), wireSplit);
    Array.prototype.forEach.call(main.querySelectorAll('.classify'), wireClassify);
    Array.prototype.forEach.call(main.querySelectorAll('.eui'), wireEui);
    Array.prototype.forEach.call(main.querySelectorAll('.quiz'), wireQuiz);
  }

  function renderLesson(lesson) {
    var h = ['<article class="lesson" id="lesson-' + lesson.id + '">'];
    h.push('<p class="crumb">' + esc(STACK_GROUPS[lesson.stack] || 'Lesson') + '</p>');
    h.push('<h1>' + esc(lesson.title) + ' <small>' + esc(lesson.subtitle) + '</small></h1>');
    h.push('<p class="lead">' + lv(lesson.oneLiner) + '</p>');
    if (lesson.facts) h.push('<div class="facts">' + lesson.facts.map(function (f) { return '<div><span class="k">' + esc(f[0]) + '</span><span class="v">' + lv(f[1]) + '</span></div>'; }).join('') + '</div>');
    lesson.sections.forEach(function (s) { h.push(sectionHtml(s)); });
    if (lesson.check !== false) h.push(checkHtml(lesson.id));
    h.push('</article>');
    content.innerHTML = h.join('');
    main.scrollTop = 0;
    wireWidgets();
  }

  /* ---------- routing ---------- */

  function route() {
    var id = location.hash.replace('#', ''), idx = -1;
    LESSONS.forEach(function (l, i) { if (l.id === id) idx = i; });
    setActive(idx >= 0 ? id : null);
    if (idx >= 0) renderLesson(LESSONS[idx]); else renderWelcome();
    document.title = (idx >= 0 ? LESSONS[idx].title + ' - ' : '') + SITE.title;
  }

  buildMenu();
  buildNav();
  window.rerender = function () { var y = main.scrollTop; route(); main.scrollTop = y; };
  wireLevelBar(document.getElementById('level-bar'));
  wireThemeBtn(document.getElementById('level-bar'));
  wireNavToggle(document.getElementById('level-bar'));
  window.addEventListener('hashchange', route);
  route();
})();
