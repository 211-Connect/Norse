import { NextApiHandler } from 'next';
import { isAxiosError } from 'axios';
import { ShortUrlService } from '@/shared/services/short-url-service';

const ShareHandler: NextApiHandler = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') res.redirect('/');


  if (req.method === 'GET') {
    const id = req.query.id;
    try {
      const response = await ShortUrlService.getShortUrlById(id as string);
      if (response) res.redirect(response.url);
      else res.redirect('/404');
    } catch (err) {
      if (isAxiosError(err)) {
        console.error(err.response?.data);
      }
      res.statusCode = 404;
      res.redirect('/404');
    }
  } else {
    res.statusCode = 404;
    res.redirect('/404');
  }
};

export default ShareHandler;
