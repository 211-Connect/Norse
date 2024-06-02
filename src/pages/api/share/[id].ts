import mongodb from '@/lib/mongodb';
import { NextApiHandler } from 'next';

const ShareHandler: NextApiHandler = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') res.redirect('/');

  if (req.method === 'GET') {
    const id = req.query.id as string;
    try {
      const record = await mongodb.shortenedUrls.findFirst({
        where: {
          shortId: id,
        },
      });

      if (record) res.redirect(record.originalUrl);
      else res.redirect('/404');
    } catch (err) {
      res.statusCode = 404;
      res.redirect('/404');
    }
  } else {
    res.statusCode = 404;
    res.redirect('/404');
  }
};

export default ShareHandler;
