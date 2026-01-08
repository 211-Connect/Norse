interface ArrayRowLabelProps {
  rowNumber?: number;
  title?: string;
  englishTitle?: string | null;
}

export const ArrayRowLabel = ({
  rowNumber,
  title,
  englishTitle,
}: ArrayRowLabelProps) => {
  const fallbackLabel = `List ${String(rowNumber).padStart(2, '0')}`;
  const customLabel = title || fallbackLabel;

  return (
    <p>
      {customLabel}
      {englishTitle && (
        <span style={{ marginLeft: '8px', opacity: 0.6, fontSize: '0.9em' }}>
          (EN: {englishTitle})
        </span>
      )}
    </p>
  );
};
