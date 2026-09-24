/* checks.js - "Check your understanding": three fresh questions at the bottom of every row.
   One generator per row id. Each returns three questions:
     { prompt, type: 'number' | 'ip6' | 'ip6exact' | 'ip6full' | 'bits' | 'hex' | 'kind' | 'text', answer, accept, explain }
   Everything is drawn at random, so no two visits ask the same thing. */

var CHECKS = (function () {
  'use strict';
  var I = IP6;

  function rnd(n) { return Math.floor(Math.random() * n); }
  function between(a, b) { return a + rnd(b - a + 1); }
  function pick(arr) { return arr[rnd(arr.length)]; }
  function fmtN(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  var SITES = ['2001:db8:acad', '2001:db8:1', '2001:db8:cafe', '2001:db8:beef', '2001:db8:10', '2001:db8:abcd'];
  var KIND_LABEL = { global: 'global unicast', doc: 'documentation (shaped like global unicast)', linklocal: 'link-local', ula: 'unique local', multicast: 'multicast', loopback: 'loopback', unspecified: 'the unspecified address', v4mapped: 'IPv4-mapped', nat64: 'the NAT64 prefix', teredo: 'Teredo', '6to4': '6to4', discard: 'discard-only', sitelocal: 'site-local (deprecated)', reserved: 'reserved' };

  function rndGroup() { return rnd(0x10000); }
  function hex4(v) { return I.hex4(v); }

  function kindQ(addrStr, words) {
    var ip = I.parse(addrStr), k = I.classify(ip);
    return { prompt: 'What kind of address is <code>' + I.fmt(ip) + '</code>? ' + words, type: 'kind', answer: k.kind, explain: I.fmt(ip) + ' is ' + KIND_LABEL[k.kind] + (k.cidr ? ', inside ' + k.cidr : '') + (k.scope ? ' (scope: ' + k.scope + ')' : '') + '.' };
  }

  var GEN = {
    hex: function () {
      var d = pick('123456789abcdef'.split('')), g = rndGroup(), bits16 = I.groupBits(g), h2 = pick('89abcdef'.split('')) + pick('0123456789abcdef'.split(''));
      return [
        { prompt: 'Write the hex digit <b>' + d + '</b> as four bits.', type: 'bits', answer: I.nibbleBits(d), explain: d + ' = ' + parseInt(d, 16) + ' = <code>' + I.nibbleBits(d) + '</code> (8 4 2 1).' },
        { prompt: 'Write the 16 bits <code>' + bits16.slice(0, 4) + ' ' + bits16.slice(4, 8) + ' ' + bits16.slice(8, 12) + ' ' + bits16.slice(12) + '</code> as one hex group.', type: 'hex', answer: hex4(g), explain: 'Four bits at a time: ' + bits16.match(/.{4}/g).map(function (b) { return b + '→' + parseInt(b, 2).toString(16); }).join(', ') + ' = <code>' + hex4(g) + '</code> (leading zeros may be dropped: ' + g.toString(16) + ').' },
        { prompt: 'How many <b>bits</b> are in the hex group <code>' + h2 + '</code> once it is padded to a full hextet?', type: 'number', answer: 16, explain: 'Every group is 16 bits (four hex digits of four bits), however many digits are written. <code>' + h2 + '</code> is really <code>00' + h2 + '</code>.' }
      ];
    },

    notation: function () {
      var a = I.randomInteresting('medium'), b = I.randomInteresting('easy'), c = I.randomInteresting(pick(['medium', 'hard']));
      var runC = I.zeroRun(I.groups(c)), zc = runC ? runC.len : 0;
      return [
        { prompt: 'Write <code>' + I.expand(a) + '</code> in its shortest form.', type: 'ip6exact', answer: I.compress(a), explain: 'Drop leading zeros in each group, then replace the longest run of zero groups with <code>::</code>: <code>' + I.compress(a) + '</code>.' },
        { prompt: 'Write <code>' + I.compress(b) + '</code> out in full (eight groups of four digits).', type: 'ip6full', answer: I.expand(b), explain: '<code>::</code> stands for enough zero groups to make eight; every group is padded to four digits: <code>' + I.expand(b) + '</code>.' },
        { prompt: 'In <code>' + I.compress(c) + '</code>, how many all-zero groups does <code>::</code> stand for? (Answer 0 if there is no <code>::</code>.)', type: 'number', answer: zc, explain: zc ? 'Full form <code>' + I.expand(c) + '</code>: the <code>::</code> covers ' + zc + ' groups (' + (8 - zc) + ' are written out).' : 'There is no <code>::</code> in it, because no two zero groups are adjacent.' }
      ];
    },

    prefix: function () {
      var p = pick([48, 52, 56, 60]), host = I.parse(pick(SITES) + ':' + rndGroup().toString(16) + ':' + rndGroup().toString(16) + ':' + rndGroup().toString(16) + ':' + rndGroup().toString(16) + ':' + rndGroup().toString(16));
      var q = pick([48, 56, 64]);
      return [
        { prompt: 'A site is delegated a <b>/' + p + '</b> and uses /64 subnets. How many <b>bits</b> are available for subnet IDs?', type: 'number', answer: 64 - p, explain: '64 − ' + p + ' = ' + (64 - p) + ' bits (' + ((64 - p) / 4) + ' hex digit' + (64 - p === 4 ? '' : 's') + '), so 2<sup>' + (64 - p) + '</sup> = ' + fmtN(Math.pow(2, 64 - p)) + ' subnets.' },
        { prompt: 'What is the <b>network address</b> of the host <code>' + I.fmt(host) + '/64</code>?', type: 'ip6', answer: I.fmt(I.network(host, 64)), explain: 'Keep the first four hextets, zero the interface ID: <code>' + I.fmt(I.network(host, 64)) + '</code>.' },
        { prompt: 'How many bits long is the <b>interface ID</b> in a /' + q + ' address used on a normal LAN?', type: 'number', answer: 64, explain: 'On a LAN the subnet is always a /64, so the interface ID is 64 bits, whatever the site prefix. The /' + q + ' only says how much of the first 64 bits is fixed by the provider.' }
      ];
    },

    slider: function () {
      var p = pick([32, 40, 44, 48, 52, 56, 60]), p2 = pick([48, 52, 56]), n = pick([4, 8, 12, 16]);
      return [
        { prompt: 'How many <b>/64</b> subnets are in a <b>/' + p + '</b>?', type: 'number', answer: Math.pow(2, 64 - p), explain: '64 − ' + p + ' = ' + (64 - p) + ' bits; 2<sup>' + (64 - p) + '</sup> = ' + fmtN(Math.pow(2, 64 - p)) + '.' },
        { prompt: 'How many <b>hex digits</b> are left for subnet IDs between a /' + p2 + ' and /64?', type: 'number', answer: (64 - p2) / 4, explain: '(64 − ' + p2 + ') ÷ 4 = ' + ((64 - p2) / 4) + ' digit' + ((64 - p2) / 4 === 1 ? '' : 's') + '.' },
        { prompt: 'An organisation wants exactly <b>' + fmtN(Math.pow(2, n)) + '</b> /64 subnets. What prefix length does it need? Give just the number.', type: 'number', answer: 64 - n, explain: fmtN(Math.pow(2, n)) + ' = 2<sup>' + n + '</sup>, so ' + n + ' subnet bits: 64 − ' + n + ' = /' + (64 - n) + '.' }
      ];
    },

    carve: function () {
      var p = pick([44, 48, 52, 56]), c = pick([52, 56, 60, 64].filter(function (x) { return x > p; }));
      var site = pick(SITES), sp = 48, cp = pick([52, 56, 64]), bits = cp - sp, idNum = 1 + rnd(Math.min(4096, Math.pow(2, bits)) - 1);
      var idHex = idNum.toString(16); while (idHex.length < bits / 4) idHex = '0' + idHex;
      var base = I.network(I.parse(site + '::'), sp), net = base + (BigInt(idNum) << BigInt(128 - cp));
      var c3 = pick([52, 56, 60, 64]);
      return [
        { prompt: 'Splitting a <b>/' + p + '</b> into <b>/' + c + '</b>s gives how many subnets?', type: 'number', answer: Math.pow(2, c - p), explain: c + ' − ' + p + ' = ' + (c - p) + ' bits; 2<sup>' + (c - p) + '</sup> = ' + fmtN(Math.pow(2, c - p)) + '.' },
        { prompt: 'In <code>' + I.fmt(base) + '/48</code>, what is the network address of the /' + cp + ' with subnet ID <code>' + idHex + '</code>?', type: 'ip6', answer: I.fmt(net), explain: 'The subnet ID occupies hex digits 13 to ' + (12 + bits / 4) + '. Write ' + idHex + ' there: <code>' + I.expand(net) + '</code> = <code>' + I.fmt(net) + '</code>.' },
        { prompt: 'A /48 is cut into /' + c3 + 's. How many <b>hex digits</b> long is each subnet ID?', type: 'number', answer: (c3 - 48) / 4, explain: '(' + c3 + ' − 48) ÷ 4 = ' + ((c3 - 48) / 4) + '.' }
      ];
    },

    kinds: function () {
      var pools = ['2001:db8:' + rndGroup().toString(16) + '::' + rndGroup().toString(16), '2a02:' + rndGroup().toString(16) + ':' + rndGroup().toString(16) + '::1', '2600:1f18::' + rndGroup().toString(16), 'fe80::' + rndGroup().toString(16) + ':' + rndGroup().toString(16) + ':1', 'fd' + (1 + rnd(255)).toString(16) + ':' + rndGroup().toString(16) + '::' + rndGroup().toString(16), 'ff02::1', 'ff02::2', 'ff02::1:ff' + rnd(256).toString(16) + ':' + rndGroup().toString(16), '::1', '::', '::ffff:' + rnd(224) + '.' + rnd(256) + '.' + rnd(256) + '.' + (1 + rnd(254))];
      var words = 'One word or phrase: global, link-local, unique local, multicast, loopback, unspecified, IPv4-mapped, documentation.';
      var scopeAddr = pick(['ff02::' + (1 + rnd(20)).toString(16), 'ff05::1:3', 'ff0e::' + (1 + rnd(200)).toString(16), 'ff01::1', 'ff08::' + (1 + rnd(200)).toString(16)]);
      var sc = I.classify(I.parse(scopeAddr)).scope, scopeWord = sc.split('-')[0];
      var accept = { interface: ['interface-local', 'interface local', 'interface', 'node-local', 'node local', 'node', '1'], link: ['link-local', 'link local', 'link', '2'], site: ['site-local', 'site local', 'site', '5'], organization: ['organization-local', 'organisation-local', 'organization local', 'organisation local', 'organization', 'organisation', 'org', '8'], global: ['global', 'internet', 'e'] }[scopeWord];
      return [kindQ(pick(pools), words), kindQ(pick(pools.slice(0, 8)), words),
        { prompt: 'What is the <b>scope</b> of the multicast address <code>' + scopeAddr + '</code>? (interface-local, link-local, site-local, organization-local or global)', type: 'text', answer: accept[0], accept: accept, explain: 'The fourth hex digit is ' + I.nibbles(I.parse(scopeAddr))[3] + ', which means ' + sc + '.' }];
    },

    iid: function () {
      var mac = I.randomMac(), e = I.eui64(mac), addr = I.parse(pick(SITES) + ':1:' + rndGroup().toString(16) + ':' + rndGroup().toString(16) + ':' + rndGroup().toString(16) + ':' + rndGroup().toString(16));
      var mac2 = I.randomMac(), e2 = I.eui64(mac2);
      return [
        { prompt: 'A device has MAC <code>' + I.fmtMac(mac) + '</code>. What is its EUI-64 <b>link-local</b> address?', type: 'ip6', answer: I.fmt(e.linkLocal), explain: 'Insert ff:fe in the middle (' + e.inserted + '), flip bit 7 of the first byte (' + (e.firstByte < 16 ? '0' : '') + e.firstByte.toString(16) + ' → ' + (e.flippedByte < 16 ? '0' : '') + e.flippedByte.toString(16) + '), prepend fe80::/64: <code>' + I.fmt(e.linkLocal) + '</code>.' },
        { prompt: 'What <b>solicited-node multicast</b> address does <code>' + I.fmt(addr) + '</code> join?', type: 'ip6', answer: I.fmt(I.solicitedNode(addr)), explain: 'ff02::1:ff + the last 24 bits (' + I.nibbles(addr).slice(26).join('') + '): <code>' + I.fmt(I.solicitedNode(addr)) + '</code>.' },
        { prompt: 'After the U/L bit is flipped, what does the first byte <code>' + (mac2[0] < 16 ? '0' : '') + mac2[0].toString(16) + '</code> of MAC <code>' + I.fmtMac(mac2) + '</code> become? Answer as two hex digits.', type: 'hex', answer: (e2.flippedByte < 16 ? '0' : '') + e2.flippedByte.toString(16), explain: e2.firstByteBits + ' → ' + e2.flippedBits + ': bit 7 (value 0x02) inverted, ' + (e2.firstByte < 16 ? '0' : '') + e2.firstByte.toString(16) + ' becomes ' + (e2.flippedByte < 16 ? '0' : '') + e2.flippedByte.toString(16) + '.' }
      ];
    },

    practice: function () {
      var a = I.randomQuestion('compress', 'medium'), b = I.randomQuestion('kth', 'easy'), c = I.randomQuestion('network', 'medium');
      return [
        { prompt: 'Shortest form of <code>' + a.shown + '</code>?', type: 'ip6exact', answer: a.fields[0].answer, explain: 'Leading zeros dropped, longest zero run → <code>::</code>: <code>' + a.fields[0].answer + '</code>.' },
        { prompt: 'In <code>' + b.site + '</code>, the network address of the /' + b.child + ' with subnet ID <code>' + b.id + '</code>?', type: 'ip6', answer: b.fields[0].answer, explain: 'Subnet ID in the fourth hextet: <code>' + b.fields[0].answer + '</code>.' },
        { prompt: 'Network address of <code>' + I.fmt(c.ip) + '/' + c.prefix + '</code>?', type: 'ip6', answer: c.fields[0].answer, explain: 'Keep ' + c.prefix + ' bits (' + (c.prefix / 4) + ' hex digits), zero the rest: <code>' + c.fields[0].answer + '</code>.' }
      ];
    }
  };

  function questions(rowId) { var g = GEN[rowId]; return g ? g() : null; }

  function grade(q, text) {
    var t = String(text || '').trim().toLowerCase();
    if (!t) return false;
    if (q.type === 'number') return I.checkAnswer({ type: 'number', answer: q.answer }, t);
    if (q.type === 'ip6' || q.type === 'ip6exact' || q.type === 'ip6full' || q.type === 'kind') return I.checkAnswer({ type: q.type, answer: q.answer }, t);
    if (q.type === 'bits') { var b = t.replace(/[\s.]/g, ''); return /^[01]{1,16}$/.test(b) && parseInt(b, 2) === parseInt(q.answer, 2); }
    if (q.type === 'hex') { var hx = t.replace(/^0x/, '').replace(/[\s:]/g, ''); return /^[0-9a-f]{1,4}$/.test(hx) && parseInt(hx, 16) === parseInt(q.answer, 16); }
    var norm = t.replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, ' ');
    return (q.accept || [q.answer]).some(function (a) { return norm === a || norm.indexOf(a) === 0; });
  }

  function shown(q) {
    if (q.type === 'number') return fmtN(q.answer);
    if (q.type === 'kind') return (I.KIND_WORDS[q.answer] || [q.answer])[0];
    return q.answer;
  }

  return { questions: questions, grade: grade, shown: shown, ROWS: Object.keys(GEN) };
})();

if (typeof module !== 'undefined') module.exports = CHECKS;
