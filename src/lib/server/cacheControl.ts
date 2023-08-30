import { GetServerSidePropsContext } from 'next';

const isProduction = process.env.NODE_ENV === 'production';
export function cacheControl(ctx: GetServerSidePropsContext) {
  if (isProduction) {
    ctx.res.setHeader(
      'Cache-Control',
      'public, max-age=60, s-maxage=60, stale-while-revalidate=60'
    );
  }
}
