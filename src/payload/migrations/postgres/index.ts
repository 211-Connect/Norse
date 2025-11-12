import * as migration_20251111_103119 from './20251111_103119';
import * as migration_20251112_141253 from './20251112_141253';

export const migrations = [
  {
    up: migration_20251111_103119.up,
    down: migration_20251111_103119.down,
    name: '20251111_103119',
  },
  {
    up: migration_20251112_141253.up,
    down: migration_20251112_141253.down,
    name: '20251112_141253'
  },
];
