/** The parts of a request this module reads: headers only. */
export interface ArcjetRequestLike {
  headers: Pick<Headers, 'get' | 'forEach'>;
}

export type ArcjetLogLevel = 'debug' | 'warn';
export type ArcjetLog = (
  level: ArcjetLogLevel,
  event: string,
  data: Record<string, unknown>,
) => void;
