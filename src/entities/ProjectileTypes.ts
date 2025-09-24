/**
 * Different projectile types for the three-weapon system
 * Each weapon type creates projectiles with unique properties and behaviors
 */

import { Entity } from '../core/Entity';
import { Transform } from '../components/Transform';
import { Sprite } from '../components/Sprite';
import { Collider, CollisionLayers, CollisionMasks, CollisionEvent } from '../components/Collider';
import { WeaponType, WeaponUpgradeEffects } from '../components/Weapon';

export interface ProjectileConfig {
  damage: number;
  speed: number;
  lifetime: number;
  width: number;
  height: number;
  piercing?: boolean;
  homing?: boolean;
  explosive?: boolean;
  explosionRadius?: number;
}

export abstract class BaseProjectile extends Entity {
  protected transform: Transform;
  protected sprite: Sprite;
  protected collider: Collider;
  protected config: ProjectileConfig;
  
  protected currentLifetime: number = 0;
  protected canvasWidth: number;
  protected canvasHeight: number;
  protected hasHit: boolean = false;

  constructor(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    canvasWidth: number,
    canvasHeight: number,
    config: ProjectileConfig,
    id?: string
  ) {
    super(id);

    this.config = config;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // Create and add Transform component
    this.transform = new Transform(
      x, y, 
      velocityX * config.speed, 
      velocityY * config.speed, 
      0
    );
    this.addComponent(this.transform);

    // Create and add Sprite component
    this.sprite = new Sprite(config.width, config.height);
    this.sprite.setLayer(2); // Projectiles render above most objects
    this.addComponent(this.sprite);

    // Create and add Collider component
    this.collider = new Collider(
      config.width,
      config.height,
      0, 0, // Centered
      CollisionLayers.PROJECTILE,
      CollisionMasks.PLAYER_PROJECTILE
    );
    
    this.collider.setCollisionCallback((event) => {
      this.handleCollision(event);
    });
    
    this.addComponent(this.collider);

    // Create the projectile sprite
    this.createSprite();
  }

  /**
   * Abstract method to create weapon-specific sprite
   */
  protected abstract createSprite(): void;

  /**
   * Update projectile logic
   */
  update(deltaTime: number): void {
    if (!this.active) return;

    // Update lifetime
    this.currentLifetime += deltaTime / 1000;
    
    if (this.currentLifetime >= this.config.lifetime) {
      this.destroy();
      return;
    }

    // Check screen boundaries
    if (this.isOutsideScreen()) {
      this.destroy();
      return;
    }

    // Apply homing behavior if enabled
    if (this.config.homing) {
      this.applyHomingBehavior(deltaTime);
    }

    super.update(deltaTime);
  }

  /**
   * Apply homing behavior to track nearest enemy
   */
  protected applyHomingBehavior(_deltaTime: number): void {
    // TODO: Implement homing logic when enemy system is available
    // For now, this is a placeholder
  }

  /**
   * Check if projectile is outside screen boundaries
   */
  protected isOutsideScreen(): boolean {
    const pos = this.transform.position;
    const halfWidth = this.config.width / 2;
    const halfHeight = this.config.height / 2;

    return (
      pos.x + halfWidth < 0 ||
      pos.x - halfWidth > this.canvasWidth ||
      pos.y + halfHeight < 0 ||
      pos.y - halfHeight > this.canvasHeight
    );
  }

  /**
   * Handle collision with other entities
   */
  protected handleCollision(event: CollisionEvent): void {
    if (this.hasHit && !this.config.piercing) {
      return; // Already hit something and not piercing
    }

    console.log(`Projectile ${this.id} hit entity ${event.otherEntityId}`);
    
    // Apply damage or effects
    this.onHit(event);
    
    this.hasHit = true;

    // Destroy projectile unless it has piercing
    if (!this.config.piercing && !event.otherCollider.isTrigger) {
      this.destroy();
    }
  }

  /**
   * Called when projectile hits a target
   */
  protected onHit(_event: CollisionEvent): void {
    // Override in subclasses for specific hit effects
  }

  /**
   * Get projectile damage
   */
  getDamage(): number {
    return this.config.damage;
  }

  /**
   * Get projectile position
   */
  getPosition(): { x: number; y: number } {
    return { ...this.transform.position };
  }

  /**
   * Get projectile velocity
   */
  getVelocity(): { x: number; y: number } {
    return { ...this.transform.velocity };
  }
}

/**
 * Beam projectile - fast, unlimited ammo, basic damage
 */
export class BeamProjectile extends BaseProjectile {
  constructor(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    canvasWidth: number,
    canvasHeight: number,
    upgradeEffects?: WeaponUpgradeEffects,
    id?: string
  ) {
    const config: ProjectileConfig = {
      damage: Math.round(1 * (upgradeEffects?.damageMultiplier || 1)),
      speed: Math.round(600 * (upgradeEffects?.speedMultiplier || 1)),
      lifetime: 3,
      width: 8,
      height: 4,
      piercing: upgradeEffects?.specialEffects?.piercing || false
    };

    super(x, y, velocityX, velocityY, canvasWidth, canvasHeight, config, id);
  }

  protected createSprite(): void {
    const canvas = document.createElement('canvas');
    canvas.width = this.config.width;
    canvas.height = this.config.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      this.sprite.image = canvas;
      return;
    }

    // Draw beam projectile (bright blue/white)
    ctx.fillStyle = this.config.piercing ? '#ffff00' : '#00ffff'; // Yellow if piercing
    ctx.fillRect(0, 1, canvas.width, canvas.height - 2);
    
    // Add bright core
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(1, 2, canvas.width - 2, 1);

    this.sprite.image = canvas;
  }
}

/**
 * Missile projectile - slower, limited ammo, high damage, potential homing/explosive
 */
export class MissileProjectile extends BaseProjectile {
  constructor(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    canvasWidth: number,
    canvasHeight: number,
    upgradeEffects?: WeaponUpgradeEffects,
    id?: string
  ) {
    const config: ProjectileConfig = {
      damage: Math.round(3 * (upgradeEffects?.damageMultiplier || 1)),
      speed: Math.round(400 * (upgradeEffects?.speedMultiplier || 1)),
      lifetime: 5,
      width: 12,
      height: 6,
      homing: upgradeEffects?.specialEffects?.homing || false,
      explosive: upgradeEffects?.specialEffects?.explosive || false
    };

    if (upgradeEffects?.specialEffects?.explosive) {
      config.explosionRadius = 30;
    }

    super(x, y, velocityX, velocityY, canvasWidth, canvasHeight, config, id);
  }

  protected createSprite(): void {
    const canvas = document.createElement('canvas');
    canvas.width = this.config.width;
    canvas.height = this.config.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      this.sprite.image = canvas;
      return;
    }

    // Draw missile body (red/orange)
    ctx.fillStyle = '#ff4400';
    ctx.fillRect(0, 1, canvas.width - 2, canvas.height - 2);
    
    // Draw missile tip (bright yellow)
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(canvas.width - 3, 2, 3, canvas.height - 4);

    // Add flame trail if homing
    if (this.config.homing) {
      ctx.fillStyle = '#ff8800';
      ctx.fillRect(0, 2, 3, canvas.height - 4);
    }

    this.sprite.image = canvas;
  }

  protected onHit(event: CollisionEvent): void {
    if (this.config.explosive) {
      this.createExplosion(event);
    }
  }

  /**
   * Create explosion effect for explosive missiles
   */
  private createExplosion(_event: CollisionEvent): void {
    // TODO: Implement explosion effect when particle system is available
    console.log(`Missile explosion at ${this.transform.position.x}, ${this.transform.position.y}`);
  }
}

/**
 * Special projectile - unique effects like shields, tractor beams, screen clear
 */
export class SpecialProjectile extends BaseProjectile {
  private specialType: SpecialWeaponType;

  constructor(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    canvasWidth: number,
    canvasHeight: number,
    specialType: SpecialWeaponType,
    upgradeEffects?: WeaponUpgradeEffects,
    id?: string
  ) {
    const config = SpecialProjectile.getConfigForType(specialType, upgradeEffects);
    super(x, y, velocityX, velocityY, canvasWidth, canvasHeight, config, id);
    this.specialType = specialType;
  }

  private static getConfigForType(
    type: SpecialWeaponType, 
    upgradeEffects?: WeaponUpgradeEffects
  ): ProjectileConfig {
    const baseConfigs: Record<SpecialWeaponType, ProjectileConfig> = {
      [SpecialWeaponType.SHIELD]: {
        damage: 0,
        speed: 0, // Stationary
        lifetime: 5 + (upgradeEffects ? 2 : 0), // Longer with upgrades
        width: 64,
        height: 64
      },
      [SpecialWeaponType.TRACTOR_BEAM]: {
        damage: 0,
        speed: 800,
        lifetime: 2,
        width: 16,
        height: 32
      },
      [SpecialWeaponType.SCREEN_CLEAR]: {
        damage: 999, // High damage to clear everything
        speed: 0, // Instant effect
        lifetime: 0.1,
        width: 1,
        height: 1
      }
    };

    return baseConfigs[type];
  }

  protected createSprite(): void {
    const canvas = document.createElement('canvas');
    canvas.width = this.config.width;
    canvas.height = this.config.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      this.sprite.image = canvas;
      return;
    }

    switch (this.specialType) {
      case SpecialWeaponType.SHIELD:
        this.createShieldSprite(ctx, canvas);
        break;
      case SpecialWeaponType.TRACTOR_BEAM:
        this.createTractorBeamSprite(ctx, canvas);
        break;
      case SpecialWeaponType.SCREEN_CLEAR:
        this.createScreenClearSprite(ctx, canvas);
        break;
    }

    this.sprite.image = canvas;
  }

  private createShieldSprite(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    // Draw shield as a translucent blue circle
    ctx.strokeStyle = '#00aaff';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
    
    // Add inner glow
    ctx.strokeStyle = '#88ddff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  private createTractorBeamSprite(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    // Draw tractor beam as a green energy beam
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#00ff00');
    gradient.addColorStop(1, '#88ff88');
    
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  private createScreenClearSprite(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    // Screen clear doesn't need a visible sprite
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  protected onHit(event: CollisionEvent): void {
    switch (this.specialType) {
      case SpecialWeaponType.SHIELD:
        this.applyShieldEffect(event);
        break;
      case SpecialWeaponType.TRACTOR_BEAM:
        this.applyTractorBeamEffect(event);
        break;
      case SpecialWeaponType.SCREEN_CLEAR:
        this.applyScreenClearEffect(event);
        break;
    }
  }

  private applyShieldEffect(_event: CollisionEvent): void {
    // TODO: Apply temporary invincibility to player
    console.log('Shield effect applied');
  }

  private applyTractorBeamEffect(_event: CollisionEvent): void {
    // TODO: Pull power-ups toward player
    console.log('Tractor beam effect applied');
  }

  private applyScreenClearEffect(_event: CollisionEvent): void {
    // TODO: Destroy all enemies and obstacles on screen
    console.log('Screen clear effect applied');
  }

  getSpecialType(): SpecialWeaponType {
    return this.specialType;
  }
}

export enum SpecialWeaponType {
  SHIELD = 'shield',
  TRACTOR_BEAM = 'tractor_beam',
  SCREEN_CLEAR = 'screen_clear'
}

/**
 * Factory function to create projectiles based on weapon type
 */
export function createProjectile(
  weaponType: WeaponType,
  x: number,
  y: number,
  velocityX: number,
  velocityY: number,
  canvasWidth: number,
  canvasHeight: number,
  upgradeEffects?: WeaponUpgradeEffects,
  specialType?: SpecialWeaponType
): BaseProjectile {
  switch (weaponType) {
    case WeaponType.BEAM:
      return new BeamProjectile(x, y, velocityX, velocityY, canvasWidth, canvasHeight, upgradeEffects);
    
    case WeaponType.MISSILE:
      return new MissileProjectile(x, y, velocityX, velocityY, canvasWidth, canvasHeight, upgradeEffects);
    
    case WeaponType.SPECIAL:
      const type = specialType || SpecialWeaponType.SHIELD;
      return new SpecialProjectile(x, y, velocityX, velocityY, canvasWidth, canvasHeight, type, upgradeEffects);
    
    default:
      throw new Error(`Unknown weapon type: ${weaponType}`);
  }
}