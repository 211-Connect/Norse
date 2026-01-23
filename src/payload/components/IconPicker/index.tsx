'use client';

import { useField } from '@payloadcms/ui';
import { useState, useMemo, useRef } from 'react';
import { SUPPORTED_ICONS, SUPPORTED_ICON_NAMES } from '@/utils/supportedIcons';
import { Info } from 'lucide-react';
import './styles.css';

const IconPicker = ({
  field: { label, required = false },
  path,
  readOnly,
}: {
  field: { label: string; required?: boolean };
  path: string;
  readOnly?: boolean;
}) => {
  const { value, setValue } = useField<string>({ path });
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const iconNames = SUPPORTED_ICON_NAMES;

  const filteredIcons = useMemo(() => {
    if (!searchTerm) return iconNames;
    return iconNames.filter((name) =>
      name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm, iconNames]);

  const renderIcon = (iconName: string) => {
    const Icon = SUPPORTED_ICONS[iconName as keyof typeof SUPPORTED_ICONS];
    if (!Icon) return null;
    return <Icon size={20} />;
  };

  const SelectedIcon = value
    ? SUPPORTED_ICONS[value as keyof typeof SUPPORTED_ICONS]
    : null;
  const XIcon = SUPPORTED_ICONS.X;

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="icon-picker" ref={dropdownRef}>
      <div className="icon-picker-label-wrapper">
        <label className="field-label">
          {label} {required && <span className="required">*</span>}
        </label>
        <div
          className="icon-picker-info"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info size={16} />
          {showTooltip && (
            <div className="icon-picker-tooltip">
              Only the most popular icons from Lucide library are available (
              {iconNames.length} icons). Contact support to extend the set with
              additional icons.
            </div>
          )}
        </div>
      </div>

      <div className="icon-picker-input">
        <button
          type="button"
          className="icon-preview-button"
          onClick={() => !readOnly && setIsOpen(!isOpen)}
          disabled={readOnly}
        >
          {SelectedIcon ? (
            <div className="icon-preview-selected">
              <SelectedIcon size={20} />
              <span>{value}</span>
            </div>
          ) : (
            <span className="icon-placeholder">Select an icon...</span>
          )}
        </button>

        {value && !readOnly && (
          <button
            type="button"
            className="icon-clear-button"
            onClick={() => setValue('')}
          >
            Clear
          </button>
        )}
      </div>

      {isOpen && !readOnly && (
        <div className="icon-picker-dropdown">
          <div className="icon-picker-header">
            <div className="icon-picker-search">
              <input
                type="text"
                placeholder="Search icons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="icon-search-input"
                autoFocus
              />
            </div>
            <button
              type="button"
              className="icon-close-button"
              onClick={handleClose}
              aria-label="Close icon picker"
            >
              <XIcon size={20} />
            </button>
          </div>

          <div className="icon-picker-grid">
            {filteredIcons.map((iconName) => (
              <button
                key={iconName}
                type="button"
                className={`icon-item ${value === iconName ? 'selected' : ''}`}
                onClick={() => {
                  setValue(iconName);
                  handleClose();
                }}
                title={iconName}
              >
                {renderIcon(iconName)}
                <span className="icon-name">{iconName}</span>
              </button>
            ))}
          </div>

          {filteredIcons.length === 0 && (
            <div className="icon-no-results">No icons found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default IconPicker;
