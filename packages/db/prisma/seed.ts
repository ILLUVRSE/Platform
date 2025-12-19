import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const titles = [
  {
    name: 'Pokémon',
    slug: 'pokemon',
    type: 'Game',
    releaseDate: new Date('1996-02-27'),
    description: 'Adventure series where trainers collect and battle pocket monsters.',
    posterUrl: 'https://placehold.co/600x800/f7d046/1b1b1b?text=Pokemon',
    genres: 'Adventure, RPG, Anime',
    whereToWatch: 'Games on Nintendo; shows on Netflix',
  },
  {
    name: 'Yu-Gi-Oh',
    slug: 'yu-gi-oh',
    type: 'Game',
    releaseDate: new Date('1999-03-02'),
    description: 'Card-duel saga blending monsters, strategy, and high stakes.',
    posterUrl: 'https://placehold.co/600x800/ff6f61/1b1b1b?text=Yu-Gi-Oh',
    genres: 'Card Game, Anime',
    whereToWatch: 'TCG in hobby shops; anime on streaming bundles',
  },
  {
    name: 'Magic the Gathering',
    slug: 'magic-the-gathering',
    type: 'Game',
    releaseDate: new Date('1993-08-05'),
    description: 'The original trading card game with planeswalkers and endless formats.',
    posterUrl: 'https://placehold.co/600x800/6c5ce7/ffffff?text=MTG',
    genres: 'Card Game, Fantasy',
    whereToWatch: 'Paper + Arena; coverage on YouTube/Twitch',
  },
  {
    name: 'Digimon',
    slug: 'digimon',
    type: 'Game',
    releaseDate: new Date('1999-08-01'),
    description: 'Digital monsters evolve with their tamers across games and anime.',
    posterUrl: 'https://placehold.co/600x800/00a8cc/ffffff?text=Digimon',
    genres: 'Adventure, RPG, Anime',
    whereToWatch: 'Games on console; shows on streaming',
  },
  {
    name: 'Stranger Things',
    slug: 'stranger-things',
    type: 'Show',
    releaseDate: new Date('2016-07-15'),
    description: 'Hawkins kids face the Upside Down in synth-soaked sci-fi horror.',
    posterUrl: 'https://placehold.co/600x800/b30059/ffffff?text=Stranger+Things',
    genres: 'Sci-Fi, Horror, Drama',
    whereToWatch: 'Netflix',
  },
  {
    name: 'The Mandalorian',
    slug: 'the-mandalorian',
    type: 'Show',
    releaseDate: new Date('2019-11-12'),
    description: 'A lone bounty hunter and Grogu roam the Outer Rim in the New Republic era.',
    posterUrl: 'https://placehold.co/600x800/0b3d91/ffffff?text=Mandalorian',
    genres: 'Sci-Fi, Adventure',
    whereToWatch: 'Disney+',
  },
  {
    name: 'Game of Thrones',
    slug: 'game-of-thrones',
    type: 'Show',
    releaseDate: new Date('2011-04-17'),
    description: 'Houses clash for the Iron Throne as winter and dragons return.',
    posterUrl: 'https://placehold.co/600x800/1f2937/ffffff?text=Game+of+Thrones',
    genres: 'Fantasy, Drama',
    whereToWatch: 'Max',
  },
  {
    name: 'House of the Dragon',
    slug: 'house-of-the-dragon',
    type: 'Show',
    releaseDate: new Date('2022-08-21'),
    description: 'Targaryen civil war sparks dragonfire a century before the Starks ride south.',
    posterUrl: 'https://placehold.co/600x800/8b5cf6/ffffff?text=House+of+the+Dragon',
    genres: 'Fantasy, Drama',
    whereToWatch: 'Max',
  },
  {
    name: 'DC Universe',
    slug: 'dc-universe',
    type: 'Universe',
    releaseDate: new Date('1939-05-01'),
    description: 'Interconnected heroes and villains from Gotham to Metropolis.',
    posterUrl: 'https://placehold.co/600x800/0f172a/ffffff?text=DC+Universe',
    genres: 'Superhero, Action',
    whereToWatch: 'Films on Max; comics in shops/digital',
  },
  {
    name: 'Harry Potter',
    slug: 'harry-potter',
    type: 'Franchise',
    releaseDate: new Date('2001-11-16'),
    description: 'Wizarding World stories from Hogwarts halls to Fantastic Beasts.',
    posterUrl: 'https://placehold.co/600x800/14532d/ffffff?text=Harry+Potter',
    genres: 'Fantasy, Adventure',
    whereToWatch: 'Films on Max/Peacock; books in print/digital',
  },
]

const videos = [
  {
    title: 'CNTRL Live Radio',
    slug: 'cntrl-live-radio',
    description: 'Live stream for radio and event broadcasts.',
    thumbnail: 'https://placehold.co/800x450/0b3d91/ffffff?text=CNTRL+Live',
    live: true,
    liveUrl: 'https://example.com/live.m3u8',
    tags: 'live,radio',
    published: true,
  },
  {
    title: 'Stranger Things: Behind the Score',
    slug: 'stranger-things-behind-the-score',
    description: 'Composer chat on building the Upside Down soundscape.',
    thumbnail: 'https://placehold.co/800x450/b30059/ffffff?text=Stranger+Things',
    hlsUrl: 'https://example.com/stranger-things.m3u8',
    mp4Url: 'https://example.com/stranger-things.mp4',
    tags: 'interview,stranger-things',
    published: true,
  },
]

async function main() {
  const email = 'admin@cntrl.com'
  const password = 'password123'
  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashedPassword,
      name: 'Super Admin',
      role: 'admin',
    },
  })

  console.log({ user })

  for (const title of titles) {
    await prisma.title.upsert({
      where: { slug: title.slug },
      update: title,
      create: title,
    })
  }

  for (const video of videos) {
    await prisma.video.upsert({
      where: { slug: video.slug },
      update: video,
      create: video,
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
