import { NextApiHandler } from 'next';
import zod from 'zod';

const querySchema = zod.object({
  address: zod.string().optional(),
  autocomplete: zod.string().optional(),
  coords: zod.string().optional(),
});

const MAPBOX_API_KEY = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;

// Handles routing based on method
const Search: NextApiHandler = async (req, res) => {
  switch (req.method) {
    case 'GET':
      return await GET(req, res);
    default:
      res.statusCode = 404;
      res.send('Not found');
  }
};

const GET: NextApiHandler = async (req, res) => {
  const q = await querySchema.parseAsync(req.query);

  let data;

  if (q.autocomplete) {
    const resp = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${q.address}.json?access_token=${MAPBOX_API_KEY}&country=US`
    );
    data = await resp.json();
  } else if (q.coords) {
    const resp = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${q.coords}.json?access_token=${MAPBOX_API_KEY}&types=address&country=US`
    );
    data = await resp.json();

    if (data.features.length > 0) {
      data = { address: data.features[0].place_name };
    } else {
      data = {};
    }
  } else {
    const resp = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${q.address}.json?access_token=${MAPBOX_API_KEY}&country=US`
    );
    data = await resp.json();

    if (data.features.length > 0) {
      data = {
        address: data.features[0].place_name,
        coords: data.features[0].center,
      };
    } else {
      data = {};
    }
  }

  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=21600, stale-while-revalidate=25200'
    );
  }

  res.json(data);
};

export default Search;
