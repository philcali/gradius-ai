/**
 * DifficultyManager handles dynamic difficulty adjustment based on game progression
 * Adjusts spawn rates, enemy speeds, and other game parameters
 */

import { System, Entity } from '../core/interfaces';
import { GameState } from '../core/GameState';
import { ScoringSystem } from './ScoringSystem';
import { ObstacleSpawner } from './ObstacleSpawner';
import { PowerUpSpawner } from './PowerUpSpawner';

export interface DifficultySettings {
  /** Base spawn interval multiplier (lower = faster spawning) */
  spawnRateMultiplier: number;
  /** Enemy speed multiplier */
  enemySpeedMultiplier: number;
  /** Enemy spawn chance (0-1) */
  enemySpawnChance: number;
  /** Background scroll speed multiplier */
  scrollSpeedMultiplier: number;
  /** Power-up spawn rate multiplier */
  powerUpSpawnMultiplier: number;
}

export class DifficultyManager implements System {
  public readonly name = 'DifficultyManager';

  private gameState: GameState;
  private scoringSystem: ScoringSystem;
  private obstacleSpawner?: ObstacleSpawner;
  private powerUpSpawner?: PowerUpSpawner;

  // Current difficulty settings
  private currentSettings: DifficultySettings;
  private lastDifficultyLevel: number = 1;

  // Base settings for difficulty scaling
  private readonly baseSettings: DifficultySettings = {
    spawnRateMultiplier: 1.0,
    enemySpeedMultiplier: 1.0,
    enemySpawnChance: 0.3,
    scrollSpeedMultiplier: 1.0,
    powerUpSpawnMultiplier: 1.0
  };

  constructor(gameState: GameState, scoringSystem: ScoringSystem) {
    this.gameState = gameState;
    this.scoringSystem = scoringSystem;
    this.currentSettings = { ...this.baseSettings };

    // Set up callbacks for level changes
    this.setupCallbacks();
  }

  /**
   * Filter - this system doesn't need to process entities directly
   */
  filter(_entity: Entity): boolean {
    return false;
  }

  /**
   * Update difficulty management
   */
  update(_entities: Entity[], _deltaTime: number): void {
    const gameData = this.gameState.getData();
    
    // Check if difficulty level has changed
    if (gameData.level !== this.lastDifficultyLevel) {
      this.updateDifficultySettings(gameData.level, gameData.difficulty);
      this.lastDifficultyLevel = gameData.level;
    }
  }

  /**
   * Set up callbacks for game state changes
   */
  private setupCallbacks(): void {
    this.scoringSystem.setLevelUpCallback((newLevel, _oldLevel) => {
      console.log(`Difficulty Manager: Level up to ${newLevel}`);
      this.updateDifficultySettings(newLevel, this.gameState.getData().difficulty);
    });

    this.scoringSystem.setDifficultyIncreaseCallback((newDifficulty, _oldDifficulty) => {
      console.log(`Difficulty Manager: Difficulty increased to ${newDifficulty.toFixed(1)}`);
      this.updateDifficultySettings(this.gameState.getData().level, newDifficulty);
    });
  }

  /**
   * Update difficulty settings based on level and difficulty
   */
  private updateDifficultySettings(level: number, difficulty: number): void {
    // Calculate new settings based on level and difficulty
    const levelFactor = Math.min(level / 10, 2.0); // Cap at 2x for level factor
    const difficultyFactor = Math.min(difficulty / 5, 2.0); // Cap at 2x for difficulty factor

    this.currentSettings = {
      // Increase spawn rate (decrease interval)
      spawnRateMultiplier: Math.max(0.3, 1.0 - (levelFactor * 0.4 + difficultyFactor * 0.3)),
      
      // Increase enemy speed
      enemySpeedMultiplier: 1.0 + levelFactor * 0.5 + difficultyFactor * 0.3,
      
      // Increase enemy spawn chance
      enemySpawnChance: Math.min(0.7, this.baseSettings.enemySpawnChance + levelFactor * 0.2 + difficultyFactor * 0.1),
      
      // Slightly increase scroll speed
      scrollSpeedMultiplier: 1.0 + levelFactor * 0.2 + difficultyFactor * 0.1,
      
      // Adjust power-up spawn rate (slightly faster at higher difficulties)
      powerUpSpawnMultiplier: Math.max(0.7, 1.0 - levelFactor * 0.1 - difficultyFactor * 0.1)
    };

    // Apply settings to spawners
    this.applySettingsToSpawners();

    console.log('Difficulty settings updated:', this.currentSettings);
  }

  /**
   * Apply current difficulty settings to spawner systems
   */
  private applySettingsToSpawners(): void {
    if (this.obstacleSpawner) {
      // Update spawn intervals
      const baseMinInterval = 1500; // Base minimum interval
      const baseMaxInterval = 3000; // Base maximum interval
      
      this.obstacleSpawner.updateConfig({
        minSpawnInterval: Math.floor(baseMinInterval * this.currentSettings.spawnRateMultiplier),
        maxSpawnInterval: Math.floor(baseMaxInterval * this.currentSettings.spawnRateMultiplier),
        enemySpawnChance: this.currentSettings.enemySpawnChance
      });
    }

    if (this.powerUpSpawner) {
      // Update power-up spawn interval
      const baseInterval = 8000; // Base interval
      
      this.powerUpSpawner.updateConfig({
        spawnInterval: Math.floor(baseInterval * this.currentSettings.powerUpSpawnMultiplier)
      });
    }
  }

  /**
   * Set obstacle spawner reference
   */
  setObstacleSpawner(spawner: ObstacleSpawner): void {
    this.obstacleSpawner = spawner;
    this.applySettingsToSpawners();
  }

  /**
   * Set power-up spawner reference
   */
  setPowerUpSpawner(spawner: PowerUpSpawner): void {
    this.powerUpSpawner = spawner;
    this.applySettingsToSpawners();
  }

  /**
   * Get current difficulty settings
   */
  getCurrentSettings(): DifficultySettings {
    return { ...this.currentSettings };
  }

  /**
   * Get spawn rate multiplier for external systems
   */
  getSpawnRateMultiplier(): number {
    return this.currentSettings.spawnRateMultiplier;
  }

  /**
   * Get enemy speed multiplier for external systems
   */
  getEnemySpeedMultiplier(): number {
    return this.currentSettings.enemySpeedMultiplier;
  }

  /**
   * Get scroll speed multiplier for external systems
   */
  getScrollSpeedMultiplier(): number {
    return this.currentSettings.scrollSpeedMultiplier;
  }

  /**
   * Force update difficulty settings (for testing)
   */
  forceUpdateDifficulty(level: number, difficulty: number): void {
    this.updateDifficultySettings(level, difficulty);
  }

  /**
   * Reset difficulty to base settings
   */
  reset(): void {
    this.currentSettings = { ...this.baseSettings };
    this.lastDifficultyLevel = 1;
    this.applySettingsToSpawners();
  }

  /**
   * Get difficulty statistics for debugging
   */
  getDifficultyStats(): {
    level: number;
    difficulty: number;
    settings: DifficultySettings;
    spawnRateIncrease: string;
    enemySpeedIncrease: string;
  } {
    const gameData = this.gameState.getData();
    
    return {
      level: gameData.level,
      difficulty: gameData.difficulty,
      settings: this.currentSettings,
      spawnRateIncrease: `${((1 / this.currentSettings.spawnRateMultiplier - 1) * 100).toFixed(0)}%`,
      enemySpeedIncrease: `${((this.currentSettings.enemySpeedMultiplier - 1) * 100).toFixed(0)}%`
    };
  }
}