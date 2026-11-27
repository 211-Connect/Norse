'use client';

import { TextField, TextareaField, useField } from '@payloadcms/ui';
import type { TextFieldClientProps, TextareaFieldClientProps } from 'payload';

import { useLayoutEffect, useRef } from 'react';

import {
  COPY_LIMITS,
  COPY_TAGS,
  type CopyField,
  type CopySource,
  type CopyTag,
  fillCopyTags,
  pickCopy,
} from '@/app/(app)/features/landing-pages/lib/copy';

import type { CopyScope } from '../copyFields';
import './LandingCopyFields.css';
import { useLandingCopyContext } from './useLandingCopyContext';

type Props = (TextFieldClientProps | TextareaFieldClientProps) & {
  scope: CopyScope;
};

const SOURCE_LABEL: Record<CopySource, string> = {
  topic: 'the topic',
  template: 'the Resource Directory templates',
  default: 'the built-in text',
};

/**
 * A landing-page copy text (title, description, H1, intro). Empty, it shows
 * what it inherits as a greyed placeholder; filled, it overrides that and
 * can be cleared back. Shows the length with sample values filled in.
 */
const LandingCopyField = (props: Props) => {
  const { scope, path, field } = props;
  const name = field.name as CopyField;
  const { value, setValue } = useField<string>({ path });
  const context = useLandingCopyContext(scope);

  const inherited = context ? pickCopy(context.layers, scope)[name] : undefined;
  const own = typeof value === 'string' && value.trim() !== '';
  const effective = own ? value : inherited?.text;
  const filled =
    effective && context ? fillCopyTags(effective, context.values) : '';
  const limit = COPY_LIMITS[name];

  // The variable chips put a tag where the cursor is (at the end when the
  // field is not focused) and leave the cursor after it.
  const wrapper = useRef<HTMLDivElement>(null);
  const cursor = useRef<number | null>(null);
  const textInput = () =>
    wrapper.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      'input, textarea',
    );
  const insertTag = (tag: CopyTag) => {
    const text = `{${tag}}`;
    const current = typeof value === 'string' ? value : '';
    const input = textInput();
    const focused = input && input === document.activeElement ? input : null;
    const start = focused?.selectionStart ?? current.length;
    const end = focused?.selectionEnd ?? current.length;
    cursor.current = start + text.length;
    setValue(current.slice(0, start) + text + current.slice(end));
  };
  // Writing the value moves the cursor to the end; put it back once the
  // field shows the new value.
  useLayoutEffect(() => {
    const at = cursor.current;
    if (at === null) return;
    cursor.current = null;
    const input = textInput();
    input?.focus();
    input?.setSelectionRange(at, at);
  }, [value]);

  const withPlaceholder = {
    ...field,
    admin: {
      ...field.admin,
      placeholder: inherited?.text ?? field.admin?.placeholder,
    },
  };
  const input =
    field.type === 'textarea' ? (
      <TextareaField
        {...(props as TextareaFieldClientProps)}
        field={withPlaceholder as TextareaFieldClientProps['field']}
      />
    ) : (
      <TextField
        {...(props as TextFieldClientProps)}
        field={withPlaceholder as TextFieldClientProps['field']}
      />
    );

  return (
    <div className="landing-copy-field" ref={wrapper}>
      {input}
      <div className="landing-copy-field__tags" aria-label="Insert a variable">
        {COPY_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            className="landing-copy-field__tag"
            // Keep focus and the cursor in the text field.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => insertTag(tag)}
          >
            {`{${tag}}`}
          </button>
        ))}
      </div>
      <div className="landing-copy-field__meta">
        {own ? (
          inherited ? (
            <span>
              Overrides {SOURCE_LABEL[inherited.source]}.{' '}
              <button
                type="button"
                className="landing-copy-field__link"
                onClick={() => setValue('')}
              >
                Use inherited
              </button>
            </span>
          ) : (
            <span>Set here.</span>
          )
        ) : inherited ? (
          <span>Inherited from {SOURCE_LABEL[inherited.source]}.</span>
        ) : (
          <span>Empty.</span>
        )}
        {limit && filled && (
          <span
            className="landing-copy-field__count"
            data-over={filled.length > limit || undefined}
            title="Length with the sample page's values filled in"
          >
            {filled.length}/{limit}
          </span>
        )}
      </div>
    </div>
  );
};

export default LandingCopyField;
