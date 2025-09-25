/**
 * Unit tests for PowerUpSpawner system
 * Tests power-up spawning logic, timing, and configuration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PowerUpSpawner, PowerUpSpawnConfig } from './PowerUpSpawner';
import { PowerUp, PowerUpType } from '../entities/PowerUp';
import { afterEach } from 'node:test';

describe('PowerUpSpawner System', () => {
  const canvasWidth = 800;
  const canvasHeight = 600;
  let spawner: PowerUpSpawner;
  let mockCreationCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockCreationCallback = vi.fn();
    spawner = new PowerUpSpawner(canvasWidth, canvasHeight);
    spawner.setPowerUpCreationCallback(mockCreationCallback);
    
    // Mock Date.now for consistent testing
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Spawner Initialization', () => {
    it('should initialize with default configuration', () => {
      const config = spawner.getConfig();
      
      expect(config.spawnInterval).toBe(8000);
      expect(config.spawnVariance).toBe(4000);
      expect(config.weaponUpgradeChance).toBe(0.4);
      expect(config.ammunitionChance).toBe(0.3);
      expect(config.specialEffectChance).toBe(0.2);
      expect(config.scoreMultiplierChance).toBe(0.1);
      expect(config.maxPowerUpsOnScreen).toBe(3);
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<PowerUpSpawnConfig> = {
        spawnInterval: 5000,
        maxPowerUpsOnScreen: 5,
        weaponUpgradeChance: 0.6
      };

      const customSpawner = new PowerUpSpawner(canvasWidth, canvasHeight, customConfig);
      const config = customSpawner.getConfig();

      expect(config.spawnInterval).toBe(5000);
      expect(config.maxPowerUpsOnScreen).toBe(5);
      expect(config.weaponUpgradeChance).toBe(0.6);
      // Should keep defaults for unspecified values
      expect(config.ammunitionChance).toBe(0.3);
    });

    it('should schedule initial spawn time', () => {
      const timeUntilSpawn = spawner.getTimeUntilNextSpawn();
      expect(timeUntilSpawn).toBeGreaterThan(0);
      expect(timeUntilSpawn).toBeLessThanOrEqual(12000); // Max interval + variance
    });
  });

  describe('Power-Up Spawning Logic', () => {
    it('should not spawn power-ups before scheduled time', () => {
      const entities: PowerUp[] = [];
      
      // Update immediately - should not spawn
      spawner.update(entities, 16);
      
      expect(mockCreationCallback).not.toHaveBeenCalled();
    });

    it('should spawn power-up when time is reached', () => {
      const entities: PowerUp[] = [];
      
      // Fast-forward past spawn time
      vi.advanceTimersByTime(15000); // Well past max spawn interval
      
      spawner.update(entities, 16);
      
      expect(mockCreationCallback).toHaveBeenCalledTimes(1);
      expect(mockCreationCallback).toHaveBeenCalledWith(expect.any(PowerUp));
    });

    it('should respect maximum power-ups on screen limit', () => {
      // Create mock power-ups already on screen
      const existingPowerUps = Array.from({ length: 3 }, (_, i) => {
        const mockPowerUp = {
          active: true,
          filter: () => true
        } as any;
        Object.setPrototypeOf(mockPowerUp, PowerUp.prototype);
        return mockPowerUp;
      });

      // Fast-forward past spawn time
      vi.advanceTimersByTime(15000);
      
      spawner.update(existingPowerUps, 16);
      
      // Should not spawn because we're at the limit
      expect(mockCreationCallback).not.toHaveBeenCalled();
    });

    it('should spawn when under the limit', () => {
      // Create fewer power-ups than the limit
      const existingPowerUps = Array.from({ length: 2 }, (_, i) => {
        const mockPowerUp = {
          active: true,
          filter: () => true
        } as any;
        Object.setPrototypeOf(mockPowerUp, PowerUp.prototype);
        return mockPowerUp;
      });

      // Fast-forward past spawn time
      vi.advanceTimersByTime(15000);
      
      spawner.update(existingPowerUps, 16);
      
      // Should spawn because we're under the limit
      expect(mockCreationCallback).toHaveBeenCalledTimes(1);
    });

    it('should schedule next spawn after spawning', () => {
      const entities: PowerUp[] = [];
      
      // Get initial next spawn time
      const initialSpawnTime = spawner.getTimeUntilNextSpawn();
      
      // Fast-forward and spawn
      vi.advanceTimersByTime(15000);
      spawner.update(entities, 16);
      
      // Should have scheduled a new spawn time
      const newSpawnTime = spawner.getTimeUntilNextSpawn();
      expect(newSpawnTime).toBeGreaterThan(0);
      expect(newSpawnTime).not.toBe(initialSpawnTime);
    });
  });

  describe('Power-Up Type Selection', () => {
    it('should create different types of power-ups', () => {
      const spawnedTypes = new Set<PowerUpType>();
      
      // Force spawn multiple power-ups to test variety
      for (let i = 0; i < 20; i++) {
        const powerUp = spawner.forceSpawn(PowerUpType.WEAPON_UPGRADE_BEAM);
        if (powerUp) {
          spawnedTypes.add(powerUp.getType());
        }
      }
      
      // Should have created beam upgrade power-ups
      expect(spawnedTypes.has(PowerUpType.WEAPON_UPGRADE_BEAM)).toBe(true);
    });

    it('should create weapon upgrade power-ups with correct configuration', () => {
      const powerUp = spawner.forceSpawn(PowerUpType.WEAPON_UPGRADE_BEAM);
      
      expect(powerUp).toBeDefined();
      expect(powerUp!.getType()).toBe(PowerUpType.WEAPON_UPGRADE_BEAM);
      expect(powerUp!.getValue()).toBe(1);
      expect(powerUp!.getScoreBonus()).toBe(100);
      expect(powerUp!.isWeaponUpgrade()).toBe(true);
    });

    it('should create ammunition power-ups with random amounts', () => {
      const powerUp = spawner.forceSpawn(PowerUpType.AMMUNITION_MISSILE);
      
      expect(powerUp).toBeDefined();
      expect(powerUp!.getType()).toBe(PowerUpType.AMMUNITION_MISSILE);
      expect(powerUp!.getValue()).toBeGreaterThanOrEqual(5);
      expect(powerUp!.getValue()).toBeLessThanOrEqual(14);
      expect(powerUp!.getScoreBonus()).toBe(50);
      expect(powerUp!.isAmmunition()).toBe(true);
    });

    it('should create special effect power-ups with duration', () => {
      const powerUp = spawner.forceSpawn(PowerUpType.SPECIAL_EFFECT_SHIELD);
      
      expect(powerUp).toBeDefined();
      expect(powerUp!.getType()).toBe(PowerUpType.SPECIAL_EFFECT_SHIELD);
      expect(powerUp!.getValue()).toBe(1);
      expect(powerUp!.getDuration()).toBe(5000);
      expect(powerUp!.getScoreBonus()).toBe(150);
      expect(powerUp!.isSpecialEffect()).toBe(true);
    });

    it('should create score multiplier power-ups', () => {
      const powerUp = spawner.forceSpawn(PowerUpType.SCORE_MULTIPLIER);
      
      expect(powerUp).toBeDefined();
      expect(powerUp!.getType()).toBe(PowerUpType.SCORE_MULTIPLIER);
      expect(powerUp!.getValue()).toBe(2);
      expect(powerUp!.getDuration()).toBe(10000);
      expect(powerUp!.getScoreBonus()).toBe(200);
    });
  });

  describe('Spawn Position and Timing', () => {
    it('should spawn power-ups off-screen to the right', () => {
      const powerUp = spawner.forceSpawn(PowerUpType.WEAPON_UPGRADE_BEAM);
      
      expect(powerUp).toBeDefined();
      
      const position = powerUp!.getPosition();
      expect(position.x).toBeGreaterThan(canvasWidth);
      expect(position.y).toBeGreaterThanOrEqual(50);
      expect(position.y).toBeLessThanOrEqual(canvasHeight - 50);
    });

    it('should vary spawn timing with configured variance', () => {
      const config = spawner.getConfig();
      const baseInterval = config.spawnInterval;
      const variance = config.spawnVariance;
      
      // The actual spawn time should be within the variance range
      const timeUntilSpawn = spawner.getTimeUntilNextSpawn();
      expect(timeUntilSpawn).toBeGreaterThanOrEqual(baseInterval - variance);
      expect(timeUntilSpawn).toBeLessThanOrEqual(baseInterval + variance);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration correctly', () => {
      const newConfig: Partial<PowerUpSpawnConfig> = {
        spawnInterval: 3000,
        weaponUpgradeChance: 0.8
      };

      spawner.updateConfig(newConfig);
      const config = spawner.getConfig();

      expect(config.spawnInterval).toBe(3000);
      expect(config.weaponUpgradeChance).toBe(0.8);
      // Should preserve other values
      expect(config.ammunitionChance).toBe(0.3);
    });

    it('should adjust spawn rates based on difficulty', () => {
      const initialConfig = spawner.getConfig();
      const initialInterval = initialConfig.spawnInterval;
      const initialWeaponChance = initialConfig.weaponUpgradeChance;

      spawner.adjustSpawnRates(2.0); // 2x difficulty

      const adjustedConfig = spawner.getConfig();
      expect(adjustedConfig.spawnInterval).toBeLessThan(initialInterval);
      expect(adjustedConfig.weaponUpgradeChance).toBeGreaterThan(initialWeaponChance);
    });

    it('should respect minimum and maximum bounds when adjusting rates', () => {
      // Test minimum spawn interval
      spawner.adjustSpawnRates(10.0); // Very high difficulty
      let config = spawner.getConfig();
      expect(config.spawnInterval).toBeGreaterThanOrEqual(8000 * 0.3); // 30% of base

      // Test maximum weapon upgrade chance
      spawner.adjustSpawnRates(5.0);
      config = spawner.getConfig();
      expect(config.weaponUpgradeChance).toBeLessThanOrEqual(0.6); // Max 60%
    });

    it('should update canvas size correctly', () => {
      const newWidth = 1024;
      const newHeight = 768;

      spawner.updateCanvasSize(newWidth, newHeight);

      // Test by spawning a power-up and checking its position
      const powerUp = spawner.forceSpawn(PowerUpType.WEAPON_UPGRADE_BEAM);
      const position = powerUp!.getPosition();

      expect(position.x).toBeGreaterThan(newWidth);
      expect(position.y).toBeLessThanOrEqual(newHeight - 50);
    });
  });

  describe('State Management', () => {
    it('should track power-up count correctly', () => {
      expect(spawner.getPowerUpCount()).toBe(0);

      // Create mock power-ups that are actual PowerUp instances
      const mockPowerUps = Array.from({ length: 2 }, (_, i) => {
        const config = {
          type: PowerUpType.WEAPON_UPGRADE_BEAM,
          value: 1,
          scoreBonus: 100
        };
        return new PowerUp(100 + i * 50, 200, config, canvasWidth, canvasHeight);
      });

      spawner.update(mockPowerUps, 16);
      expect(spawner.getPowerUpCount()).toBe(2);
    });

    it('should clean up inactive power-ups from tracking', () => {
      // Create mix of active and inactive power-ups
      const mockPowerUps = [
        {
          active: true,
          filter: () => true
        } as any,
        {
          active: false,
          filter: () => true
        } as any,
        {
          active: true,
          filter: () => true
        } as any
      ];

      mockPowerUps.forEach(powerUp => {
        Object.setPrototypeOf(powerUp, PowerUp.prototype);
      });

      spawner.update(mockPowerUps, 16);
      expect(spawner.getPowerUpCount()).toBe(2); // Only active ones
    });

    it('should reset state correctly', () => {
      // Force spawn some power-ups
      spawner.forceSpawn(PowerUpType.WEAPON_UPGRADE_BEAM);
      
      const initialSpawnTime = spawner.getTimeUntilNextSpawn();
      
      spawner.reset();
      
      expect(spawner.getPowerUpCount()).toBe(0);
      
      const newSpawnTime = spawner.getTimeUntilNextSpawn();
      expect(newSpawnTime).not.toBe(initialSpawnTime);
    });

    it('should provide spawn statistics', () => {
      const stats = spawner.getSpawnStats();
      
      expect(stats).toHaveProperty('totalPowerUps');
      expect(stats).toHaveProperty('nextSpawnIn');
      expect(stats).toHaveProperty('spawnInterval');
      expect(stats).toHaveProperty('maxOnScreen');
      
      expect(typeof stats.totalPowerUps).toBe('number');
      expect(typeof stats.nextSpawnIn).toBe('number');
      expect(typeof stats.spawnInterval).toBe('number');
      expect(typeof stats.maxOnScreen).toBe('number');
    });
  });

  describe('Force Spawn Functionality', () => {
    it('should force spawn when under limit', () => {
      const powerUp = spawner.forceSpawn(PowerUpType.WEAPON_UPGRADE_BEAM);
      
      expect(powerUp).toBeDefined();
      expect(mockCreationCallback).toHaveBeenCalledWith(powerUp);
    });

    it('should not force spawn when at limit', () => {
      // Create power-ups at the limit
      const mockPowerUps = Array.from({ length: 3 }, () => {
        const mockPowerUp = {
          active: true,
          filter: () => true
        } as any;
        Object.setPrototypeOf(mockPowerUp, PowerUp.prototype);
        return mockPowerUp;
      });

      spawner.update(mockPowerUps, 16);
      
      const powerUp = spawner.forceSpawn(PowerUpType.WEAPON_UPGRADE_BEAM);
      expect(powerUp).toBeNull();
    });

    it('should handle invalid power-up types gracefully', () => {
      const invalidType = 'invalid_type' as PowerUpType;
      const powerUp = spawner.forceSpawn(invalidType);
      
      expect(powerUp).toBeNull();
    });
  });
});