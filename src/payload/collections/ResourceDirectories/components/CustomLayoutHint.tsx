'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './CustomLayoutHint.css';

const CustomLayoutHint = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="custom-layout-hint">
      <button
        type="button"
        className="custom-layout-hint-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="custom-layout-hint-toggle-content">
          <h3 className="custom-layout-hint-title">Custom Attributes Guide</h3>
          <p className="custom-layout-hint-subtitle">
            Use dynamic values from resource data in custom attributes
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp className="custom-layout-hint-toggle-icon" size={20} />
        ) : (
          <ChevronDown className="custom-layout-hint-toggle-icon" size={20} />
        )}
      </button>

      {isExpanded && (
        <div className="custom-layout-hint-content">
          <div className="custom-layout-hint-section">
            <h4 className="custom-layout-hint-section-title">
              Dynamic Property References
            </h4>
            <p className="custom-layout-hint-text">
              Use <code>{'{{ propertyPath }}'}</code> syntax to access resource
              properties. Supports nested paths with dot notation.
            </p>
          </div>

          <div className="custom-layout-hint-section">
            <h4 className="custom-layout-hint-section-title">Example Usage</h4>
            <div className="custom-layout-hint-code-block">
              <pre>
                {`{
  "title": "{{ attribute_values.sitesystem_emailaddress.label }}",
  "description": "{{ attribute_values.sitesystem_emailaddress.value }}",
  "icon": "Mail",
  "iconColor": "#00aaff",
  "url": "mailto:{{ attribute_values.sitesystem_emailaddress.value }}"
}`}
              </pre>
            </div>
          </div>

          <div className="custom-layout-hint-section custom-layout-hint-info">
            <h4 className="custom-layout-hint-section-title">
              Available Fields
            </h4>
            <p className="custom-layout-hint-text">
              All custom attribute fields support dynamic interpolation:{' '}
              <code>title</code>, <code>subtitle</code>,{' '}
              <code>description</code>, and <code>url</code>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomLayoutHint;
