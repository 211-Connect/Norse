import * as migration_20251111_103119 from './20251111_103119';
import * as migration_20251112_141253 from './20251112_141253';
import * as migration_20251119_131652 from './20251119_131652';
import * as migration_20251120_084650 from './20251120_084650';
import * as migration_20251130_112910 from './20251130_112910';
import * as migration_20251203_082422 from './20251203_082422';
import * as migration_20251207_161707 from './20251207_161707';
import * as migration_20251217_174753 from './20251217_174753';
import * as migration_20251217_215250 from './20251217_215250';
import * as migration_20251219_103353 from './20251219_103353';
import * as migration_20251221_172847 from './20251221_172847';

export const migrations = [
  {
    up: migration_20251111_103119.up,
    down: migration_20251111_103119.down,
    name: '20251111_103119',
  },
  {
    up: migration_20251112_141253.up,
    down: migration_20251112_141253.down,
    name: '20251112_141253',
  },
  {
    up: migration_20251119_131652.up,
    down: migration_20251119_131652.down,
    name: '20251119_131652',
  },
  {
    up: migration_20251120_084650.up,
    down: migration_20251120_084650.down,
    name: '20251120_084650',
  },
  {
    up: migration_20251130_112910.up,
    down: migration_20251130_112910.down,
    name: '20251130_112910',
  },
  {
    up: migration_20251203_082422.up,
    down: migration_20251203_082422.down,
    name: '20251203_082422',
  },
  {
    up: migration_20251207_161707.up,
    down: migration_20251207_161707.down,
    name: '20251207_161707',
  },
  {
    up: migration_20251217_174753.up,
    down: migration_20251217_174753.down,
    name: '20251217_174753',
  },
  {
    up: migration_20251217_215250.up,
    down: migration_20251217_215250.down,
    name: '20251217_215250',
  },
  {
    up: migration_20251219_103353.up,
    down: migration_20251219_103353.down,
    name: '20251219_103353',
  },
  {
    up: migration_20251221_172847.up,
    down: migration_20251221_172847.down,
    name: '20251221_172847'
  },
];
