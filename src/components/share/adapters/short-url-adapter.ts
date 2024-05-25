import axios from 'axios';

export default function ShortUrlAdapter() {
  return {
    createShortUrl: async (url: string): Promise<{ url: string }> => {
      const { data } = await axios.post(`/api/short-url`, {
        url,
      });

      return data;
    },
  };
}
