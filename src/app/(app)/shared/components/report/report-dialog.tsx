import { Building2Icon, TriangleAlert } from 'lucide-react';
import { Button, buttonVariants } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { cn } from '../../lib/utils';
import { useState } from 'react';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { Typography } from '../ui/typography';
import { Link } from '../link';

export function ReportDialog({
  className,
  linkText,
}: {
  className?: string;
  linkText: string;
}) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  return (
    <>
      <Button
        aria-label={linkText}
        variant="outline"
        className={cn('flex gap-1', className)}
        onClick={() => handleOpenChange(true)}
      >
        <TriangleAlert className="size-4" aria-hidden="true" />
        {linkText}
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <form>
          <DialogContent className="max-w-sm md:max-w-md">
            <DialogHeader>
              {/* Need to replace all hardcoded text with translations */}
              <DialogTitle>Report an Issue</DialogTitle>
              <DialogDescription>
                Help us keep this information accurate
              </DialogDescription>
            </DialogHeader>

            <Label htmlFor="issue-description" className="mb-2 mt-4">
              What needs to be corrected?
            </Label>
            <Textarea
              placeholder="Please describe the issue with this listing. For example: wrong phone number, outdated hours, service no longer available, etc."
              rows={6}
            />

            <Button>Submit Feedback</Button>

            <Separator />

            <DialogFooter>
              <div className="flex flex-col gap-4 bg-muted p-4">
                <div className="flex gap-4">
                  <Building2Icon size={32} />

                  <div className="flex flex-col gap-1">
                    <Typography variant="heading" as="h3" className="text-sm">
                      Do you work at or refer to this organization?
                    </Typography>
                    <Typography
                      variant="paragraph"
                      size="xs"
                      className="text-muted-foreground"
                    >
                      If you work at or regularly refer to this organization,
                      you can submit detailed edits directly to the record.
                    </Typography>
                  </div>
                </div>

                <Link
                  className={buttonVariants({ variant: 'outline' })}
                  href="/organizations/id/feedback"
                >
                  Advanced Feedback
                </Link>
              </div>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
    </>
  );
}
