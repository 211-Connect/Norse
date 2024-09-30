import { UAParser } from 'ua-parser-js';

export type DeviceType = ReturnType<typeof getServerDevice>;

export function getServerDevice(userAgent: string) {
  const parser = new UAParser();
  parser.setUA(userAgent);

  const deviceType = parser.getDevice().type;

  return {
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType !== 'mobile' && deviceType !== 'tablet',
  };
}
