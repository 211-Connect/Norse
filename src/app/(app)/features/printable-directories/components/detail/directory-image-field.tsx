'use client';

import { Trash2, Upload } from 'lucide-react';
import { type ChangeEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/app/(app)/shared/components/ui/button';
import { Label } from '@/app/(app)/shared/components/ui/label';
import {
  PrintableDirectoryImageKind,
  uploadPrintableDirectoryImage,
} from '@/app/(app)/shared/serverActions/printableDirectories/uploadPrintableDirectoryImage';

import { DIRECTORY_IMAGE_MIME_TYPES } from '../../utils/constants';
import { DirectoryImageThumbnail } from './directory-image-thumbnail';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

type DirectoryImageFieldProps = {
  id: string;
  kind: PrintableDirectoryImageKind;
  label: string;
  imageUrl: string;
  onChange: (url: string) => void;
  directoryId: string;
  disabled?: boolean;
};

/** Upload/remove control for a directory image (cover image or logo). */
export function DirectoryImageField({
  id,
  kind,
  label,
  imageUrl,
  onChange,
  directoryId,
  disabled = false,
}: DirectoryImageFieldProps) {
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

    if (!DIRECTORY_IMAGE_MIME_TYPES.includes(file.type)) {
      toast.error(t('image_unsupported_type', { ns: 'page-directories' }));
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(t('image_too_large', { ns: 'page-directories' }));
      return;
    }

    setIsUploading(true);

    try {
      const uploadData = new FormData();
      uploadData.set('file', file);
      uploadData.set('kind', kind);
      uploadData.set('directoryId', directoryId);
      if (tenantId) {
        uploadData.set('tenantId', tenantId);
      }

      const result = await uploadPrintableDirectoryImage(uploadData);

      if (!result) {
        toast.error(t('image_upload_error', { ns: 'page-directories' }));
        return;
      }

      onChange(result.url);
    } catch {
      toast.error(t('image_upload_error', { ns: 'page-directories' }));
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
            <DirectoryImageThumbnail src={imageUrl} alt={label} kind={kind} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={disabled || isUploading}
              onClick={() => onChange('')}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              {t('image_remove', { ns: 'page-directories' })}
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
            {t('image_upload', { ns: 'page-directories' })}
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={DIRECTORY_IMAGE_MIME_TYPES.join(',')}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
