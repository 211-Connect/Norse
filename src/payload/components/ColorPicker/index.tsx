"use client";

import { useField, TextInput } from "@payloadcms/ui";

import "./styles.css";

const ColorPicker = ({
  field: { label, required = false },
  path,
}: {
  field: { label: string; required?: boolean };
  path: string;
}) => {
  const { value, setValue } = useField<string>({ path });

  return (
    <div className={"color-picker"}>
      <label className={"field-label"}>
        {label} {required && <span className="required">*</span>}
      </label>
      <div className={"color-picker-row"}>
        <input
          type="color"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <TextInput
          label=""
          path={path}
          onChange={(e: { target: { value: string } }) =>
            setValue(e.target.value)
          }
          value={value}
        />
      </div>
    </div>
  );
};

export default ColorPicker;
