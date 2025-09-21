import { Badges } from '@/shared/components/badges';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import { ContactSection } from './overview-components/contact-section';
import { DetailsSection } from './overview-components/details-section';
import { MainSection } from './overview-components/main-section';

export function Overview({ resource }) {
  return (
    <>
      <div className="flex-1">
        <Card className="print:border-none print:shadow-none">
          <CardHeader>
            <Badges className="mb-3" items={['Waiver']} /> {/* HARDCODED */}
            <CardTitle>{resource.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <MainSection resource={resource} />
            <ContactSection resource={resource} />
            <DetailsSection resource={resource} />
          </CardContent>
        </Card>
      </div>
      <Separator className="hidden border-b border-black print:block" />
    </>
  );
}
