import { NextApiHandler } from 'next';
import clientPromise from '@/lib/mongodb';

const dbName = 'search_engine';
const collectionName = 'shortenedUrls';
const ShareHandler: NextApiHandler = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') res.redirect('/');

  if (req.method === 'GET') {
    const id = req.query.id;
    const mongo = await clientPromise;
    try {
      const record = await mongo.db(dbName).collection(collectionName).findOne({
        shortId: id,
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
