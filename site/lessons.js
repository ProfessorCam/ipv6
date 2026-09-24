/*
 * lessons.js - the teaching content, one object per row in the left column.
 *
 *   id        short word used in the URL hash (#slider)
 *   stack     'basics' | 'cidr' | 'kinds' | 'practice': groups the left column
 *   chip      the small chip text on the row
 *   title     big label in the left column
 *   subtitle  one line under the title
 *   facts     [[label, text], ...] the two-column facts box under the title
 *   oneLiner  the whole idea in one sentence
 *   sections  [{ h: heading, p: [paragraphs, may contain <b> <code>], ... }]
 *     hexbits  - { value, edit }: an address as eight hextets, each hex digit over its four bits
 *     compress - { value, presets }: type an address, watch it shrink by the RFC 5952 rules
 *     anatomy  - { value, prefix, site }: colour-coded hextet strip: routing prefix, subnet ID, interface ID
 *     cidr     - { value, min, max, start, caption }: the interactive prefix slider
 *     split    - { value, parent, child }: carve one block into equal subnets
 *     classify - { presets: [...] }: type an address, learn which kind it is
 *     eui64    - { mac, prefix }: MAC to interface ID, link-local, global and solicited-node addresses
 *     quiz     - { kinds: [...] }: the practice questions
 *     table / steps / columns / after as on the other Packet Lessons sites
 *
 * Reading levels: any prose may be a plain string or { s, m, e } for Simple / Moderate / Engineer.
 * A missing key falls back to m; '' leaves that paragraph out. Refer to other rows as {{row:id}}.
 * All numbers in the widgets come from ipv6.js, not from this file.
 */
var SITE = {
  title: 'IPv6 Subnetting',
  image: 'professorcryan/ipv6',
  port: 8083,
  menu: [
    { label: 'Frames & Packets', href: 'https://professorcam.github.io/frames/' },
    { label: 'Protocols', href: 'https://professorcam.github.io/pcap/' },
    { label: 'Encryption and Protocols', href: 'https://professorcam.github.io/encryption/' },
    { label: 'Packet Forensics', href: 'https://professorcam.github.io/forensics/' },
    { label: 'Server Basics', href: 'https://professorcam.github.io/servers/' },
    { label: 'IPv4 Subnetting', href: 'https://professorcam.github.io/ipv4/' },
    { label: 'IPv6 Subnetting', href: '#', current: true }
  ]
};

var LESSONS = [
  /* ------------------------------------------------------------------ hex */
  {
    id: 'hex',
    stack: 'basics',
    chip: 'hex',
    title: 'Hex and hextets',
    subtitle: '128 bits, written as eight groups of four hex digits',
    facts: [
      ['How long', {
        s: '128 switches: four times as many as IPv4. Written as eight groups, each up to four characters, with colons between.',
        m: '128 bits, written as eight 16-bit groups (hextets) in hexadecimal, separated by colons. Each hex digit is exactly four bits.',
        e: '128 bits, eight 16-bit fields in hex (RFC 4291). One hex digit = one nibble = 4 bits; one hextet = 16 bits; the address = 32 nibbles.'
      }],
      ['How many', {
        s: '2 multiplied by itself 128 times: about 340 undecillion. Enough that every grain of sand on Earth could have trillions.',
        m: '2<sup>128</sup> ≈ 3.4 × 10<sup>38</sup>. IPv4\'s 2<sup>32</sup> is 4.3 billion; IPv6 has 2<sup>96</sup> times more. The size is the whole point: it lets every subnet be enormous and every device keep a real address.',
        e: '2<sup>128</sup> ≈ 3.4 × 10<sup>38</sup>. The design spends this freely: a standard subnet is a /64 (2<sup>64</sup> addresses) so that interface identifiers can be derived rather than assigned, and a home site gets a /56 or /48 so it can have hundreds or thousands of subnets.'
      }]
    ],
    oneLiner: {
      s: 'An IPv6 address is 128 switches. Hex is just a compact way to write four switches at a time, and a colon comes every sixteen.',
      m: 'An IPv6 address is 128 bits written in hexadecimal: each hex digit is four bits, each colon-separated group is sixteen. Everything on this site is arithmetic on those bits.',
      e: 'An IPv6 address is a 128-bit integer written as eight hextets of four hex digits. Prefixes, subnet IDs and interface identifiers are all nibble- and hextet-aligned slices of it.'
    },
    sections: [
      { h: 'One hex digit is four bits', p: {
        s: [
          'In IPv4 we wrote eight switches as a number from 0 to 255. IPv6 has too many switches for that, so it writes four at a time as a single character: 0 to 9, then a to f. Four switches can be set 16 ways, and there are exactly 16 of those characters.',
          'Type any address below. Each character sits over the four switches it stands for.'
        ],
        m: [
          'Hexadecimal is base 16. One hex digit stands for exactly four bits (a <b>nibble</b>): <code>0</code> is <code>0000</code>, <code>9</code> is <code>1001</code>, <code>a</code> is <code>1010</code>, <code>f</code> is <code>1111</code>. Four hex digits make sixteen bits, a <b>hextet</b> (also called a quartet or a field). Eight hextets make 128 bits. The colon is only a separator for people, exactly like the dots in IPv4.',
          'Type any address below to see each hex digit over its four bits. Hover over a bit to see its place value inside the hextet.'
        ],
        e: [
          'Base 16, 4 bits per digit, 16 bits per field, eight fields (RFC 4291 §2.2). Upper- and lower-case are equivalent; RFC 5952 mandates lower case in text. Because every boundary that matters (hextet, nibble) is a whole number of hex digits, IPv6 subnetting is usually done by counting hex digits rather than by binary arithmetic.',
          'Enter any address; hover a bit for its weight within the hextet (2<sup>15</sup> … 2<sup>0</sup>).'
        ]
      }, hexbits: { value: '2001:db8:acad:1:20c:29ff:fe4b:1fa2', edit: true }, after: {
        s: [
          'So <code>db8</code> is really <code>0db8</code>: <code>0000 1101 1011 1000</code>. The address is easier to read in hex than in 128 ones and zeros, which is the only reason hex is used.'
        ],
        m: [
          '<code>2001</code> = <code>0010 0000 0000 0001</code>. <code>0db8</code> = <code>0000 1101 1011 1000</code>. The group written <code>db8</code> is really <code>0db8</code>: leading zeros in a group may be left out, which {{row:notation}} covers. You rarely need binary in IPv6 because prefix lengths are almost always multiples of 4, so the line between network and host falls between two hex digits.'
        ],
        e: [
          '<code>2001:0db8</code> = <code>0010 0000 0000 0001 : 0000 1101 1011 1000</code>. Prefix lengths in practice are nibble-aligned (/32, /48, /56, /64) so boundaries fall between hex digits; a /10 (fe80::/10) or /7 (fc00::/7) is where you still need to look at bits, and the classifier in {{row:kinds}} shows those.'
        ]
      }},
      { h: 'The sixteen digits', p: {
        s: ['Worth knowing by heart, especially the second half: a is 10, b is 11, up to f which is 15.'],
        m: ['Hex to binary, one nibble at a time. Reading <code>f</code> as "four ones" and <code>8</code> as "one then three zeros" is the entire skill.'],
        e: ['Nibble table. Mask nibbles you will meet: <code>f</code> (4 network bits), <code>e</code> (3), <code>c</code> (2), <code>8</code> (1), <code>0</code> (0), by analogy with 255/254/252/248 in IPv4 octets.']
      }, table: [
        ['Hex', 'Binary', 'Decimal', 'Hex', 'Binary', 'Decimal'],
        ['0', '0000', '0', '8', '1000', '8'],
        ['1', '0001', '1', '9', '1001', '9'],
        ['2', '0010', '2', 'a', '1010', '10'],
        ['3', '0011', '3', 'b', '1011', '11'],
        ['4', '0100', '4', 'c', '1100', '12'],
        ['5', '0101', '5', 'd', '1101', '13'],
        ['6', '0110', '6', 'e', '1110', '14'],
        ['7', '0111', '7', 'f', '1111', '15']
      ]}
    ]
  },

  /* ------------------------------------------------------------------ notation */
  {
    id: 'notation',
    stack: 'basics',
    chip: '::',
    title: 'Writing it short',
    subtitle: 'Leading zeros, the double colon, and the one right way',
    facts: [
      ['Two rules', {
        s: 'Drop zeros at the front of any group. Replace the longest run of all-zero groups with <code>::</code>, once.',
        m: '1. Leading zeros in a hextet may be omitted. 2. One run of consecutive all-zero hextets may be replaced by <code>::</code>, and it must be the longest run (leftmost if tied).',
        e: 'RFC 5952 §4: strip leading zeros in each field; <code>::</code> replaces the longest run of two or more zero fields, leftmost on a tie, never a single zero field; lower-case hex. RFC 4291 permits more variants; 5952 picks one canonical text form.'
      }],
      ['Why it matters', {
        s: 'So that two people writing the same address write the same thing, and so it fits on a line.',
        m: 'The same address can be written many legal ways. Logs, configs and access lists compare text, so one canonical form (RFC 5952) avoids mismatches that are invisible to the eye.',
        e: 'Canonical form matters for string comparison in ACLs, certificates, logs and tooling; RFC 5952 also fixes the placement of brackets and ports (<code>[2001:db8::1]:443</code>) and the %zone suffix for link-local addresses.'
      }]
    ],
    oneLiner: {
      s: 'Most IPv6 addresses are full of zeros, so there are two rules for leaving them out, and one right way to apply them.',
      m: 'Leading zeros in a group can be dropped and one run of zero groups can become <code>::</code>. RFC 5952 fixes exactly how, so every address has a single shortest form.',
      e: 'Text representation per RFC 4291 with the RFC 5952 canonical restrictions: shortest form, longest zero run compressed, leftmost tie, no compression of a single field, lower case.'
    },
    sections: [
      { h: 'Watch an address shrink', p: {
        s: [
          'Type a long address, or press one of the examples. The steps show the zeros at the front of each group disappearing, then the longest stretch of empty groups collapsing into <code>::</code>.'
        ],
        m: [
          'Type any address or use a preset. Step 1 removes leading zeros from every hextet. Step 2 finds the longest run of all-zero hextets and replaces it with <code>::</code>. If there are two runs of equal length, the left one is compressed. A single zero hextet is written as <code>0</code>, never as <code>::</code>.'
        ],
        e: [
          'Interactive RFC 5952 canonicaliser. Step 1: §4.1, drop leading zeros. Step 2: §4.2, compress the longest run of ≥2 zero fields, leftmost tie (§4.2.3), never a lone field (§4.2.2). Case per §4.3. The expanded form is what appears on the wire; the short form is text only.'
        ]
      }, compress: { value: '2001:0db8:0000:0000:0000:ff00:0042:8329', presets: ['2001:0db8:0000:0000:0000:ff00:0042:8329', '2001:0db8:0000:0001:0000:0000:0000:0001', '2001:db8:0:0:1:0:0:1', 'fe80:0000:0000:0000:020c:29ff:fe4b:1fa2', '0000:0000:0000:0000:0000:0000:0000:0001', '2001:0db8:00ab:0000:0cd0:0000:0000:0001'] }, after: {
        s: [
          'The address on the wire is always the full 128 switches. Short forms are only for humans typing and reading.'
        ],
        m: [
          '<b>The classic traps.</b> <code>2001:db8::1:0:0:1</code>, not <code>2001:db8:0:0:1::1</code>: the runs are both two long, so the left one wins. <code>2001:db8:0:1:1:1:1:1</code> keeps its lone zero because <code>::</code> must stand for at least two groups. And <code>::</code> can appear once only, otherwise nobody could tell how many groups each one stood for.'
        ],
        e: [
          'Equal runs: <code>2001:db8:0:0:1:0:0:1</code> → <code>2001:db8::1:0:0:1</code> (leftmost). Lone zero: <code>2001:db8:0:1:1:1:1:1</code> stays. One <code>::</code> only, or the group count is ambiguous. Embedded IPv4 is allowed in the low 32 bits of the mapped and NAT64 prefixes: <code>::ffff:192.0.2.128</code> = <code>::ffff:c000:280</code>.'
        ]
      }}
    ]
  },

  /* ------------------------------------------------------------------ prefix */
  {
    id: 'prefix',
    stack: 'cidr',
    chip: '/64',
    title: 'Prefix and interface ID',
    subtitle: 'The line is almost always at 64',
    facts: [
      ['The standard split', {
        s: 'The first half (64 switches) says which network. The second half (64 switches) says which device on it. Every normal network is a /64.',
        m: '<b>Network prefix</b> = the first 64 bits: a global routing prefix from the ISP plus a subnet ID you choose. <b>Interface ID</b> = the last 64 bits, identifying one device. Subnets are /64 by convention and by requirement for SLAAC.',
        e: 'Global routing prefix (typically /48 or /56 from the ISP) + subnet ID (the bits between it and /64) + 64-bit interface identifier (RFC 4291 §2.5.4). SLAAC (RFC 4862) and EUI-64 require /64; RFC 7421 documents why the boundary is fixed.'
      }],
      ['What the ISP gives you', {
        s: 'Not one address but a whole block, usually big enough for 256 or 65,536 separate networks in your house or company.',
        m: 'A prefix, not an address: a home gets a /56 (256 subnets) or /48 (65,536 subnets); an enterprise a /48 or shorter. Each subnet is a /64. There is no NAT to save addresses.',
        e: 'RFC 6177 recommends /48 or /56 per end site (BCP 157); RIR policy gives ISPs /32 or shorter. Delegation to the CPE via DHCPv6-PD (RFC 8415). Each LAN, VLAN and point-to-point link gets its own /64 (RFC 6164 allows /127 on router links).'
      }]
    ],
    oneLiner: {
      s: 'Draw the line through the middle: the left half names the network, the right half names the device. That is nearly every IPv6 network in the world.',
      m: 'An IPv6 address is a 64-bit network prefix and a 64-bit interface identifier. Within the prefix, the ISP owns the first part and you choose the subnet ID in the rest.',
      e: 'Address = global routing prefix ∥ subnet ID ∥ 64-bit IID. Subnetting in IPv6 is choosing subnet IDs between the delegated prefix and /64; hosts are never counted.'
    },
    sections: [
      { h: 'Three parts, coloured', p: {
        s: [
          'Here is a typical address on a lab network. Blue was given to us by the internet provider. Green is the network number we chose ourselves. Pink is the device.'
        ],
        m: [
          'A host on a lab subnet. The ISP delegated <code>2001:db8:acad::/48</code> (blue: 48 bits). We picked subnet <code>0001</code> in the next 16 bits (green: the subnet ID), making the network <code>2001:db8:acad:1::/64</code>. The device fills the last 64 bits (pink: the interface ID). Every colour boundary falls on a colon, which is exactly why /48 and /64 are so common.'
        ],
        e: [
          '<code>2001:db8:acad:1:20c:29ff:fe4b:1fa2/64</code>: routing prefix 2001:db8:acad::/48 (delegated), subnet ID 0x0001 (16 bits available → 65,536 /64s), IID 020c:29ff:fe4b:1fa2 (modified EUI-64 from 00:0c:29:4b:1f:a2, see {{row:iid}}). All boundaries hextet-aligned.'
        ]
      }, anatomy: { value: '2001:db8:acad:1:20c:29ff:fe4b:1fa2', prefix: 64, site: 48, left: 'global routing prefix, delegated by the ISP', mid: 'subnet ID, chosen by you: 16 bits here, so 65,536 subnets', right: 'interface ID: one device on that subnet' }, after: {
        s: [
          'Because the line always falls at 64, IPv6 subnetting almost never asks "how many devices fit?". The answer is always "more than you can ever plug in". The question is only "how many networks do I get, and what do I number them?"'
        ],
        m: [
          '<b>The mindset change from IPv4.</b> Nobody counts hosts. A /64 holds 18 quintillion addresses whether it serves one printer or a data centre. IPv6 subnetting is entirely about the subnet ID field: how many bits the ISP left you (64 − delegated prefix length) and how you number them. {{Row:slider}} and {{row:carve}} are about exactly that.',
          'The prefix length is written after a slash, as in IPv4, and the network address has the interface ID set to all zeros: <code>2001:db8:acad:1::/64</code>. There is no broadcast address; the all-ones interface ID is an ordinary address, and "everyone" is reached with multicast <code>ff02::1</code> instead.'
        ],
        e: [
          'Host counting is irrelevant at /64; plan by subnet count. Subnet-ID bits = 64 − delegated length: /48 → 16 bits, /56 → 8, /60 → 4. No broadcast: the all-zeros IID is the subnet-router anycast (RFC 4291 §2.6.1, rarely used), the all-ones IID is a normal unicast address, and ff02::1 replaces broadcast. Longer-than-64 prefixes break SLAAC; /127 is the exception for router links (RFC 6164).'
        ]
      }}
    ]
  },

  /* ------------------------------------------------------------------ slider */
  {
    id: 'slider',
    stack: 'cidr',
    chip: 'cidr',
    title: 'The prefix slider',
    subtitle: 'Move the line, count subnets instead of hosts',
    facts: [
      ['The rule', {
        s: 'Every four steps of the slider is one hex digit. Each hex digit you keep for yourself gives you 16 times as many networks.',
        m: 'Subnets of /64 in a /p = 2<sup>(64 − p)</sup>. Every 4 bits is one hex digit: a /48 leaves 4 digits (65,536 subnets), a /56 leaves 2 (256), a /60 leaves 1 (16).',
        e: '/64s per /p = 2<sup>64−p</sup>; total addresses = 2<sup>128−p</sup>. Nibble-align allocations so each level of the plan is a whole hex digit.'
      }],
      ['Worth remembering', {
        s: '/48 = 65,536 networks. /56 = 256 networks. /64 = one network with more addresses than you can count.',
        m: '/32 ISP, /48 site (65,536 /64s), /52 (4096), /56 home (256), /60 (16), /64 one subnet (2<sup>64</sup> addresses), /127 router link, /128 one host.',
        e: '/32 LIR minimum; /48 end site; /56 residential; /64 subnet; /127 p2p; /128 loopback/host. Address count per /64 = 2<sup>64</sup> ≈ 1.8 × 10<sup>19</sup>.'
      }]
    ],
    oneLiner: {
      s: 'Slide the line and watch the number of networks change by 16 for every hex digit, while the number of devices per network stays impossibly large.',
      m: 'The prefix length sets how many bits are left between it and /64 for subnet IDs, and how many /64 subnets that gives you. Hosts are not the question.',
      e: 'Prefix length p fixes the routing prefix; 64 − p bits enumerate 2<sup>64−p</sup> /64 subnets; 128 − p bits enumerate the addresses. Nibble strip shows the hex-digit alignment.'
    },
    sections: [
      { h: 'Drag it', p: {
        s: [
          'Drag from <code>/32</code> to <code>/128</code>. Each hex character in the strip below turns green when it is yours to number networks with, pink when it belongs to devices.'
        ],
        m: [
          'Drag the slider (arrow keys work too). The 32 hex digits underneath show the line moving one nibble at a time: blue is the routing prefix, green is the subnet ID (the bits between the prefix and /64), pink is the interface ID. Stop at /48, /56 and /64, the three you will meet most.'
        ],
        e: [
          'Sweep p from 32 to 128 on <code>2001:db8:acad::</code>. Tiles report /64 count (2<sup>64−p</sup>), address count (2<sup>128−p</sup>), mask, network and last address from <code>ipv6.js</code>. Past /64 the subnet-ID field is gone and you are cutting into the IID; SLAAC stops working, which the caption notes.'
        ]
      }, cidr: { value: '2001:db8:acad::', min: 32, max: 128, start: 48, caption: {
        s: '<b>/{p}</b> keeps {p} switches for the network. {subtext} Every network still has 2<sup>64</sup> addresses for devices, which is more than the number of grains of sand on Earth.',
        m: '<b>/{p}</b>: {subtext} The block runs from <code>{net}</code> to <code>{last}</code>, mask <code>{mask}</code>. {slaac}',
        e: '<b>/{p}</b>: {subtext} Range <code>{net}</code> – <code>{last}</code>; 2<sup>{hb}</sup> addresses; next block <code>{next}</code>. {slaac}'
      } }, after: {
        s: [
          'Stop at <code>/48</code>: four green characters, so 16 × 16 × 16 × 16 = 65,536 networks. Move to <code>/56</code>: two green characters, 256 networks. That is the whole difference between a company allocation and a home one.'
        ],
        m: [
          '<code>/48</code> leaves a 16-bit subnet ID: four hex digits, 65,536 /64s. <code>/56</code> leaves 8 bits: two hex digits, 256 /64s. <code>/60</code> leaves one digit: 16 /64s. Because the ISP\'s prefix and your subnets both end on hex digits, you can read the subnet number straight out of the address: in <code>2001:db8:acad:<b>1a</b>::/64</code> under a /48, the subnet ID is <code>001a</code>.',
          'Past <code>/64</code> the slider is cutting into the interface ID. Routers can do it (a /127 between two routers is standard), but hosts that configure themselves with SLAAC need a full /64, so LANs stay at /64.'
        ],
        e: [
          '/48 → 2<sup>16</sup> /64s (4 nibbles); /52 → 2<sup>12</sup> (3); /56 → 2<sup>8</sup> (2); /60 → 2<sup>4</sup> (1); /64 → 1. Read the subnet ID as the hex digits between the delegated prefix and the fourth colon. Beyond /64 you consume IID bits: legal for /127 p2p (RFC 6164) and /128 loopbacks; SLAAC requires the IID to be 64 bits (RFC 4862 §5.5.3, RFC 7421).'
        ]
      }}
    ]
  },

  /* ------------------------------------------------------------------ carve */
  {
    id: 'carve',
    stack: 'cidr',
    chip: 'split',
    title: 'Splitting a prefix',
    subtitle: 'A /48 into /52s, /56s or /64s, by counting in hex',
    facts: [
      ['How many pieces', {
        s: 'Each hex digit you spend is 16 pieces. Two digits, 256 pieces. Four digits, 65 536.',
        m: 'Borrow <i>b</i> bits and you get 2<sup><i>b</i></sup> subnets. Borrow whole hex digits (4, 8, 12, 16 bits) and the subnet IDs are just counting in hex: 0, 1, 2 … f, 10, 11 …',
        e: 'Child prefix c from parent p gives 2<sup>c−p</sup> subnets. Nibble-aligned borrowing (c − p ≡ 0 mod 4) keeps every subnet ID an integer number of hex digits, which is the entire trick of readable IPv6 plans.'
      }],
      ['Where they start', {
        s: 'The pieces are numbered in order: the first is ...:0::, the second ...:1::, up to ...:f:: and then ...:10::.',
        m: 'Subnet <i>k</i> = parent network + <i>k</i> × 2<sup>128−c</sup>. With nibble alignment that is simply the subnet ID written in hex in the right position.',
        e: 'Network(k) = parent | (k << (128 − c)). Subnet ID field = bits [p, c). Hierarchical plans typically reserve digits per site / building / VLAN so that the address reads like a path.'
      }]
    ],
    oneLiner: {
      s: 'Take the block your provider gave you and number the networks inside it. In IPv6 that is counting in hex, nothing more.',
      m: 'Subnetting an IPv6 prefix means choosing subnet IDs in the bits between the delegated prefix and /64. When you borrow whole hex digits, the subnet IDs are just hex numbers in order.',
      e: 'Fixed-length subnetting of a delegated prefix: 2<sup>c−p</sup> children at stride 2<sup>128−c</sup>. Nibble alignment makes the plan legible; further splitting of children is the same operation recursively.'
    },
    sections: [
      { h: 'Pick a parent and a child size', p: {
        s: [
          'Choose the block on the left and how small to cut it on the right. The table lists each piece with its number. Try /48 into /64: the fourth group counts up from 0.'
        ],
        m: [
          'Choose the delegated prefix (the parent) and the prefix to cut it into (the child). The table lists each subnet with its subnet ID, network address and range. Try /48 into /52 (one digit, 16 pieces), /48 into /56 (two digits, 256 pieces) and /48 into /64 (four digits, 65,536 pieces, the first 64 shown).'
        ],
        e: [
          'Select parent and child prefixes; the table enumerates children with subnet ID, network, first assignable address (::1, since ::0 is the subnet-router anycast) and last address. Non-nibble-aligned children (e.g. /50) are allowed and show why they are avoided: IDs no longer map to whole digits.'
        ]
      }, split: { value: '2001:db8:acad::', parent: 48, child: 52 }, after: {
        s: [
          'Nobody works out how many devices fit. Every piece, however small the block, is still a /64 with more addresses than anyone could use.'
        ],
        m: [
          '<b>A typical plan.</b> With a /48, many organisations spend the four subnet digits as a path: first digit = site or building, second = floor or department, last two = VLAN. <code>2001:db8:acad:<b>2</b><b>1</b><b>0a</b>::/64</code> reads as site 2, floor 1, VLAN 0a. Because there are 65,536 subnets, wasting most of them costs nothing. Compare IPv4, where every bit borrowed for subnets was a bit stolen from hosts.',
          'Home routers usually receive a /56 and hand out /64s to each of their LANs (main, guest, IoT) by counting the last two digits of the subnet ID.'
        ],
        e: [
          'Plan by hierarchy, not by count: reserve nibbles per level (site / building / function / VLAN) and leave spares. Hosts per /64 are never a constraint. Point-to-point router links: allocate a /64 per link and configure /127 within it (RFC 6164). Residential: /56 delegated via DHCPv6-PD, CPE assigns /64 per LAN. Avoid /48 boundaries that do not align to the RIR allocation to keep aggregation clean.'
        ]
      }}
    ]
  },

  /* ------------------------------------------------------------------ kinds */
  {
    id: 'kinds',
    stack: 'kinds',
    chip: 'kind',
    title: 'Kinds of address',
    subtitle: 'Global, unique local, link-local, multicast and the rest',
    facts: [
      ['The four you see daily', {
        s: '<code>2…</code> or <code>3…</code>: a real internet address. <code>fe80…</code>: talks to neighbours only. <code>fd…</code>: private, like 10.x.x.x. <code>ff…</code>: a group, not one device.',
        m: '<b>Global unicast</b> 2000::/3 (internet). <b>Link-local</b> fe80::/10 (every interface has one, never routed). <b>Unique local</b> fc00::/7, in practice fd00::/8 (the IPv6 "private"). <b>Multicast</b> ff00::/8 (replaces broadcast).',
        e: 'GUA 2000::/3 (RFC 4291); LLA fe80::/10, mandatory per interface, scope = link, needs %zone in text; ULA fc00::/7 with L=1 → fd00::/8, 40-bit random global ID (RFC 4193); multicast ff00::/8 with flag and scope nibbles (RFC 4291 §2.7).'
      }],
      ['Every interface has several', {
        s: 'One device usually has a link-local address, one or more internet addresses, and belongs to a few groups. That is normal, not a mistake.',
        m: 'An interface always has a link-local address, usually one or more global addresses (a stable one and temporary privacy ones), and joins ff02::1 plus a solicited-node group per address. <code>ip -6 addr</code> showing five addresses is normal.',
        e: 'Per interface: LLA (required), GUA(s) via SLAAC and/or DHCPv6, possibly ULA, temporary addresses (RFC 8981), plus multicast memberships: ff02::1, ff01::1, solicited-node ff02::1:ffxx:xxxx per unicast address, ff02::2 on routers.'
      }]
    ],
    oneLiner: {
      s: 'You can tell what an IPv6 address is for from its first few characters. This row is the list.',
      m: 'IPv6 addresses are typed by prefix: global, unique local, link-local, multicast, loopback and a few special-purpose blocks. The first hextet tells you which.',
      e: 'Address scope and type are encoded in the leading bits (RFC 4291 §2.4, IANA special-purpose registry per RFC 6890). Knowing the first hextet is the whole diagnosis.'
    },
    sections: [
      { h: 'The ranges', p: {
        s: ['Here they are, with what each one means when you see it on a device.'],
        m: ['The ranges every technician should recognise. The multicast row has a small table of its own below.'],
        e: ['Per RFC 4291 and the IANA IPv6 Special-Purpose Address Registry (RFC 6890), plus the well-known multicast groups.']
      }, tableClass: 'compare prose', table: {
        s: [
          ['Starts with', 'Name', 'What it means'],
          ['2 or 3', 'Global', 'A real internet address. Yours comes from your provider.'],
          ['fe80', 'Link-local', 'For talking to neighbours on the same cable or Wi-Fi only. Every device makes one for itself, no server needed.'],
          ['fd (or fc)', 'Unique local', 'Private, like 192.168 in IPv4. Not on the internet.'],
          ['ff', 'Multicast', 'A group. ff02::1 is "everyone here"; ff02::2 is "every router here".'],
          ['::1', 'Loopback', 'This computer talking to itself, like 127.0.0.1.'],
          ['::', 'Nothing yet', 'No address, like 0.0.0.0.'],
          ['2001:db8', 'Examples', 'Reserved for books and manuals, including this site.'],
          ['::ffff:', 'Wrapped IPv4', 'An IPv4 address written inside an IPv6 one, so programs can use one format for both.']
        ],
        m: [
          ['Prefix', 'Name', 'What it is for', 'Seen when'],
          ['2000::/3', 'Global unicast (GUA)', 'Internet-routable. Allocated IANA → RIR → ISP → you. First hextet 2000 to 3fff.', 'Every internet-connected interface; <code>2001:</code>, <code>2600:</code>, <code>2a00:</code> …'],
          ['fe80::/10', 'Link-local (LLA)', 'Auto-configured on every interface, valid only on that link, never forwarded. Used by Neighbor Discovery, router advertisements, and as the next hop in routing tables.', '<code>fe80::…</code> on every device; default gateway shown as a link-local address; written with <code>%eth0</code> to say which link.'],
          ['fc00::/7 (use fd00::/8)', 'Unique local (ULA)', 'The IPv6 private range. fd + 40 random bits + subnet ID. Not routed on the internet; no NAT intended, but used alongside global addresses.', 'Internal-only networks, labs, home networks whose ISP has no IPv6.'],
          ['ff00::/8', 'Multicast', 'One packet to a group. The second hextet\'s last digit is the scope: 1 interface, 2 link, 5 site, e global. Replaces broadcast entirely.', 'ff02::1 all nodes, ff02::2 all routers, ff02::1:ffxx:xxxx solicited-node (address resolution), ff02::fb mDNS, ff02::1:2 DHCPv6.'],
          ['::1/128', 'Loopback', 'The host itself. One address, not a whole /8 as in IPv4.', '<code>ping ::1</code>, local services.'],
          ['::/128', 'Unspecified', '"No address yet." Source of the first Duplicate Address Detection probe. Never a destination.', 'DAD, and <code>::/0</code> as the default route.'],
          ['::ffff:0:0/96', 'IPv4-mapped', 'An IPv4 address carried in the last 32 bits, written <code>::ffff:192.0.2.1</code>. Used inside dual-stack software, not on the wire.', '<code>netstat</code> on a dual-stack server showing IPv4 clients as ::ffff:….'],
          ['2001:db8::/32', 'Documentation', 'Reserved for examples. Every address on this site is in it.', 'Books, RFCs, this site. Never on a live network.'],
          ['64:ff9b::/96', 'NAT64', 'IPv4 addresses reached from an IPv6-only network through a translator.', 'IPv6-only mobile and enterprise networks (with DNS64).'],
          ['2002::/16, 2001::/32', 'Tunnels (6to4, Teredo)', 'Legacy transition mechanisms carrying IPv6 inside IPv4. 6to4 is deprecated.', 'Old Windows machines, old routers.'],
          ['fec0::/10', 'Site-local (deprecated)', 'The pre-2004 private range, replaced by ULA.', 'Old documentation, old DNS resolver defaults on Windows.']
        ],
        e: [
          ['Prefix', 'Name', 'RFC', 'Scope / forwarded', 'Notes'],
          ['2000::/3', 'Global unicast', '4291, 3587', 'global, yes', 'Currently allocated from 2000::/3 only; other /3s reserved. First hextet 2xxx or 3xxx.'],
          ['fe80::/10', 'Link-local unicast', '4291 §2.5.6', 'link, never', 'Required on every IPv6 interface; fe80::/64 in practice (bits 10–63 zero). NDP, RA, OSPFv3 and BGP next hops use it. Zone index (%ifname) disambiguates.'],
          ['fc00::/7', 'Unique local', '4193', 'site/org, not globally', 'L bit =1 → fd00::/8; 40-bit pseudo-random global ID gives collision-resistant private space. fc00::/8 (L=0) is not defined. Filter at borders.'],
          ['ff00::/8', 'Multicast', '4291 §2.7, 7346', 'per scope nibble', 'ff F S ::… flags (0=well-known, 1=transient, 3=prefix-based RFC 3306, 7=embedded-RP RFC 3956), scope 1 interface, 2 link, 3 realm, 4 admin, 5 site, 8 org, e global. Maps to MAC 33:33:xx:xx:xx:xx (low 32 bits).'],
          ['::1/128', 'Loopback', '4291 §2.5.3', 'node', 'Single address. Packets to ::1 must never leave the node.'],
          ['::/128', 'Unspecified', '4291 §2.5.2', 'source only', 'DAD NS source; INADDR6_ANY in bind(); ::/0 default route.'],
          ['::ffff:0:0/96', 'IPv4-mapped', '4291 §2.5.5.2', 'API only', 'Dual-stack sockets present v4 peers this way; must not appear on the wire (RFC 4038). ::/96 IPv4-compatible is deprecated.'],
          ['64:ff9b::/96', 'NAT64 WKP', '6052, 6146', 'global via translator', 'DNS64 synthesises AAAA; the low 32 bits carry the IPv4 address. 64:ff9b:1::/48 for local-use NAT64 (RFC 8215).'],
          ['2001:db8::/32', 'Documentation', '3849', 'none', 'Also 3fff::/20 (RFC 9637). Filter and never assign.'],
          ['2001::/32', 'Teredo', '4380', 'via relay', 'IPv6 over UDP/IPv4 through NATs. Encodes server, flags, obfuscated client port and address.'],
          ['2002::/16', '6to4', '3056, deprecated 7526', 'via relay', '2002:V4ADDR::/48 embeds the IPv4 address. Anycast relays 192.88.99.0/24 withdrawn.'],
          ['100::/64', 'Discard-only', '6666', 'blackhole', 'Remote-triggered black hole routing.'],
          ['fec0::/10', 'Site-local', '3879 (deprecated)', 'none', 'Ambiguity across sites killed it; ULA replaced it.']
        ]
      }},
      { h: 'Multicast, the addresses that replaced broadcast', p: {
        s: ['IPv6 has no broadcast. When a device needs "everyone", it uses one of these group addresses instead.'],
        m: ['There is no broadcast in IPv6. These well-known groups do the jobs broadcast did in IPv4, and the scope digit (the fourth hex digit) says how far they reach.'],
        e: ['Well-known link-scope groups (ff02::/16) and their IPv4 analogues. All map to Ethernet 33:33:xx:xx:xx:xx; switches with MLD snooping prune them.']
      }, table: [
        ['Address', 'Group', 'IPv4 equivalent'],
        ['ff02::1', 'All nodes on the link', '255.255.255.255 / the subnet broadcast'],
        ['ff02::2', 'All routers on the link', '224.0.0.2'],
        ['ff02::1:ffxx:xxxx', 'Solicited-node (last 24 bits of a unicast address). Used instead of an ARP broadcast, see {{row:iid}}', 'ARP broadcast ff:ff:ff:ff:ff:ff'],
        ['ff02::5, ff02::6', 'OSPFv3 all SPF routers, designated routers', '224.0.0.5, 224.0.0.6'],
        ['ff02::fb', 'mDNS (Bonjour, Avahi)', '224.0.0.251'],
        ['ff02::1:2', 'All DHCPv6 relay agents and servers', '255.255.255.255 (DHCP Discover)'],
        ['ff05::1:3', 'All DHCPv6 servers, site scope', '—'],
        ['ff0e::…', 'Global-scope groups', '224.0.1.0 and up']
      ]},
      { h: 'Try one', p: {
        s: ['Type an address or press a button to see what kind it is.'],
        m: ['Classify an address. For multicast the scope is decoded too.'],
        e: ['Most-specific-first lookup over the ranges in <code>ipv6.js</code>; multicast flags and scope nibbles decoded.']
      }, classify: { presets: ['2001:db8:acad:1::10', '2600:1f18:4e2:6b00::1', 'fe80::20c:29ff:fe4b:1fa2', 'fd12:3456:789a:1::1', 'ff02::1', 'ff02::1:ff4b:1fa2', 'ff05::1:3', '::1', '::', '::ffff:192.0.2.128', '64:ff9b::198.51.100.7', '2002:c000:204::1', 'fec0::1'] } }
    ]
  },

  /* ------------------------------------------------------------------ iid */
  {
    id: 'iid',
    stack: 'kinds',
    chip: 'EUI-64',
    title: 'Interface IDs and SLAAC',
    subtitle: 'How a device makes its own address from its MAC, and why it often does not',
    facts: [
      ['EUI-64 in one line', {
        s: 'Cut the 6-byte MAC address in half, push <code>ff:fe</code> into the middle to make 8 bytes, and flip one switch in the first byte.',
        m: 'Split the 48-bit MAC into two 24-bit halves, insert <code>ff:fe</code> between them, and invert bit 7 of the first byte (the universal/local bit). The result is a 64-bit interface ID.',
        e: 'Modified EUI-64 (RFC 4291 App. A): OUI ∥ 0xfffe ∥ NIC, with the U/L bit (bit 7 of octet 0, 0x02) inverted so that universally administered MACs give IIDs with the bit set. Prepend fe80::/64 for the LLA or any on-link /64 for a GUA.'
      }],
      ['Why you rarely see it now', {
        s: 'An address built from your MAC follows you from network to network, which is a privacy problem. Modern devices make up random ones instead.',
        m: 'A MAC-derived IID is the same on every network the device joins, so it can be tracked. Windows, Android, iOS and modern Linux use random stable IDs (RFC 7217) plus temporary addresses (RFC 8981) that change daily. EUI-64 still appears on routers, servers and some IoT devices, and in every exam.',
        e: 'RFC 7217 stable-privacy IIDs (hash of prefix, interface, secret) replace EUI-64 as the default in most stacks (RFC 8064); RFC 8981 temporary addresses rotate for outbound connections. EUI-64 remains common on network gear (Cisco <code>ipv6 address … eui-64</code>) and in certification material.'
      }]
    ],
    oneLiner: {
      s: 'A device can build its own IPv6 address with no server: it hears the network number from the router and adds its own second half.',
      m: 'With SLAAC a host learns the /64 prefix from a router advertisement and appends an interface ID it makes itself: from its MAC (EUI-64) or, more often now, at random.',
      e: 'SLAAC (RFC 4862): RA supplies the on-link /64 and flags; the host forms the IID (EUI-64, RFC 7217 or temporary), runs DAD via the solicited-node group, and configures the address. DHCPv6 is the alternative or complement (M/O flags).'
    },
    sections: [
      { h: 'From MAC to address', p: {
        s: ['Type any MAC address. The steps show it being stretched to 8 bytes and one switch being flipped, then the finished addresses.'],
        m: ['Type any MAC address. The steps below split it, insert <code>ff:fe</code>, flip the U/L bit, and then show the link-local address, a global address on the lab prefix, and the solicited-node multicast group that goes with it.'],
        e: ['Modified EUI-64 derivation step by step, then the LLA (fe80::/64 ∥ IID), a GUA on 2001:db8:acad:1::/64, the solicited-node group ff02::1:ffXX:XXXX (low 24 bits) and its 33:33 Ethernet mapping.']
      }, eui64: { mac: '00:0c:29:4b:1f:a2', prefix: '2001:db8:acad:1::' }, after: {
        s: [
          'The last three characters of the MAC end up as the last part of the solicited-node group. When a neighbour wants your MAC, it sends to that group instead of shouting to everyone, so only you (and any unlucky device whose address ends the same way) has to listen.'
        ],
        m: [
          '<b>Why the solicited-node address exists.</b> IPv4 finds a neighbour\'s MAC by broadcasting an ARP request that every host must process. IPv6 sends a Neighbor Solicitation to <code>ff02::1:ff</code> + the last 24 bits of the target address. Only hosts whose addresses end in those 24 bits have joined that group, so almost nobody else is interrupted. The switch can even filter it by the matching <code>33:33:ff:xx:xx:xx</code> MAC.',
          '<b>SLAAC, step by step.</b> 1. The host makes a link-local address and checks nobody else has it (Duplicate Address Detection: a Neighbor Solicitation from <code>::</code> to the solicited-node group). 2. It sends a Router Solicitation to <code>ff02::2</code>. 3. The router answers with a Router Advertisement carrying the /64 prefix. 4. The host appends its interface ID, runs DAD again, and is online. No DHCP server needed; DHCPv6 is used only if the RA says so (M flag) or to hand out extras like DNS (O flag, though RAs can carry DNS too, RFC 8106).'
        ],
        e: [
          'Address resolution: NS to the solicited-node group (ff02::1:ff00:0/104 ∥ low 24 bits), Ethernet 33:33:ff:xx:xx:xx; MLD snooping limits delivery. Reply NA unicast. DAD: NS from :: for the tentative address; any NA means collision.',
          'SLAAC sequence: LLA + DAD → RS to ff02::2 → RA (prefix option with A flag, on-link L flag, M/O flags, RDNSS) → IID formation (EUI-64 / RFC 7217 / RFC 8981) → DAD → configured. M=1: stateful DHCPv6 for addresses; O=1: DHCPv6 for other config only. Android does not implement DHCPv6, so RDNSS in the RA is the portable way to supply DNS.'
        ]
      }}
    ]
  },

  /* ------------------------------------------------------------------ practice */
  {
    id: 'practice',
    stack: 'practice',
    chip: 'quiz',
    title: 'Try it yourself',
    subtitle: 'Random questions, checked as you go',
    facts: [
      ['Question types', {
        s: 'Shorten an address, write one out in full, count networks, find a subnet\'s address, name the kind of address, or build a link-local address from a MAC.',
        m: 'Compress (RFC 5952), expand, count /64s in a prefix, find the network for a subnet ID, classify an address, derive an EUI-64 link-local address, and find a host\'s network address.',
        e: 'Canonicalisation, expansion, 2<sup>c−p</sup> counts, subnet-ID placement, classification by prefix, modified EUI-64, and prefix masking at /48 to /64.'
      }],
      ['Difficulty', {
        s: 'Easy keeps to /48 and /64 and the friendliest addresses. Hard mixes in odd prefix lengths and trickier zero runs.',
        m: 'Easy: /48 sites, /64 subnets, one zero run. Medium: /52 to /60 boundaries, lone zero groups. Hard: /44 to /60 parents, equal-length zero runs, all address kinds.',
        e: 'Easy: nibble-aligned, single run. Medium: mixed child lengths, distractor zero fields. Hard: arbitrary nibble-aligned parents, tie-breaking runs, full kind set including mapped and NAT64.'
      }]
    ],
    oneLiner: {
      s: 'Practice until reading a /48 and writing its 65,536 subnets is as automatic as 192.168.1.0/24.',
      m: 'Random IPv6 addressing questions of the seven kinds that appear in networking exams, with the working shown after each answer.',
      e: 'Generated drill over canonical form, subnet arithmetic, classification and EUI-64, with derivations on demand.'
    },
    sections: [
      { h: 'Questions', p: {
        s: ['Pick a kind and a difficulty, type your answer and press Enter. Any correct spelling of an address counts, except for "shorten", where only the shortest form is right.'],
        m: ['Choose a question type and difficulty, type your answer and press Enter or Check. Addresses are accepted in any valid spelling except for the compress questions, which require the RFC 5952 form, and the expand questions, which require all eight four-digit groups. Your score is kept for this browser tab.'],
        e: ['Answers: any valid text form for ip6 fields; RFC 5952 exact for compress; 8 × 4 hex digits for expand; lenient words for kinds. Score persists per tab (sessionStorage).']
      }, quiz: { kinds: ['compress', 'expand', 'subnets', 'kth', 'kind', 'linklocal', 'network'] } },
      { h: 'Worked example: subnet 1a of 2001:db8:acad::/48', p: {
        s: [
          '<b>Step 1.</b> The provider\'s part is <code>2001:db8:acad</code>, three groups, 48 switches.',
          '<b>Step 2.</b> The fourth group is ours to number networks with: 4 hex characters, 65,536 networks.',
          '<b>Step 3.</b> Network number 1a goes in that fourth group: <code>2001:db8:acad:1a::/64</code>. (The zeros in front of 1a are dropped.)',
          '<b>Step 4.</b> A device on it might be <code>2001:db8:acad:1a:20c:29ff:fe4b:1fa2</code>: same first four groups, its own last four.'
        ],
        m: [
          '<b>Delegated prefix.</b> <code>2001:db8:acad::/48</code>: 48 bits = 3 hextets = 12 hex digits fixed.',
          '<b>Subnet ID field.</b> Bits 48 to 63 = the fourth hextet = 4 hex digits = 2<sup>16</sup> = 65,536 /64s.',
          '<b>Subnet 0x001a.</b> Write it in the fourth hextet: <code>2001:db8:acad:001a::/64</code>, canonically <code>2001:db8:acad:1a::/64</code>. Range <code>2001:db8:acad:1a::</code> to <code>2001:db8:acad:1a:ffff:ffff:ffff:ffff</code>.',
          '<b>A host.</b> MAC 00:0c:29:4b:1f:a2 → IID 020c:29ff:fe4b:1fa2 → <code>2001:db8:acad:1a:20c:29ff:fe4b:1fa2</code>. Its network address: zero the last four hextets.'
        ],
        e: [
          '2001:db8:acad::/48 → subnet-ID bits [48,64), 2<sup>16</sup> children. ID 0x001a → 2001:0db8:acad:001a::/64 → 2001:db8:acad:1a::/64. Last = …:1a:ffff:ffff:ffff:ffff. IID from 00:0c:29:4b:1f:a2: 00→02 (U/L flip), insert fffe → 020c:29ff:fe4b:1fa2. Solicited-node ff02::1:ff4b:1fa2, MAC 33:33:ff:4b:1f:a2.'
        ]
      }}
    ]
  }
];
