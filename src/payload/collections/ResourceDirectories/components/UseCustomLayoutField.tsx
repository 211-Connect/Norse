'use client';

import { Button, CheckboxInput, useField } from '@payloadcms/ui';
import { DEFAULT_RESOURCE_LAYOUT } from '@/app/(app)/features/resource/types/layout-config';
import './UseCustomLayoutField.css';

const UseCustomLayoutField = ({
  field,
  path,
  readOnly,
}: {
  field: { label: string; required?: boolean; description?: string };
  path: string;
  readOnly?: boolean;
}) => {
  const { value, setValue } = useField<boolean>({ path });
  const leftColumnField = useField<typeof DEFAULT_RESOURCE_LAYOUT.leftColumn>({
    path: 'resource.leftColumn',
  });
  const rightColumnField = useField<typeof DEFAULT_RESOURCE_LAYOUT.rightColumn>(
    {
      path: 'resource.rightColumn',
    },
  );

  const handlePopulateDefault = () => {
    setValue(true);

    leftColumnField.setValue([...DEFAULT_RESOURCE_LAYOUT.leftColumn]);
    rightColumnField.setValue([...DEFAULT_RESOURCE_LAYOUT.rightColumn]);
  };

  const hasCustomLayout =
    (Array.isArray(leftColumnField.value) &&
      leftColumnField.value.length > 0) ||
    (Array.isArray(rightColumnField.value) &&
      rightColumnField.value.length > 0);

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

export default UseCustomLayoutField;
