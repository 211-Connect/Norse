'use client';

import {
  AlertTriangleIcon,
  MailIcon,
  PencilIcon,
  PlusIcon,
  SendIcon,
  Trash2Icon,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import {
  Fragment,
  type ReactElement,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/(app)/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/(app)/shared/components/ui/dialog';
import { Skeleton } from '@/app/(app)/shared/components/ui/skeleton';
import { Switch } from '@/app/(app)/shared/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/(app)/shared/components/ui/tooltip';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { usePrintableDirectoryCapability } from '@/app/(app)/shared/hooks/use-printable-directory-capability';
import { createPrintableDirectoryDelivery } from '@/app/(app)/shared/serverActions/printableDirectories/createPrintableDirectoryDelivery';
import { deletePrintableDirectoryDelivery } from '@/app/(app)/shared/serverActions/printableDirectories/deletePrintableDirectoryDelivery';
import { getPrintableDirectoryDeliveries } from '@/app/(app)/shared/serverActions/printableDirectories/getPrintableDirectoryDeliveries';
import { PrintableDirectoryDeliveryError } from '@/app/(app)/shared/serverActions/printableDirectories/printableDirectoryDeliveryResult';
import { sendPrintableDirectoryDeliveryTest } from '@/app/(app)/shared/serverActions/printableDirectories/sendPrintableDirectoryDeliveryTest';
import { updatePrintableDirectoryDelivery } from '@/app/(app)/shared/serverActions/printableDirectories/updatePrintableDirectoryDelivery';
import {
  PrintableDirectoryDeliveryResponseDto,
  PrintableDirectoryResponseDto,
} from '@/lib/api/generated/data-contracts';

import {
  DeliveryInput,
  MAX_DELIVERIES_PER_DIRECTORY,
  TEST_SENDS_PER_HOUR,
} from '../../utils/scheduledDelivery';
import { ScheduledDeliveryDialog } from './scheduled-delivery-dialog';
import { ScheduleSummary } from './scheduled-delivery-summary';

type ScheduledDeliveriesCardProps = {
  directory: PrintableDirectoryResponseDto;
};

const VARIANT_LABEL_KEYS = {
  'line-listing': 'print_dialog.line_listing',
  'summary-listing': 'print_dialog.summary_listing',
  'full-listing': 'print_dialog.full_listing',
} as const;

function useLanguageName(): (locale: string) => string {
  const { i18n } = useTranslation();

  return (locale: string) => {
    try {
      return (
        new Intl.DisplayNames([i18n.language], { type: 'language' }).of(
          locale,
        ) ?? locale
      );
    } catch {
      return locale;
    }
  };
}

/**
 * Hover/focus label for compact controls; needs a TooltipProvider above.
 * The child receives the trigger's `data-state`, so wrap Radix controls
 * that style themselves by their own `data-state` (e.g. Switch) in a span.
 */
function WithTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactElement;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="max-w-xs leading-snug">{label}</TooltipContent>
    </Tooltip>
  );
}

function formatRunDate(date: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`));
  } catch {
    return date;
  }
}

/**
 * Scheduled PDF delivery (docs/scheduled-pdf-delivery.md). Shown only to
 * users with the `scheduledPdfDelivery` capability who can edit the
 * directory; the API hides other directories' schedules (404).
 */
export function ScheduledDeliveriesCard({
  directory,
}: ScheduledDeliveriesCardProps) {
  const canSchedule = usePrintableDirectoryCapability('scheduledPdfDelivery');

  if (!canSchedule) {
    return null;
  }

  return <ScheduledDeliveriesCardContent directory={directory} />;
}

function ScheduledDeliveriesCardContent({
  directory,
}: ScheduledDeliveriesCardProps) {
  const { t, i18n } = useTranslation([
    'page-directories',
    'page-list',
    'common',
  ]);
  const appConfig = useAppConfig();
  const session = useSession();
  const languageName = useLanguageName();

  const [deliveries, setDeliveries] = useState<
    PrintableDirectoryDeliveryResponseDto[] | null
  >(null);
  const [isHidden, setIsHidden] = useState(false);
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    delivery?: PrintableDirectoryDeliveryResponseDto;
  }>({ open: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] =
    useState<PrintableDirectoryDeliveryResponseDto | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  // Rendering and emailing the PDF takes several seconds; show progress.
  const [sendingId, setSendingId] = useState<string | null>(null);

  const setBusy = (id: string, busy: boolean) =>
    setBusyIds((current) => {
      const next = new Set(current);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });

  const errorMessage = (error: PrintableDirectoryDeliveryError) =>
    error === 'limit_reached'
      ? t('scheduled_delivery_limit_reached', {
          max: MAX_DELIVERIES_PER_DIRECTORY,
        })
      : error === 'forbidden'
        ? t('capability_required')
        : t('scheduled_delivery_save_failed');

  const load = useCallback(async () => {
    const result = await getPrintableDirectoryDeliveries(
      directory.id,
      appConfig.tenantId,
    );

    if (result.success) {
      setDeliveries(result.data);
      return;
    }

    // No edit access to this directory, or no capability: nothing to show.
    if (
      result.error === 'not_found' ||
      result.error === 'unauthorized' ||
      result.error === 'forbidden'
    ) {
      setIsHidden(true);
      return;
    }

    toast.error(t('scheduled_delivery_load_failed'));
    setDeliveries([]);
  }, [directory.id, appConfig.tenantId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const replaceDelivery = (updated: PrintableDirectoryDeliveryResponseDto) =>
    setDeliveries(
      (current) =>
        current?.map((item) => (item.id === updated.id ? updated : item)) ??
        null,
    );

  const handleSubmit = async (input: DeliveryInput) => {
    setIsSubmitting(true);
    try {
      const editing = dialogState.delivery;
      const result = editing
        ? await updatePrintableDirectoryDelivery(
            directory.id,
            editing.id,
            input,
            appConfig.tenantId,
          )
        : await createPrintableDirectoryDelivery(
            directory.id,
            input,
            appConfig.tenantId,
          );

      if (!result.success) {
        toast.error(errorMessage(result.error));
        return;
      }

      if (editing) {
        replaceDelivery(result.data);
      } else {
        setDeliveries((current) => [...(current ?? []), result.data]);
      }
      toast.success(t('scheduled_delivery_saved'));
      setDialogState({ open: false });
    } catch {
      toast.error(t('scheduled_delivery_save_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (
    delivery: PrintableDirectoryDeliveryResponseDto,
    enabled: boolean,
  ) => {
    setBusy(delivery.id, true);
    replaceDelivery({ ...delivery, enabled });
    try {
      const result = await updatePrintableDirectoryDelivery(
        directory.id,
        delivery.id,
        { enabled },
        appConfig.tenantId,
      );
      if (result.success) {
        replaceDelivery(result.data);
      } else {
        replaceDelivery(delivery);
        toast.error(errorMessage(result.error));
      }
    } catch {
      replaceDelivery(delivery);
      toast.error(t('scheduled_delivery_save_failed'));
    } finally {
      setBusy(delivery.id, false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;

    const delivery = pendingDelete;
    setBusy(delivery.id, true);
    try {
      const result = await deletePrintableDirectoryDelivery(
        directory.id,
        delivery.id,
        appConfig.tenantId,
      );
      if (!result.success) {
        toast.error(errorMessage(result.error));
        return;
      }
      setDeliveries(
        (current) => current?.filter((item) => item.id !== delivery.id) ?? null,
      );
      toast.success(t('scheduled_delivery_deleted'));
      setPendingDelete(null);
    } catch {
      toast.error(t('scheduled_delivery_save_failed'));
    } finally {
      setBusy(delivery.id, false);
    }
  };

  const handleSendTest = async (
    delivery: PrintableDirectoryDeliveryResponseDto,
  ) => {
    setBusy(delivery.id, true);
    setSendingId(delivery.id);
    try {
      const result = await sendPrintableDirectoryDeliveryTest(
        directory.id,
        delivery.id,
        appConfig.tenantId,
      );
      if (result.success) {
        toast.success(
          t('scheduled_delivery_test_sent', {
            email: session.data?.user?.email ?? '',
            interpolation: { escapeValue: false },
          }),
        );
      } else {
        toast.error(
          result.error === 'rate_limited'
            ? t('scheduled_delivery_test_rate_limited', {
                max: TEST_SENDS_PER_HOUR,
              })
            : result.error === 'empty'
              ? t('scheduled_delivery_test_empty')
              : t('scheduled_delivery_test_failed'),
        );
      }
    } catch {
      toast.error(t('scheduled_delivery_test_failed'));
    } finally {
      setBusy(delivery.id, false);
      setSendingId(null);
    }
  };

  if (isHidden) {
    return null;
  }

  const count = deliveries?.length ?? 0;
  const atLimit = count >= MAX_DELIVERIES_PER_DIRECTORY;

  return (
    <TooltipProvider delayDuration={200}>
      <Card data-testid="scheduled-deliveries-card">
        <CardHeader className="mb-4 flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="mb-0 text-lg">
              {t('scheduled_delivery_title')}
            </CardTitle>
            <Typography variant="paragraph" size="sm" textColor="secondary">
              {t('scheduled_delivery_description')}
            </Typography>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {count > 0 && (
              <Typography variant="paragraph" size="sm" textColor="secondary">
                {t('scheduled_delivery_count', {
                  count,
                  max: MAX_DELIVERIES_PER_DIRECTORY,
                })}
              </Typography>
            )}
            <Button
              type="button"
              variant="outline"
              className="gap-1"
              disabled={deliveries === null || atLimit}
              onClick={() => setDialogState({ open: true })}
              data-testid="add-scheduled-delivery-btn"
            >
              <PlusIcon className="size-4" aria-hidden="true" />
              {t('scheduled_delivery_add')}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {deliveries === null ? (
            <div className="space-y-2" aria-busy="true">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : deliveries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-md border border-dashed px-4 py-8 text-center">
              <MailIcon
                className="size-6 text-muted-foreground"
                aria-hidden="true"
              />
              <Typography
                variant="paragraph"
                size="sm"
                textColor="secondary"
                className="max-w-md"
              >
                {t('scheduled_delivery_empty')}
              </Typography>
            </div>
          ) : (
            <ul className="divide-y rounded-md border">
              {deliveries.map((delivery) => {
                const isBusy = busyIds.has(delivery.id);
                const localeRemoved = !directory.locales.includes(
                  delivery.print.locale,
                );

                return (
                  <li
                    key={delivery.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
                    data-testid="scheduled-delivery-row"
                  >
                    <div className="min-w-0 space-y-1.5">
                      <Typography
                        as="p"
                        variant="paragraph"
                        size="sm"
                        className={
                          delivery.enabled
                            ? 'font-medium'
                            : 'font-medium text-muted-foreground'
                        }
                      >
                        <ScheduleSummary
                          frequency={delivery.frequency}
                          weekdays={delivery.weekdays}
                          monthDays={delivery.monthDays}
                        />
                        {!delivery.enabled && (
                          <span className="ml-1 text-xs font-normal">
                            {' '}
                            ({t('scheduled_delivery_paused')})
                          </span>
                        )}
                      </Typography>

                      <Typography
                        as="p"
                        variant="paragraph"
                        size="sm"
                        className="flex flex-wrap items-center gap-x-1.5"
                      >
                        {[
                          languageName(delivery.print.locale),
                          t(VARIANT_LABEL_KEYS[delivery.print.variant], {
                            ns: 'page-list',
                          }),
                          delivery.print.fontSize === 'large' &&
                            t('print_dialog.font_size_large', {
                              ns: 'page-list',
                            }),
                          delivery.print.booklet && (
                            <WithTooltip
                              key="booklet"
                              label={t('print_dialog.booklet_layout_help', {
                                ns: 'page-list',
                              })}
                            >
                              <span
                                tabIndex={0}
                                className="cursor-help rounded-sm underline decoration-dotted underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                              >
                                {t('print_dialog.booklet_layout', {
                                  ns: 'page-list',
                                })}
                              </span>
                            </WithTooltip>
                          ),
                        ]
                          .filter(Boolean)
                          .map((item, index) => (
                            <Fragment key={index}>
                              {index > 0 && (
                                <span
                                  aria-hidden="true"
                                  className="text-muted-foreground"
                                >
                                  •
                                </span>
                              )}
                              {item}
                            </Fragment>
                          ))}
                      </Typography>

                      <Typography
                        as="p"
                        variant="paragraph"
                        size="sm"
                        textColor="secondary"
                        title={delivery.recipients.join(', ')}
                      >
                        {t('scheduled_delivery_recipients', {
                          count: delivery.recipients.length,
                        })}
                        {' · '}
                        {delivery.lastRun
                          ? t(
                              delivery.lastRun.status === 'skipped' &&
                                delivery.lastRun.reason === 'empty'
                                ? 'scheduled_delivery_last_run_skipped_empty'
                                : `scheduled_delivery_last_run_${delivery.lastRun.status}`,
                              {
                                date: formatRunDate(
                                  delivery.lastRun.date,
                                  i18n.language,
                                ),
                              },
                            )
                          : t('scheduled_delivery_never_run')}
                      </Typography>

                      {localeRemoved && (
                        <Typography
                          as="p"
                          variant="paragraph"
                          size="sm"
                          className="flex items-center gap-1 text-amber-700"
                        >
                          <AlertTriangleIcon
                            className="size-4 shrink-0"
                            aria-hidden="true"
                          />
                          {t('scheduled_delivery_locale_removed', {
                            language: languageName(directory.primaryLanguage),
                            interpolation: { escapeValue: false },
                          })}
                        </Typography>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <WithTooltip
                        label={
                          delivery.enabled
                            ? t('scheduled_delivery_pause')
                            : t('scheduled_delivery_resume')
                        }
                      >
                        <span className="inline-flex">
                          <Switch
                            checked={delivery.enabled}
                            disabled={isBusy}
                            onCheckedChange={(checked) =>
                              handleToggle(delivery, checked)
                            }
                            aria-label={
                              delivery.enabled
                                ? t('scheduled_delivery_pause')
                                : t('scheduled_delivery_resume')
                            }
                            className="mr-1 cursor-pointer"
                          />
                        </span>
                      </WithTooltip>
                      <WithTooltip label={t('scheduled_delivery_send_test')}>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={isBusy}
                          loading={sendingId === delivery.id}
                          onClick={() => handleSendTest(delivery)}
                          aria-label={t('scheduled_delivery_send_test')}
                        >
                          <SendIcon className="size-4" aria-hidden="true" />
                        </Button>
                      </WithTooltip>
                      <WithTooltip label={t('scheduled_delivery_edit')}>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={isBusy}
                          onClick={() =>
                            setDialogState({ open: true, delivery })
                          }
                          aria-label={t('scheduled_delivery_edit')}
                        >
                          <PencilIcon className="size-4" aria-hidden="true" />
                        </Button>
                      </WithTooltip>
                      <WithTooltip label={t('scheduled_delivery_delete')}>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={isBusy}
                          onClick={() => setPendingDelete(delivery)}
                          aria-label={t('scheduled_delivery_delete')}
                        >
                          <Trash2Icon className="size-4" aria-hidden="true" />
                        </Button>
                      </WithTooltip>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <ScheduledDeliveryDialog
        open={dialogState.open}
        onOpenChange={(open) =>
          setDialogState((current) => ({ ...current, open }))
        }
        delivery={dialogState.delivery}
        locales={directory.locales}
        defaultLocale={
          directory.locales.includes(i18n.language)
            ? i18n.language
            : directory.primaryLanguage
        }
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent closeLabel={t('call_to_action.close', { ns: 'common' })}>
          <DialogHeader>
            <DialogTitle>{t('scheduled_delivery_delete_title')}</DialogTitle>
            <DialogDescription>
              {t('scheduled_delivery_delete_description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              {t('call_to_action.cancel', { ns: 'common' })}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              loading={pendingDelete ? busyIds.has(pendingDelete.id) : false}
            >
              {t('call_to_action.delete', { ns: 'common' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
