# IPv6 Subnetting

Part of the Packet Lessons family, in the same shell as [IPv4 Subnetting](https://github.com/ProfessorCam/ipv4)
and [Frames & Packets](https://github.com/ProfessorCam/frames). Students click a row in the left column and
get, in the right column, a plain-English lesson with a live widget in it. Every address on the site is
computed in the browser from what the student types; nothing is a lookup table.

Rows, grouped in the sidebar: **Hex and hextets** (an address as 32 hex digits over their bits), **Writing it
short** (RFC 5952 compression, step by step), **Prefix and interface ID** (the /64 line: routing prefix,
subnet ID, interface ID, in colour), **The prefix slider** (drag from /32 to /128 and watch the number of
/64s change by 16 per hex digit), **Splitting a prefix** (a /48 into /52s, /56s or /64s, every subnet ID
listed in hex), **Kinds of address** (global, unique local, link-local, multicast and the special blocks,
with a classifier), **Interface IDs and SLAAC** (MAC to EUI-64 to link-local, global and solicited-node
addresses) and **Try it yourself** (random questions of seven kinds, checked as you go, with the working
shown). Every row ends with **Check your understanding**: three questions on that row's topic, generated
with fresh numbers each time.

No frameworks, no build step: plain HTML, CSS and JavaScript. Published to GitHub Pages at
<https://professorcam.github.io/ipv6/> by `.github/workflows/pages.yml` on every push to `main`.

## Run it

Nothing on this site needs a server, so `site/index.html` opens straight from disk. To serve it:

```sh
docker compose up -d --build
```

Then open <http://127.0.0.1:8083>. Stop it with `docker compose down`. Or, from Docker Hub, in the foreground
(Ctrl+C stops and removes it):

```sh
docker run --rm -it --name ipv6 -p 8083:8083 professorcryan/ipv6
```

## Reading level and theme

The buttons at the top right switch every explanation between **Simple**, **Moderate** (the default) and
**Engineer**. The choice is stored in the browser, and `?level=simple` (or `moderate`, `engineer`) on the URL
opens the site at that level. The mechanism is `site/level.js`, identical on every Packet Lessons site; in
`site/lessons.js` any piece of prose can be a plain string or an object with `s`, `m` and `e` keys.

The site opens in dark mode. The sun/moon button switches to light; `?theme=light` or `?theme=dark` overrides
for a visit. The dark palette is a block of `[data-theme="dark"]` overrides at the end of `site/style.css`.

The lesson list can be hidden with the button at the top left of the page, leaving the rail and the lesson.
The choice is remembered in the browser.

## Layout

```
Dockerfile           nginx:alpine + the site directory
docker-compose.yml   one service, port 8083
nginx.conf           serves site/
site/
  index.html         page shell: left <nav>, right <main>
  style.css          the shared Packet Lessons theme, the IPv4 widget styles, then the IPv6 pieces
  app.js             builds the nav, renders a lesson, draws and wires the widgets
  lessons.js         ALL teaching content lives here, one object per row
  level.js           the Simple | Moderate | Engineer toggle and the lv() text resolver
  ipv6.js            the arithmetic: parsing, RFC 5952, prefixes, classification, EUI-64, question generator
  checks.js          the "Check your understanding" generators, one per row, and their grader
```

## The maths

`site/ipv6.js` has no DOM in it and is loaded by node as well as the browser, so it can be tested:

```sh
node -e "var I=require('./site/ipv6.js'); console.log(I.compress(I.parse('2001:0db8:0000:0000:0000:0000:0000:0001')), I.subnetCount(48,64).number)"
# 2001:db8::1 65536
```

Addresses are BigInts. `compress()` follows RFC 5952 (longest zero run, leftmost on a tie, never a single
group, lower case). `classify()` walks the special-purpose ranges most-specific first and decodes multicast
scope. `eui64()` returns every intermediate step so the page can show them. Quiz answers accept any valid
spelling of an address except where the question asks for the shortest or the full form.

## Adding a row

Append an object to `LESSONS` in `site/lessons.js`; the comment at the top lists every key and widget. Add a
generator under the row's id in `site/checks.js` to give it a "Check your understanding" box.
