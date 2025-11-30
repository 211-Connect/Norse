interface ArrayRowLabelProps {
  rowNumber?: number;
  title?: string;
}

export const ArrayRowLabel = ({ rowNumber, title }: ArrayRowLabelProps) => {
  const customLabel = title || `List ${String(rowNumber).padStart(2, '0')}`;
  return <p>{customLabel}</p>;
};
