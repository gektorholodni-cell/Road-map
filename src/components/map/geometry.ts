import type { Island } from '../../types';

export const ART_SCALE = 1.45;
/** Радиуиз сектора на карте в мировых единицах. */
export const islandRadius = (i: Island) => 200 * i.map.scale * ART_SCALE;
