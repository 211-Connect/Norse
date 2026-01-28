'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Eye, Code } from 'lucide-react';
import { useField } from '@payloadcms/ui';
import type { FilterCondition } from '@/utils/badgeFilterEvaluator';
import {
  parseFilter,
  validateFilterStructure,
} from '@/utils/badgeFilterEvaluator';
import './style.css';

interface FilterBuilderProps {
  path: string;
}

const PROPERTIES = [
  { value: 'taxonomyNameEn', label: 'Taxonomy (English)', color: '#3B82F6' },
  { value: 'taxonomyName', label: 'Taxonomy (Translated)', color: '#3B82F6' },
  { value: 'termNameEn', label: 'Term (English)', color: '#10B981' },
  { value: 'termName', label: 'Term (Translated)', color: '#10B981' },
] as const;

const OPERATORS = [
  { value: 'Is', label: 'Is', requiresValue: true },
  { value: 'Is not', label: 'Is not', requiresValue: true },
  { value: 'Contains', label: 'Contains', requiresValue: true },
  { value: 'Does not contain', label: 'Does not contain', requiresValue: true },
  { value: 'Starts with', label: 'Starts with', requiresValue: true },
  { value: 'Ends with', label: 'Ends with', requiresValue: true },
  { value: 'Is empty', label: 'Is empty', requiresValue: false },
  { value: 'Is not empty', label: 'Is not empty', requiresValue: false },
] as const;

export const FilterBuilder = ({ path }: FilterBuilderProps) => {
  const { value, setValue } = useField<string>({ path });
  const [mode, setMode] = useState<'visual' | 'text'>('visual');
  const [conditions, setConditions] = useState<FilterCondition[]>([
    { property: 'taxonomyNameEn', operator: 'Is', value: '' },
  ]);
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND');
  const [textValue, setTextValue] = useState(value || '');
  const [validationError, setValidationError] = useState<string>('');

  // Parse initial value
  useEffect(() => {
    if (value && value.trim()) {
      try {
        const parsed = parseFilter(value);
        setConditions(parsed.conditions);
        setLogic(parsed.logic);
        setTextValue(value);
        setValidationError('');
      } catch (error) {
        setTextValue(value);
        setValidationError(
          error instanceof Error ? error.message : 'Invalid filter',
        );
      }
    }
  }, [value]);

  // Generate filter string from conditions
  const generateFilterString = (): string => {
    return conditions
      .map((condition) => {
        const needsQuotes =
          condition.value &&
          !['Is empty', 'Is not empty'].includes(condition.operator);
        const valueStr = needsQuotes ? `"${condition.value}"` : condition.value;

        if (['Is empty', 'Is not empty'].includes(condition.operator)) {
          return `{{${condition.property}}} ${condition.operator}`;
        }

        return `{{${condition.property}}} ${condition.operator} ${valueStr}`;
      })
      .join(` ${logic} `);
  };

  // Update parent when conditions change
  useEffect(() => {
    if (mode === 'visual') {
      const filterString = generateFilterString();
      setTextValue(filterString);

      try {
        const parsed = parseFilter(filterString);
        validateFilterStructure(parsed);
        setValidationError('');
        setValue(filterString);
      } catch (error) {
        setValidationError(
          error instanceof Error ? error.message : 'Invalid filter',
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conditions, logic, mode]);

  const handleTextChange = (newValue: string) => {
    setTextValue(newValue);

    if (!newValue.trim()) {
      setValidationError('');
      setValue(newValue);
      return;
    }

    try {
      const parsed = parseFilter(newValue);
      validateFilterStructure(parsed);
      setConditions(parsed.conditions);
      setLogic(parsed.logic);
      setValidationError('');
      setValue(newValue);
    } catch (error) {
      setValidationError(
        error instanceof Error ? error.message : 'Invalid filter',
      );
      setValue(newValue);
    }
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      { property: 'taxonomyNameEn', operator: 'Is', value: '' },
    ]);
  };

  const removeCondition = (index: number) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((_, i) => i !== index));
    }
  };

  const updateCondition = (
    index: number,
    updates: Partial<FilterCondition>,
  ) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    setConditions(newConditions);
  };

  const getPropertyColor = (property: string) => {
    return PROPERTIES.find((p) => p.value === property)?.color || '#6B7280';
  };

  return (
    <div className="filter-builder">
      <div className="filter-builder-header">
        <div className="filter-builder-tabs">
          <button
            type="button"
            className={`filter-builder-tab ${mode === 'visual' ? 'active' : ''}`}
            onClick={() => setMode('visual')}
          >
            <GripVertical size={14} />
            Visual
          </button>
          <button
            type="button"
            className={`filter-builder-tab ${mode === 'text' ? 'active' : ''}`}
            onClick={() => setMode('text')}
          >
            <Code size={14} />
            Text
          </button>
        </div>
      </div>

      {mode === 'visual' ? (
        <div className="filter-builder-visual">
          <div className="filter-builder-logic">
            <span className="filter-builder-logic-label">Match</span>
            <select
              value={logic}
              onChange={(e) => setLogic(e.target.value as 'AND' | 'OR')}
              className="filter-builder-logic-select"
            >
              <option value="AND">ALL (AND)</option>
              <option value="OR">ANY (OR)</option>
            </select>
          </div>

          <div className="filter-builder-conditions">
            {conditions.map((condition, index) => (
              <div key={index} className="filter-builder-condition">
                <div className="filter-builder-condition-grip">
                  <GripVertical size={14} />
                </div>

                <div className="filter-builder-condition-fields">
                  <select
                    value={condition.property}
                    onChange={(e) =>
                      updateCondition(index, { property: e.target.value })
                    }
                    className="filter-builder-select filter-builder-property"
                    style={{
                      borderColor: getPropertyColor(condition.property),
                      backgroundColor: `${getPropertyColor(condition.property)}10`,
                    }}
                  >
                    {PROPERTIES.map((prop) => (
                      <option key={prop.value} value={prop.value}>
                        {prop.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={condition.operator}
                    onChange={(e) => {
                      const newOperator = e.target
                        .value as FilterCondition['operator'];
                      const requiresValue = OPERATORS.find(
                        (op) => op.value === newOperator,
                      )?.requiresValue;

                      updateCondition(index, {
                        operator: newOperator,
                        value: requiresValue ? condition.value : '',
                      });
                    }}
                    className="filter-builder-select filter-builder-operator"
                  >
                    {OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  {OPERATORS.find((op) => op.value === condition.operator)
                    ?.requiresValue && (
                    <input
                      type="text"
                      value={condition.value}
                      onChange={(e) =>
                        updateCondition(index, { value: e.target.value })
                      }
                      placeholder="Enter value..."
                      className="filter-builder-input filter-builder-value"
                    />
                  )}
                </div>

                {conditions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCondition(index)}
                    className="filter-builder-remove"
                    title="Remove condition"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addCondition}
            className="filter-builder-add-condition"
          >
            <Plus size={14} />
            Add Condition
          </button>

          <div className="filter-builder-preview">
            <div className="filter-builder-preview-header">
              <Eye size={12} />
              <span>Preview</span>
            </div>
            <code className="filter-builder-preview-code">
              {generateFilterString()}
            </code>
          </div>
        </div>
      ) : (
        <div className="filter-builder-text">
          <textarea
            value={textValue}
            onChange={(e) => handleTextChange(e.target.value)}
            className="filter-builder-textarea"
            placeholder='Example: {{taxonomyNameEn}} Is "Payment" AND {{termNameEn}} Contains "County"'
            rows={2}
          />
        </div>
      )}

      {validationError && (
        <div className="filter-builder-error">
          <span className="filter-builder-error-icon">⚠️</span>
          {validationError}
        </div>
      )}

      {!validationError && textValue && (
        <div className="filter-builder-success">
          <span className="filter-builder-success-icon">✓</span>
          Filter is valid
        </div>
      )}
    </div>
  );
};

export default FilterBuilder;
