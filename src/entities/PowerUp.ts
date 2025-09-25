/**
 * PowerUp entity represents collectible items that provide weapon upgrades,
 * ammunition, or special abilities to the player
 */

import { Entity } from '../core/Entity';
import { Transform } from '../components/Transform';
import { Sprite } from '../components/Sprite';
import { Collider, CollisionLayers, CollisionMasks } from '../components/Collider';
import { WeaponType } from '../components/Weapon';
import { SpecialEffectType } from '../components/SpecialEffects';

export enum PowerUpType {
  WEAPON_UPGRADE_BEAM = 'weapon_upgrade_beam',
  WEAPON_UPGRADE_MISSILE = 'weapon_upgrade_missile',
  WEAPON_UPGRADE_SPECIAL = 'weapon_upgrade_special',
  AMMUNITION_MISSILE = 'ammunition_missile',
  AMMUNITION_SPECIAL = 'ammunition_special',
  SPECIAL_EFFECT_SHIELD = 'special_effect_shield',
  SPECIAL_EFFECT_TRACTOR = 'special_effect_tractor',
  SPECIAL_EFFECT_CLEAR = 'special_effect_clear',
  SCORE_MULTIPLIER = 'score_multiplier'
}

export interface PowerUpConfig {
  type: PowerUpType;
  value: number; // Amount of upgrade/ammo/effect
  scoreBonus: number; // Bonus points for collecting
  duration?: number; // For temporary effects (in milliseconds)
}

export class PowerUp extends Entity {
  private transform: Transform;
  private sprite: Sprite;
  private collider: Collider;
  private config: PowerUpConfig;

  // Visual properties
  private readonly width: number = 24;
  private readonly height: number = 24;
  private readonly scrollSpeed: number = 150; // pixels per second (matches background)

  // Collection callback
  private collectionCallback?: (powerUp: PowerUp) => void;

  constructor(
    x: number,
    y: number,
    config: PowerUpConfig,
    id?: string
  ) {
    super(id);

    this.config = config;

    // Create and add Transform component
    this.transform = new Transform(x, y, -this.scrollSpeed, 0, 0);
    this.addComponent(this.transform);

    // Create and add Sprite component
    this.sprite = new Sprite(this.width, this.height);
    this.sprite.setLayer(2); // Render above background but below UI
    this.addComponent(this.sprite);

    // Create and add Collider component
    this.collider = new Collider(
      this.width - 2,
      this.height - 2,
      0, 0,
      CollisionLayers.POWERUP,
      CollisionMasks.POWERUP
    );

    // Set up collision callback for collection
    this.collider.setCollisionCallback((event) => {
      if (event.otherCollider.layer === CollisionLayers.PLAYER) {
        this.collect();
      }
    });

    this.addComponent(this.collider);

    // Create visual representation based on power-up type
    this.createVisualRepresentation();
  }

  /**
   * Create visual representation based on power-up type
   */
  private createVisualRepresentation(): void {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      this.sprite.image = canvas;
      return;
    }

    // Clear background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw based on power-up type
    switch (this.config.type) {
      case PowerUpType.WEAPON_UPGRADE_BEAM:
        this.drawWeaponUpgrade(ctx, '#00aaff', 'B');
        break;
      case PowerUpType.WEAPON_UPGRADE_MISSILE:
        this.drawWeaponUpgrade(ctx, '#ff4400', 'M');
        break;
      case PowerUpType.WEAPON_UPGRADE_SPECIAL:
        this.drawWeaponUpgrade(ctx, '#aa00ff', 'S');
        break;
      case PowerUpType.AMMUNITION_MISSILE:
        this.drawAmmunition(ctx, '#ffaa00', 'M');
        break;
      case PowerUpType.AMMUNITION_SPECIAL:
        this.drawAmmunition(ctx, '#aa00ff', 'S');
        break;
      case PowerUpType.SPECIAL_EFFECT_SHIELD:
        this.drawSpecialEffect(ctx, '#00ff00', '◊');
        break;
      case PowerUpType.SPECIAL_EFFECT_TRACTOR:
        this.drawSpecialEffect(ctx, '#ffff00', '◈');
        break;
      case PowerUpType.SPECIAL_EFFECT_CLEAR:
        this.drawSpecialEffect(ctx, '#ff0000', '◉');
        break;
      case PowerUpType.SCORE_MULTIPLIER:
        this.drawScoreMultiplier(ctx);
        break;
    }

    this.sprite.image = canvas;
  }

  /**
   * Draw weapon upgrade power-up
   */
  private drawWeaponUpgrade(ctx: CanvasRenderingContext2D, color: string, letter: string): void {
    // Outer glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    
    // Main shape (hexagon)
    ctx.fillStyle = color;
    ctx.beginPath();
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = 10;
    
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Letter indicator
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, centerX, centerY);
  }

  /**
   * Draw ammunition power-up
   */
  private drawAmmunition(ctx: CanvasRenderingContext2D, color: string, letter: string): void {
    // Outer glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    
    // Main shape (rectangle with rounded corners)
    ctx.fillStyle = color;
    const x = 4;
    const y = 6;
    const width = this.width - 8;
    const height = this.height - 12;
    const radius = 3;
    
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Letter indicator
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, this.width / 2, this.height / 2);
  }

  /**
   * Draw special effect power-up
   */
  private drawSpecialEffect(ctx: CanvasRenderingContext2D, color: string, symbol: string): void {
    // Outer glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    
    // Main shape (circle)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.width / 2, this.height / 2, 9, 0, Math.PI * 2);
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Symbol indicator
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, this.width / 2, this.height / 2);
  }

  /**
   * Draw score multiplier power-up
   */
  private drawScoreMultiplier(ctx: CanvasRenderingContext2D): void {
    // Rainbow gradient
    const gradient = ctx.createRadialGradient(
      this.width / 2, this.height / 2, 0,
      this.width / 2, this.height / 2, 12
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, '#ffff00');
    gradient.addColorStop(0.6, '#ff8800');
    gradient.addColorStop(1, '#ff0088');

    // Outer glow
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 12;
    
    // Main shape (star)
    ctx.fillStyle = gradient;
    this.drawStar(ctx, this.width / 2, this.height / 2, 5, 10, 5);

    // Reset shadow
    ctx.shadowBlur = 0;

    // Multiplier text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('×2', this.width / 2, this.height / 2);
  }

  /**
   * Draw a star shape
   */
  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ): void {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      const x = cx + Math.cos(rot) * outerRadius;
      const y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      const x2 = cx + Math.cos(rot) * innerRadius;
      const y2 = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x2, y2);
      rot += step;
    }

    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Update power-up logic
   */
  update(deltaTime: number): void {
    if (!this.active) return;

    // Remove if moved off screen
    if (this.transform.position.x + this.width < 0) {
      this.active = false;
    }

    // Call parent update to update components
    super.update(deltaTime);
  }

  /**
   * Handle power-up collection
   */
  private collect(): void {
    if (this.collectionCallback) {
      this.collectionCallback(this);
    }
    this.active = false;
  }

  /**
   * Get power-up configuration
   */
  getConfig(): PowerUpConfig {
    return { ...this.config };
  }

  /**
   * Get power-up type
   */
  getType(): PowerUpType {
    return this.config.type;
  }

  /**
   * Get power-up value
   */
  getValue(): number {
    return this.config.value;
  }

  /**
   * Get score bonus for collecting this power-up
   */
  getScoreBonus(): number {
    return this.config.scoreBonus;
  }

  /**
   * Get duration for temporary effects
   */
  getDuration(): number | undefined {
    return this.config.duration;
  }

  /**
   * Get power-up position
   */
  getPosition(): { x: number; y: number } {
    return { ...this.transform.position };
  }

  /**
   * Get power-up dimensions
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * Set collection callback
   */
  setCollectionCallback(callback: (powerUp: PowerUp) => void): void {
    this.collectionCallback = callback;
  }

  /**
   * Get weapon type for weapon upgrade power-ups
   */
  getWeaponType(): WeaponType | undefined {
    switch (this.config.type) {
      case PowerUpType.WEAPON_UPGRADE_BEAM:
        return WeaponType.BEAM;
      case PowerUpType.WEAPON_UPGRADE_MISSILE:
        return WeaponType.MISSILE;
      case PowerUpType.WEAPON_UPGRADE_SPECIAL:
        return WeaponType.SPECIAL;
      default:
        return undefined;
    }
  }

  /**
   * Get special effect type for special effect power-ups
   */
  getSpecialEffectType(): SpecialEffectType | undefined {
    switch (this.config.type) {
      case PowerUpType.SPECIAL_EFFECT_SHIELD:
        return SpecialEffectType.SHIELD;
      case PowerUpType.SPECIAL_EFFECT_TRACTOR:
        return SpecialEffectType.TRACTOR_BEAM;
      case PowerUpType.SPECIAL_EFFECT_CLEAR:
        return SpecialEffectType.SCREEN_CLEAR;
      default:
        return undefined;
    }
  }

  /**
   * Check if this is a weapon upgrade power-up
   */
  isWeaponUpgrade(): boolean {
    return [
      PowerUpType.WEAPON_UPGRADE_BEAM,
      PowerUpType.WEAPON_UPGRADE_MISSILE,
      PowerUpType.WEAPON_UPGRADE_SPECIAL
    ].includes(this.config.type);
  }

  /**
   * Check if this is an ammunition power-up
   */
  isAmmunition(): boolean {
    return [
      PowerUpType.AMMUNITION_MISSILE,
      PowerUpType.AMMUNITION_SPECIAL
    ].includes(this.config.type);
  }

  /**
   * Check if this is a special effect power-up
   */
  isSpecialEffect(): boolean {
    return [
      PowerUpType.SPECIAL_EFFECT_SHIELD,
      PowerUpType.SPECIAL_EFFECT_TRACTOR,
      PowerUpType.SPECIAL_EFFECT_CLEAR
    ].includes(this.config.type);
  }

  /**
   * Create a weapon upgrade power-up
   */
  static createWeaponUpgrade(
    x: number,
    y: number,
    weaponType: WeaponType,
    upgradeLevel: number = 1
  ): PowerUp {
    let type: PowerUpType;
    switch (weaponType) {
      case WeaponType.BEAM:
        type = PowerUpType.WEAPON_UPGRADE_BEAM;
        break;
      case WeaponType.MISSILE:
        type = PowerUpType.WEAPON_UPGRADE_MISSILE;
        break;
      case WeaponType.SPECIAL:
        type = PowerUpType.WEAPON_UPGRADE_SPECIAL;
        break;
    }

    const config: PowerUpConfig = {
      type,
      value: upgradeLevel,
      scoreBonus: 100 * upgradeLevel
    };

    return new PowerUp(x, y, config);
  }

  /**
   * Create an ammunition power-up
   */
  static createAmmunition(
    x: number,
    y: number,
    weaponType: WeaponType,
    amount: number,
  ): PowerUp {
    let type: PowerUpType;
    switch (weaponType) {
      case WeaponType.MISSILE:
        type = PowerUpType.AMMUNITION_MISSILE;
        break;
      case WeaponType.SPECIAL:
        type = PowerUpType.AMMUNITION_SPECIAL;
        break;
      default:
        throw new Error(`Cannot create ammunition for weapon type: ${weaponType}`);
    }

    const config: PowerUpConfig = {
      type,
      value: amount,
      scoreBonus: 50
    };

    return new PowerUp(x, y, config);
  }
}