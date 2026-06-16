import path from 'node:path';
export const rootDir = path.resolve(new URL('..', import.meta.url).pathname, '..');
export const inputCsv = path.join(rootDir, 'inputs/world_cup_2026_master_schedule_aruba_time_data.csv');
export const dataDir = path.join(rootDir, 'data');
export const outputDir = path.join(rootDir, 'outputs');
