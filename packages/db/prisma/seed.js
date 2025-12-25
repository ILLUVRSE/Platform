/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function main() {
  // Wipe content so we start clean with public-access news.
  await prisma.credit.deleteMany();
  await prisma.title.deleteMany();
  await prisma.person.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.video.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.station.deleteMany();
  await prisma.stream.deleteMany();
  await prisma.source.deleteMany();
  await prisma.user.deleteMany();

  const email = 'admin@cntrl.com';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: 'Super Admin',
      role: 'admin',
    },
  });

  console.log({ user });

  const sourcesSeed = [
    {
      name: 'BBC World',
      slug: 'bbc-world',
      type: 'public_broadcaster',
      homepageUrl: 'https://www.bbc.com/news/world',
      feedUrl: 'http://feeds.bbci.co.uk/news/world/rss.xml',
      countryCode: 'GB',
      language: 'en',
      reliability: 90,
      fetchInterval: 60,
    },
    {
      name: 'NPR World',
      slug: 'npr-world',
      type: 'public_broadcaster',
      homepageUrl: 'https://www.npr.org/sections/world/',
      feedUrl: 'https://feeds.npr.org/1004/rss.xml',
      countryCode: 'US',
      language: 'en',
      reliability: 85,
      fetchInterval: 60,
    },
    {
      name: 'UN News',
      slug: 'un-news',
      type: 'ngo',
      homepageUrl: 'https://news.un.org/',
      feedUrl: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml',
      countryCode: 'UN',
      language: 'en',
      reliability: 75,
      fetchInterval: 120,
    },
    {
      name: 'Al Jazeera World',
      slug: 'aljazeera-world',
      type: 'public_broadcaster',
      homepageUrl: 'https://www.aljazeera.com/news/',
      feedUrl: 'https://www.aljazeera.com/xml/rss/all.xml',
      countryCode: 'QA',
      language: 'en',
      reliability: 80,
      fetchInterval: 60,
    },
    {
      name: 'ILLUVRSE Newsroom',
      slug: 'illuvrse-newsroom',
      type: 'community',
      homepageUrl: 'https://illuvrse.news',
      feedUrl: null,
      countryCode: 'US',
      language: 'en',
      reliability: 88,
      fetchInterval: 0,
      active: false,
      notes: 'Internal public access desk updates.',
    },
  ];

  for (const source of sourcesSeed) {
    await prisma.source.create({ data: source });
  }

  const stationsSeed = [
    {
      name: 'BBC World Service',
      slug: slugify('BBC World Service'),
      countryCode: 'GB',
      region: 'EU',
      language: 'en',
      genre: 'News',
      streamUrl: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service',
      websiteUrl: 'https://www.bbc.co.uk/sounds/play/live:bbc_world_service',
      bitrate: 128,
      codec: 'mp3',
      status: 'online',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/9c/BBC_World_Service_logo.png',
      lastCheckedAt: new Date(),
    },
    {
      name: 'NPR Program Stream',
      slug: slugify('NPR Program Stream'),
      countryCode: 'US',
      language: 'en',
      genre: 'News',
      streamUrl: 'https://npr-ice.streamguys1.com/live.mp3',
      websiteUrl: 'https://www.npr.org',
      bitrate: 128,
      codec: 'mp3',
      status: 'online',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/NPR_logo.svg/320px-NPR_logo.svg.png',
      lastCheckedAt: new Date(),
    },
    {
      name: 'Radio France Internationale',
      slug: slugify('Radio France Internationale'),
      countryCode: 'FR',
      region: 'EU',
      language: 'fr',
      genre: 'News',
      streamUrl: 'https://stream11.tdiradio.com/rfi/rfia/francais/mp3-128/rfia.mp3',
      websiteUrl: 'https://www.rfi.fr/',
      bitrate: 128,
      codec: 'mp3',
      status: 'online',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Logo_RFI.svg/320px-Logo_RFI.svg.png',
      lastCheckedAt: new Date(),
    },
    {
      name: 'Voice of Nigeria',
      slug: slugify('Voice of Nigeria'),
      countryCode: 'NG',
      region: 'AF',
      language: 'en',
      genre: 'News',
      streamUrl: '',
      websiteUrl: 'https://voiceofnigeria.gov.ng/',
      status: 'unknown',
      logoUrl: null,
      notes: 'Syndication target. Stream URL pending.',
      lastCheckedAt: new Date(),
    },
    {
      name: 'All India Radio External Services',
      slug: slugify('All India Radio External Services'),
      countryCode: 'IN',
      region: 'AS',
      language: 'en',
      genre: 'News',
      streamUrl: '',
      websiteUrl: 'https://www.newsonair.gov.in/',
      status: 'unknown',
      logoUrl: null,
      notes: 'Syndication target. Stream URL pending.',
      lastCheckedAt: new Date(),
    },
    {
      name: 'Channel Africa',
      slug: slugify('Channel Africa'),
      countryCode: 'ZA',
      region: 'AF',
      language: 'en',
      genre: 'News',
      streamUrl: '',
      websiteUrl: 'https://www.sabc.co.za/',
      status: 'unknown',
      logoUrl: null,
      notes: 'Syndication target. Stream URL pending.',
      lastCheckedAt: new Date(),
    },
    {
      name: 'Deutsche Welle English',
      slug: slugify('Deutsche Welle English'),
      countryCode: 'DE',
      language: 'en',
      genre: 'News',
      streamUrl: 'https://dwstream4-lh.akamaihd.net/i/dwstream4_live@131329/index_4_a-p.m3u8',
      websiteUrl: 'https://www.dw.com/en/media-center/live-tv/s-100825',
      bitrate: 128,
      codec: 'aac',
      status: 'online',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Deutsche_Welle_logo.svg/320px-Deutsche_Welle_logo.svg.png',
      lastCheckedAt: new Date(),
    },
    {
      name: 'KQED Public Radio',
      slug: slugify('KQED Public Radio'),
      countryCode: 'US',
      language: 'en',
      region: 'NA',
      genre: 'News / Talk',
      streamUrl: 'https://kqed-ice.streamguys1.com/kqedradio.aac',
      websiteUrl: 'https://www.kqed.org/radio/live',
      bitrate: 64,
      codec: 'aac',
      status: 'online',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/KQED_logo.svg/320px-KQED_logo.svg.png',
      lastCheckedAt: new Date(),
    },
    {
      name: 'WNYC 93.9 FM',
      slug: slugify('WNYC 93.9 FM'),
      countryCode: 'US',
      language: 'en',
      region: 'NA',
      city: 'New York',
      genre: 'News / Talk',
      streamUrl: 'https://fm939.wnyc.org/wnycfm',
      websiteUrl: 'https://www.wnyc.org/streams/',
      bitrate: 128,
      codec: 'mp3',
      status: 'online',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/WNYC_logo.svg/320px-WNYC_logo.svg.png?20211220',
      lastCheckedAt: new Date(),
    },
    {
      name: 'KCRW News',
      slug: slugify('KCRW News'),
      countryCode: 'US',
      language: 'en',
      region: 'NA',
      city: 'Los Angeles',
      genre: 'News / Music',
      streamUrl: 'https://kcrw.streamguys1.com/kcrw_192k_mp3_on_air',
      websiteUrl: 'https://www.kcrw.com/playlist',
      bitrate: 192,
      codec: 'mp3',
      status: 'online',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/03/KCRW_logo.svg/320px-KCRW_logo.svg.png',
      lastCheckedAt: new Date(),
    },
    {
      name: 'RNZ National',
      slug: slugify('RNZ National'),
      countryCode: 'NZ',
      language: 'en',
      region: 'OC',
      genre: 'News / Talk',
      streamUrl: 'https://radionz-ice.streamguys1.com/national.mp3',
      websiteUrl: 'https://www.rnz.co.nz/audio/live/national',
      bitrate: 128,
      codec: 'mp3',
      status: 'online',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/49/Radio_New_Zealand_logo.svg/320px-Radio_New_Zealand_logo.svg.png',
      lastCheckedAt: new Date(),
    },
    {
      name: 'WBUR Boston',
      slug: slugify('WBUR Boston'),
      countryCode: 'US',
      region: 'NA',
      city: 'Boston',
      language: 'en',
      genre: 'News / Talk',
      streamUrl: 'https://wbur-live.streamguys1.com/wburlive-mp3',
      websiteUrl: 'https://www.wbur.org/listen/live',
      bitrate: 128,
      codec: 'mp3',
      status: 'online',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/WBUR_logo.svg/320px-WBUR_logo.svg.png',
      lastCheckedAt: new Date(),
    },
    {
      name: 'KPCC / LAist',
      slug: slugify('KPCC LAist'),
      countryCode: 'US',
      region: 'NA',
      city: 'Los Angeles',
      language: 'en',
      genre: 'News / Talk',
      streamUrl: 'https://scpr-ice.streamguys1.com/sgkpcc64aac',
      websiteUrl: 'https://laist.com/radio',
      bitrate: 64,
      codec: 'aac',
      status: 'online',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/70/KPCC_logo.svg/320px-KPCC_logo.svg.png',
      lastCheckedAt: new Date(),
    },
    {
      name: 'WAMU 88.5',
      slug: slugify('WAMU 88.5'),
      countryCode: 'US',
      region: 'NA',
      city: 'Washington DC',
      language: 'en',
      genre: 'News / Talk',
      streamUrl: 'https://wamu-1.streamguys1.com/wamu-1',
      websiteUrl: 'https://wamu.org/listen/',
      bitrate: 128,
      codec: 'mp3',
      status: 'online',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/WAMU_logo.svg/320px-WAMU_logo.svg.png',
      lastCheckedAt: new Date(),
    },
    {
      name: 'WBEZ Chicago',
      slug: slugify('WBEZ Chicago'),
      countryCode: 'US',
      region: 'NA',
      city: 'Chicago',
      language: 'en',
      genre: 'News / Talk',
      streamUrl: 'https://wbez-live.streamguys1.com/wbez128.mp3',
      websiteUrl: 'https://www.wbez.org/',
      bitrate: 128,
      codec: 'mp3',
      status: 'online',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8c/WBEZ_logo.svg/320px-WBEZ_logo.svg.png',
      lastCheckedAt: new Date(),
    },
    {
      name: 'KEXP Seattle',
      slug: slugify('KEXP Seattle'),
      countryCode: 'US',
      region: 'NA',
      city: 'Seattle',
      language: 'en',
      genre: 'Music / Culture',
      streamUrl: 'https://live.kexp.org/kexp128.mp3',
      websiteUrl: 'https://www.kexp.org/listen/',
      bitrate: 128,
      codec: 'mp3',
      status: 'online',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/KEXP_logo.svg/320px-KEXP_logo.svg.png',
      lastCheckedAt: new Date(),
    },
    {
      name: 'ABC NewsRadio',
      slug: slugify('ABC NewsRadio'),
      countryCode: 'AU',
      region: 'OC',
      language: 'en',
      genre: 'News',
      streamUrl: 'https://live-radio01.mediahubaustralia.com/NEWSW/mp3/',
      websiteUrl: 'https://www.abc.net.au/radio/newsradio/',
      bitrate: 128,
      codec: 'mp3',
      status: 'online',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/43/ABC_NewsRadio_logo.svg/320px-ABC_NewsRadio_logo.svg.png',
      lastCheckedAt: new Date(),
    },
    {
      name: 'CBC Radio One Toronto',
      slug: slugify('CBC Radio One Toronto'),
      countryCode: 'CA',
      region: 'NA',
      city: 'Toronto',
      language: 'en',
      genre: 'News / Talk',
      streamUrl: 'https://cbcliveradio-lh.akamaihd.net/i/CBCR1_TORONTO@118208/master.m3u8',
      websiteUrl: 'https://www.cbc.ca/listen/live-radio/1-14-cbc-radio-one-toronto',
      bitrate: 128,
      codec: 'aac',
      status: 'online',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4a/CBC_Radio_One_logo.svg/320px-CBC_Radio_One_logo.svg.png',
      lastCheckedAt: new Date(),
    },
    {
      name: 'RTÉ Radio 1',
      slug: slugify('RTE Radio 1'),
      countryCode: 'IE',
      region: 'EU',
      language: 'en',
      genre: 'News / Talk',
      streamUrl: 'https://av.rasset.ie/av/live/radio/radio1.sdp/playlist.m3u8',
      websiteUrl: 'https://www.rte.ie/radio1/',
      bitrate: 128,
      codec: 'aac',
      status: 'online',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7c/RTE_Radio_1_logo.svg/320px-RTE_Radio_1_logo.svg.png',
      lastCheckedAt: new Date(),
    },
    {
      name: 'Sveriges Radio P1',
      slug: slugify('Sveriges Radio P1'),
      countryCode: 'SE',
      region: 'EU',
      language: 'sv',
      genre: 'News / Talk',
      streamUrl: 'https://sverigesradio.se/topsy/direkt/209-hi.mp3',
      websiteUrl: 'https://sverigesradio.se/p1',
      bitrate: 192,
      codec: 'mp3',
      status: 'online',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Sveriges_Radio_logo.svg/320px-Sveriges_Radio_logo.svg.png',
      lastCheckedAt: new Date(),
    },
  ];

  for (const station of stationsSeed) {
    await prisma.station.create({
      data: station,
    });
  }

  const streamsSeed = [
    {
      name: 'Mont Ventoux Summit Cam',
      locationName: 'Mont Ventoux, France',
      countryCode: 'FR',
      language: 'fr',
      embedUrl: 'https://test-streams.mux.dev/ptsventoux/ptsventoux.m3u8',
      posterImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Mont_Ventoux_top.jpg/640px-Mont_Ventoux_top.jpg',
      attribution: 'Test-streams.mux.dev',
      licenseNote: 'Publicly shared demo HLS feed',
    },
    {
      name: 'Angel One Scenic Cam',
      locationName: 'Demo scenic feed',
      countryCode: 'CA',
      embedUrl: 'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/hls.m3u8',
      posterImage: 'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/poster.jpg',
      attribution: 'Shaka Demo',
      licenseNote: 'Publicly shared demo HLS feed',
    },
  ];

  for (const stream of streamsSeed) {
    const slug = slugify(stream.name);
    await prisma.stream.create({
      data: {
        ...stream,
        slug,
      },
    });
  }

  const tagNames = ['News', 'Feature', 'World', 'Climate', 'Health', 'Technology', 'Economy', 'Conflict', 'Policy', 'Science', 'Energy', 'Humanitarian'];
  await Promise.all(
    tagNames.map((name) =>
      prisma.tag.create({
        data: { name, slug: slugify(name) },
      }),
    ),
  );

  const now = new Date();
  const hoursAgo = (hours) => new Date(now.getTime() - hours * 60 * 60 * 1000);
  const cover = (label, bg, fg = 'ffffff') =>
    `https://placehold.co/1200x800/${bg}/${fg}?text=${encodeURIComponent(label)}`;

  const sources = await prisma.source.findMany({ select: { id: true, slug: true, reliability: true } });
  const sourceBySlug = Object.fromEntries(sources.map((source) => [source.slug, source]));

  const tagConnect = (names) =>
    names.map((name) => ({
      where: { slug: slugify(name) },
      create: { name, slug: slugify(name) },
    }));

  const articleSeeds = [
    {
      title: 'ILLUVRSE desk moves to a 12-hour verification loop',
      summary: 'Verification signals refresh twice daily, tightening the gap between ingest and badge updates.',
      excerpt: 'ILLUVRSE News now refreshes verification signals twice daily, tightening the window between ingest and badge updates.',
      content: `### What changed
ILLUVRSE News now refreshes verification signals every 12 hours. Each cycle recalculates reliability, updates badges, and writes a public audit entry.

### Why it matters
The tighter loop shortens the gap between ingest and verification. Readers can see signals stabilize faster when sources shift.

### Next up
The desk will publish a diff view so partners can track reliability changes over time.`,
      coverImage: cover('Verification Loop', '0f172a'),
      tags: ['News', 'Technology', 'Policy'],
      publishedAt: hoursAgo(0.5),
      sourceSlug: 'illuvrse-newsroom',
      sourceUrl: 'https://illuvrse.news/news/transparency',
      sources: [
        { name: 'Transparency Log', url: 'https://illuvrse.news/news/transparency' },
        { name: 'Open Data Directory', url: 'https://illuvrse.news/news/open-data' },
      ],
      locale: 'en-US',
      countryCode: 'US',
      region: 'NA',
    },
    {
      title: 'Open data API now ships hourly CSV snapshots',
      summary: 'Hourly CSV exports make it easier to analyze article metadata, licenses, and regional availability.',
      excerpt: 'The open data endpoint now exports an hourly CSV snapshot that mirrors the JSON feed for quick analysis and dashboards.',
      content: `ILLUVRSE News now publishes hourly CSV snapshots alongside the JSON feed. The snapshot includes license, region, and reliability fields so teams can pull into sheets or BI tools.

The API continues to serve the live JSON feed, but the CSV makes bulk analysis faster for research partners.`,
      coverImage: cover('Open Data CSV', '1f2937'),
      tags: ['News', 'Technology', 'Economy'],
      publishedAt: hoursAgo(1.4),
      sourceSlug: 'illuvrse-newsroom',
      sourceUrl: 'https://illuvrse.news/news/open-data',
      sources: [{ name: 'Open Data Directory', url: 'https://illuvrse.news/news/open-data' }],
      locale: 'en-US',
      countryCode: 'US',
      region: 'NA',
    },
    {
      title: 'Radio grid adds new public access stations across NA and EU',
      summary: 'New public access stations join the grid, improving coverage in North America and Europe.',
      excerpt: 'The radio grid expands with new public access stations and clearer metadata for region, language, and licensing.',
      content: `The radio grid added new public access stations across North America and Europe, with refreshed metadata for region, language, and licensing.

Stations appear immediately in the News Radio lineup and are included in health checks every 60 minutes.`,
      coverImage: cover('Radio Grid', '0b3d91'),
      tags: ['News', 'World'],
      publishedAt: hoursAgo(2.2),
      sourceSlug: 'illuvrse-newsroom',
      sourceUrl: 'https://illuvrse.news/news/radio',
      sources: [{ name: 'News Radio', url: 'https://illuvrse.news/news/radio' }],
      locale: 'en-GB',
      countryCode: 'GB',
      region: 'EU',
    },
    {
      title: 'Translation queue opens for six new languages',
      summary: 'Six new language lanes are now available for translation tasks, backed by regional editors.',
      excerpt: 'The newsroom opened translation tasks for six new languages with human review and regional context notes.',
      content: `The translation queue is now open for six new languages. Each lane includes regional context notes and a human review step before publish.

Contributors can claim tasks from the desk view and submit glossary updates for recurring terms.`,
      coverImage: cover('Translation Queue', '14532d'),
      tags: ['News', 'Humanitarian', 'Policy'],
      publishedAt: hoursAgo(3.3),
      sourceSlug: 'illuvrse-newsroom',
      sourceUrl: 'https://illuvrse.news/news/desk',
      sources: [
        { name: 'News Desk', url: 'https://illuvrse.news/news/desk' },
        { name: 'Transparency Log', url: 'https://illuvrse.news/news/transparency' },
      ],
      locale: 'en-US',
      countryCode: 'US',
      region: 'NA',
    },
    {
      title: 'Source health monitor now flags unstable feeds in real time',
      summary: 'Real-time health signals help the desk spot unstable feeds and avoid false alerts.',
      excerpt: 'The source health monitor now flags unstable feeds with live status badges and retry windows.',
      content: `Source health monitoring now updates in real time, surfacing unstable feeds with live status badges and retry windows.

The change reduces false alerts by separating temporary outages from persistent failures.`,
      coverImage: cover('Source Health', '334155'),
      tags: ['News', 'Technology', 'Science'],
      publishedAt: hoursAgo(4.7),
      sourceSlug: 'illuvrse-newsroom',
      sourceUrl: 'https://illuvrse.news/news/transparency',
      sources: [{ name: 'Transparency Log', url: 'https://illuvrse.news/news/transparency' }],
      locale: 'en-US',
      countryCode: 'US',
      region: 'NA',
    },
    {
      title: 'Climate desk expands to include energy transition briefings',
      summary: 'Climate coverage now includes energy transition briefings and policy trackers.',
      excerpt: 'Daily climate briefs now include energy transition updates across policy, infrastructure, and research.',
      content: `The climate desk now includes energy transition briefings across policy, infrastructure, and research.

Briefs are tagged for region and license to support local partners and long-term tracking.`,
      coverImage: cover('Climate Desk', '065f46'),
      tags: ['News', 'Climate', 'Energy'],
      publishedAt: hoursAgo(6.1),
      sourceSlug: 'illuvrse-newsroom',
      sourceUrl: 'https://illuvrse.news/news',
      sources: [{ name: 'News Desk', url: 'https://illuvrse.news/news' }],
      locale: 'en-US',
      countryCode: 'US',
      region: 'NA',
    },
    {
      title: 'Community briefs board launches for local updates',
      summary: 'A new board highlights local updates from vetted community partners.',
      excerpt: 'A new community briefs board highlights vetted local updates and invites local partners to contribute.',
      content: `The community briefs board highlights vetted local updates and invites local partners to contribute short dispatches.

Submissions are reviewed within the 12-hour verification loop before they surface in the main feed.`,
      coverImage: cover('Community Briefs', '7c2d12'),
      tags: ['News', 'World', 'Humanitarian'],
      publishedAt: hoursAgo(8.3),
      sourceSlug: 'illuvrse-newsroom',
      sourceUrl: 'https://illuvrse.news/news',
      sources: [{ name: 'News Desk', url: 'https://illuvrse.news/news' }],
      locale: 'en-US',
      countryCode: 'US',
      region: 'NA',
    },
    {
      title: 'Audit log now includes cross-region licensing checks',
      summary: 'Audit entries now show cross-region license checks for each published story.',
      excerpt: 'The audit log now records cross-region licensing checks to prevent reuse outside allowed markets.',
      content: `Audit log entries now include cross-region licensing checks so partners can verify reuse rights at a glance.

The desk will expand this to include a summary of license exceptions by region.`,
      coverImage: cover('License Checks', '4b5563'),
      tags: ['News', 'Policy', 'Technology'],
      publishedAt: hoursAgo(10.9),
      sourceSlug: 'illuvrse-newsroom',
      sourceUrl: 'https://illuvrse.news/news/transparency',
      sources: [{ name: 'Transparency Log', url: 'https://illuvrse.news/news/transparency' }],
      locale: 'en-GB',
      countryCode: 'GB',
      region: 'EU',
    },
    {
      title: 'Inside the 12-hour loop: how ILLUVRSE verifies fast-moving stories',
      summary: 'A look at the twice-daily cadence that re-scores sources, updates badges, and keeps the desk transparent.',
      excerpt: 'A look at the twice-daily cadence that re-scores sources, updates badges, and keeps the desk transparent.',
      content: `### The cadence
ILLUVRSE News runs a verification sweep every 12 hours. The sweep re-scores source reliability, checks license metadata, and writes a public audit entry for each change.

### The signal
Reliability is a weighted signal, not a verdict. The desk looks at source history, consistency of coverage, and transparency of corrections. A short cadence catches shifts without amplifying noise.

### The workflow
Agents propose summaries and highlight deltas. Editors review the changes, annotate sources when context is missing, and decide which stories surface as top items.

### What readers see
Badges update twice daily, and the audit log captures the reason for each change. Readers get fresher signals while keeping the history visible.

### Next up
The team is testing a community review lane where local partners can submit evidence for badge adjustments.`,
      coverImage: cover('Verification Feature', '1e293b'),
      pullQuote: 'Verification is a cadence, not a one-time gate.',
      tags: ['Feature', 'Policy', 'Technology'],
      publishedAt: hoursAgo(1.1),
      sourceSlug: 'illuvrse-newsroom',
      sourceUrl: 'https://illuvrse.news/news/transparency',
      sources: [
        { name: 'Transparency Log', url: 'https://illuvrse.news/news/transparency' },
        { name: 'Open Data Directory', url: 'https://illuvrse.news/news/open-data' },
      ],
      locale: 'en-US',
      countryCode: 'US',
      region: 'NA',
    },
    {
      title: 'Building the live channel mosaic for public access',
      summary: 'The live channel grid balances feed health, regional diversity, and viewer context.',
      excerpt: 'The live channel grid balances feed health, regional diversity, and viewer context.',
      content: `### A grid that breathes
The live channel mosaic is designed to feel like a map, not a list. Tiles rotate based on region, genre, and live status so viewers can scan quickly.

### Feed health
Each tile reflects stream health. If a feed stalls or drops, the grid falls back to backup sources and logs the event for operators.

### Context matters
Every tile carries region and language metadata. That context helps viewers understand what they are hearing before they dive in.

### Open access
The grid prioritizes public access sources and makes licensing clear so partners can rebroadcast safely.`,
      coverImage: cover('Live Channel Mosaic', '0f766e'),
      pullQuote: 'The grid is a map of attention, not a wall of noise.',
      tags: ['Feature', 'Technology', 'World'],
      publishedAt: hoursAgo(5.6),
      sourceSlug: 'illuvrse-newsroom',
      sourceUrl: 'https://illuvrse.news/news/live',
      sources: [
        { name: 'Live Desk', url: 'https://illuvrse.news/news/live' },
        { name: 'Video Catalog', url: 'https://illuvrse.news/news/videos' },
      ],
      locale: 'en-GB',
      countryCode: 'GB',
      region: 'EU',
    },
    {
      title: 'From raw feeds to readable briefs: the human + agent workflow',
      summary: 'Agents draft the first pass, editors set the final tone, and every brief links back to source context.',
      excerpt: 'Agents draft the first pass, editors set the final tone, and every brief links back to source context.',
      content: `### First pass automation
Agents summarize new items, extract key tags, and draft a short excerpt. This keeps the desk responsive when feeds spike.

### Human editorial layer
Editors verify the sources, tune the language, and decide whether a story should be tagged as news or feature.

### What makes a brief readable
The desk favors a short lede, a clear "why it matters" line, and a single action or link for follow-up.

### Shared accountability
Every published brief links back to its sources and audit trail so readers can trace the chain of custody.`,
      coverImage: cover('Human + Agent', '6d28d9'),
      pullQuote: 'Agents draft the first pass, editors set the final tone.',
      tags: ['Feature', 'Science', 'Policy'],
      publishedAt: hoursAgo(7.8),
      sourceSlug: 'illuvrse-newsroom',
      sourceUrl: 'https://illuvrse.news/news/desk',
      sources: [
        { name: 'News Desk', url: 'https://illuvrse.news/news/desk' },
        { name: 'Transparency Log', url: 'https://illuvrse.news/news/transparency' },
      ],
      locale: 'en-US',
      countryCode: 'US',
      region: 'NA',
    },
    {
      title: 'Mapping coverage gaps: where the open desk still needs eyes',
      summary: 'Coverage gaps reveal where the desk needs more local partners and more resilient feeds.',
      excerpt: 'Coverage gaps reveal where the desk needs more local partners and more resilient feeds.',
      content: `### Seeing the gaps
Coverage gaps show up when regions have low source density, intermittent feeds, or missing translations.

### Signals from partners
Local partners submit gap reports that help the desk prioritize new sources and station outreach.

### What is next
The desk is piloting a public request board for new sources, with a promise to respond within two verification cycles.`,
      coverImage: cover('Coverage Gaps', 'be123c'),
      pullQuote: 'Coverage gaps are the signal, not the failure.',
      tags: ['Feature', 'Humanitarian', 'World'],
      publishedAt: hoursAgo(11.4),
      sourceSlug: 'illuvrse-newsroom',
      sourceUrl: 'https://illuvrse.news/news/open-data',
      sources: [
        { name: 'Open Data Directory', url: 'https://illuvrse.news/news/open-data' },
        { name: 'Transparency Log', url: 'https://illuvrse.news/news/transparency' },
      ],
      locale: 'en-US',
      countryCode: 'US',
      region: 'NA',
    },
  ];

  for (const article of articleSeeds) {
    const slug = article.slug || slugify(article.title);
    const source = article.sourceSlug ? sourceBySlug[article.sourceSlug] : undefined;
    await prisma.article.create({
      data: {
        title: article.title,
        slug,
        content: article.content,
        summary: article.summary,
        excerpt: article.excerpt,
        coverImage: article.coverImage,
        pullQuote: article.pullQuote,
        locale: article.locale ?? 'en-US',
        countryCode: article.countryCode ?? null,
        region: article.region ?? null,
        license: article.license ?? 'CC-BY-4.0',
        sourceReliability: article.sourceReliability ?? source?.reliability ?? 85,
        sourceUrl: article.sourceUrl ?? null,
        originId: `seed-${slug}`,
        published: true,
        publishedAt: article.publishedAt ?? now,
        status: 'published',
        authorId: user.id,
        ...(source ? { sourceId: source.id } : {}),
        tags: { connectOrCreate: tagConnect(article.tags) },
        sources: article.sources ?? [],
      },
    });
  }

  console.log(`Seeded ${sourcesSeed.length} sources, ${stationsSeed.length} stations, ${streamsSeed.length} streams, ${tagNames.length} tags, and ${articleSeeds.length} articles.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
