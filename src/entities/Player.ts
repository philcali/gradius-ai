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
import { Health } from '../components/Health';
import { InputManager } from '../core/InputManager';
import { createProjectile, BaseProjectile, SpecialWeaponType } from './ProjectileTypes';
import { PowerUp, PowerUpType } from './PowerUp';

export class Player extends Entity {
  private transform: Transform;
  private sprite: Sprite;
  private collider: Collider;
  private weapon: Weapon;
  private specialEffects: SpecialEffects;
  private health: Health;
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

  // Power-up collection callback
  private powerUpCollectionCallback?: (powerUp: PowerUp, player: Player) => void;

  // Visual effects callback
  private visualEffectsCallback?: (effectType: string, position: { x: number; y: number }, data?: any) => void;

  // Death callback for game over handling
  private deathCallback?: () => void;

  // Death state management
  private isDying: boolean = false;
  private deathHandled: boolean = false;

  // Score tracking for power-up collection
  private score: number = 0;

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

    // Create and add Health component
    this.health = new Health({
      maxHealth: 3, // Player starts with 3 health points
      currentHealth: 3,
      invulnerabilityDuration: 1500, // 1.5 seconds of invulnerability after taking damage
      regeneration: {
        enabled: false, // No health regeneration by default
        rate: 0,
        delay: 0
      }
    });

    // Set up health callbacks
    this.health.setOnDamageCallback((damage, currentHealth, maxHealth) => {
      console.log(`Player took ${damage} damage! Health: ${currentHealth}/${maxHealth}`);
      
      // Create damage flash effect
      if (this.visualEffectsCallback) {
        this.visualEffectsCallback('damage_flash', { x: 0, y: 0 });
      }
    });

    this.health.setOnDeathCallback(() => {
      console.log('Player died!');
      this.isDying = true; // Mark as dying but don't deactivate yet
      
      // Trigger death callback for game over handling
      if (this.deathCallback) {
        this.deathCallback();
      }
    });

    this.addComponent(this.health);

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
      this.handleCollision(event);
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

    // Update health component (handles regeneration and invulnerability)
    this.health.update(deltaTime);

    // Don't process input or movement if dying
    if (!this.isDying) {
      this.processInput(deltaTime);
      this.processWeaponInput(deltaTime);
      this.constrainToBounds();
    }

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
    // Primary fire (beam weapon) - Space key (hold to fire automatically)
    if (this.inputManager.isKeyPressed('space')) {
      this.fireCurrentWeapon();
    }

    // Secondary fire (missile weapon) - X key (hold to fire automatically)
    if (this.inputManager.isKeyPressed('keyx')) {
      this.fireMissileWeapon();
    }

    // Special weapon activation - Z key (single press only)
    if (this.inputManager.isKeyJustPressed('keyz')) {
      this.activateSpecialWeapon();
    }

    // Weapon switching - Tab key (single press only)
    if (this.inputManager.isKeyJustPressed('tab')) {
      this.weapon.cycleWeapon();
    }

    // Weapon selection keys (single press only)
    if (this.inputManager.isKeyJustPressed('digit1')) {
      this.weapon.switchWeapon(WeaponType.BEAM);
    }
    if (this.inputManager.isKeyJustPressed('digit2')) {
      this.weapon.switchWeapon(WeaponType.MISSILE);
    }
    if (this.inputManager.isKeyJustPressed('digit3')) {
      this.weapon.switchWeapon(WeaponType.SPECIAL);
    }

    // Individual special effect activation keys (single press only)
    if (this.inputManager.isKeyJustPressed('keyq')) {
      this.activateSpecificEffect(SpecialEffectType.SHIELD);
    }
    if (this.inputManager.isKeyJustPressed('keye')) {
      this.activateSpecificEffect(SpecialEffectType.TRACTOR_BEAM);
    }
    if (this.inputManager.isKeyJustPressed('keyr')) {
      this.activateSpecificEffect(SpecialEffectType.SCREEN_CLEAR);
    }
  }

  private applyMuzzleFlash(): void {
    // Create muzzle flash effect
    if (this.visualEffectsCallback) {
      const muzzlePosition = {
        x: this.transform.position.x + this.shipWidth / 2,
        y: this.transform.position.y
      };
      this.visualEffectsCallback('muzzle_flash', muzzlePosition, { direction: { x: 1, y: 0 } });
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
      this.applyMuzzleFlash();
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
      this.applyMuzzleFlash();
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

  /**
   * Handle collision events
   */
  private handleCollision(event: any): void {
    // Check if collision is with a power-up
    if (event.otherCollider.layer === CollisionLayers.POWERUP) {
      // Power-up collection will be handled by the power-up's collision callback
      // This is just for logging/debugging
      console.log(`Player is collecting power-up from entity ${event.otherEntityId}`);
      return;
    }

    // Handle other collision types (enemies, obstacles, etc.)
    // Check shield invulnerability first
    if (this.isInvulnerable()) {
      console.log(`Shield blocked collision with entity ${event.otherEntityId}`);
      return;
    }

    // Check health-based invulnerability (i-frames after taking damage)
    if (this.health.isInvulnerable()) {
      console.log(`Player is invulnerable, ignoring collision with entity ${event.otherEntityId}`);
      return;
    }

    console.log(`Player collided with entity ${event.otherEntityId}`);

    // Determine damage based on collision type
    let damage = 1; // Default damage
    
    // Different entities could deal different damage
    // This could be expanded to check the other entity's type or damage component
    if (event.otherCollider.layer === CollisionLayers.ENEMY) {
      damage = 1; // Enemies deal 1 damage
    } else if (event.otherCollider.layer === CollisionLayers.OBSTACLE) {
      damage = 1; // Obstacles deal 1 damage
    } else if (event.otherCollider.layer === CollisionLayers.PROJECTILE) {
      damage = 1; // Enemy projectiles deal 1 damage
    }

    // Apply damage through health system
    const died = this.health.takeDamage(damage);
    
    if (died) {
      console.log('Player died from collision!');
      // Death is handled by the health component's death callback
    }
  }

  /**
   * Collect a power-up and apply its effects
   */
  collectPowerUp(powerUp: PowerUp): boolean {
    const powerUpType = powerUp.getType();
    const value = powerUp.getValue();
    const scoreBonus = powerUp.getScoreBonus();

    // Add score bonus
    this.score += scoreBonus;

    // Apply power-up effects based on type
    let collected = false;

    if (powerUp.isWeaponUpgrade()) {
      const weaponType = powerUp.getWeaponType();
      if (weaponType) {
        for (let i = 0; i < value; i++) {
          if (this.upgradeWeapon(weaponType)) {
            collected = true;
          }
        }
        console.log(`Collected weapon upgrade for ${weaponType} (${value} levels)`);
      }
    } else if (powerUp.isAmmunition()) {
      if (powerUpType === PowerUpType.AMMUNITION_MISSILE) {
        if (this.addAmmo(WeaponType.MISSILE, value)) {
          collected = true;
        }
        console.log(`Collected ${value} missile ammunition`);
      } else if (powerUpType === PowerUpType.AMMUNITION_SPECIAL) {
        if (this.addAmmo(WeaponType.SPECIAL, value)) {
          collected = true;
        }
        console.log(`Collected ${value} special ammunition`);
      }
    } else if (powerUp.isSpecialEffect()) {
      const effectType = powerUp.getSpecialEffectType();
      if (effectType) {
        // For special effects, we can either upgrade the effect or add uses
        if (this.upgradeSpecialEffect(effectType) || this.addSpecialEffectUses(effectType, value)) {
          collected = true;
        }
        console.log(`Collected special effect: ${effectType}`);
      }
    } else if (powerUpType === PowerUpType.SCORE_MULTIPLIER) {
      // Score multiplier is handled differently - it affects future scoring
      // For now, just give the bonus points
      collected = true;
      console.log(`Collected score multiplier: ${value}x for ${powerUp.getDuration()}ms`);
    }

    // Call collection callback for visual feedback and game state updates
    if (this.powerUpCollectionCallback) {
      this.powerUpCollectionCallback(powerUp, this);
    }

    // Create visual feedback effect

    return collected;
  }

  /**
   * Set the callback function for power-up collection
   */
  setPowerUpCollectionCallback(callback: (powerUp: PowerUp, player: Player) => void): void {
    this.powerUpCollectionCallback = callback;
  }

  /**
   * Set the visual effects callback
   */
  setVisualEffectsCallback(callback: (effectType: string, position: { x: number; y: number }, data?: any) => void): void {
    this.visualEffectsCallback = callback;
  }

  /**
   * Get current score
   */
  getScore(): number {
    return this.score;
  }

  /**
   * Add to score
   */
  addScore(points: number): void {
    this.score += points;
  }

  /**
   * Reset score
   */
  resetScore(): void {
    this.score = 0;
  }

  /**
   * Get the health component
   */
  getHealth(): Health {
    return this.health;
  }

  /**
   * Get current health
   */
  getCurrentHealth(): number {
    return this.health.getCurrentHealth();
  }

  /**
   * Get maximum health
   */
  getMaxHealth(): number {
    return this.health.getMaxHealth();
  }

  /**
   * Get health as a percentage (0-1)
   */
  getHealthPercentage(): number {
    return this.health.getHealthPercentage();
  }

  /**
   * Check if player is alive
   */
  isAlive(): boolean {
    return this.health.isAlive();
  }

  /**
   * Take damage
   */
  takeDamage(damage: number): boolean {
    return this.health.takeDamage(damage);
  }

  /**
   * Heal health
   */
  heal(amount: number): number {
    return this.health.heal(amount);
  }

  /**
   * Set health to a specific value
   */
  setHealth(health: number): void {
    this.health.setHealth(health);
  }

  /**
   * Fully restore health
   */
  fullHeal(): void {
    this.health.fullHeal();
  }

  /**
   * Check if player has health-based invulnerability (i-frames)
   */
  hasHealthInvulnerability(): boolean {
    return this.health.isInvulnerable();
  }

  /**
   * Get remaining invulnerability time
   */
  getRemainingInvulnerabilityTime(): number {
    return this.health.getRemainingInvulnerabilityTime();
  }

  /**
   * Set death callback for game over handling
   */
  setDeathCallback(callback: () => void): void {
    this.deathCallback = callback;
  }

  /**
   * Reset player to full health and clear death state
   */
  resetHealth(): void {
    this.health.reset();
    this.isDying = false;
    this.deathHandled = false;
    this.active = true; // Reactivate the player
  }

  /**
   * Check if player is in dying state
   */
  isDyingState(): boolean {
    return this.isDying;
  }

  /**
   * Check if player death has been handled
   */
  isDeathHandled(): boolean {
    return this.deathHandled;
  }

  /**
   * Mark player death as handled and deactivate the entity
   */
  markDeathHandled(): void {
    this.deathHandled = true;
    this.active = false; // Now it's safe to deactivate
  }
}