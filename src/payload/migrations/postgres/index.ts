import * as migration_20251111_103119 from './20251111_103119';

export const migrations = [
  {
    up: migration_20251111_103119.up,
    down: migration_20251111_103119.down,
    name: '20251111_103119'
  },
];
