/* ipv6.js - IPv6 address arithmetic with no DOM in it.
   Addresses are BigInts (128 bits). Every number the site shows comes from here.
   Loaded in the browser as window.IP6, and by node for the smoke tests. */

var IP6 = (function () {
  'use strict';

  var ONE = BigInt(1), ZERO = BigInt(0);
  var MAX = (ONE << BigInt(128)) - ONE;
  var HEX = '0123456789abcdef';

  /* ---------- parsing and printing ---------- */

  function parseGroup(g) {
    if (!/^[0-9a-f]{1,4}$/i.test(g)) return null;
    return parseInt(g, 16);
  }

  /* Accepts full, compressed and IPv4-embedded forms; ignores a %zone. Returns BigInt or null. */
  function parse(str) {
    if (typeof str !== 'string') return null;
    var s = str.trim().toLowerCase().replace(/%.*$/, '');
    if (!s || /[^0-9a-f:.]/.test(s)) return null;
    /* an embedded dotted IPv4 tail becomes two groups */
    var m = /^(.*:)(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s);
    if (m) {
      var o = [m[2], m[3], m[4], m[5]].map(Number);
      if (o.some(function (x) { return x > 255; })) return null;
      s = m[1] + ((o[0] << 8) | o[1]).toString(16) + ':' + ((o[2] << 8) | o[3]).toString(16);
    }
    var halves = s.split('::');
    if (halves.length > 2) return null;
    var left = halves[0] ? halves[0].split(':') : [], right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
    if (halves.length === 1 && left.length !== 8) return null;
    if (halves.length === 2 && left.length + right.length > 7) return null;
    var groups = [];
    for (var i = 0; i < left.length; i++) { var a = parseGroup(left[i]); if (a === null) return null; groups.push(a); }
    if (halves.length === 2) { var fill = 8 - left.length - right.length; for (var j = 0; j < fill; j++) groups.push(0); }
    for (var k = 0; k < right.length; k++) { var b = parseGroup(right[k]); if (b === null) return null; groups.push(b); }
    if (groups.length !== 8) return null;
    var n = ZERO;
    groups.forEach(function (g) { n = (n << BigInt(16)) | BigInt(g); });
    return n;
  }

  function groups(n) {
    var out = [];
    for (var i = 7; i >= 0; i--) out.push(Number((n >> BigInt(16 * i)) & BigInt(0xffff)));
    return out;
  }

  function hex4(v) { var s = v.toString(16); while (s.length < 4) s = '0' + s; return s; }

  /* Full form: eight groups of four hex digits. */
  function expand(n) { return groups(n).map(hex4).join(':'); }

  /* Where the :: goes: the longest run of two or more zero groups, leftmost on a tie (RFC 5952). */
  function zeroRun(gs) {
    var best = { start: -1, len: 0 }, cur = { start: -1, len: 0 };
    for (var i = 0; i <= 8; i++) {
      if (i < 8 && gs[i] === 0) { if (cur.len === 0) cur.start = i; cur.len++; }
      else { if (cur.len > best.len) best = { start: cur.start, len: cur.len }; cur = { start: -1, len: 0 }; }
    }
    return best.len >= 2 ? best : null;
  }

  /* Shortest form per RFC 5952: no leading zeros, one :: for the longest zero run, lowercase. */
  function compress(n) {
    var gs = groups(n), run = zeroRun(gs), hx = gs.map(function (g) { return g.toString(16); });
    if (!run) return hx.join(':');
    var left = hx.slice(0, run.start).join(':'), right = hx.slice(run.start + run.len).join(':');
    return left + '::' + right;
  }

  /* Leading zeros stripped but no :: yet: the middle step when teaching compression. */
  function stripZeros(n) { return groups(n).map(function (g) { return g.toString(16); }).join(':'); }

  function fmt(n) { return compress(n); }

  /* '2001:db8::/32' -> { ip, prefix } or null */
  function parseCidr(str) {
    if (typeof str !== 'string') return null;
    var m = /^\s*([0-9a-fA-F:.%]+)\s*\/\s*(\d{1,3})\s*$/.exec(str);
    if (!m) return null;
    var ip = parse(m[1]), p = parseInt(m[2], 10);
    if (ip === null || p > 128) return null;
    return { ip: ip, prefix: p };
  }

  /* 4-bit binary for each hex digit, and 16-bit binary for a group */
  function nibbleBits(h) { var s = parseInt(h, 16).toString(2); while (s.length < 4) s = '0' + s; return s; }
  function groupBits(g) { var s = g.toString(2); while (s.length < 16) s = '0' + s; return s; }
  function toBits(n) { var s = n.toString(2); while (s.length < 128) s = '0' + s; return s; }
  function nibbles(n) { var s = n.toString(16); while (s.length < 32) s = '0' + s; return s.split(''); }

  /* ---------- prefixes ---------- */

  function maskOf(prefix) {
    if (prefix <= 0) return ZERO;
    if (prefix >= 128) return MAX;
    return (MAX << BigInt(128 - prefix)) & MAX;
  }
  function network(ip, prefix) { return ip & maskOf(prefix); }
  function lastAddress(ip, prefix) { return network(ip, prefix) | (~maskOf(prefix) & MAX); }
  function hostBits(prefix) { return 128 - prefix; }

  /* Sizes are powers of two far beyond Number; describe them as such. */
  var NAMES = [[BigInt('1000000000000000000000000000000000000'), 'undecillion'], [BigInt('1000000000000000000000000000000000'), 'decillion'], [BigInt('1000000000000000000000000000000'), 'nonillion'], [BigInt('1000000000000000000000000000'), 'octillion'], [BigInt('1000000000000000000000000'), 'septillion'], [BigInt('1000000000000000000000'), 'sextillion'], [BigInt('1000000000000000000'), 'quintillion'], [BigInt('1000000000000000'), 'quadrillion'], [BigInt('1000000000000'), 'trillion'], [BigInt('1000000000'), 'billion'], [BigInt('1000000'), 'million']];
  function pow2(bits) {
    var n = ONE << BigInt(bits), out = { bits: bits, exact: n.toString(), exp: '2^' + bits, human: null, number: null };
    if (bits <= 53) out.number = Number(n);
    for (var i = 0; i < NAMES.length; i++) {
      if (n >= NAMES[i][0]) { out.human = (Number(n * BigInt(10) / NAMES[i][0]) / 10).toFixed(1).replace(/\.0$/, '') + ' ' + NAMES[i][1]; break; }
    }
    return out;
  }
  function fmtBig(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  /* How many /child subnets fit in a /parent */
  function subnetCount(parent, child) { return pow2(child - parent); }

  function describe(ip, prefix) {
    var net = network(ip, prefix);
    return {
      ip: ip, prefix: prefix, mask: maskOf(prefix), network: net, last: lastAddress(ip, prefix),
      first: prefix >= 128 ? net : net + ONE, hostBits: 128 - prefix, size: pow2(128 - prefix),
      subnets64: prefix <= 64 ? pow2(64 - prefix) : null, subnetBits: prefix <= 64 ? 64 - prefix : 0,
      next: prefix === 0 ? null : (lastAddress(ip, prefix) + ONE) & MAX
    };
  }

  /* The subnet ID: the bits between a site prefix and the subnet prefix (default /64), as hex */
  function subnetId(ip, sitePrefix, subnetPrefix) {
    var to = subnetPrefix === undefined ? 64 : subnetPrefix;
    if (sitePrefix >= to) return '';
    var bits = to - sitePrefix, v = (ip >> BigInt(128 - to)) & ((ONE << BigInt(bits)) - ONE);
    var s = v.toString(16); while (s.length < Math.ceil(bits / 4)) s = '0' + s;
    return s;
  }

  function subnetsOf(ip, parentPrefix, childPrefix, limit) {
    limit = limit || 64;
    var count = pow2(childPrefix - parentPrefix), step = ONE << BigInt(128 - childPrefix), base = network(ip, parentPrefix), out = [];
    var total = count.number !== null ? count.number : Infinity;
    for (var i = 0; i < total && i < limit; i++) {
      var net = base + step * BigInt(i);
      var d = describe(net, childPrefix);
      d.id = subnetId(net, parentPrefix, childPrefix);
      d.index = i;
      out.push(d);
    }
    return { total: count, shown: out.length, subnets: out };
  }

  /* ---------- kinds of address ---------- */

  var RANGES = [
    { cidr: '::/128',            kind: 'unspecified', name: 'Unspecified',                      rfc: 'RFC 4291' },
    { cidr: '::1/128',           kind: 'loopback',    name: 'Loopback',                         rfc: 'RFC 4291' },
    { cidr: '::ffff:0:0/96',     kind: 'v4mapped',    name: 'IPv4-mapped',                      rfc: 'RFC 4291' },
    { cidr: '64:ff9b::/96',      kind: 'nat64',       name: 'NAT64 well-known prefix',          rfc: 'RFC 6052' },
    { cidr: '100::/64',          kind: 'discard',     name: 'Discard-only (black hole)',        rfc: 'RFC 6666' },
    { cidr: '2001:db8::/32',     kind: 'doc',         name: 'Documentation',                    rfc: 'RFC 3849' },
    { cidr: '2001::/32',         kind: 'teredo',      name: 'Teredo tunnelling',                rfc: 'RFC 4380' },
    { cidr: '2002::/16',         kind: '6to4',        name: '6to4 tunnelling (deprecated)',     rfc: 'RFC 3056, 7526' },
    { cidr: '2000::/3',          kind: 'global',      name: 'Global unicast',                   rfc: 'RFC 4291' },
    { cidr: 'fd00::/8',          kind: 'ula',         name: 'Unique local (locally assigned)',  rfc: 'RFC 4193' },
    { cidr: 'fc00::/7',          kind: 'ula',         name: 'Unique local',                     rfc: 'RFC 4193' },
    { cidr: 'fe80::/10',         kind: 'linklocal',   name: 'Link-local',                       rfc: 'RFC 4291' },
    { cidr: 'fec0::/10',         kind: 'sitelocal',   name: 'Site-local (deprecated)',          rfc: 'RFC 3879' },
    { cidr: 'ff02::1/128',       kind: 'multicast',   name: 'Multicast: all nodes on the link', rfc: 'RFC 4291' },
    { cidr: 'ff02::2/128',       kind: 'multicast',   name: 'Multicast: all routers on the link', rfc: 'RFC 4291' },
    { cidr: 'ff02::fb/128',      kind: 'multicast',   name: 'Multicast: mDNS',                  rfc: 'RFC 6762' },
    { cidr: 'ff02::1:2/128',     kind: 'multicast',   name: 'Multicast: DHCPv6 relays and servers', rfc: 'RFC 8415' },
    { cidr: 'ff02::1:ff00:0/104', kind: 'multicast',  name: 'Multicast: solicited-node',        rfc: 'RFC 4291' },
    { cidr: 'ff00::/8',          kind: 'multicast',   name: 'Multicast',                        rfc: 'RFC 4291' }
  ];
  RANGES.forEach(function (r) { var c = parseCidr(r.cidr); r.ip = c.ip; r.prefix = c.prefix; });

  var MCAST_SCOPE = { 1: 'interface-local', 2: 'link-local', 3: 'realm-local', 4: 'admin-local', 5: 'site-local', 8: 'organization-local', e: 'global' };

  function classify(ip) {
    for (var i = 0; i < RANGES.length; i++) {
      if (network(ip, RANGES[i].prefix) === RANGES[i].ip) {
        var r = RANGES[i], out = { kind: r.kind, name: r.name, cidr: r.cidr, rfc: r.rfc, routable: r.kind === 'global' || r.kind === 'teredo' || r.kind === '6to4' || r.kind === 'nat64' };
        if (r.kind === 'multicast') {
          var scopeNibble = nibbles(ip)[3], flags = nibbles(ip)[2];
          out.scope = MCAST_SCOPE[scopeNibble] || 'unassigned scope ' + scopeNibble;
          out.flags = flags;
          out.routable = scopeNibble !== '1' && scopeNibble !== '2';
        }
        return out;
      }
    }
    return { kind: 'reserved', name: 'Reserved / unassigned by IANA', cidr: null, rfc: 'RFC 4291', routable: false };
  }

  /* ---------- interface identifiers ---------- */

  function parseMac(str) {
    if (typeof str !== 'string') return null;
    var s = str.trim().toLowerCase().replace(/[^0-9a-f]/g, '');
    if (s.length !== 12) return null;
    var out = []; for (var i = 0; i < 12; i += 2) out.push(parseInt(s.slice(i, i + 2), 16));
    return out;
  }
  function fmtMac(bytes) { return bytes.map(function (b) { return (b < 16 ? '0' : '') + b.toString(16); }).join(':'); }

  /* Modified EUI-64: split the MAC, insert ff:fe, flip bit 7 (the U/L bit) of the first byte. */
  function eui64(macBytes) {
    var b = macBytes.slice(), first = b[0], flipped = first ^ 0x02;
    var iidBytes = [flipped, b[1], b[2], 0xff, 0xfe, b[3], b[4], b[5]];
    var iid = ZERO; iidBytes.forEach(function (x) { iid = (iid << BigInt(8)) | BigInt(x); });
    var bin = function (v) { var s = v.toString(2); while (s.length < 8) s = '0' + s; return s; };
    return {
      mac: fmtMac(b), oui: fmtMac(b.slice(0, 3)), nic: fmtMac(b.slice(3)),
      firstByte: first, firstByteBits: bin(first), flippedByte: flipped, flippedBits: bin(flipped),
      inserted: fmtMac(b.slice(0, 3)) + ':ff:fe:' + fmtMac(b.slice(3)),
      iid: iid, iidGroups: [hex4(Number(iid >> BigInt(48) & BigInt(0xffff))), hex4(Number(iid >> BigInt(32) & BigInt(0xffff))), hex4(Number(iid >> BigInt(16) & BigInt(0xffff))), hex4(Number(iid & BigInt(0xffff)))],
      linkLocal: (BigInt('0xfe80') << BigInt(112)) | iid
    };
  }
  function withPrefix(prefixIp, iid) { return network(prefixIp, 64) | (iid & ((ONE << BigInt(64)) - ONE)); }

  /* Solicited-node multicast: ff02::1:ff00:0/104 plus the last 24 bits of the address */
  function solicitedNode(ip) { return parse('ff02::1:ff00:0') | (ip & BigInt(0xffffff)); }

  /* The multicast MAC a solicited-node group maps to: 33:33 + the last 32 bits */
  function multicastMac(ip) { var low = Number(ip & BigInt(0xffffffff)); return '33:33:' + fmtMac([(low >>> 24) & 255, (low >>> 16) & 255, (low >>> 8) & 255, low & 255]); }

  /* ---------- practice questions ---------- */

  function rnd(n) { return Math.floor(Math.random() * n); }
  function pick(arr) { return arr[rnd(arr.length)]; }
  function rndGroup() { return rnd(0x10000); }
  function fromGroups(gs) { var n = ZERO; gs.forEach(function (g) { n = (n << BigInt(16)) | BigInt(g); }); return n; }

  var SITES = ['2001:db8:acad', '2001:db8:1', '2001:db8:cafe', '2001:db8:beef', '2001:db8:10', '2001:db8:abcd', '2001:db8:0'];

  /* an address with a realistic mix of zero groups, so compression is interesting */
  function randomInteresting(difficulty) {
    var gs = [0x2001, 0xdb8, rndGroup(), rndGroup(), rndGroup(), rndGroup(), rndGroup(), rndGroup()];
    var zeros = difficulty === 'hard' ? 2 + rnd(3) : difficulty === 'medium' ? 2 + rnd(2) : 3 + rnd(2);
    var start = 2 + rnd(6 - zeros + 1);
    for (var i = 0; i < zeros; i++) gs[start + i] = 0;
    if (difficulty !== 'easy' && rnd(2)) gs[start === 2 ? 7 : 2] = 0;               /* a lone zero group or a second run */
    if (difficulty === 'hard' && rnd(2)) { var s2 = start < 5 ? 6 : 2; gs[s2] = 0; if (s2 + 1 < 8 && s2 + 1 !== start) gs[s2 + 1] = 0; }
    var j = 2 + rnd(6); if (gs[j] !== 0) gs[j] = gs[j] & 0x0fff;                    /* some leading zeros to strip */
    var k = 2 + rnd(6); if (gs[k] !== 0) gs[k] = gs[k] & 0x00ff || 0x1a;
    return fromGroups(gs);
  }

  function randomMac() { return [pick([0x00, 0x00, 0x02, 0x08, 0x3c, 0xa4, 0xb8, 0xdc]), rnd(256), rnd(256), rnd(256), rnd(256), rnd(256)]; }

  /* kind: 'compress' | 'expand' | 'subnets' | 'kth' | 'kind' | 'linklocal' | 'network' | 'mixed'
     Returns { kind, prompt pieces, fields: [{ id, label, answer, type }] } */
  function randomQuestion(kind, difficulty) {
    if (kind === 'mixed' || !kind) kind = pick(['compress', 'expand', 'subnets', 'kth', 'kind', 'linklocal', 'network']);
    var q = { kind: kind, fields: [] };
    if (kind === 'compress') {
      q.ip = randomInteresting(difficulty); q.shown = difficulty === 'easy' ? expand(q.ip) : (rnd(2) ? expand(q.ip) : stripZeros(q.ip));
      q.fields.push({ id: 'short', label: 'Shortest form', answer: compress(q.ip), type: 'ip6exact' });
    } else if (kind === 'expand') {
      q.ip = randomInteresting(difficulty); q.shown = compress(q.ip);
      q.fields.push({ id: 'full', label: 'Full form (8 groups of 4)', answer: expand(q.ip), type: 'ip6full' });
    } else if (kind === 'subnets') {
      var p = difficulty === 'hard' ? pick([32, 40, 44, 48, 52, 56, 60]) : difficulty === 'medium' ? pick([44, 48, 52, 56]) : pick([48, 56]);
      var c = difficulty === 'easy' ? 64 : pick([52, 56, 60, 64].filter(function (x) { return x > p; }));
      q.parent = p; q.child = c;
      q.fields.push({ id: 'count', label: 'Number of /' + c + ' subnets', answer: subnetCount(p, c).number, type: 'number' });
    } else if (kind === 'kth') {
      var site = pick(SITES), sp = difficulty === 'hard' ? pick([44, 48, 52, 56]) : 48, cp = difficulty === 'easy' ? 64 : pick([56, 60, 64].filter(function (x) { return x > sp; }));
      var base = network(parse(site + '::'), sp), bits = cp - sp, idNum = 1 + rnd(Math.min(Math.pow(2, bits), 4096) - 1);
      var netAddr = base + (BigInt(idNum) << BigInt(128 - cp));
      var idHex = idNum.toString(16); while (idHex.length < Math.ceil(bits / 4)) idHex = '0' + idHex;
      q.site = fmt(base) + '/' + sp; q.child = cp; q.id = idHex; q.idNum = idNum; q.ip = netAddr;
      q.fields.push({ id: 'net', label: 'Network address', answer: fmt(netAddr), type: 'ip6' });
    } else if (kind === 'kind') {
      var pools = ['2001:db8:' + rndGroup().toString(16) + '::' + rndGroup().toString(16), '2600:1f18:' + rndGroup().toString(16) + '::' + rnd(0xfff).toString(16), '2a00:1450:' + rndGroup().toString(16) + '::200e',
        'fe80::' + rndGroup().toString(16) + ':' + rndGroup().toString(16) + ':' + rndGroup().toString(16), 'fd' + (rnd(255) + 1).toString(16) + ':' + rndGroup().toString(16) + ':' + rndGroup().toString(16) + '::1',
        'ff02::1', 'ff02::2', 'ff02::1:ff' + rnd(256).toString(16) + ':' + rndGroup().toString(16), 'ff05::1:3', '::1', '::', '::ffff:' + rnd(224) + '.' + rnd(256) + '.' + rnd(256) + '.' + (1 + rnd(254))];
      if (difficulty === 'easy') pools = pools.slice(0, 9).concat(['::1']);
      q.ip = parse(pick(pools)); var k = classify(q.ip);
      q.fields.push({ id: 'kind', label: 'Kind of address', answer: k.kind, type: 'kind' });
    } else if (kind === 'linklocal') {
      q.mac = randomMac(); var e = eui64(q.mac);
      q.fields.push({ id: 'll', label: 'Link-local address (EUI-64)', answer: fmt(e.linkLocal), type: 'ip6' });
    } else {
      var siteB = pick(SITES), hostIp = parse(siteB + ':' + rndGroup().toString(16) + ':' + rndGroup().toString(16) + ':' + rndGroup().toString(16) + ':' + rndGroup().toString(16) + ':' + rndGroup().toString(16));
      var np = difficulty === 'easy' ? 64 : pick([48, 56, 60, 64]);
      q.ip = hostIp; q.prefix = np;
      q.fields.push({ id: 'net', label: 'Network address', answer: fmt(network(hostIp, np)), type: 'ip6' });
    }
    return q;
  }

  var KIND_WORDS = {
    global: ['global', 'global unicast', 'gua', 'public', 'unicast'], ula: ['ula', 'unique local', 'unique-local', 'private', 'local'], linklocal: ['link-local', 'link local', 'linklocal', 'lla'],
    multicast: ['multicast', 'mcast', 'group'], loopback: ['loopback', 'localhost', 'lo'], unspecified: ['unspecified', 'any', 'none', 'no address', 'unknown'], v4mapped: ['ipv4-mapped', 'ipv4 mapped', 'v4-mapped', 'v4 mapped', 'mapped', 'ipv4'],
    doc: ['documentation', 'doc', 'docs', 'example', 'global', 'global unicast'], teredo: ['teredo', 'global'], '6to4': ['6to4', 'global'], nat64: ['nat64', 'global'], discard: ['discard', 'black hole', 'blackhole'], sitelocal: ['site-local', 'site local', 'deprecated'], reserved: ['reserved', 'unassigned']
  };

  /* Lenient answer check. ip6: any valid spelling of the same address. ip6exact: the RFC 5952 form only.
     ip6full: eight groups of four digits. number: digits with separators. kind: a word from the list. */
  function checkAnswer(field, text) {
    var t = String(text || '').trim().toLowerCase();
    if (!t) return false;
    if (field.type === 'number') { var m = /^([\d,\s ]+)/.exec(t); return !!m && parseInt(m[1].replace(/[,\s ]/g, ''), 10) === field.answer; }
    if (field.type === 'kind') { var norm = t.replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, ' '); if (norm === field.answer) return true; return (KIND_WORDS[field.answer] || []).some(function (w) { return norm === w || norm.indexOf(w) === 0; }); }
    var ip = parse(t.replace(/\s+/g, ''));
    if (ip === null) return false;
    var same = ip === parse(field.answer);
    if (!same) return false;
    if (field.type === 'ip6exact') return t.replace(/\s+/g, '') === field.answer;
    if (field.type === 'ip6full') return /^([0-9a-f]{4}:){7}[0-9a-f]{4}$/.test(t.replace(/\s+/g, ''));
    return true;
  }

  return {
    parse: parse, groups: groups, expand: expand, compress: compress, stripZeros: stripZeros, fmt: fmt, parseCidr: parseCidr, zeroRun: zeroRun,
    nibbleBits: nibbleBits, groupBits: groupBits, toBits: toBits, nibbles: nibbles, hex4: hex4,
    maskOf: maskOf, network: network, lastAddress: lastAddress, hostBits: hostBits, pow2: pow2, fmtBig: fmtBig, subnetCount: subnetCount, describe: describe, subnetId: subnetId, subnetsOf: subnetsOf,
    RANGES: RANGES, classify: classify, MCAST_SCOPE: MCAST_SCOPE,
    parseMac: parseMac, fmtMac: fmtMac, eui64: eui64, withPrefix: withPrefix, solicitedNode: solicitedNode, multicastMac: multicastMac,
    randomQuestion: randomQuestion, checkAnswer: checkAnswer, randomMac: randomMac, randomInteresting: randomInteresting, KIND_WORDS: KIND_WORDS
  };
})();

if (typeof module !== 'undefined') module.exports = IP6;
