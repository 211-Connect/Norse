export type CsvRow = {
  id: string;
} & Record<string, unknown>;

// CSV parsing utilities
const createRowId = (): string => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `row_${Math.random().toString(36).slice(2, 11)}`;
};

export const parseCSV = (csvText: string): string[][] => {
  const lines = csvText.split('\n').filter((line) => line.trim());
  return lines.map((line) => {
    const result: string[] = [];
    let current = '';
    let inside = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inside && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inside = !inside;
        }
      } else if (char === ',' && !inside) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  });
};

export const escapeCSV = (value: any): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const generateCSV = (
  headers: string[],
  data: Record<string, any>[],
): string => {
  const headerRow = headers.map(escapeCSV).join(',');
  const dataRows = data.map((row) =>
    headers.map((header) => escapeCSV(row[header])).join(','),
  );
  return [headerRow, ...dataRows].join('\n');
};

// Topics CSV utilities
// Template columns: topic, subtopic, query, query_type, new_window
export const parseTopicsCSV = (csvText: string): any[] => {
  const lines = parseCSV(csvText);
  if (lines.length < 2) return [];

  const headers = lines[0].map((h) => h.toLowerCase().replace(/[^a-z_]/g, ''));

  // Group rows into a topic->subtopics structure
  const topicsMap: Map<string, any> = new Map();
  const topicsOrder: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    const item: any = {};
    headers.forEach((header, index) => {
      item[header] = row[index] || '';
    });

    if (!item.topic) continue;

    const topicKey = item.topic;

    if (!topicsMap.has(topicKey)) {
      topicsMap.set(topicKey, {
        id: createRowId(),
        name: topicKey,
        subtopics: [],
      });
      topicsOrder.push(topicKey);
    }

    const topicEntry = topicsMap.get(topicKey);

    if (item.subtopic) {
      topicEntry.subtopics.push({
        id: createRowId(),
        name: item.subtopic,
        queryType: item.query_type || 'taxonomy',
        query: item.query || '',
        newWindow: item.new_window?.toLowerCase() === 'true',
      });
    }
  }

  return topicsOrder.map((key) => topicsMap.get(key));
};

export const generateTopicsCSV = (items: any[]): string => {
  const headers = ['topic', 'subtopic', 'query', 'query_type', 'new_window'];
  const rows: Record<string, string>[] = [];

  for (const topic of items) {
    const subtopics = topic.subtopics || [];

    if (subtopics.length === 0) {
      rows.push({
        topic: topic.name || '',
        subtopic: '',
        query: topic.href || '',
        query_type: topic.href ? 'link' : 'taxonomy',
        new_window: '',
      });
    } else {
      for (const subtopic of subtopics) {
        rows.push({
          topic: topic.name || '',
          subtopic: subtopic.name || '',
          query: subtopic.query || subtopic.href || '',
          query_type: subtopic.queryType || 'taxonomy',
          new_window: subtopic.newWindow ? 'true' : '',
        });
      }
    }
  }

  return generateCSV(headers, rows);
};

// Suggestions CSV utilities
// Template columns: topic, query
export const parseSuggestionsCSV = (csvText: string): any[] => {
  const lines = parseCSV(csvText);
  if (lines.length < 2) return [];

  const headers = lines[0].map((h) => h.toLowerCase().trim());
  const items: Array<{ id: string; value: string; taxonomies: string }> = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    const item: any = {};

    headers.forEach((header, index) => {
      item[header] = row[index] || '';
    });

    // Only add non-empty rows
    if (item.topic) {
      items.push({
        id: createRowId(),
        value: item.topic,
        taxonomies: item.query || '',
      });
    }
  }

  return items;
};

export const generateSuggestionsCSV = (items: any[]): string => {
  const headers = ['topic', 'query'];
  const data = items.map((item) => ({
    topic: item.value || '',
    query: item.taxonomies || '',
  }));
  return generateCSV(headers, data);
};

// Facets CSV utilities
export const parseFacetsCSV = (csvText: string): any[] => {
  const lines = parseCSV(csvText);
  if (lines.length < 2) return [];

  const headers = lines[0].map((h) => h.toLowerCase());
  const parseValueOrder = (raw: string): string[] =>
    raw
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean);

  const getSortByValue = (
    raw: string,
  ): 'count' | 'name' | 'valueOrder' | 'dayOfWeek' => {
    const normalized = raw.toLowerCase();
    if (normalized === 'name') return 'name';
    if (normalized === 'valueorder') return 'valueOrder';
    if (normalized === 'dayofweek') return 'dayOfWeek';
    return 'count';
  };

  const items: Array<{
    id: string;
    name: string;
    facet: string;
    showInDetails: boolean;
    sortBy: 'count' | 'name' | 'valueOrder' | 'dayOfWeek';
    valueOrder: { value: string }[];
  }> = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    const item: any = {};

    headers.forEach((header, index) => {
      const rawValue = row[index] || '';
      if (header === 'showindetails') {
        item[header] = rawValue.toLowerCase() === 'true';
      } else if (header === 'sortby') {
        item[header] = getSortByValue(rawValue);
      } else if (header === 'valueorder') {
        item[header] = parseValueOrder(rawValue);
      } else {
        item[header] = rawValue;
      }
    });

    // Only add non-empty rows
    if (item.name || item.facet) {
      items.push({
        id: createRowId(),
        name: item.name || '',
        facet: item.facet || '',
        showInDetails: item.showindetails !== false,
        sortBy: getSortByValue(item.sortby || ''),
        valueOrder: (item.valueorder || []).map((value: string) => ({ value })),
      });
    }
  }

  return items;
};

export const generateFacetsCSV = (items: any[]): string => {
  const headers = ['name', 'facet', 'showInDetails', 'sortBy', 'valueOrder'];
  const data = items.map((item) => ({
    name: item.name || '',
    facet: item.facet || '',
    showInDetails: item.showInDetails ? 'true' : 'false',
    sortBy:
      item.sortBy === 'name'
        ? 'name'
        : item.sortBy === 'valueOrder'
          ? 'valueOrder'
          : item.sortBy === 'dayOfWeek'
            ? 'dayOfWeek'
            : 'count',
    valueOrder: (item.valueOrder || [])
      .map((entry: any) => entry?.value)
      .filter(Boolean)
      .join('|'),
  }));
  return generateCSV(headers, data);
};
