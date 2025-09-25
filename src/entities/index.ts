/**
 * Entity exports
 */

export { Player } from './Player';
export { Obstacle } from './Obstacle';
export type { ObstacleConfig } from './Obstacle';
export { Enemy, EnemyMovementPattern } from './Enemy';
export type { EnemyConfig } from './Enemy';
export {
  BaseProjectile,
  BeamProjectile,
  MissileProjectile,
  SpecialProjectile,
  SpecialWeaponType,
  createProjectile
} from './ProjectileTypes';
export type { ProjectileConfig } from './ProjectileTypes';