import React from 'react';
import { DefaultServerCellComponentProps } from 'payload';
import { Tenant } from '@/payload/payload-types';

type Services = Tenant['services'];

const serviceMap: Record<keyof Services, string> = {
  resourceDirectory: 'RD',
  hsda: 'HSDA',
  searchApi: 'SAPI',
};

export default function ServicesCell({
  rowData,
}: DefaultServerCellComponentProps) {
  const { services } = rowData as Tenant;
  const enabledServices = Object.entries(services)
    .filter(([, isEnabled]) => isEnabled)
    .map(([serviceKey]) => serviceMap[serviceKey as keyof Services])
    .join(', ');

  return <span>{enabledServices}</span>;
}
