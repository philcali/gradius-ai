/**
 * PowerUpSpawner system handles spawning power-ups at random intervals
 * Manages different types of power-ups and their spawn rates
 */

import { System, Entity } from '../core/interfaces';
import { PowerUp, PowerUpType, PowerUpConfig } from '../entities/PowerUp';

export interface PowerUpSpawnConfig {
  spawnInterval: number; // Base interval between spawns (milliseconds)
  spawnVariance: number; // Random variance in spawn timing (milliseconds)
  weaponUpgradeChance: number; // Chance to spawn weapon upgrade (0-1)
  ammunitionChance: number; // Chance to spawn ammunition (0-1)
  specialEffectChance: number; // Chance to spawn special effect (0-1)
  scoreMultiplierChance: number; // Chance to spawn score multiplier (0-1)
  maxPowerUpsOnScreen: number; // Maximum number of power-ups on screen
}

export class PowerUpSpawner implements System {
  public readonly name = 'PowerUpSpawner';

  private canvasWidth: number;
  private canvasHeight: number;
  private config: PowerUpSpawnConfig;
  private nextSpawnTime: number = 0;
  private powerUps: PowerUp[] = [];

  // Power-up creation callback
  private powerUpCreationCallback?: (powerUp: PowerUp) => void;

  // Default spawn configuration
  private static readonly DEFAULT_CONFIG: PowerUpSpawnConfig = {
    spawnInterval: 8000, // 8 seconds base interval
    spawnVariance: 4000, // ±4 seconds variance
    weaponUpgradeChance: 0.4, // 40% chance
    ammunitionChance: 0.3, // 30% chance
    specialEffectChance: 0.2, // 20% chance
    scoreMultiplierChance: 0.1, // 10% chance
    maxPowerUpsOnScreen: 3
  };

  constructor(
    canvasWidth: number,
    canvasHeight: number,
    config: Partial<PowerUpSpawnConfig> = {}
  ) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.config = { ...PowerUpSpawner.DEFAULT_CONFIG, ...config };
    this.scheduleNextSpawn();
  }

  /**
   * Filter for power-up entities
   */
  filter(entity: Entity): boolean {
    return entity instanceof PowerUp;
  }

  /**
   * Update power-up spawning logic
   */
  update(entities: Entity[], deltaTime: number): void {
    // Update power-up list
    this.powerUps = entities.filter(entity => this.filter(entity)) as PowerUp[];

    // Check if it's time to spawn a new power-up
    const currentTime = Date.now();
    if (currentTime >= this.nextSpawnTime && this.canSpawnPowerUp()) {
      console.log(deltaTime);
      this.spawnRandomPowerUp();
      this.scheduleNextSpawn();
    }

    // Clean up inactive power-ups from our tracking list
    this.powerUps = this.powerUps.filter(powerUp => powerUp.active);
  }

  /**
   * Check if a new power-up can be spawned
   */
  private canSpawnPowerUp(): boolean {
    return this.powerUps.length < this.config.maxPowerUpsOnScreen;
  }

  /**
   * Schedule the next power-up spawn
   */
  private scheduleNextSpawn(): void {
    const variance = (Math.random() - 0.5) * 2 * this.config.spawnVariance;
    const spawnDelay = this.config.spawnInterval + variance;
    this.nextSpawnTime = Date.now() + spawnDelay;
  }

  /**
   * Spawn a random power-up
   */
  private spawnRandomPowerUp(): void {
    const powerUpType = this.selectRandomPowerUpType();
    const powerUp = this.createPowerUp(powerUpType);

    if (powerUp && this.powerUpCreationCallback) {
      this.powerUpCreationCallback(powerUp);
    }
  }

  /**
   * Select a random power-up type based on configured chances
   */
  private selectRandomPowerUpType(): PowerUpType {
    const random = Math.random();
    let cumulativeChance = 0;

    // Check weapon upgrade chance
    cumulativeChance += this.config.weaponUpgradeChance;
    if (random < cumulativeChance) {
      return this.selectRandomWeaponUpgrade();
    }

    // Check ammunition chance
    cumulativeChance += this.config.ammunitionChance;
    if (random < cumulativeChance) {
      return this.selectRandomAmmunition();
    }

    // Check special effect chance
    cumulativeChance += this.config.specialEffectChance;
    if (random < cumulativeChance) {
      return this.selectRandomSpecialEffect();
    }

    // Default to score multiplier
    return PowerUpType.SCORE_MULTIPLIER;
  }

  /**
   * Select a random weapon upgrade type
   */
  private selectRandomWeaponUpgrade(): PowerUpType {
    const weaponUpgrades = [
      PowerUpType.WEAPON_UPGRADE_BEAM,
      PowerUpType.WEAPON_UPGRADE_MISSILE,
      PowerUpType.WEAPON_UPGRADE_SPECIAL
    ];
    return weaponUpgrades[Math.floor(Math.random() * weaponUpgrades.length)];
  }

  /**
   * Select a random ammunition type
   */
  private selectRandomAmmunition(): PowerUpType {
    const ammunitionTypes = [
      PowerUpType.AMMUNITION_MISSILE,
      PowerUpType.AMMUNITION_SPECIAL
    ];
    return ammunitionTypes[Math.floor(Math.random() * ammunitionTypes.length)];
  }

  /**
   * Select a random special effect type
   */
  private selectRandomSpecialEffect(): PowerUpType {
    const specialEffects = [
      PowerUpType.SPECIAL_EFFECT_SHIELD,
      PowerUpType.SPECIAL_EFFECT_TRACTOR,
      PowerUpType.SPECIAL_EFFECT_CLEAR
    ];
    return specialEffects[Math.floor(Math.random() * specialEffects.length)];
  }

  /**
   * Create a power-up of the specified type
   */
  private createPowerUp(type: PowerUpType): PowerUp | null {
    // Spawn position (right side of screen, random Y)
    const spawnX = this.canvasWidth + 50; // Off-screen to the right
    const spawnY = Math.random() * (this.canvasHeight - 100) + 50; // Avoid edges

    let config: PowerUpConfig;

    switch (type) {
      case PowerUpType.WEAPON_UPGRADE_BEAM:
      case PowerUpType.WEAPON_UPGRADE_MISSILE:
      case PowerUpType.WEAPON_UPGRADE_SPECIAL:
        config = {
          type,
          value: 1, // Single level upgrade
          scoreBonus: 100
        };
        break;

      case PowerUpType.AMMUNITION_MISSILE:
        config = {
          type,
          value: Math.floor(Math.random() * 10) + 5, // 5-14 missiles
          scoreBonus: 50
        };
        break;

      case PowerUpType.AMMUNITION_SPECIAL:
        config = {
          type,
          value: Math.floor(Math.random() * 3) + 1, // 1-3 special uses
          scoreBonus: 75
        };
        break;

      case PowerUpType.SPECIAL_EFFECT_SHIELD:
      case PowerUpType.SPECIAL_EFFECT_TRACTOR:
      case PowerUpType.SPECIAL_EFFECT_CLEAR:
        config = {
          type,
          value: 1, // Single use/upgrade
          scoreBonus: 150,
          duration: 5000 // 5 seconds for temporary effects
        };
        break;

      case PowerUpType.SCORE_MULTIPLIER:
        config = {
          type,
          value: 2, // 2x multiplier
          scoreBonus: 200,
          duration: 10000 // 10 seconds
        };
        break;

      default:
        return null;
    }

    return new PowerUp(spawnX, spawnY, config);
  }

  /**
   * Set the callback for creating power-ups
   */
  setPowerUpCreationCallback(callback: (powerUp: PowerUp) => void): void {
    this.powerUpCreationCallback = callback;
  }

  /**
   * Get current power-up count on screen
   */
  getPowerUpCount(): number {
    return this.powerUps.length;
  }

  /**
   * Get time until next spawn (in milliseconds)
   */
  getTimeUntilNextSpawn(): number {
    return Math.max(0, this.nextSpawnTime - Date.now());
  }

  /**
   * Force spawn a specific power-up type (for testing/debugging)
   */
  forceSpawn(type: PowerUpType): PowerUp | null {
    if (!this.canSpawnPowerUp()) {
      return null;
    }

    const powerUp = this.createPowerUp(type);
    if (powerUp && this.powerUpCreationCallback) {
      this.powerUpCreationCallback(powerUp);
    }
    return powerUp;
  }

  /**
   * Update spawn configuration
   */
  updateConfig(newConfig: Partial<PowerUpSpawnConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current spawn configuration
   */
  getConfig(): PowerUpSpawnConfig {
    return { ...this.config };
  }

  /**
   * Reset spawner state
   */
  reset(): void {
    this.powerUps = [];
    this.scheduleNextSpawn();
  }

  /**
   * Update canvas dimensions
   */
  updateCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  /**
   * Adjust spawn rates based on game difficulty/progression
   */
  adjustSpawnRates(difficultyMultiplier: number): void {
    // Increase spawn frequency as difficulty increases
    const baseInterval = PowerUpSpawner.DEFAULT_CONFIG.spawnInterval;
    this.config.spawnInterval = Math.max(
      baseInterval * 0.3, // Minimum 30% of base interval
      baseInterval / difficultyMultiplier
    );

    // Slightly increase weapon upgrade chances at higher difficulties
    const baseWeaponChance = PowerUpSpawner.DEFAULT_CONFIG.weaponUpgradeChance;
    this.config.weaponUpgradeChance = Math.min(
      0.6, // Maximum 60% chance
      baseWeaponChance + (difficultyMultiplier - 1) * 0.1
    );
  }

  /**
   * Get spawn statistics for debugging
   */
  getSpawnStats(): {
    totalPowerUps: number;
    nextSpawnIn: number;
    spawnInterval: number;
    maxOnScreen: number;
  } {
    return {
      totalPowerUps: this.powerUps.length,
      nextSpawnIn: this.getTimeUntilNextSpawn(),
      spawnInterval: this.config.spawnInterval,
      maxOnScreen: this.config.maxPowerUpsOnScreen
    };
  }
}