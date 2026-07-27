'use client';

import { InfoIcon, RefreshCwIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/(app)/shared/components/ui/button';
import { LocationSearchBar } from '@/app/(app)/shared/components/search/location-search-bar';
import { Checkbox } from '@/app/(app)/shared/components/ui/checkbox';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/(app)/shared/components/ui/tooltip';
import {
  PrintableDirectoryCoordsDto,
  PrintableDirectoryDefaultQueryConfigDto,
} from '@/lib/api/generated/data-contracts';
import { AccessPolicy, ResourceLayout } from '@/types/printableDirectories';

import { slugify } from '../utils';

type CreateDirectoryDialogProps = {
  open: boolean;
  isSubmitting: boolean;
  mode?: 'create' | 'edit';
  title?: string;
  submitLabel?: string;
  slugError?: string | null;
  initialValues?: {
    name: string;
    slug?: string | null;
    resourceLayout: ResourceLayout;
    accessPolicy: AccessPolicy;
    isBookletLayout?: boolean;
    defaultQueryConfig?: PrintableDirectoryDefaultQueryConfigDto | null;
  };
  onOpenChange: (open: boolean) => void;
  onSlugChange?: () => void;
  onSubmit: (values: {
    name: string;
    slug: string;
    resourceLayout: ResourceLayout;
    accessPolicy: AccessPolicy;
    isBookletLayout: boolean;
    defaultQueryConfig: PrintableDirectoryDefaultQueryConfigDto | null;
  }) => Promise<void>;
};

const DEFAULT_RESOURCE_LAYOUT: ResourceLayout = 'line';
const DEFAULT_ACCESS_POLICY: AccessPolicy = 'private';
const DEFAULT_IS_BOOKLET_LAYOUT = false;

export function CreateDirectoryDialog({
  open,
  isSubmitting,
  mode = 'create',
  title,
  submitLabel,
  slugError,
  initialValues,
  onOpenChange,
  onSlugChange,
  onSubmit,
}: CreateDirectoryDialogProps) {
  const { t } = useTranslation(['page-directories', 'common']);
  const everywhereLabel = t('search.everywhere', {
    ns: 'common',
    defaultValue: 'Everywhere',
  });
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [resourceLayout, setResourceLayout] = useState<ResourceLayout>(
    DEFAULT_RESOURCE_LAYOUT,
  );
  const [accessPolicy, setAccessPolicy] = useState<AccessPolicy>(
    DEFAULT_ACCESS_POLICY,
  );
  const [isBookletLayout, setIsBookletLayout] = useState<boolean>(
    DEFAULT_IS_BOOKLET_LAYOUT,
  );
  const [defaultLocationName, setDefaultLocationName] = useState('');
  const [defaultCoords, setDefaultCoords] =
    useState<PrintableDirectoryCoordsDto | null>(null);
  const [defaultRadius, setDefaultRadius] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && initialValues) {
      setName(initialValues.name);
      setSlug(initialValues.slug ?? '');
      setSlugTouched(Boolean(initialValues.slug));
      setResourceLayout(initialValues.resourceLayout);
      setAccessPolicy(initialValues.accessPolicy);
      setIsBookletLayout(
        initialValues.isBookletLayout ?? DEFAULT_IS_BOOKLET_LAYOUT,
      );
      setDefaultLocationName(
        initialValues.defaultQueryConfig?.locationName ?? everywhereLabel,
      );
      setDefaultCoords(initialValues.defaultQueryConfig?.coords ?? null);
      setDefaultRadius(
        initialValues.defaultQueryConfig?.radius != null
          ? String(initialValues.defaultQueryConfig.radius)
          : '',
      );
      return;
    }

    setName('');
    setSlug('');
    setSlugTouched(false);
    setResourceLayout(DEFAULT_RESOURCE_LAYOUT);
    setAccessPolicy(DEFAULT_ACCESS_POLICY);
    setIsBookletLayout(DEFAULT_IS_BOOKLET_LAYOUT);
    setDefaultLocationName(everywhereLabel);
    setDefaultCoords(null);
    setDefaultRadius('');
  }, [open, everywhereLabel]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setSlugTouched(true);
    onSlugChange?.();
  };

  const handleGenerateSlug = () => {
    setSlug(slugify(name));
    setSlugTouched(false);
    onSlugChange?.();
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedSlug = slugify(slug);
    if (!trimmedName || !trimmedSlug) return;

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
      slug: trimmedSlug,
      resourceLayout,
      accessPolicy,
      isBookletLayout,
      defaultQueryConfig,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {title ??
              (mode === 'edit'
                ? t('edit_directory', { ns: 'page-directories' })
                : t('add_directory', { ns: 'page-directories' }))}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="new-directory-name">
            {t('name_label', { ns: 'page-directories' })}
          </Label>
          <Input
            id="new-directory-name"
            className="h-9 text-sm"
            value={name}
            onChange={(event) => handleNameChange(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-directory-slug">
            {t('slug_label', { ns: 'page-directories' })}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="new-directory-slug"
              className="h-9 text-sm"
              value={slug}
              placeholder={t('slug_placeholder', { ns: 'page-directories' })}
              onChange={(event) => handleSlugChange(event.target.value)}
              onBlur={(event) => setSlug(slugify(event.target.value))}
              aria-invalid={Boolean(slugError)}
              aria-describedby={
                slugError ? 'new-directory-slug-error' : undefined
              }
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleGenerateSlug}
              aria-label={t('slug_auto_generate', { ns: 'page-directories' })}
              title={t('slug_auto_generate', { ns: 'page-directories' })}
            >
              <RefreshCwIcon className="size-4" aria-hidden="true" />
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            {t('slug_help', { ns: 'page-directories' })}
          </p>
          {slugError && (
            <p
              id="new-directory-slug-error"
              className="text-destructive text-xs"
              role="alert"
            >
              {slugError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-directory-resource-layout">
            {t('resource_layout.label', { ns: 'page-directories' })}
          </Label>
          <Select
            value={resourceLayout}
            onValueChange={(value) =>
              setResourceLayout(value as ResourceLayout)
            }
          >
            <SelectTrigger id="new-directory-resource-layout" className="h-9">
              <SelectValue
                placeholder={t('resource_layout.label', {
                  ns: 'page-directories',
                })}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">
                {t('resource_layout_name.line', { ns: 'page-directories' })}
              </SelectItem>
              <SelectItem value="summary">
                {t('resource_layout_name.summary', { ns: 'page-directories' })}
              </SelectItem>
              <SelectItem value="full">
                {t('resource_layout_name.full', { ns: 'page-directories' })}
              </SelectItem>
              <SelectItem value="custom-search">
                {t('resource_layout_name.custom_search', {
                  ns: 'page-directories',
                })}
              </SelectItem>
              <SelectItem value="custom-resource">
                {t('resource_layout_name.custom_resource', {
                  ns: 'page-directories',
                })}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="new-directory-is-booklet-layout"
              checked={isBookletLayout}
              onCheckedChange={(value) => setIsBookletLayout(value === true)}
            />
            <Label
              htmlFor="new-directory-is-booklet-layout"
              className="cursor-pointer"
            >
              {t('booklet_layout.label', { ns: 'page-directories' })}
            </Label>
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <InfoIcon
                      className="text-muted-foreground size-4"
                      aria-label={t('booklet_layout.help', {
                        ns: 'page-directories',
                      })}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {t('booklet_layout.help', { ns: 'page-directories' })}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-directory-access-policy">
            {t('access_policy.label', { ns: 'page-directories' })}
          </Label>
          <Select
            value={accessPolicy}
            onValueChange={(value) => setAccessPolicy(value as AccessPolicy)}
          >
            <SelectTrigger id="new-directory-access-policy" className="h-9">
              <SelectValue
                placeholder={t('access_policy.label', {
                  ns: 'page-directories',
                })}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">
                {t('access_policy_name.private', { ns: 'page-directories' })}
              </SelectItem>
              <SelectItem value="shared-read">
                {t('access_policy_name.shared_read', {
                  ns: 'page-directories',
                })}
              </SelectItem>
              <SelectItem value="shared-edit">
                {t('access_policy_name.shared_edit', {
                  ns: 'page-directories',
                })}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-directory-default-location-name">
            {t('default_query_config.location_name_label', {
              ns: 'page-directories',
            })}
          </Label>
          <LocationSearchBar
            mode="standalone"
            inputId="new-directory-default-location-name"
            showIcon={false}
            placeholder=""
            initialValue={''}
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
          <Label>
            {t('default_query_config.coords_label', {
              ns: 'page-directories',
              defaultValue: 'Default coordinates',
            })}
          </Label>
          <p className="text-sm text-muted-foreground">
            {defaultCoords
              ? `${defaultCoords.latitude}, ${defaultCoords.longitude}`
              : '-'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-directory-default-radius">
            {t('default_query_config.radius_label', {
              ns: 'page-directories',
              defaultValue: 'Default radius',
            })}
          </Label>
          <Input
            id="new-directory-default-radius"
            className="h-9 text-sm"
            type="number"
            min={0}
            max={1000}
            value={defaultRadius}
            onChange={(event) => setDefaultRadius(event.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('call_to_action.cancel', { ns: 'common' })}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !slug.trim()}
            loading={isSubmitting}
          >
            {submitLabel ??
              (mode === 'edit'
                ? t('call_to_action.save', { ns: 'common' })
                : t('call_to_action.create', { ns: 'common' }))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
