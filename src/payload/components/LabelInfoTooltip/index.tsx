'use client';

import { Tooltip, FieldLabel } from '@payloadcms/ui';
import { useRef, useState } from 'react';
import type { TextFieldLabelClientComponent } from 'payload';

import './styles.css';
import { InfoIcon } from 'lucide-react';

const TOOLTIP_MAPPER: Record<string, string> = {
  favicon: "A small icon displayed in user's browser",
  openGraph: 'The image used when sharing over social media',
  query:
    'Use a comma to separate taxonomy codes in a list. Example: BD-1800,BD-2000',
  taxonomies:
    'Use a comma to separate taxonomy codes in a list. Example: BD-1800,BD-2000',
};

const LabelInfoTooltip: TextFieldLabelClientComponent = ({ field, path }) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const infoIconRef = useRef<HTMLDivElement>(null);

  const tooltipContent = TOOLTIP_MAPPER[field?.name ?? ''];

  return (
    <>
      <div
        className="label-info-tooltip"
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
      >
        <div className="label-info-tooltip-content">
          <FieldLabel
            label={field?.label || field?.name}
            path={path}
            required={field?.required}
          />
          <div ref={infoIconRef} className="label-info-tooltip-icon-wrapper">
            <InfoIcon className="label-info-tooltip-icon" />
            {tooltipContent && (
              <Tooltip
                boundingRef={infoIconRef}
                position="top"
                show={tooltipVisible}
                staticPositioning
                className="label-info-tooltip-tooltip"
              >
                {tooltipContent}
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LabelInfoTooltip;
