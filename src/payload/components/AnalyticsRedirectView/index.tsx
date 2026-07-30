import { redirect } from 'next/navigation';

/**
 * The analytics dashboard now lives at the main admin dashboard (`/admin`).
 * This view keeps the old `/admin/analytics` path working by redirecting
 * any bookmarked links to the new location.
 */
export default function AnalyticsRedirectView() {
  redirect('/admin');
}
