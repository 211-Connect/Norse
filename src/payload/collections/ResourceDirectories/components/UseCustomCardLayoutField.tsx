'use client';

import { DEFAULT_SEARCH_CARD_LAYOUT } from '@/app/(app)/features/search/types/card-layout-config';
import { Button, CheckboxInput, useField } from '@payloadcms/ui';

import './UseCustomLayoutField.css';

const UseCustomCardLayoutField = ({
  field,
  path,
  readOnly,
}: {
  field: { label: string; required?: boolean; description?: string };
  path: string;
  readOnly?: boolean;
}) => {
  const { value, setValue } = useField<boolean>({ path });
  const cardLayoutField = useField<typeof DEFAULT_SEARCH_CARD_LAYOUT>({
    path: 'search.cardLayout',
  });

  const handlePopulateDefault = () => {
    setValue(true);
    cardLayoutField.setValue([...DEFAULT_SEARCH_CARD_LAYOUT]);
  };

  const hasCustomLayout =
    Array.isArray(cardLayoutField.value) && cardLayoutField.value.length > 0;

  return (
    <div className="use-custom-resource-layout-wrapper">
      <div>
        <CheckboxInput
          checked={value || false}
          onToggle={(e) => setValue(e.target.checked)}
          readOnly={readOnly}
          label={field.label}
        />
      </div>

      {!readOnly && !hasCustomLayout && (
        <Button onClick={handlePopulateDefault} disabled={readOnly}>
          Populate with Default Layout
        </Button>
      )}
    </div>
  );
};

export default UseCustomCardLayoutField;
