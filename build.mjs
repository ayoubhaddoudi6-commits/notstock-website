// Builds the Not Stock website into ./_site (plain HTML, no dependencies).
// The legal pages come from data/legal.json, which is exported from the app's own legal texts
// (scripts/website/export-legal.mjs in the app repo), so the website and the app always match.
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '_site');
const ORIGIN = 'https://notstock.app';
const legal = JSON.parse(readFileSync(join(here, 'data/legal.json'), 'utf8'));
const C = legal.company;
const YEAR = new Date().getFullYear();

// Legal doc key in the app -> URL on the website.
const SLUG = { privacy: 'privacy', terms: 'terms', subscription: 'subscriptions', guidelines: 'guidelines', storage: 'cookies', safety: 'safety', licences: 'licences' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const linkify = (s) =>
  esc(s)
    .replace(/([a-z0-9._-]+@notstock\.app)/gi, '<a href="mailto:$1">$1</a>')
    .replace(/\b(openstreetmap\.org\/copyright|opendata\.ndw\.nu|opendata\.rdw\.nl)\b/g, '<a href="https://$1" rel="noopener">$1</a>');
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---------- Icons (simple line icons) ----------
const ICON = {
  warning: '<path d="M12 3 2 20.5h20L12 3z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.3" r=".4"/>',
  radio: '<rect x="7" y="7" width="10" height="14" rx="2"/><path d="M9 7V2.5"/><path d="M10 11h4M10 14h4M10 17h4"/>',
  people: '<circle cx="12" cy="8" r="3"/><path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="4.8" cy="10" r="2"/><circle cx="19.2" cy="10" r="2"/>',
  car: '<path d="M3 17v-4l2.2-5.2A2 2 0 0 1 7 6.5h10a2 2 0 0 1 1.8 1.3L21 13v4"/><path d="M3 17h18v2H3z"/><circle cx="7" cy="14" r="1"/><circle cx="17" cy="14" r="1"/><path d="M3 13h18"/>',
  gauge: '<path d="M3.5 17.5a8.5 8.5 0 1 1 17 0"/><path d="M12 17.5l4.2-6"/><circle cx="12" cy="17.5" r="1.2"/>',
  tag: '<path d="M3 12.2V4h8.2L21 13.8 13.8 21 3 12.2z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  camera: '<rect x="3" y="7" width="18" height="12" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 7l1.5-3h5L16 7"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L3.5 17.5a1.8 1.8 0 0 0 2.5 2.5l6-6a4 4 0 0 0 5.2-5.2l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6z"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5z"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9.5"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  heart: '<path d="M12 20s-7.5-4.6-9-9.5C2 7 4.3 4.5 7.2 4.5c2 0 3.6 1.2 4.8 3 1.2-1.8 2.8-3 4.8-3 2.9 0 5.2 2.5 4.2 6-1.5 4.9-9 9.5-9 9.5z"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
};
const icon = (k) =>
  `<div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg></div>`;

// ---------- Layout ----------
function page({ path, title, description, body, nav }) {
  const depth = path.split('/').filter(Boolean).length;
  const r = depth ? '../'.repeat(depth) : './';
  const fullTitle = path === '/' ? title : `${title} · Not Stock`;
  const link = (href, label, key, cls = '') =>
    `<a href="${r}${href}"${cls ? ` class="${cls}"` : ''}${nav === key ? ' aria-current="page"' : ''}>${label}</a>`;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#0a0b0d">
<link rel="canonical" href="${ORIGIN}${path}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Not Stock">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${ORIGIN}${path}">
<meta property="og:image" content="${ORIGIN}/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" sizes="32x32" href="${r}assets/favicon-32.png">
<link rel="apple-touch-icon" href="${r}assets/apple-touch-icon.png">
<link rel="stylesheet" href="${r}assets/site.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top"><div class="wrap">
  <a class="brand" href="${r}" aria-label="Not Stock home"><img src="${r}assets/logo.svg" alt="" width="64" height="38"><span class="word">Not <b>Stock</b></span></a>
  <nav class="nav" aria-label="Main">
    <a href="${r}#market">Market</a>
    ${link('creators/', 'Creators', 'creators', 'hide-sm')}
    ${link('support/', 'Support', 'support')}
    ${link('legal/', 'Legal', 'legal')}
  </nav>
</div></header>
<main id="main">
${body}
</main>
<footer><div class="wrap">
  <div class="foot">
    <div>
      <a class="brand" href="${r}"><img src="${r}assets/logo.svg" alt="" width="64" height="38"><span class="word">Not <b>Stock</b></span></a>
      <p>The app for drivers whose car isn't stock. Made in the Netherlands.</p>
    </div>
    <div>
      <h4>Help</h4>
      ${link('support/', 'Support & FAQ')}
      ${link('delete-account/', 'Delete your account')}
      ${link('creators/', 'Creators')}
      ${link('contact/', 'Contact & imprint')}
    </div>
    <div>
      <h4>Legal</h4>
      ${link('privacy/', 'Privacy Policy')}
      ${link('terms/', 'Terms of Use')}
      ${link('subscriptions/', 'Subscription terms')}
      ${link('guidelines/', 'Community Guidelines')}
      ${link('cookies/', 'Cookies & storage')}
    </div>
  </div>
  <p class="fine">© ${YEAR} Not Stock · ${esc(C.name)} · KvK ${esc(C.kvk)} · ${esc(C.address)}<br>
  Not Stock is not affiliated with any car brand. Always follow the law and the road signs where you drive.</p>
</div></footer>
</body>
</html>
`;
  const dir = join(OUT, path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  return html;
}

// ---------- Pages ----------
const MARKET = [
  ['wrench', 'The full build sheet', 'Every mod with brand, date, mileage and what it cost. Buyers see exactly what’s in the car and how much went into it, so a good build gets the price it deserves.'],
  ['filter', 'Search like a car guy', 'Filter on tune stage, horsepower, documented builds and money spent on mods. Plus everything you’d expect: make, model, engine, price, year, km, gearbox and distance.'],
  ['check', 'History you can check', 'Service history straight from the seller’s garage and the RDW odometer verdict on the number plate. Fewer surprises, more trust.'],
  ['tag', 'Offers in the app', 'Make an offer with a message about the build, or contact the seller directly. Sellers mark the car as sold when it’s gone.'],
  ['pin', 'Near you & trending', 'See what’s for sale around you and which builds everyone’s looking at right now.'],
  ['heart', 'Save & follow the price', 'Save the cars you like and see when the price drops. Only you see what you saved.'],
];
const MORE = [
  ['people', 'Communities & meets', 'Groups for your engine, model or scene, public or private, and car meets with RSVPs.'],
  ['radio', 'Your crew on the road', 'Drive together, see each other on the map and talk on the walkie-talkie.'],
  ['warning', 'Live road warnings', 'Police, hazards and speed cameras with the exact limit, where the law allows it.'],
  ['car', 'Your garage', 'Mods, service history and reminders for oil and APK. The same garage becomes your listing.'],
  ['gauge', 'Performance meter', '0–100, 100–200 and the ¼ mile. Only where it’s legal and safe, like a track day.'],
  ['camera', 'Feed & creators', 'Share your build, follow car creators and see what your friends are working on.'],
];
// Real app screenshots live in assets/screens/ (01-*.png, 02-*.png …). The section only shows when there are any.
const SCREENS = (() => {
  try {
    return readdirSync(join(here, 'assets/screens')).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort();
  } catch {
    return [];
  }
})();
const caption = (f) => f.replace(/^\d+[-_]?/, '').replace(/\.[a-z]+$/i, '').replace(/[-_]+/g, ' ');

page({
  path: '/',
  nav: 'home',
  title: 'Not Stock — buy & sell tuned cars',
  description: 'The marketplace for tuned and modified cars, made by and for car people. Every mod and the service history in one listing. Plus meets, crews and live road warnings.',
  body: `
<section class="hero"><div class="wrap">
  <div>
    <span class="kicker">The market for car people</span>
    <h1>Buy &amp; sell <span class="o">tuned cars.</span></h1>
    <p class="lead">Not Stock is the marketplace for modified cars, made by and for car people. Every mod, what it cost and the service history in one listing, so the right buyer sees what your build is worth. Plus meets, crews and live road warnings.</p>
    <div class="ctas">
      <span class="btn btn-soon" aria-label="Coming soon to the App Store"><svg width="18" height="22" viewBox="0 0 18 22" aria-hidden="true"><path fill="currentColor" d="M14.9 11.7c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2.1-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.5 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.7-1-2.7-4.1zM12.4 4.1c.7-.9 1.2-2 1-3.2-1 0-2.2.7-3 1.5-.6.7-1.2 1.9-1 3.1 1.1.1 2.3-.6 3-1.4z"/></svg><span><small>Coming soon to the</small>App Store</span></span>
      <a class="btn btn-ghost" href="#market">How it works</a>
    </div>
  </div>
  <div class="hero-art"><img src="./assets/logo.svg" alt="The Not Stock logo: an N made of tyre marks and an S shaped like a racetrack" width="1064" height="632"></div>
</div></section>

<div class="strip"><span>Tuned cars</span><span>Documented builds</span><span>Car meets</span><span>Made in NL</span></div>
${
  SCREENS.length
    ? `
<section class="screens-sec"><div class="wrap">
  <h2>See it in action</h2>
  <div class="screens">
    ${SCREENS.map((f) => `<figure class="phone"><img src="./assets/screens/${f}" alt="Not Stock: ${esc(caption(f))}" loading="lazy"><figcaption>${esc(caption(f))}</figcaption></figure>`).join('\n    ')}
  </div>
</div></section>`
    : ''
}
<section id="market"><div class="wrap">
  <h2>A market that gets tuned cars</h2>
  <p class="sub">On normal car sites a tuned car is “modified, price on request”. On Not Stock the build is the selling point: buyers who know what a stage 2 or a proper exhaust is worth, and sellers who can show it.</p>
  <div class="grid">
    ${MARKET.map(([k, t, d]) => `<div class="card">${icon(k)}<h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('\n    ')}
  </div>
  <div class="how">
    <h3>Selling your car</h3>
    <ol class="steps">
      <li>Add your car to your garage once: mods, receipts, service history.</li>
      <li>Tap <b>Sell a car</b>, add photos, price and city. The build sheet comes along automatically.</li>
      <li>Get offers in the app, or let buyers contact you. Mark it as sold when it’s gone.</li>
    </ol>
  </div>
</div></section>

<section class="alt"><div class="wrap">
  <h2>More than a market</h2>
  <p class="sub">Everything car people need in one app, so you’re already here when your next car comes up for sale.</p>
  <div class="grid">
    ${MORE.map(([k, t, d]) => `<div class="card">${icon(k)}<h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('\n    ')}
  </div>
</div></section>

<section><div class="wrap">
  <h2>Your data stays yours</h2>
  <p class="sub">No ads, no analytics, no selling your data. New accounts start private, and your location is used on your phone and only shared when you choose to. <a href="./privacy/">Read the privacy policy</a>.</p>
</div></section>

<section class="alt"><div class="wrap">
  <h2>Free, or go Pro</h2>
  <p class="sub">Selling one car, the map, all warnings, the feed and communities are free. Pro is for people who sell more or drive a lot.</p>
  <div class="plans">
    <div class="plan">
      <div class="name">Free</div>
      <div class="price">€0</div>
      <ul><li>1 car for sale with 10 photos</li><li>Search, offers and saved cars</li><li>Map, navigation and every warning</li><li>Feed, communities and car meets</li><li>1 car in your garage</li></ul>
    </div>
    <div class="plan hot">
      <div class="name">Pro</div>
      <div class="price">€4.99 <small>/ month</small></div>
      <div class="note" style="margin-top:0">or €39.99 / year</div>
      <ul><li>Up to 3 cars for sale with 30 photos each</li><li>Unlimited garage with the full maintenance plan</li><li>Auto-start, police heat and a 30 km radio range</li><li>Performance meter for 100–200 and ¼ mile</li><li>AI features, app colours and the Pro crown</li></ul>
    </div>
  </div>
  <p class="note">Prices include VAT. Subscriptions are handled by Apple and can be cancelled any time. <a href="./subscriptions/">Subscription terms</a>.</p>
</div></section>

<section><div class="wrap">
  <h2>For creators</h2>
  <p class="sub">Car creator on Instagram or TikTok? Get a creator profile that people follow, follower stats, and a chance at the blue check.</p>
  <a class="btn btn-primary" href="./creators/">Creator plans</a>
</div></section>
`,
});

// Support
const FAQ = [
  ['How do I contact you?', `Email <a href="mailto:${C.email}">${C.email}</a>, or use Menu → Contact support in the app. We answer as soon as we can, usually within a few working days.`],
  ['How do I delete my account?', `In the app: Profile → Menu → Your data → Delete my account. Everything linked to your account is erased right away. <a href="../delete-account/">More about deleting your account</a>.`],
  ['How do I get a copy of my data?', 'In the app: Profile → Menu → Your data → Download my data. You get a file with everything we have about you.'],
  ['How do I cancel Pro?', 'Pro is a subscription through Apple. On your iPhone: Settings → your name → Subscriptions → Not Stock → Cancel Subscription. You keep Pro until the end of the period you paid for. For a refund, use reportaproblem.apple.com.'],
  ['I bought Pro but don’t see it on my new phone', 'Sign in with the same Not Stock account and tap Profile → Menu → Restore purchases.'],
  ['Why don’t I get speed camera warnings?', 'Camera warnings switch off by themselves in countries where they’re not allowed while driving (for example Germany and Switzerland). Also check that Not Stock may use your location, and that Drive mode is on in Menu → Drive mode.'],
  ['Why doesn’t Not Stock start by itself when I drive?', 'Auto-start is part of Pro and needs location access set to “Always” in your iPhone settings. Open Not Stock once after installing or updating so it can get ready.'],
  ['How do I report a post, a person or illegal content?', 'Tap the flag on a post or profile, or long-press a message. For illegal content you can also use Menu → Report illegal content. Block someone to stop them from seeing or contacting you.'],
  ['How do I start or delete a community?', 'Start one from the Communities tab. As its admin you can make it private or hidden, add questions for new members and appoint moderators in its settings. The person who started it, or the last admin, can delete it at the bottom of its settings.'],
  ['Is it legal to use Not Stock while driving?', 'Set up your route before you drive and use a phone holder. Don’t type or read while driving. Not Stock never replaces the road signs or the traffic around you. <a href="../safety/">Safety & speed cameras</a>.'],
];
page({
  path: '/support/',
  nav: 'support',
  title: 'Support',
  description: 'Help with Not Stock: contact, deleting your account, your data, Pro subscriptions, camera warnings and more.',
  body: `
<div class="page"><div class="wrap">
  <h1>Support</h1>
  <p class="meta">Stuck with something? Most answers are below. Otherwise, just email us.</p>
  <div class="contact-grid">
    <div class="card"><h3>Help with the app</h3><a href="mailto:${C.email}">${C.email}</a></div>
    <div class="card"><h3>Your data & privacy</h3><a href="mailto:${C.privacyEmail}">${C.privacyEmail}</a></div>
    <div class="card"><h3>Creators & the blue check</h3><a href="mailto:${C.creatorsEmail}">${C.creatorsEmail}</a></div>
    <div class="card"><h3>Authorities & legal</h3><a href="mailto:${C.dsaEmail}">${C.dsaEmail}</a></div>
  </div>
  <h2 id="faq">Frequently asked</h2>
  <div class="faq">
    ${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${a}</p></details>`).join('\n    ')}
  </div>
</div></div>`,
});

// Delete account
page({
  path: '/delete-account/',
  nav: 'support',
  title: 'Delete your account',
  description: 'How to delete your Not Stock account and what happens to your data.',
  body: `
<div class="page"><div class="wrap">
  <h1>Delete your account</h1>
  <p class="meta">You can delete your Not Stock account yourself, any time, right in the app.</p>
  <ol class="steps">
    <li>Open Not Stock and go to the <b>Profile</b> tab.</li>
    <li>Tap <b>Menu</b>, then <b>Your data</b>.</li>
    <li>Optional: tap <b>Download my data</b> first if you want a copy.</li>
    <li>Tap <b>Delete my account</b> and confirm.</li>
  </ol>
  <h2>What happens</h2>
  <p>Everything linked to your account is erased right away, including your photos, cars, posts, messages and listings. Copies in our hosting provider's backups disappear within 30 days. Hazard reports you made stay on the map without your name until they expire, and communities you started are handed to another member.</p>
  <p><b>Pro subscription:</b> deleting your account doesn't cancel your Apple subscription. Cancel it first on your iPhone: Settings → your name → Subscriptions → Not Stock.</p>
  <h2>Can't open the app anymore?</h2>
  <p>Email <a href="mailto:${C.privacyEmail}">${C.privacyEmail}</a> from the email address of your account (or tell us your username) and we'll delete it for you within one month.</p>
  <p class="note">More details in the <a href="../privacy/">Privacy Policy</a>.</p>
</div></div>`,
});

// Creators
page({
  path: '/creators/',
  nav: 'creators',
  title: 'Creators',
  description: 'Creator profiles on Not Stock: followers instead of friend requests, follower stats, featured creators and the blue check.',
  body: `
<div class="page"><div class="wrap" style="max-width:var(--max)">
  <h1>Creators</h1>
  <p class="meta">For car creators on Instagram and TikTok. Choose “I’m a creator” when you start, or switch any time in Profile → Menu → Become a creator.</p>
  <div class="plans">
    <div class="plan">
      <div class="name">Creator</div>
      <div class="price">€14.99 <small>/ month</small></div>
      <ul><li>Creator profile: people follow you, no friend requests</li><li>Creator badge on your profile and posts</li><li>Apply for the blue check (5,000+ followers)</li><li>Follower stats: new followers this week and month</li><li>Everything in Not Stock Pro</li></ul>
    </div>
    <div class="plan hot">
      <div class="name">Creator Plus</div>
      <div class="price">€39.99 <small>/ month</small></div>
      <ul><li>Everything in Creator</li><li>Featured creator: shown at the top of the Feed for everyone (with the blue check)</li><li>Higher in search results</li></ul>
    </div>
  </div>
  <h2 style="font-size:28px;margin-top:56px">The blue check</h2>
  <p>The blue check can't be bought and isn't part of any plan. It means the Not Stock team checked that you own the linked Instagram or TikTok account and that it has at least 5,000 real followers.</p>
  <ol class="steps">
    <li>Get a Creator plan and fill in your Instagram or TikTok username and follower count in the app.</li>
    <li>Put the code you get in your bio, so we can see the account is really yours.</li>
    <li>We check it by hand. You'll see the result in the app.</li>
  </ol>
  <p class="note">We can refuse or remove the blue check, for example for bought or fake followers or pretending to be someone else. Paid promotions must be marked as an ad (#ad). Full rules in the <a href="../terms/">Terms of Use</a> and <a href="../subscriptions/">Subscription terms</a>. Questions: <a href="mailto:${C.creatorsEmail}">${C.creatorsEmail}</a>.</p>
</div></div>`,
});

// Contact / imprint
page({
  path: '/contact/',
  nav: 'support',
  title: 'Contact & imprint',
  description: 'Who runs Not Stock, and how to reach us.',
  body: `
<div class="page"><div class="wrap">
  <h1>Contact & imprint</h1>
  <p class="meta">Not Stock is run by:</p>
  <div class="card">
    <p style="margin:0"><b>${esc(C.name)}</b><br>${esc(C.address)}<br>Chamber of Commerce (KvK): ${esc(C.kvk)}</p>
  </div>
  <div class="contact-grid">
    <div class="card"><h3>Support</h3><a href="mailto:${C.email}">${C.email}</a></div>
    <div class="card"><h3>Privacy & data requests</h3><a href="mailto:${C.privacyEmail}">${C.privacyEmail}</a></div>
    <div class="card"><h3>Creators</h3><a href="mailto:${C.creatorsEmail}">${C.creatorsEmail}</a></div>
    <div class="card"><h3>Authorities (EU Digital Services Act)</h3><a href="mailto:${C.dsaEmail}">${C.dsaEmail}</a><p style="margin-top:6px">Single point of contact for authorities and the European Commission. Languages: English or Dutch.</p></div>
  </div>
  <p>Want to report illegal content? Use Report in the app (on the post, profile or message), or Menu → Report illegal content, or email <a href="mailto:${C.dsaEmail}">${C.dsaEmail}</a>.</p>
</div></div>`,
});

// Legal pages from the app's texts
for (const d of legal.docs) {
  const slug = SLUG[d.key] ?? d.key;
  const toc = d.sections.length > 3 ? `<ul class="toc">${d.sections.map((s) => `<li><a href="#${slugify(s.heading)}">${esc(s.heading)}</a></li>`).join('')}</ul>` : '';
  page({
    path: `/${slug}/`,
    nav: 'legal',
    title: d.title,
    description: d.summary,
    body: `
<div class="page"><div class="wrap">
  <h1>${esc(d.title)}</h1>
  <p class="meta">Last updated: ${esc(legal.updated)} · The same text you find in the app under Profile → Menu → Legal.</p>
  <p class="summary">${esc(d.summary)}</p>
  ${toc}
  ${d.sections
    .map(
      (s) => `<h2 id="${slugify(s.heading)}">${esc(s.heading)}</h2>
  ${s.body.length > 1 ? `<ul>${s.body.map((p) => `<li>${linkify(p)}</li>`).join('')}</ul>` : `<p>${linkify(s.body[0] ?? '')}</p>`}`,
    )
    .join('\n  ')}
</div></div>`,
  });
}

page({
  path: '/legal/',
  nav: 'legal',
  title: 'Legal',
  description: 'Privacy Policy, Terms of Use, Subscription terms, Community Guidelines and more.',
  body: `
<div class="page"><div class="wrap">
  <h1>Legal</h1>
  <p class="meta">Written in plain language. The same texts are in the app under Profile → Menu → Legal.</p>
  <div class="legal-index">
    ${legal.docs.map((d) => `<a href="../${SLUG[d.key] ?? d.key}/"><b>${esc(d.title)}</b><span>${esc(d.summary)}</span></a>`).join('\n    ')}
    <a href="../contact/"><b>Contact & imprint</b><span>Who runs Not Stock and how to reach us.</span></a>
  </div>
</div></div>`,
});

// ---------- Static files ----------
cpSync(join(here, 'assets'), join(OUT, 'assets'), { recursive: true });
writeFileSync(join(OUT, '.nojekyll'), '');
const notFound = page({
  path: '/404-tmp/',
  title: 'Page not found',
  description: 'This page does not exist.',
  body: `<div class="page"><div class="wrap"><h1>Wrong turn</h1><p class="meta">This page doesn't exist (anymore).</p><a class="btn btn-primary" href="/">Back to Not Stock</a></div></div>`,
});
// 404 is served from any depth, so it needs absolute links.
writeFileSync(join(OUT, '404.html'), notFound.replace(/(href|src)="\.\.\/(?!\.)/g, '$1="/'));
rmSync(join(OUT, '404-tmp'), { recursive: true, force: true });
const urls = ['/', '/support/', '/delete-account/', '/creators/', '/contact/', '/legal/', ...legal.docs.map((d) => `/${SLUG[d.key] ?? d.key}/`)];
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${ORIGIN}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`);
if (process.env.CUSTOM_DOMAIN) writeFileSync(join(OUT, 'CNAME'), process.env.CUSTOM_DOMAIN + '\n');
console.log(`built ${urls.length} pages into _site`);
