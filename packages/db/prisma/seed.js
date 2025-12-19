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
  ];

  for (const source of sourcesSeed) {
    await prisma.source.create({ data: source });
  }

  const stationsSeed = [
    {
      name: 'BBC World Service',
      slug: slugify('BBC World Service'),
      countryCode: 'GB',
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
      name: 'RFI Monde',
      slug: slugify('RFI Monde'),
      countryCode: 'FR',
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

  console.log(`Seeded ${sourcesSeed.length} sources, ${stationsSeed.length} stations, ${streamsSeed.length} streams, and ${tagNames.length} tags.`);
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
