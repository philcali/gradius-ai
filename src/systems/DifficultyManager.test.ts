/**
 * Unit tests for DifficultyManager
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DifficultyManager, DifficultySettings } from './DifficultyManager';
import { ScoringSystem } from './ScoringSystem';
import { GameState } from '../core/GameState';
import { ObstacleSpawner } from './ObstacleSpawner';
import { PowerUpSpawner } from './PowerUpSpawner';

describe('DifficultyManager', () => {
  let gameState: GameState;
  let scoringSystem: ScoringSystem;
  let difficultyManager: DifficultyManager;
  let obstacleSpawner: ObstacleSpawner;
  let powerUpSpawner: PowerUpSpawner;

  beforeEach(() => {
    gameState = new GameState();
    scoringSystem = new ScoringSystem(gameState);
    difficultyManager = new DifficultyManager(gameState, scoringSystem);
    obstacleSpawner = new ObstacleSpawner(800, 600);
    powerUpSpawner = new PowerUpSpawner(800, 600);

    // Mock Date.now for consistent testing
    vi.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    scoringSystem.destroy();
  });

  describe('Initialization', () => {
    it('should initialize with base difficulty settings', () => {
      const settings = difficultyManager.getCurrentSettings();

      expect(settings.spawnRateMultiplier).toBe(1.0);
      expect(settings.enemySpeedMultiplier).toBe(1.0);
      expect(settings.enemySpawnChance).toBe(0.3);
      expect(settings.scrollSpeedMultiplier).toBe(1.0);
      expect(settings.powerUpSpawnMultiplier).toBe(1.0);
    });

    it('should set up callbacks with scoring system', () => {
      const setLevelUpCallbackSpy = vi.spyOn(scoringSystem, 'setLevelUpCallback');
      const setDifficultyIncreaseCallbackSpy = vi.spyOn(scoringSystem, 'setDifficultyIncreaseCallback');

      new DifficultyManager(gameState, scoringSystem);

      expect(setLevelUpCallbackSpy).toHaveBeenCalled();
      expect(setDifficultyIncreaseCallbackSpy).toHaveBeenCalled();
    });
  });

  describe('Difficulty Scaling', () => {
    it('should increase spawn rate with higher levels', () => {
      difficultyManager.forceUpdateDifficulty(5, 3.0);
      const settings = difficultyManager.getCurrentSettings();

      expect(settings.spawnRateMultiplier).toBeLessThan(1.0);
      expect(settings.enemySpeedMultiplier).toBeGreaterThan(1.0);
      expect(settings.enemySpawnChance).toBeGreaterThan(0.3);
    });

    it('should cap difficulty scaling at reasonable limits', () => {
      difficultyManager.forceUpdateDifficulty(20, 10.0);
      const settings = difficultyManager.getCurrentSettings();

      // Should be capped at reasonable values
      expect(settings.spawnRateMultiplier).toBeGreaterThanOrEqual(0.3);
      expect(settings.enemySpeedMultiplier).toBeLessThanOrEqual(3.0);
      expect(settings.enemySpawnChance).toBeLessThanOrEqual(0.7);
    });

    it('should calculate level factor correctly', () => {
      difficultyManager.forceUpdateDifficulty(10, 1.0);
      const settings1 = difficultyManager.getCurrentSettings();

      difficultyManager.forceUpdateDifficulty(20, 1.0);
      const settings2 = difficultyManager.getCurrentSettings();

      // Level 20 should have more extreme settings than level 10
      expect(settings2.spawnRateMultiplier).toBeLessThan(settings1.spawnRateMultiplier);
      expect(settings2.enemySpeedMultiplier).toBeGreaterThan(settings1.enemySpeedMultiplier);
    });

    it('should calculate difficulty factor correctly', () => {
      difficultyManager.forceUpdateDifficulty(1, 2.0);
      const settings1 = difficultyManager.getCurrentSettings();

      difficultyManager.forceUpdateDifficulty(1, 5.0);
      const settings2 = difficultyManager.getCurrentSettings();

      // Higher difficulty should have more extreme settings
      expect(settings2.spawnRateMultiplier).toBeLessThan(settings1.spawnRateMultiplier);
      expect(settings2.enemySpeedMultiplier).toBeGreaterThan(settings1.enemySpeedMultiplier);
    });
  });

  describe('Spawner Integration', () => {
    it('should update obstacle spawner configuration', () => {
      difficultyManager.setObstacleSpawner(obstacleSpawner);
      
      const initialConfig = obstacleSpawner.getConfig();
      
      difficultyManager.forceUpdateDifficulty(5, 3.0);
      
      const updatedConfig = obstacleSpawner.getConfig();
      
      expect(updatedConfig.minSpawnInterval).toBeLessThan(initialConfig.minSpawnInterval);
      expect(updatedConfig.maxSpawnInterval).toBeLessThan(initialConfig.maxSpawnInterval);
      expect(updatedConfig.enemySpawnChance).toBeGreaterThan(initialConfig.enemySpawnChance);
    });

    it('should update power-up spawner configuration', () => {
      difficultyManager.setPowerUpSpawner(powerUpSpawner);
      
      const initialConfig = powerUpSpawner.getConfig();
      
      difficultyManager.forceUpdateDifficulty(5, 3.0);
      
      const updatedConfig = powerUpSpawner.getConfig();
      
      expect(updatedConfig.spawnInterval).toBeLessThan(initialConfig.spawnInterval);
    });

    it('should handle spawners being set after difficulty changes', () => {
      // Change difficulty first
      difficultyManager.forceUpdateDifficulty(5, 3.0);
      
      // Then set spawners
      difficultyManager.setObstacleSpawner(obstacleSpawner);
      difficultyManager.setPowerUpSpawner(powerUpSpawner);
      
      const obstacleConfig = obstacleSpawner.getConfig();
      const powerUpConfig = powerUpSpawner.getConfig();
      
      // Should apply current difficulty settings
      expect(obstacleConfig.minSpawnInterval).toBeLessThan(1500);
      expect(powerUpConfig.spawnInterval).toBeLessThan(8000);
    });
  });

  describe('Update Logic', () => {
    it('should detect level changes and update difficulty', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Simulate level change
      gameState.setLevel(3);
      
      difficultyManager.update([], 16);
      
      // Check that difficulty settings were updated (console log indicates this)
      expect(consoleSpy).toHaveBeenCalledWith('Difficulty settings updated:', expect.any(Object));
      
      consoleSpy.mockRestore();
    });

    it('should not update difficulty if level has not changed', () => {
      const updateSpy = vi.spyOn(difficultyManager, 'forceUpdateDifficulty');
      
      // Update without level change
      difficultyManager.update([], 16);
      difficultyManager.update([], 16);
      
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe('Multiplier Getters', () => {
    it('should return correct spawn rate multiplier', () => {
      difficultyManager.forceUpdateDifficulty(5, 3.0);
      
      const multiplier = difficultyManager.getSpawnRateMultiplier();
      const settings = difficultyManager.getCurrentSettings();
      
      expect(multiplier).toBe(settings.spawnRateMultiplier);
    });

    it('should return correct enemy speed multiplier', () => {
      difficultyManager.forceUpdateDifficulty(5, 3.0);
      
      const multiplier = difficultyManager.getEnemySpeedMultiplier();
      const settings = difficultyManager.getCurrentSettings();
      
      expect(multiplier).toBe(settings.enemySpeedMultiplier);
    });

    it('should return correct scroll speed multiplier', () => {
      difficultyManager.forceUpdateDifficulty(5, 3.0);
      
      const multiplier = difficultyManager.getScrollSpeedMultiplier();
      const settings = difficultyManager.getCurrentSettings();
      
      expect(multiplier).toBe(settings.scrollSpeedMultiplier);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to base settings', () => {
      // Change difficulty
      difficultyManager.forceUpdateDifficulty(10, 5.0);
      
      const changedSettings = difficultyManager.getCurrentSettings();
      expect(changedSettings.spawnRateMultiplier).not.toBe(1.0);
      
      // Reset
      difficultyManager.reset();
      
      const resetSettings = difficultyManager.getCurrentSettings();
      expect(resetSettings.spawnRateMultiplier).toBe(1.0);
      expect(resetSettings.enemySpeedMultiplier).toBe(1.0);
      expect(resetSettings.enemySpawnChance).toBe(0.3);
    });

    it('should apply reset settings to spawners', () => {
      difficultyManager.setObstacleSpawner(obstacleSpawner);
      
      // Change difficulty
      difficultyManager.forceUpdateDifficulty(10, 5.0);
      
      const changedConfig = obstacleSpawner.getConfig();
      expect(changedConfig.minSpawnInterval).toBeLessThan(1500);
      
      // Reset
      difficultyManager.reset();
      
      const resetConfig = obstacleSpawner.getConfig();
      expect(resetConfig.minSpawnInterval).toBe(1500); // Base value
    });
  });

  describe('Statistics and Debugging', () => {
    it('should provide difficulty statistics', () => {
      gameState.setLevel(5);
      difficultyManager.forceUpdateDifficulty(5, 3.0);
      
      const stats = difficultyManager.getDifficultyStats();
      
      expect(stats.level).toBe(5);
      expect(stats.difficulty).toBe(3.0);
      expect(stats.settings).toBeDefined();
      expect(stats.spawnRateIncrease).toMatch(/\d+%/);
      expect(stats.enemySpeedIncrease).toMatch(/\d+%/);
    });

    it('should calculate percentage increases correctly', () => {
      difficultyManager.forceUpdateDifficulty(5, 3.0);
      
      const stats = difficultyManager.getDifficultyStats();
      const settings = stats.settings;
      
      // Spawn rate increase should be inverse of multiplier
      const expectedSpawnIncrease = Math.round((1 / settings.spawnRateMultiplier - 1) * 100);
      expect(stats.spawnRateIncrease).toBe(`${expectedSpawnIncrease}%`);
      
      // Enemy speed increase should be direct multiplier
      const expectedSpeedIncrease = Math.round((settings.enemySpeedMultiplier - 1) * 100);
      expect(stats.enemySpeedIncrease).toBe(`${expectedSpeedIncrease}%`);
    });
  });

  describe('Callback Integration', () => {
    it('should respond to level up callbacks', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Trigger level up callback
      const levelUpCallback = scoringSystem['onLevelUp'];
      if (levelUpCallback) {
        levelUpCallback(3, 2);
      }
      
      expect(consoleSpy).toHaveBeenCalledWith('Difficulty Manager: Level up to 3');
      
      consoleSpy.mockRestore();
    });

    it('should respond to difficulty increase callbacks', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Trigger difficulty increase callback
      const difficultyCallback = scoringSystem['onDifficultyIncrease'];
      if (difficultyCallback) {
        difficultyCallback(2.5, 2.0);
      }
      
      expect(consoleSpy).toHaveBeenCalledWith('Difficulty Manager: Difficulty increased to 2.5');
      
      consoleSpy.mockRestore();
    });
  });
});