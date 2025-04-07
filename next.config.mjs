import { withPayload } from '@payloadcms/next/withPayload';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig = {};

const withNextIntl = createNextIntlPlugin();
export default withPayload(withNextIntl(nextConfig));
