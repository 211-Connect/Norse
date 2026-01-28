import { FacetWithTranslation } from '@/types/resource';

export interface FilterCondition {
  property: string;
  operator:
    | 'Is'
    | 'Is not'
    | 'Contains'
    | 'Does not contain'
    | 'Starts with'
    | 'Ends with'
    | 'Is empty'
    | 'Is not empty';
  value: string;
}

export interface FilterExpression {
  conditions: FilterCondition[];
  logic: 'AND' | 'OR';
}

/**
 * Parse a filter string into a structured FilterExpression
 * Example: "{{taxonomyNameEn}} Is "Payment" AND {{termNameEn}} Contains "County""
 */
export function parseFilter(filterString: string): FilterExpression {
  if (!filterString || !filterString.trim()) {
    throw new Error('Filter cannot be empty');
  }

  const trimmed = filterString.trim();

  // Detect logic operator (default to AND if not specified)
  let logic: 'AND' | 'OR' = 'AND';
  let conditionStrings: string[] = [];

  // Check for OR first (case-insensitive)
  if (/ OR /i.test(trimmed)) {
    logic = 'OR';
    conditionStrings = trimmed.split(/ OR /i);
  } else if (/ AND /i.test(trimmed)) {
    logic = 'AND';
    conditionStrings = trimmed.split(/ AND /i);
  } else {
    // Single condition
    conditionStrings = [trimmed];
  }

  const conditions: FilterCondition[] = conditionStrings.map((condStr) => {
    const condition = parseCondition(condStr.trim());
    if (!condition) {
      throw new Error(`Invalid condition: ${condStr}`);
    }
    return condition;
  });

  if (conditions.length === 0) {
    throw new Error('Filter must contain at least one condition');
  }

  return { conditions, logic };
}

/**
 * Parse a single condition string
 * Example: '{{taxonomyNameEn}} Is "Payment"'
 */
function parseCondition(conditionStr: string): FilterCondition | null {
  // Extract property name from {{propertyName}}
  const propertyMatch = conditionStr.match(/\{\{(\w+)\}\}/);
  if (!propertyMatch) {
    throw new Error(
      `Property not found. Use {{propertyName}} syntax. Got: ${conditionStr}`,
    );
  }

  const property = propertyMatch[1];

  // Valid property names
  const validProperties = [
    'code',
    'taxonomyName',
    'termName',
    'taxonomyNameEn',
    'termNameEn',
  ];
  if (!validProperties.includes(property)) {
    throw new Error(
      `Invalid property: ${property}. Valid properties are: ${validProperties.join(', ')}`,
    );
  }

  // Remove the property reference to get the rest
  const rest = conditionStr.replace(/\{\{\w+\}\}\s*/, '').trim();

  // Check for "Is empty" or "Is not empty" operators
  if (/^Is empty$/i.test(rest)) {
    return { property, operator: 'Is empty', value: '' };
  }
  if (/^Is not empty$/i.test(rest)) {
    return { property, operator: 'Is not empty', value: '' };
  }

  // Parse operator and value for other operators
  const operators = [
    'Is not',
    'Is',
    'Does not contain',
    'Contains',
    'Starts with',
    'Ends with',
  ];

  for (const op of operators) {
    const regex = new RegExp(`^${op}\\s+(.+)$`, 'i');
    const match = rest.match(regex);

    if (match) {
      let value = match[1].trim();

      // Remove surrounding quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      return {
        property,
        operator: op as FilterCondition['operator'],
        value,
      };
    }
  }

  throw new Error(`Invalid operator in condition: ${conditionStr}`);
}

/**
 * Evaluate a filter expression against a facet
 */
export function evaluateFilter(
  filter: FilterExpression,
  facet: FacetWithTranslation,
): boolean {
  const results = filter.conditions.map((condition) =>
    evaluateCondition(condition, facet),
  );

  if (filter.logic === 'AND') {
    return results.every((result) => result);
  } else {
    return results.some((result) => result);
  }
}

/**
 * Evaluate a single condition against a facet
 */
function evaluateCondition(
  condition: FilterCondition,
  facet: FacetWithTranslation,
): boolean {
  const propertyValue = String(
    facet[condition.property as keyof FacetWithTranslation] || '',
  ).toLowerCase();
  const conditionValue = condition.value.toLowerCase();

  switch (condition.operator) {
    case 'Is':
      return propertyValue === conditionValue;

    case 'Is not':
      return propertyValue !== conditionValue;

    case 'Contains':
      return propertyValue.includes(conditionValue);

    case 'Does not contain':
      return !propertyValue.includes(conditionValue);

    case 'Starts with':
      return propertyValue.startsWith(conditionValue);

    case 'Ends with':
      return propertyValue.endsWith(conditionValue);

    case 'Is empty':
      return !propertyValue || propertyValue.trim() === '';

    case 'Is not empty':
      return !!propertyValue && propertyValue.trim() !== '';

    default:
      return false;
  }
}

/**
 * Interpolate property references in a template string
 * Example: "Category: {{taxonomyName}}" with facet.taxonomyName = "Payment"
 * Returns: "Category: Payment"
 */
export function interpolateProperties(
  template: string,
  facet: FacetWithTranslation,
): string {
  if (!template) return '';

  return template.replace(/\{\{(\w+)\}\}/g, (match, property) => {
    const value = facet[property as keyof FacetWithTranslation];
    return value !== undefined && value !== null ? String(value) : match;
  });
}

/**
 * Validate filter structure without requiring a facet
 * Used for admin validation
 */
export function validateFilterStructure(filter: FilterExpression): void {
  if (!filter.conditions || filter.conditions.length === 0) {
    throw new Error('Filter must contain at least one condition');
  }

  filter.conditions.forEach((condition, index) => {
    if (!condition.property) {
      throw new Error(`Condition ${index + 1}: Property is required`);
    }

    if (!condition.operator) {
      throw new Error(`Condition ${index + 1}: Operator is required`);
    }

    // Value is required for all operators except "Is empty" and "Is not empty"
    if (
      !['Is empty', 'Is not empty'].includes(condition.operator) &&
      condition.value === undefined
    ) {
      throw new Error(`Condition ${index + 1}: Value is required`);
    }
  });

  if (!['AND', 'OR'].includes(filter.logic)) {
    throw new Error('Logic must be either AND or OR');
  }
}
