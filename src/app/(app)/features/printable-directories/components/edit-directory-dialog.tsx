'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LocationSearchBar } from '@/app/(app)/shared/components/search/location-search-bar';
import { keepDialogOpenWhileAutocompleteIsOpen } from '@/app/(app)/shared/components/ui/autocomplete';
import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/(app)/shared/components/ui/dialog';
import { Input } from '@/app/(app)/shared/components/ui/input';
import { Label } from '@/app/(app)/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/(app)/shared/components/ui/select';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { usePrintableDirectoryCapability } from '@/app/(app)/shared/hooks/use-printable-directory-capability';
import { PrintableDirectoryDefaultQueryConfigDto } from '@/lib/api/generated/data-contracts';
import { AccessPolicy } from '@/types/printableDirectories';

import { Checkbox } from '@/app/(app)/shared/components/ui/checkbox';
import { getLanguageName } from '@/app/(app)/shared/lib/language-names';

import { useShareUrlBase } from '../hooks/use-share-url-base';
import { CopyShareUrlButton } from './detail/copy-share-url-button';
import { DirectoryImageField } from './detail/directory-image-field';
import {
  getAccessPolicyDescription,
  getAccessPolicyLabel,
  slugify,
} from '../utils';

/**
 * Edits a printable directory's general info (name, share URL, access
 * policy, languages, default query location) after creation. Directory *creation* uses
 * `CreateDirectoryWizard` instead — see docs/printable-directories.md.
 */
type EditDirectoryDialogProps = {
  open: boolean;
  isSubmitting: boolean;
  /** Shown under the share URL field, e.g. when the slug is already taken. */
  slugError?: string | null;
  onSlugChange?: () => void;
  directoryId: string;
  initialValues: {
    name: string;
    logoUrl: string;
    slug?: string | null;
    accessPolicy: AccessPolicy;
    primaryLanguage: string;
    locales: string[];
    defaultQueryConfig?: PrintableDirectoryDefaultQueryConfigDto | null;
  };
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: {
    name: string;
    slug: string;
    /** Omitted when the tenant hides access policies (`everyone` mode). */
    accessPolicy?: AccessPolicy;
    locales: string[];
    /** Omitted for users without the Logo Upload capability. */
    logoUrl?: string;
    defaultQueryConfig: PrintableDirectoryDefaultQueryConfigDto | null;
  }) => Promise<void>;
};

export function EditDirectoryDialog({
  open,
  isSubmitting,
  directoryId,
  slugError,
  onSlugChange,
  initialValues,
  onOpenChange,
  onSubmit,
}: EditDirectoryDialogProps) {
  const { t } = useTranslation(['page-directories', 'common']);
  const appConfig = useAppConfig();
  const shareUrlBase = useShareUrlBase();
  const everywhereLabel = t('search.everywhere', {
    ns: 'common',
    defaultValue: 'Everywhere',
  });

  const hideAccessPolicy =
    appConfig.printableDirectories.accessMode === 'everyone';

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [accessPolicy, setAccessPolicy] = useState<AccessPolicy>(
    initialValues.accessPolicy,
  );
  const canUploadLogo = usePrintableDirectoryCapability('logoUpload');
  const [locales, setLocales] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState('');
  const [defaultLocationName, setDefaultLocationName] = useState('');
  const [defaultCoords, setDefaultCoords] = useState<NonNullable<
    PrintableDirectoryDefaultQueryConfigDto['coords']
  > | null>(null);
  const [defaultRadius, setDefaultRadius] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(initialValues.name);
    setSlug(initialValues.slug ?? '');
    setAccessPolicy(initialValues.accessPolicy);
    setLocales(initialValues.locales);
    setLogoUrl(initialValues.logoUrl);
    setDefaultLocationName(
      initialValues.defaultQueryConfig?.locationName ?? everywhereLabel,
    );
    setDefaultCoords(initialValues.defaultQueryConfig?.coords ?? null);
    setDefaultRadius(
      initialValues.defaultQueryConfig?.radius != null
        ? String(initialValues.defaultQueryConfig.radius)
        : '',
    );
    // Reset only when (re)opened: callers rebuild `initialValues` on every
    // render, and resetting then would discard what the user typed.
  }, [open]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const trimmedSlug = slug.trim();
    const normalizedSlug = trimmedSlug ? slugify(trimmedSlug) : '';
    const trimmedLocationName = defaultLocationName.trim();
    const normalizedLocationName =
      trimmedLocationName === everywhereLabel ? '' : trimmedLocationName;
    const parsedRadiusValue = Number(defaultRadius.trim());
    const parsedRadius =
      defaultRadius.trim() && Number.isFinite(parsedRadiusValue)
        ? parsedRadiusValue
        : undefined;

    const defaultQueryConfig: PrintableDirectoryDefaultQueryConfigDto | null =
      normalizedLocationName || defaultCoords || parsedRadius != null
        ? {
            locationName: normalizedLocationName || undefined,
            coords: defaultCoords ?? undefined,
            radius: parsedRadius,
          }
        : null;

    await onSubmit({
      name: trimmedName,
      slug: normalizedSlug || slugify(trimmedName),
      // Hidden means "not configurable here", not "reset": leave the stored
      // policy untouched.
      ...(hideAccessPolicy ? {} : { accessPolicy }),
      locales,
      ...(canUploadLogo ? { logoUrl } : {}),
      defaultQueryConfig,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onEscapeKeyDown={keepDialogOpenWhileAutocompleteIsOpen}>
        <DialogHeader>
          <DialogTitle>
            {t('edit_directory', { ns: 'page-directories' })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="edit-directory-name">
            {t('name_label', { ns: 'page-directories' })}
          </Label>
          <Input
            id="edit-directory-name"
            className="h-9 text-sm"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-directory-slug">
            {t('share_url_label', { ns: 'page-directories' })}
          </Label>
          <div className="border-input focus-within:ring-ring flex h-9 items-center overflow-hidden rounded-md border text-sm shadow-sm focus-within:ring-2">
            <span
              className="bg-muted text-muted-foreground flex h-full max-w-[60%] items-center truncate border-r px-2"
              title={shareUrlBase}
            >
              {shareUrlBase}
            </span>
            <input
              id="edit-directory-slug"
              className="h-full min-w-0 flex-1 bg-transparent px-2 outline-none"
              placeholder={t('slug_placeholder', { ns: 'page-directories' })}
              value={slug}
              aria-invalid={Boolean(slugError)}
              aria-describedby="edit-directory-slug-help"
              onChange={(event) => {
                setSlug(event.target.value);
                onSlugChange?.();
              }}
            />
            {slug.trim() && (
              <CopyShareUrlButton
                url={`${shareUrlBase}${slugify(slug.trim())}`}
                className="mr-1"
              />
            )}
          </div>
          <p
            id="edit-directory-slug-help"
            className={
              slugError
                ? 'text-destructive text-xs'
                : 'text-muted-foreground text-xs'
            }
          >
            {slugError ?? t('share_url_help', { ns: 'page-directories' })}
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            {t('languages_label', { ns: 'page-directories' })}
          </legend>
          <p className="text-muted-foreground text-xs">
            {t('languages_help', { ns: 'page-directories' })}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {appConfig.i18n.locales.map((locale) => {
              const isPrimary = locale === initialValues.primaryLanguage;
              const checkboxId = `edit-directory-locale-${locale}`;

              return (
                <div key={locale} className="flex items-center gap-2">
                  <Checkbox
                    id={checkboxId}
                    checked={isPrimary || locales.includes(locale)}
                    disabled={isPrimary}
                    onCheckedChange={(checked) =>
                      setLocales((previous) =>
                        checked === true
                          ? [...previous, locale]
                          : previous.filter((item) => item !== locale),
                      )
                    }
                  />
                  <Label htmlFor={checkboxId} className="text-sm font-normal">
                    {getLanguageName(locale, { englishName: true })}
                    {isPrimary &&
                      ` (${t('localized_field.primary_language', {
                        ns: 'page-directories',
                      })})`}
                  </Label>
                </div>
              );
            })}
          </div>
        </fieldset>

        {!hideAccessPolicy && (
          <div className="space-y-2">
            <Label htmlFor="edit-directory-access-policy">
              {t('access_policy.label', { ns: 'page-directories' })}
            </Label>
            <Select
              value={accessPolicy}
              onValueChange={(value) => setAccessPolicy(value as AccessPolicy)}
            >
              <SelectTrigger id="edit-directory-access-policy" className="h-9">
                <SelectValue
                  placeholder={t('access_policy.label', {
                    ns: 'page-directories',
                  })}
                />
              </SelectTrigger>
              <SelectContent>
                {(['private', 'shared-read', 'shared-edit'] as const).map(
                  (policy) => (
                    <SelectItem key={policy} value={policy}>
                      <div className="flex flex-col py-0.5">
                        <span>{getAccessPolicyLabel(policy, t)}</span>
                        <span className="text-muted-foreground text-xs">
                          {getAccessPolicyDescription(policy, t)}
                        </span>
                      </div>
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="edit-directory-default-location-name">
            {t('default_query_config.location_name_label', {
              ns: 'page-directories',
            })}
          </Label>
          <LocationSearchBar
            mode="standalone"
            inputId="edit-directory-default-location-name"
            showIcon={false}
            placeholder=""
            initialValue={defaultLocationName}
            onLocationChange={(location, coordinates) => {
              setDefaultLocationName(location);
              setDefaultCoords(
                coordinates
                  ? {
                      latitude: coordinates[1],
                      longitude: coordinates[0],
                    }
                  : null,
              );
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-directory-default-radius">
            {t('default_query_config.radius_label', {
              ns: 'page-directories',
              defaultValue: 'Default radius',
            })}
          </Label>
          <Input
            id="edit-directory-default-radius"
            className="h-9 text-sm"
            type="number"
            min={0}
            max={1000}
            value={defaultRadius}
            onChange={(event) => setDefaultRadius(event.target.value)}
          />
        </div>

        {canUploadLogo && (
          <div className="space-y-1">
            <DirectoryImageField
              kind="logo"
              id="edit-directory-logo"
              label={t('logo_label', { ns: 'page-directories' })}
              imageUrl={logoUrl}
              onChange={setLogoUrl}
              directoryId={directoryId}
              disabled={isSubmitting}
            />
            <p className="text-muted-foreground text-xs">
              {t('logo_help', { ns: 'page-directories' })}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('call_to_action.cancel', { ns: 'common' })}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim()}
            loading={isSubmitting}
          >
            {t('call_to_action.save', { ns: 'common' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
