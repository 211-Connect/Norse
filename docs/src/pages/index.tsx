import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <div
          style={{
            backgroundColor: '#EBE9EF',
            width: '100%',
            maxWidth: '800px',
            margin: '0 auto',
            boxShadow: '0 0 10px rgba(0,0,0,0.4)',
            borderRadius: '6px',
            marginBottom: '2rem',
            overflow: 'hidden',
          }}
        >
          <img src="/img/cropped-screenshot.png" width="100%" height="auto" />
        </div>
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="The modern search engine for community resources."
    >
      <HomepageHeader />
    </Layout>
  );
}
