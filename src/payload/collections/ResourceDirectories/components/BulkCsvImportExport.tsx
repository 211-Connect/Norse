'use client';

import { Button, useField, useForm, useFormFields } from '@payloadcms/ui';
import { useCallback, useMemo } from 'react';

import './BulkEditButtons.css';
import {
  type CsvRow,
  generateCSV,
  generateFacetsCSV,
  generateSuggestionsCSV,
  generateTopicsCSV,
  parseFacetsCSV,
  parseSuggestionsCSV,
  parseTopicsCSV,
} from './csvUtils';

type BulkCsvKind = 'topics' | 'suggestions' | 'facets';

interface BulkCsvImportExportProps {
  kind: BulkCsvKind;
}

const BULK_CSV_CONFIG: Record<
  BulkCsvKind,
  {
    fieldPath: string;
    templateFileName: string;
    exportFilePrefix: string;
    itemLabel: string;
    templateCSV: string;
    parseCSV: (csvText: string) => CsvRow[];
    generateCSV: (items: CsvRow[]) => string;
  }
> = {
  topics: {
    fieldPath: 'topics.list',
    templateFileName: 'topics-template.csv',
    exportFilePrefix: 'topics',
    itemLabel: 'topics',
    templateCSV: generateCSV(
      ['topic', 'subtopic', 'query', 'query_type', 'new_window'],
      [
        {
          topic: 'Food',
          subtopic: 'Food Pantries/Banks',
          query: 'BD-1800.2000',
          query_type: 'taxonomy',
          new_window: '',
        },
        {
          topic: 'Transportation',
          subtopic: 'Bus Fare',
          query: 'BT-8300.1000',
          query_type: 'taxonomy',
          new_window: '',
        },
      ],
    ),
    parseCSV: parseTopicsCSV,
    generateCSV: generateTopicsCSV,
  },
  suggestions: {
    fieldPath: 'suggestions',
    templateFileName: 'suggestions-template.csv',
    exportFilePrefix: 'suggestions',
    itemLabel: 'suggestions',
    templateCSV: generateCSV(
      ['topic', 'query'],
      [
        {
          topic: 'I need food.',
          query: 'BD',
        },
        {
          topic: 'I need transportation.',
          query: 'BT-4500',
        },
      ],
    ),
    parseCSV: parseSuggestionsCSV,
    generateCSV: generateSuggestionsCSV,
  },
  facets: {
    fieldPath: 'search.facets',
    templateFileName: 'facets-template.csv',
    exportFilePrefix: 'facets',
    itemLabel: 'facets',
    templateCSV: generateCSV(
      ['name', 'facet', 'showInDetails', 'sortBy', 'valueOrder'],
      [
        {
          name: 'Hours of Operation',
          facet: 'hours',
          showInDetails: 'true',
          sortBy: 'count',
          valueOrder: '',
        },
        {
          name: 'Days Of The Week',
          facet: 'daysofweek',
          showInDetails: 'false',
          sortBy: 'valueOrder',
          valueOrder:
            'Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday',
        },
      ],
    ),
    parseCSV: parseFacetsCSV,
    generateCSV: generateFacetsCSV,
  },
};

const BulkCsvImportExport: React.FC<BulkCsvImportExportProps> = ({ kind }) => {
  const {
    fieldPath,
    templateFileName,
    exportFilePrefix,
    parseCSV,
    generateCSV,
    itemLabel,
    templateCSV,
  } = BULK_CSV_CONFIG[kind];

  const { removeFieldRow, setModified } = useForm();
  const { setValue } = useField<CsvRow[]>({ path: fieldPath });
  const formFields = useFormFields(([fields]) => fields);

  const inputId = `${exportFilePrefix}-import`;

  type FormFieldState = Record<string, unknown>;
  type FormRowMeta = Record<string, unknown>;

  const getField = useCallback(
    (path: string): FormFieldState | undefined =>
      formFields[path] as FormFieldState | undefined,
    [formFields],
  );

  const getFieldValue = useCallback(
    (path: string): unknown => getField(path)?.value,
    [getField],
  );

  const getFieldRows = useCallback(
    (path: string): FormRowMeta[] => {
      const rows = getField(path)?.rows;
      return Array.isArray(rows) ? (rows as FormRowMeta[]) : [];
    },
    [getField],
  );

  const toStringValue = (value: unknown): string =>
    value === null || value === undefined ? '' : String(value);

  const getRowPath = useCallback(
    (row: FormRowMeta): string => toStringValue(row.lastRenderedPath),
    [],
  );

  const getRowId = useCallback(
    (row: FormRowMeta, fallback: string): string =>
      toStringValue(row.id) || fallback,
    [],
  );

  const getRowFieldValue = useCallback(
    (rowPath: string, fieldName: string): string =>
      toStringValue(getFieldValue(`${rowPath}.${fieldName}`)),
    [getFieldValue],
  );

  const mapRows = useCallback(
    <T,>(
      rows: FormRowMeta[],
      mapper: (row: FormRowMeta, index: number) => T,
    ): T[] => rows.map(mapper),
    [],
  );

  const itemsToExport = useMemo((): CsvRow[] => {
    if (kind === 'suggestions') {
      return mapRows(getFieldRows(fieldPath), (row, index) => {
        const rowPath = getRowPath(row);
        return {
          id: getRowId(row, `suggestion-${index}`),
          value: getRowFieldValue(rowPath, 'value'),
          taxonomies: getRowFieldValue(rowPath, 'taxonomies'),
        };
      });
    }

    if (kind === 'facets') {
      return mapRows(getFieldRows(fieldPath), (row, index) => {
        const rowPath = getRowPath(row);
        return {
          id: getRowId(row, `facet-${index}`),
          name: getRowFieldValue(rowPath, 'name'),
          facet: getRowFieldValue(rowPath, 'facet'),
          showInDetails: Boolean(getFieldValue(`${rowPath}.showInDetails`)),
          sortBy: getRowFieldValue(rowPath, 'sortBy') || 'count',
          valueOrder: mapRows(
            getFieldRows(`${rowPath}.valueOrder`),
            (valueRow) => {
              const valuePath = getRowPath(valueRow);
              return {
                value: getRowFieldValue(valuePath, 'value'),
              };
            },
          ),
        };
      });
    }

    return mapRows(getFieldRows(fieldPath), (topicRow, topicIndex) => {
      const topicPath = getRowPath(topicRow);
      const subtopicRows = getFieldRows(`${topicPath}.subtopics`);

      const subtopics = mapRows(subtopicRows, (subtopicRow, subtopicIndex) => {
        const subtopicPath = getRowPath(subtopicRow);
        return {
          id: getRowId(subtopicRow, `subtopic-${topicIndex}-${subtopicIndex}`),
          name: getRowFieldValue(subtopicPath, 'name'),
          queryType: getRowFieldValue(subtopicPath, 'queryType') || 'taxonomy',
          query: getRowFieldValue(subtopicPath, 'query'),
          href: getRowFieldValue(subtopicPath, 'href'),
          newWindow: Boolean(getFieldValue(`${subtopicPath}.openInNewTab`)),
        };
      });

      return {
        id: getRowId(topicRow, `topic-${topicIndex}`),
        name: getRowFieldValue(topicPath, 'name'),
        href: getRowFieldValue(topicPath, 'href'),
        subtopics,
      };
    });
  }, [
    fieldPath,
    getFieldRows,
    getFieldValue,
    getRowFieldValue,
    getRowId,
    getRowPath,
    kind,
    mapRows,
  ]);

  const hasItems = itemsToExport.length > 0;

  const downloadCSV = useCallback((csv: string, fileName: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const handleDownloadTemplate = useCallback(() => {
    downloadCSV(templateCSV, templateFileName);
  }, [downloadCSV, templateCSV, templateFileName]);

  const handleImport = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedItems = parseCSV(text);

        if (importedItems.length === 0) {
          alert('CSV file must contain valid data');
          return;
        }

        setValue(importedItems);
        setModified(true);
        alert(`Successfully imported ${importedItems.length} ${itemLabel}`);
      } catch (error) {
        console.error('Error importing CSV:', error);
        alert('Error importing CSV. Please check the file format.');
      }

      event.target.value = '';
    },
    [itemLabel, parseCSV, setModified, setValue],
  );

  const handleClear = useCallback(() => {
    const rows = getFieldRows(fieldPath);

    for (let index = rows.length - 1; index >= 0; index -= 1) {
      removeFieldRow({ path: fieldPath, rowIndex: index });
    }
  }, [fieldPath, getFieldRows, removeFieldRow]);

  const handleExport = useCallback(() => {
    try {
      if (itemsToExport.length === 0) {
        alert(`No ${itemLabel} to export`);
        return;
      }

      const csv = generateCSV(itemsToExport);
      downloadCSV(
        csv,
        `${exportFilePrefix}-export-${new Date().toISOString().split('T')[0]}.csv`,
      );
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting CSV');
    }
  }, [downloadCSV, exportFilePrefix, generateCSV, itemLabel, itemsToExport]);

  return (
    <div className="bulk-edit-container">
      <div className="description">
        <p>Bulk import or export values using a preset CSV template.</p>
        <button onClick={handleDownloadTemplate} className="template-link">
          Download Template CSV
        </button>
      </div>
      <div className="button-group">
        <input
          type="file"
          id={inputId}
          accept=".csv"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
        <Button
          onClick={handleClear}
          buttonStyle="secondary"
          size="small"
          disabled={!hasItems}
        >
          Clear
        </Button>
        <Button
          onClick={() => document.getElementById(inputId)?.click()}
          buttonStyle="secondary"
          size="small"
          disabled={hasItems}
        >
          Import
        </Button>
        <Button onClick={handleExport} buttonStyle="secondary" size="small">
          Export
        </Button>
      </div>
    </div>
  );
};

export default BulkCsvImportExport;
