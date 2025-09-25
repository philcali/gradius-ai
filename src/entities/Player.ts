/**
 * Player entity represents the player's spaceship
 * Handles movement, input processing, and screen boundary constraints
 */

import { Entity } from '../core/Entity';
import { Transform } from '../components/Transform';
import { Sprite } from '../components/Sprite';
import { Collider, CollisionLayers, CollisionMasks } from '../components/Collider';
import { Weapon, WeaponType } from '../components/Weapon';
import { SpecialEffects, SpecialEffectType } from '../components/SpecialEffects';
import { InputManager } from '../core/InputManager';
import { createProjectile, BaseProjectile, SpecialWeaponType } from './ProjectileTypes';

export class Player extends Entity {
  private transform: Transform;
  private sprite: Sprite;
  private collider: Collider;
  private weapon: Weapon;
  private specialEffects: SpecialEffects;
  private inputManager: InputManager;

  // Movement properties
  private readonly moveSpeed: number = 300; // pixels per second
  private readonly canvasWidth: number;
  private readonly canvasHeight: number;

  // Ship dimensions for boundary checking
  private readonly shipWidth: number = 32;
  private readonly shipHeight: number = 32;

  // Projectile creation callback
  private projectileCreationCallback?: (projectile: BaseProjectile) => void;

  constructor(
    x: number,
    y: number,
    canvasWidth: number,
    canvasHeight: number,
    inputManager: InputManager,
    id?: string
  ) {
    super(id);

    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.inputManager = inputManager;

    // Create and add Transform component
    this.transform = new Transform(x, y, 0, 0, 0);
    this.addComponent(this.transform);

    // Create and add Weapon component
    this.weapon = new Weapon(WeaponType.BEAM);
    this.addComponent(this.weapon);

    // Create and add SpecialEffects component
    this.specialEffects = new SpecialEffects();
    this.addComponent(this.specialEffects);

    // Create and add Sprite component
    this.sprite = new Sprite(this.shipWidth, this.shipHeight);
    this.sprite.setLayer(1); // Player should render above background
    this.addComponent(this.sprite);

    // Create and add Collider component
    this.collider = new Collider(
      this.shipWidth - 4, // Slightly smaller than sprite for better gameplay
      this.shipHeight - 4,
      0, // Offset X (centered)
      0, // Offset Y (centered)
      CollisionLayers.PLAYER,
      CollisionMasks.PLAYER
    );

    // Set up collision callback
    this.collider.setCollisionCallback((event) => {
      console.log(`Player collided with entity ${event.otherEntityId}`);
      // In a real game, this would handle damage, game over, etc.
    });

    this.addComponent(this.collider);

    // Create a simple rectangle sprite for now (will be replaced with actual sprite later)
    this.createPlaceholderSprite();
  }

  /**
   * Create a placeholder sprite using canvas drawing
   */
  private createPlaceholderSprite(): void {
    const canvas = document.createElement('canvas');
    canvas.width = this.shipWidth;
    canvas.height = this.shipHeight;
    const ctx = canvas.getContext('2d');

    // If context is not available (e.g., in test environment), skip drawing
    if (!ctx) {
      this.sprite.image = canvas;
      return;
    }

    // Draw a simple spaceship shape
    ctx.fillStyle = '#00aaff';

    // Ship body (triangle pointing right)
    ctx.beginPath();
    ctx.moveTo(canvas.width - 2, canvas.height / 2); // Nose
    ctx.lineTo(2, 2); // Top back
    ctx.lineTo(8, canvas.height / 2 - 4); // Top middle
    ctx.lineTo(8, canvas.height / 2 + 4); // Bottom middle
    ctx.lineTo(2, canvas.height - 2); // Bottom back
    ctx.closePath();
    ctx.fill();

    // Engine glow
    ctx.fillStyle = '#ff4400';
    ctx.fillRect(0, canvas.height / 2 - 2, 6, 4);

    this.sprite.image = canvas;
  }

  /**
   * Update player logic including input processing and movement
   */
  update(deltaTime: number): void {
    if (!this.active) return;

    this.processInput(deltaTime);
    this.processWeaponInput(deltaTime);
    this.constrainToBounds();

    // Call parent update to update components
    super.update(deltaTime);
  }

  /**
   * Process keyboard input for player movement
   */
  private processInput(_deltaTime: number): void {
    let vx = 0;
    let vy = 0;

    // Horizontal movement
    if (this.inputManager.isKeyPressed('arrowleft') || this.inputManager.isKeyPressed('keya')) {
      vx = -this.moveSpeed;
    }
    if (this.inputManager.isKeyPressed('arrowright') || this.inputManager.isKeyPressed('keyd')) {
      vx = this.moveSpeed;
    }

    // Vertical movement
    if (this.inputManager.isKeyPressed('arrowup') || this.inputManager.isKeyPressed('keyw')) {
      vy = -this.moveSpeed;
    }
    if (this.inputManager.isKeyPressed('arrowdown') || this.inputManager.isKeyPressed('keys')) {
      vy = this.moveSpeed;
    }

    // Diagonal movement normalization
    if (vx !== 0 && vy !== 0) {
      const normalizer = Math.sqrt(2) / 2; // Approximately 0.707
      vx *= normalizer;
      vy *= normalizer;
    }

    // Set velocity
    this.transform.setVelocity(vx, vy);
  }

  /**
   * Constrain player ship to screen boundaries
   */
  private constrainToBounds(): void {
    const halfWidth = this.shipWidth / 2;
    const halfHeight = this.shipHeight / 2;

    // Horizontal bounds
    if (this.transform.position.x - halfWidth < 0) {
      this.transform.position.x = halfWidth;
      if (this.transform.velocity.x < 0) {
        this.transform.velocity.x = 0;
      }
    } else if (this.transform.position.x + halfWidth > this.canvasWidth) {
      this.transform.position.x = this.canvasWidth - halfWidth;
      if (this.transform.velocity.x > 0) {
        this.transform.velocity.x = 0;
      }
    }

    // Vertical bounds
    if (this.transform.position.y - halfHeight < 0) {
      this.transform.position.y = halfHeight;
      if (this.transform.velocity.y < 0) {
        this.transform.velocity.y = 0;
      }
    } else if (this.transform.position.y + halfHeight > this.canvasHeight) {
      this.transform.position.y = this.canvasHeight - halfHeight;
      if (this.transform.velocity.y > 0) {
        this.transform.velocity.y = 0;
      }
    }
  }

  /**
   * Get the player's current position
   */
  getPosition(): { x: number; y: number } {
    return { ...this.transform.position };
  }

  /**
   * Set the player's position
   */
  setPosition(x: number, y: number): void {
    this.transform.setPosition(x, y);
  }

  /**
   * Get the player's current velocity
   */
  getVelocity(): { x: number; y: number } {
    return { ...this.transform.velocity };
  }

  /**
   * Get the player's movement speed
   */
  getMoveSpeed(): number {
    return this.moveSpeed;
  }

  /**
   * Get the player's ship dimensions
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.shipWidth, height: this.shipHeight };
  }

  /**
   * Check if the player is moving
   */
  isMoving(): boolean {
    return this.transform.velocity.x !== 0 || this.transform.velocity.y !== 0;
  }

  /**
   * Process weapon input for firing projectiles
   */
  private processWeaponInput(_deltaTime: number): void {
    // Primary fire (beam weapon) - Space key
    if (this.inputManager.isKeyPressed('space')) {
      this.fireCurrentWeapon();
    }

    // Secondary fire (missile weapon) - X key
    if (this.inputManager.isKeyPressed('keyx')) {
      this.fireMissileWeapon();
    }

    // Special weapon activation - Z key
    if (this.inputManager.isKeyPressed('keyz')) {
      this.activateSpecialWeapon();
    }

    // Weapon switching - Tab key
    if (this.inputManager.isKeyPressed('tab')) {
      this.weapon.cycleWeapon();
    }

    // Weapon selection keys
    if (this.inputManager.isKeyPressed('digit1')) {
      this.weapon.switchWeapon(WeaponType.BEAM);
    }
    if (this.inputManager.isKeyPressed('digit2')) {
      this.weapon.switchWeapon(WeaponType.MISSILE);
    }
    if (this.inputManager.isKeyPressed('digit3')) {
      this.weapon.switchWeapon(WeaponType.SPECIAL);
    }

    // Individual special effect activation keys
    if (this.inputManager.isKeyPressed('keyq')) {
      this.activateSpecificEffect(SpecialEffectType.SHIELD);
    }
    if (this.inputManager.isKeyPressed('keye')) {
      this.activateSpecificEffect(SpecialEffectType.TRACTOR_BEAM);
    }
    if (this.inputManager.isKeyPressed('keyr')) {
      this.activateSpecificEffect(SpecialEffectType.SCREEN_CLEAR);
    }
  }

  /**
   * Fire the currently selected weapon
   */
  private fireCurrentWeapon(): void {
    if (!this.weapon.canFire()) {
      return;
    }

    if (this.weapon.fire()) {
      this.createProjectileForCurrentWeapon();
    }
  }

  /**
   * Fire missile weapon specifically (for secondary fire)
   */
  private fireMissileWeapon(): void {
    const currentWeapon = this.weapon.getCurrentWeapon();

    // Temporarily switch to missile weapon
    this.weapon.switchWeapon(WeaponType.MISSILE);

    if (this.weapon.canFire() && this.weapon.fire()) {
      this.createProjectileForCurrentWeapon();
    }

    // Switch back to original weapon
    this.weapon.switchWeapon(currentWeapon);
  }

  /**
   * Create a projectile for the current weapon type
   */
  private createProjectileForCurrentWeapon(): void {
    const weaponType = this.weapon.getCurrentWeapon();
    const config = this.weapon.getCurrentWeaponConfig();
    const upgradeEffects = this.weapon.getUpgradeEffects(weaponType, config.currentLevel);

    // Calculate projectile spawn position (front of the ship)
    const spawnX = this.transform.position.x + this.shipWidth / 2;
    const spawnY = this.transform.position.y;

    // For special weapons, determine which special type to create
    let specialType: SpecialWeaponType | undefined;
    if (weaponType === WeaponType.SPECIAL) {
      // Cycle through special weapon types based on weapon level or player choice
      const level = config.currentLevel;
      if (level === 1) specialType = SpecialWeaponType.SHIELD;
      else if (level === 2) specialType = SpecialWeaponType.TRACTOR_BEAM;
      else specialType = SpecialWeaponType.SCREEN_CLEAR;
    }

    // Create projectile using the factory function
    const projectile = createProjectile(
      weaponType,
      spawnX,
      spawnY,
      1, // Velocity X (normalized, will be multiplied by speed)
      0, // Velocity Y
      this.canvasWidth,
      this.canvasHeight,
      upgradeEffects,
      specialType
    );

    // Call the callback to add projectile to the game
    if (this.projectileCreationCallback) {
      this.projectileCreationCallback(projectile);
    }
  }

  /**
   * Activate special weapon effect (Z key)
   */
  private activateSpecialWeapon(): void {
    // Determine which special effect to activate based on weapon level
    const config = this.weapon.getWeaponConfig(WeaponType.SPECIAL);
    if (!config) return;

    let effectType: SpecialEffectType;
    if (config.currentLevel === 1) {
      effectType = SpecialEffectType.SHIELD;
    } else if (config.currentLevel === 2) {
      effectType = SpecialEffectType.TRACTOR_BEAM;
    } else {
      effectType = SpecialEffectType.SCREEN_CLEAR;
    }

    this.activateSpecificEffect(effectType);
  }

  /**
   * Activate a specific special effect
   */
  private activateSpecificEffect(effectType: SpecialEffectType): void {
    if (this.specialEffects.activateEffect(effectType)) {
      // Apply immediate effects based on type
      switch (effectType) {
        case SpecialEffectType.SHIELD:
          this.applyShieldEffect();
          break;
        case SpecialEffectType.TRACTOR_BEAM:
          this.applyTractorBeamEffect();
          break;
        case SpecialEffectType.SCREEN_CLEAR:
          this.applyScreenClearEffect();
          break;
      }
    }
  }

  /**
   * Apply shield effect - temporary invincibility
   */
  private applyShieldEffect(): void {
    const activeEffect = this.specialEffects.getActiveEffect(SpecialEffectType.SHIELD);
    if (!activeEffect) return;

    // Update collider to ignore damage during shield
    this.collider.setCollisionCallback((event) => {
      if (this.specialEffects.isEffectActive(SpecialEffectType.SHIELD)) {
        const effectData = activeEffect.data;
        
        // Complete invulnerability or damage reduction
        if (effectData.invulnerable) {
          console.log(`Shield blocked collision with entity ${event.otherEntityId}`);
          return; // No damage taken
        } else if (effectData.damageReduction > 0) {
          console.log(`Shield reduced damage from entity ${event.otherEntityId} by ${effectData.damageReduction * 100}%`);
          // In a full implementation, this would reduce damage
        }

        // Reflect damage at higher levels
        if (effectData.reflectDamage) {
          console.log(`Shield reflected damage back to entity ${event.otherEntityId}`);
          // In a full implementation, this would damage the attacker
        }
      } else {
        // Normal collision handling when shield is not active
        console.log(`Player collided with entity ${event.otherEntityId}`);
      }
    });

    console.log(`Shield activated for ${activeEffect.duration}ms at level ${activeEffect.level}`);
  }

  /**
   * Apply tractor beam effect - attract power-ups and optionally enemies
   */
  private applyTractorBeamEffect(): void {
    const activeEffect = this.specialEffects.getActiveEffect(SpecialEffectType.TRACTOR_BEAM);
    if (!activeEffect) return;

    const effectData = activeEffect.data;
    console.log(`Tractor beam activated with range ${effectData.range} and strength ${effectData.strength}`);
    
    // In a full implementation, this would:
    // 1. Find all power-ups within range
    // 2. Apply attractive force toward player
    // 3. At level 3+, also affect enemies
    
    // For now, we'll create a visual projectile to represent the beam
    if (this.projectileCreationCallback) {
      const spawnX = this.transform.position.x + this.shipWidth / 2;
      const spawnY = this.transform.position.y;
      
      const config = this.weapon.getCurrentWeaponConfig();
      const upgradeEffects = this.weapon.getUpgradeEffects(WeaponType.SPECIAL, config.currentLevel);
      
      const tractorProjectile = createProjectile(
        WeaponType.SPECIAL,
        spawnX,
        spawnY,
        1, 0,
        this.canvasWidth,
        this.canvasHeight,
        upgradeEffects,
        SpecialWeaponType.TRACTOR_BEAM
      );
      
      this.projectileCreationCallback(tractorProjectile);
    }
  }

  /**
   * Apply screen clear effect - destroy all enemies and obstacles
   */
  private applyScreenClearEffect(): void {
    const activeEffect = this.specialEffects.getActiveEffect(SpecialEffectType.SCREEN_CLEAR);
    if (!activeEffect) return;

    const effectData = activeEffect.data;
    console.log(`Screen clear activated with damage ${effectData.damage} and range ${effectData.range}`);
    
    // In a full implementation, this would:
    // 1. Find all enemies and destructible obstacles on screen
    // 2. Apply massive damage to destroy them
    // 3. Award bonus score at level 3+
    
    // For now, we'll create a special projectile to handle the effect
    if (this.projectileCreationCallback) {
      const spawnX = this.canvasWidth / 2; // Center of screen
      const spawnY = this.canvasHeight / 2;
      
      const config = this.weapon.getCurrentWeaponConfig();
      const upgradeEffects = this.weapon.getUpgradeEffects(WeaponType.SPECIAL, config.currentLevel);
      
      const clearProjectile = createProjectile(
        WeaponType.SPECIAL,
        spawnX,
        spawnY,
        0, 0, // Stationary
        this.canvasWidth,
        this.canvasHeight,
        upgradeEffects,
        SpecialWeaponType.SCREEN_CLEAR
      );
      
      this.projectileCreationCallback(clearProjectile);
    }
  }

  /**
   * Set the callback function for creating projectiles
   */
  setProjectileCreationCallback(callback: (projectile: BaseProjectile) => void): void {
    this.projectileCreationCallback = callback;
  }

  /**
   * Get the weapon component
   */
  getWeapon(): Weapon {
    return this.weapon;
  }

  /**
   * Get current weapon type
   */
  getCurrentWeaponType(): WeaponType {
    return this.weapon.getCurrentWeapon();
  }

  /**
   * Get ammunition count for a weapon type
   */
  getAmmo(weaponType: WeaponType): number | undefined {
    return this.weapon.getAmmo(weaponType);
  }

  /**
   * Get maximum ammunition count for a weapon type
   */
  getMaxAmmo(weaponType: WeaponType): number | undefined {
    return this.weapon.getMaxAmmo(weaponType);
  }

  /**
   * Add ammunition to a weapon type
   */
  addAmmo(weaponType: WeaponType, amount: number): boolean {
    return this.weapon.addAmmo(weaponType, amount);
  }

  /**
   * Upgrade a weapon type
   */
  upgradeWeapon(weaponType: WeaponType): boolean {
    return this.weapon.upgradeWeapon(weaponType);
  }

  /**
   * Check if the player can fire the current weapon
   */
  canFire(): boolean {
    return this.weapon.canFire();
  }

  /**
   * Get time until current weapon can fire again
   */
  getTimeUntilReady(): number {
    return this.weapon.getTimeUntilReady();
  }

  /**
   * Get the fire rate of the current weapon in milliseconds
   */
  getFireRate(): number {
    const config = this.weapon.getCurrentWeaponConfig();
    return config.fireRate;
  }

  /**
   * Get time since last shot was fired in milliseconds
   */
  getTimeSinceLastShot(): number {
    return this.weapon.getTimeSinceLastShot();
  }

  /**
   * Get the special effects component
   */
  getSpecialEffects(): SpecialEffects {
    return this.specialEffects;
  }

  /**
   * Check if a special effect is currently active
   */
  isSpecialEffectActive(effectType: SpecialEffectType): boolean {
    return this.specialEffects.isEffectActive(effectType);
  }

  /**
   * Get remaining duration for a special effect
   */
  getSpecialEffectRemainingDuration(effectType: SpecialEffectType): number {
    return this.specialEffects.getRemainingDuration(effectType);
  }

  /**
   * Get remaining cooldown for a special effect
   */
  getSpecialEffectRemainingCooldown(effectType: SpecialEffectType): number {
    return this.specialEffects.getRemainingCooldown(effectType);
  }

  /**
   * Get remaining uses for a special effect
   */
  getSpecialEffectRemainingUses(effectType: SpecialEffectType): number | undefined {
    return this.specialEffects.getRemainingUses(effectType);
  }

  /**
   * Upgrade a special effect
   */
  upgradeSpecialEffect(effectType: SpecialEffectType): boolean {
    return this.specialEffects.upgradeEffect(effectType);
  }

  /**
   * Add uses to a special effect
   */
  addSpecialEffectUses(effectType: SpecialEffectType, amount: number): boolean {
    return this.specialEffects.addUses(effectType, amount);
  }

  /**
   * Check if player is currently invulnerable (shield effect)
   */
  isInvulnerable(): boolean {
    return this.specialEffects.isEffectActive(SpecialEffectType.SHIELD);
  }
}