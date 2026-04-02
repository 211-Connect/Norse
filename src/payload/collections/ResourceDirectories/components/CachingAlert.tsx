'use client';

import React from 'react';
import './CachingAlert.css';

const CachingAlert: React.FC = () => {
  return (
    <div className="caching-alert">
      <div className="caching-alert-icon">ℹ️</div>
      <div className="caching-alert-content">
        <p className="caching-alert-text">
          Due to high traffic, the system uses caching to ensure optimal
          performance. Most changes to UI settings will be visible immediately
          on the live site. However, some changes may take up to{' '}
          <strong>1 minute</strong> to fully propagate across all cached layers.
        </p>
      </div>
    </div>
  );
};

export default CachingAlert;
