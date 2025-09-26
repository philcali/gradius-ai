/**
 * Unit tests for ScoringSystem
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ScoringSystem, ScoreValues, ProgressionConfig } from './ScoringSystem';
import { GameState } from '../core/GameState';
import { Obstacle } from '../entities/Obstacle';
import { Enemy, EnemyMovementPattern } from '../entities/Enemy';
import { PowerUp, PowerUpType } from '../entities/PowerUp';

describe('ScoringSystem', () => {
  let gameState: GameState;
  let scoringSystem: ScoringSystem;

  beforeEach(() => {
    gameState = new GameState();
    scoringSystem = new ScoringSystem(gameState);
    
    // Mock Date.now for consistent testing
    vi.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    scoringSystem.destroy();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const scoreValues = scoringSystem.getScoreValues();
      const progressionConfig = scoringSystem.getProgressionConfig();

      expect(scoreValues.smallObstacle).toBe(10);
      expect(scoreValues.basicEnemy).toBe(100);
      expect(progressionConfig.levelScoreThreshold).toBe(1000);
    });

    it('should accept custom score values', () => {
      const customScoreValues: Partial<ScoreValues> = {
        smallObstacle: 20,
        basicEnemy: 150
      };

      const customScoringSystem = new ScoringSystem(gameState, customScoreValues);
      const scoreValues = customScoringSystem.getScoreValues();

      expect(scoreValues.smallObstacle).toBe(20);
      expect(scoreValues.basicEnemy).toBe(150);
      expect(scoreValues.mediumObstacle).toBe(25); // Should keep default

      customScoringSystem.destroy();
    });

    it('should accept custom progression config', () => {
      const customProgressionConfig: Partial<ProgressionConfig> = {
        levelScoreThreshold: 2000,
        maxDifficultyLevel: 15
      };

      const customScoringSystem = new ScoringSystem(gameState, undefined, customProgressionConfig);
      const progressionConfig = customScoringSystem.getProgressionConfig();

      expect(progressionConfig.levelScoreThreshold).toBe(2000);
      expect(progressionConfig.maxDifficultyLevel).toBe(15);
      expect(progressionConfig.levelTimeThreshold).toBe(30000); // Should keep default

      customScoringSystem.destroy();
    });
  });

  describe('Obstacle Scoring', () => {
    it('should award correct score for small obstacles', () => {
      const obstacle = new Obstacle(100, 100, 800, 600, {
        width: 24,
        height: 24,
        destructible: true
      });

      const score = scoringSystem.awardObstacleScore(obstacle);
      
      expect(score).toBe(15); // 10 * 1.5 (destructible bonus)
      expect(gameState.getData().score).toBe(15);
    });

    it('should award correct score for medium obstacles', () => {
      const obstacle = new Obstacle(100, 100, 800, 600, {
        width: 32,
        height: 32,
        destructible: true
      });

      const score = scoringSystem.awardObstacleScore(obstacle);
      
      expect(score).toBe(37); // 25 * 1.5 (destructible bonus), floored
      expect(gameState.getData().score).toBe(37);
    });

    it('should award correct score for large obstacles', () => {
      const obstacle = new Obstacle(100, 100, 800, 600, {
        width: 48,
        height: 48,
        destructible: true
      });

      const score = scoringSystem.awardObstacleScore(obstacle);
      
      expect(score).toBe(75); // 50 * 1.5 (destructible bonus)
      expect(gameState.getData().score).toBe(75);
    });

    it('should not apply destructible bonus for indestructible obstacles', () => {
      const obstacle = new Obstacle(100, 100, 800, 600, {
        width: 32,
        height: 32,
        destructible: false
      });

      const score = scoringSystem.awardObstacleScore(obstacle);
      
      expect(score).toBe(25); // No destructible bonus
      expect(gameState.getData().score).toBe(25);
    });

    it('should apply combo multiplier', () => {
      const obstacle = new Obstacle(100, 100, 800, 600, {
        width: 24,
        height: 24,
        destructible: true
      });

      // Build up combo
      for (let i = 0; i < 5; i++) {
        scoringSystem.awardObstacleScore(obstacle);
      }

      // 6th hit should have combo multiplier
      const score = scoringSystem.awardObstacleScore(obstacle);
      
      expect(score).toBe(22); // 15 * 1.5 (combo multiplier), floored
    });
  });

  describe('Enemy Scoring', () => {
    it('should award correct score for basic enemies', () => {
      const enemy = new Enemy(100, 100, 800, 600, {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.STRAIGHT,
        speed: 20,
        health: 1
      });

      const score = scoringSystem.awardEnemyScore(enemy);
      
      expect(score).toBe(100); // Basic enemy score * health (1)
      expect(gameState.getData().score).toBe(100);
    });

    it('should award correct score for advanced enemies', () => {
      const enemy = new Enemy(100, 100, 800, 600, {
        width: 32,
        height: 24,
        movementPattern: EnemyMovementPattern.SINE_WAVE,
        speed: 30,
        health: 2
      });

      const score = scoringSystem.awardEnemyScore(enemy);
      
      expect(score).toBe(400); // Advanced enemy score (200) * health (2)
      expect(gameState.getData().score).toBe(400);
    });

    it('should multiply score by enemy health', () => {
      const enemy = new Enemy(100, 100, 800, 600, {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.STRAIGHT,
        speed: 20,
        health: 3
      });

      const score = scoringSystem.awardEnemyScore(enemy);
      
      // Enemy with health > 1 is considered advanced (200 base score)
      expect(score).toBe(600); // Advanced enemy score (200) * health (3)
      expect(gameState.getData().score).toBe(600);
    });
  });

  describe('Power-up Scoring', () => {
    it('should award score for power-up collection', () => {
      const powerUp = new PowerUp(100, 100, {
        type: PowerUpType.WEAPON_UPGRADE_BEAM,
        value: 1,
        scoreBonus: 100
      });

      const score = scoringSystem.awardPowerUpScore(powerUp);
      
      expect(score).toBe(100);
      expect(gameState.getData().score).toBe(100);
    });

    it('should use default score if no scoreBonus specified', () => {
      const powerUp = new PowerUp(100, 100, {
        type: PowerUpType.AMMUNITION_MISSILE,
        value: 5,
        scoreBonus: 0
      });

      // Mock the config to return 0 scoreBonus
      vi.spyOn(powerUp, 'getConfig').mockReturnValue({
        type: PowerUpType.AMMUNITION_MISSILE,
        value: 5,
        scoreBonus: 0
      });

      const score = scoringSystem.awardPowerUpScore(powerUp);
      
      expect(score).toBe(50); // Default power-up collection score
      expect(gameState.getData().score).toBe(50);
    });
  });

  describe('Combo System', () => {
    it('should track combo correctly', () => {
      const obstacle = new Obstacle(100, 100, 800, 600, {
        width: 24,
        height: 24,
        destructible: true
      });

      // Award some scores to build combo
      scoringSystem.awardObstacleScore(obstacle);
      scoringSystem.awardObstacleScore(obstacle);
      scoringSystem.awardObstacleScore(obstacle);

      const stats = scoringSystem.getGameStats();
      expect(stats.currentCombo).toBe(3);
      expect(stats.maxCombo).toBe(3);
    });

    it('should reset combo when resetCombo is called', () => {
      const obstacle = new Obstacle(100, 100, 800, 600, {
        width: 24,
        height: 24,
        destructible: true
      });

      // Build combo
      scoringSystem.awardObstacleScore(obstacle);
      scoringSystem.awardObstacleScore(obstacle);

      expect(scoringSystem.getGameStats().currentCombo).toBe(2);

      // Reset combo
      scoringSystem.resetCombo();

      expect(scoringSystem.getGameStats().currentCombo).toBe(0);
      expect(scoringSystem.getGameStats().maxCombo).toBe(2); // Max should remain
    });

    it('should trigger combo achievement callback', () => {
      const comboCallback = vi.fn();
      scoringSystem.setComboAchievementCallback(comboCallback);

      const obstacle = new Obstacle(100, 100, 800, 600, {
        width: 24,
        height: 24,
        destructible: true
      });

      // Build combo to 10
      for (let i = 0; i < 10; i++) {
        scoringSystem.awardObstacleScore(obstacle);
      }

      expect(comboCallback).toHaveBeenCalledWith(10);
    });
  });

  describe('Level Progression', () => {
    it('should level up based on score threshold', () => {
      const levelUpCallback = vi.fn();
      scoringSystem.setLevelUpCallback(levelUpCallback);

      // Set score to trigger level up
      gameState.setScore(1000);

      // Trigger update to check progression
      scoringSystem.update([], 16);

      expect(levelUpCallback).toHaveBeenCalledWith(2, 1);
      expect(gameState.getData().level).toBe(2);
    });

    it('should level up based on time threshold', () => {
      const levelUpCallback = vi.fn();
      scoringSystem.setLevelUpCallback(levelUpCallback);

      // Mock time progression - need to reset the scoring system with new time
      vi.spyOn(Date, 'now').mockReturnValue(1000 + 30000); // 30 seconds later
      
      // Reset to update the start time
      scoringSystem.reset();
      
      // Now mock current time to be 30 seconds after reset
      vi.spyOn(Date, 'now').mockReturnValue(1000 + 30000 + 30000);

      // Trigger update to check progression
      scoringSystem.update([], 16);

      expect(levelUpCallback).toHaveBeenCalledWith(2, 1);
      expect(gameState.getData().level).toBe(2);
    });

    it('should calculate difficulty multipliers correctly', () => {
      // Set to level 3, difficulty 2.0
      gameState.setLevel(3);

      const spawnRateMultiplier = scoringSystem.getSpawnRateMultiplier();
      const enemySpeedMultiplier = scoringSystem.getEnemySpeedMultiplier();

      expect(spawnRateMultiplier).toBeGreaterThan(1);
      expect(enemySpeedMultiplier).toBeGreaterThan(1);
    });
  });

  describe('Game Statistics', () => {
    it('should track game statistics correctly', () => {
      const obstacle = new Obstacle(100, 100, 800, 600, {
        width: 24,
        height: 24,
        destructible: true
      });

      const enemy = new Enemy(100, 100, 800, 600, {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.STRAIGHT,
        speed: 20,
        health: 1
      });

      const powerUp = new PowerUp(100, 100, {
        type: PowerUpType.WEAPON_UPGRADE_BEAM,
        value: 1,
        scoreBonus: 100
      });

      scoringSystem.awardObstacleScore(obstacle);
      scoringSystem.awardEnemyScore(enemy);
      scoringSystem.awardPowerUpScore(powerUp);

      const stats = scoringSystem.getGameStats();

      expect(stats.obstaclesDestroyed).toBe(1);
      expect(stats.enemiesDestroyed).toBe(1);
      expect(stats.powerUpsCollected).toBe(1);
      expect(stats.totalScore).toBe(15 + 100 + 100); // Sum of all scores
      expect(stats.currentCombo).toBe(3);
    });

    it('should calculate game time correctly', () => {
      // Reset to set a known start time
      scoringSystem.reset();
      
      // Mock time progression
      vi.spyOn(Date, 'now').mockReturnValue(1000 + 5000); // 5 seconds later

      const stats = scoringSystem.getGameStats();
      expect(stats.gameTime).toBe(5000);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all statistics', () => {
      const obstacle = new Obstacle(100, 100, 800, 600, {
        width: 24,
        height: 24,
        destructible: true
      });

      // Build up some stats
      scoringSystem.awardObstacleScore(obstacle);
      scoringSystem.awardObstacleScore(obstacle);

      expect(scoringSystem.getGameStats().obstaclesDestroyed).toBe(2);
      expect(scoringSystem.getGameStats().currentCombo).toBe(2);

      // Reset
      scoringSystem.reset();

      const stats = scoringSystem.getGameStats();
      expect(stats.obstaclesDestroyed).toBe(0);
      expect(stats.enemiesDestroyed).toBe(0);
      expect(stats.powerUpsCollected).toBe(0);
      expect(stats.currentCombo).toBe(0);
      expect(stats.maxCombo).toBe(0);
    });
  });

  describe('Configuration Updates', () => {
    it('should update score values', () => {
      const newScoreValues: Partial<ScoreValues> = {
        smallObstacle: 20,
        basicEnemy: 150
      };

      scoringSystem.updateScoreValues(newScoreValues);

      const scoreValues = scoringSystem.getScoreValues();
      expect(scoreValues.smallObstacle).toBe(20);
      expect(scoreValues.basicEnemy).toBe(150);
      expect(scoreValues.mediumObstacle).toBe(25); // Should remain unchanged
    });

    it('should update progression config', () => {
      const newProgressionConfig: Partial<ProgressionConfig> = {
        levelScoreThreshold: 2000,
        maxDifficultyLevel: 15
      };

      scoringSystem.updateProgressionConfig(newProgressionConfig);

      const progressionConfig = scoringSystem.getProgressionConfig();
      expect(progressionConfig.levelScoreThreshold).toBe(2000);
      expect(progressionConfig.maxDifficultyLevel).toBe(15);
      expect(progressionConfig.levelTimeThreshold).toBe(30000); // Should remain unchanged
    });
  });
});