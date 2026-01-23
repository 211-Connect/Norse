'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './BadgeHint.css';

const BadgeHint = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="badge-hint">
      <button
        type="button"
        className="badge-hint-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="badge-hint-toggle-content">
          <h3 className="badge-hint-title">Badge Configuration Guide</h3>
          <p className="badge-hint-subtitle">
            Create custom badges that automatically appear on resources based on
            their facet data
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp className="badge-hint-toggle-icon" size={20} />
        ) : (
          <ChevronDown className="badge-hint-toggle-icon" size={20} />
        )}
      </button>

      {isExpanded && (
        <div className="badge-hint-content">
          <div className="badge-hint-section">
            <h4 className="badge-hint-section-title">How Badges Work</h4>
            <p className="badge-hint-text">
              Badges are visual indicators that highlight specific resource
              attributes. They automatically appear on resource cards in search
              results when a resource&apos;s facets match your configured
              filters.
            </p>
          </div>

          <div className="badge-hint-section">
            <h4 className="badge-hint-section-title">Understanding Facets</h4>
            <p className="badge-hint-text">
              Each resource has facets - categorized metadata that describes
              various attributes. Facets contain both translated and English
              values:
            </p>
            <div className="badge-hint-code-block">
              <pre>
                {`{
  taxonomyNameEn: "Area Served by County",
  taxonomyName: "Área atendida por condado",
  termNameEn: "Ramsey County"
  termName: "Condado de Ramsey",
}`}
              </pre>
            </div>
          </div>

          <div className="badge-hint-section">
            <h4 className="badge-hint-section-title">
              Creating Filter Conditions
            </h4>
            <p className="badge-hint-text">
              Use filter expressions to define when a badge should appear.
              Reference facet properties using double curly braces:{' '}
              <code>{'{{propertyName}}'}</code>
            </p>

            <div className="badge-hint-subsection">
              <strong>Available Properties:</strong>
              <ul className="badge-hint-list">
                <li>
                  <code>{'{{taxonomyNameEn}}'}</code> - Category name (English)
                </li>
                <li>
                  <code>{'{{taxonomyName}}'}</code> - Category name (translated)
                </li>
                <li>
                  <code>{'{{termNameEn}}'}</code> - Term name (English)
                </li>
                <li>
                  <code>{'{{termName}}'}</code> - Term name (translated)
                </li>
              </ul>
            </div>

            <div className="badge-hint-subsection">
              <strong>Supported Operators:</strong>
              <ul className="badge-hint-list">
                <li>
                  <code>Is</code> - Exact match
                </li>
                <li>
                  <code>IsNot</code> - Not equal to
                </li>
                <li>
                  <code>Contains</code> - Includes substring
                </li>
                <li>
                  <code>DoesNotContain</code> - Does not include substring
                </li>
                <li>
                  <code>StartsWith</code> - Begins with text
                </li>
                <li>
                  <code>EndsWith</code> - Ends with text
                </li>
                <li>
                  <code>IsEmpty</code> - Field has no value
                </li>
                <li>
                  <code>IsNotEmpty</code> - Field has a value
                </li>
              </ul>
            </div>

            <div className="badge-hint-subsection">
              <strong>Logical Operators:</strong>
              <ul className="badge-hint-list">
                <li>
                  <code>AND</code> - All conditions must be true
                </li>
                <li>
                  <code>OR</code> - At least one condition must be true
                </li>
              </ul>
            </div>
          </div>

          <div className="badge-hint-section">
            <h4 className="badge-hint-section-title">Filter Examples</h4>
            <div className="badge-hint-examples">
              <div className="badge-hint-example">
                <strong>County Services:</strong>
                <code>{'{{termNameEn}} Contains "County"'}</code>
                <p>Matches any term containing &ldquo;County&rdquo;</p>
              </div>
              <div className="badge-hint-example">
                <strong>Multiple Counties:</strong>
                <code>
                  {
                    '{{taxonomyNameEn}} Is "Area Served by County" AND ({{termNameEn}} Is "Ramsey County" OR {{termNameEn}} Is "Hennepin County")'
                  }
                </code>
                <p>Advanced: Uses nested parentheses for complex logic</p>
              </div>
            </div>
          </div>

          <div className="badge-hint-section">
            <h4 className="badge-hint-section-title">Nested Operations</h4>
            <p className="badge-hint-text">
              For complex filters, you can use parentheses to group conditions.
              Use the Text mode in the filter builder for nested operations like{' '}
              <code>(X AND Y) OR Z</code>.
            </p>
            <div className="badge-hint-examples">
              <div className="badge-hint-example">
                <code>{'(A AND B) OR C'}</code>
                <p>
                  Match resources where (A and B are both true) or C is true
                </p>
              </div>
              <div className="badge-hint-example">
                <code>{'A AND (B OR C)'}</code>
                <p>Match resources where A is true and either B or C is true</p>
              </div>
            </div>
          </div>

          <div className="badge-hint-section">
            <h4 className="badge-hint-section-title">
              Dynamic Labels & Tooltips
            </h4>
            <p className="badge-hint-text">
              Use the same <code>{'{{propertyName}}'}</code> syntax in label and
              tooltip fields to display dynamic content from matching facets.
              This is especially useful for localization.
            </p>
            <div className="badge-hint-examples">
              <div className="badge-hint-example">
                <strong>Label:</strong> <code>{'{{termName}}'}</code>
                <p>Displays the translated term name on the badge</p>
              </div>
              <div className="badge-hint-example">
                <strong>Tooltip:</strong>{' '}
                <code>{'Category: {{taxonomyName}}'}</code>
                <p>Shows category context on hover</p>
              </div>
            </div>
          </div>

          <div className="badge-hint-section badge-hint-warning">
            <h4 className="badge-hint-section-title">Best Practices</h4>
            <ul className="badge-hint-list">
              <li>
                Use English properties (<code>taxonomyNameEn</code>,{' '}
                <code>termNameEn</code>) in filters for consistency across
                locales
              </li>
              <li>
                Use translated properties (<code>taxonomyName</code>,{' '}
                <code>termName</code>) in labels for proper localization
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeHint;
