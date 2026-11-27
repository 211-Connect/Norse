import Link from 'next/link';

import type { LandingCrumb } from '../server/landing-page-data';

/**
 * Breadcrumbs (Home › Topic › State › County › City), the H1 and the intro,
 * above a landing page's results (docs/landing-pages.md, "The page").
 */
export function LandingHeader({
  crumbs,
  crumbsLabel,
  h1,
  intro,
}: {
  crumbs: LandingCrumb[];
  crumbsLabel: string;
  h1: string;
  intro: string;
}) {
  return (
    <header className="flex flex-col gap-2 px-1 pt-1 print:hidden">
      <nav aria-label={crumbsLabel}>
        <ol className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
          {crumbs.map((crumb, index) => (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && <span aria-hidden="true">›</span>}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground underline-offset-2 hover:underline"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-foreground">
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <h1 className="text-xl leading-tight font-semibold text-balance">{h1}</h1>
      {intro && (
        <p className="text-muted-foreground text-sm text-pretty">{intro}</p>
      )}
    </header>
  );
}
