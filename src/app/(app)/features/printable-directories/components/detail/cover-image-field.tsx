'use client';

import { Trash2, Upload } from 'lucide-react';
import { type ChangeEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/app/(app)/shared/components/ui/button';
import { Label } from '@/app/(app)/shared/components/ui/label';
import { uploadPrintableDirectoryCoverImage } from '@/app/(app)/shared/serverActions/printableDirectories/uploadPrintableDirectoryCoverImage';

import { CoverImageThumbnail } from './cover-image-thumbnail';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

type CoverImageFieldProps = {
  id: string;
  label: string;
  imageUrl: string;
  onChange: (url: string) => void;
  directoryId: string;
  disabled?: boolean;
};

export function CoverImageField({
  id,
  label,
  imageUrl,
  onChange,
  directoryId,
  disabled = false,
}: CoverImageFieldProps) {
  const { t } = useTranslation(['page-directories', 'common']);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { tenantId } = useAppConfig();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so selecting the same file again still triggers a change event
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error(t('cover_image_invalid_type', { ns: 'page-directories' }));
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(t('cover_image_too_large', { ns: 'page-directories' }));
      return;
    }

    setIsUploading(true);

    try {
      const uploadData = new FormData();
      uploadData.set('file', file);
      uploadData.set('directoryId', directoryId);
      if (tenantId) {
        uploadData.set('tenantId', tenantId);
      }

      const result = await uploadPrintableDirectoryCoverImage(uploadData);

      if (!result) {
        toast.error(t('cover_image_upload_error', { ns: 'page-directories' }));
        return;
      }

      onChange(result.url);
    } catch {
      toast.error(t('cover_image_upload_error', { ns: 'page-directories' }));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 max-w-36">
      <Label htmlFor={id}>{label}</Label>

      <div>
        {imageUrl ? (
          <div className="flex flex-col gap-2">
            <CoverImageThumbnail src={imageUrl} alt={label} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={disabled || isUploading}
              onClick={() => onChange('')}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              {t('cover_image_remove', { ns: 'page-directories' })}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={disabled || isUploading}
            loading={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-4" aria-hidden="true" />
            {t('cover_image_upload', { ns: 'page-directories' })}
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
