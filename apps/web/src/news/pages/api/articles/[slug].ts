import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@news/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const slug = req.query.slug;
  if (!slug || Array.isArray(slug)) {
    return res.status(400).json({ message: 'Missing slug' });
  }

  try {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: { tags: true },
    });
    if (!article) {
      return res.status(404).json({ message: 'Not found' });
    }
    return res.status(200).json(article);
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
}
