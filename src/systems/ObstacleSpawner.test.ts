/**
 * Unit tests for ObstacleSpawner system
 */

import { ObstacleSpawner, SpawnConfig } from './ObstacleSpawner';
import { Obstacle } from '../entities/Obstacle';
import { Enemy } from '../entities/Enemy';

describe('ObstacleSpawner', () => {
  const canvasWidth = 800;
  const canvasHeight = 600;

  describe('constructor', () => {
    it('should create spawner with default configuration', () => {
      const spawner = new ObstacleSpawner(canvasWidth, canvasHeight);

      expect(spawner.name).toBe('ObstacleSpawner');
      expect(spawner.isEnabled()).toBe(true);
      
      const config = spawner.getConfig();
      expect(config.minSpawnInterval).toBe(1500);
      expect(config.maxSpawnInterval).toBe(3000);
      expect(config.enemySpawnChance).toBe(0.3);
      expect(config.enabled).toBe(true);
    });

    it('should create spawner with custom configuration', () => {
      const customConfig: Partial<SpawnConfig> = {
        minSpawnInterval: 1000,
        maxSpawnInterval: 2000,
        enemySpawnChance: 0.5,
        enabled: false
      };

      const spawner = new ObstacleSpawner(canvasWidth, canvasHeight, customConfig);
      const config = spawner.getConfig();

      expect(config.minSpawnInterval).toBe(1000);
      expect(config.maxSpawnInterval).toBe(2000);
      expect(config.enemySpawnChance).toBe(0.5);
      expect(config.enabled).toBe(false);
    });
  });

  describe('configuration management', () => {
    it('should update configuration correctly', () => {
      const spawner = new ObstacleSpawner(canvasWidth, canvasHeight);
      
      spawner.updateConfig({
        minSpawnInterval: 500,
        enemySpawnChance: 0.8
      });

      const config = spawner.getConfig();
      expect(config.minSpawnInterval).toBe(500);
      expect(config.enemySpawnChance).toBe(0.8);
      expect(config.maxSpawnInterval).toBe(3000); // Should remain unchanged
    });

    it('should enable and disable spawning', () => {
      const spawner = new ObstacleSpawner(canvasWidth, canvasHeight);

      expect(spawner.isEnabled()).toBe(true);

      spawner.setEnabled(false);
      expect(spawner.isEnabled()).toBe(false);

      spawner.setEnabled(true);
      expect(spawner.isEnabled()).toBe(true);
    });
  });

  describe('spawn timing', () => {
    it('should not spawn immediately after creation', () => {
      const spawner = new ObstacleSpawner(canvasWidth, canvasHeight);
      
      let spawnedCount = 0;
      spawner.setObstacleSpawnCallback(() => spawnedCount++);
      spawner.setEnemySpawnCallback(() => spawnedCount++);

      spawner.update([], 16); // One frame
      
      expect(spawnedCount).toBe(0);
    });

    it('should report time until next spawn', () => {
      const spawner = new ObstacleSpawner(canvasWidth, canvasHeight);
      
      const timeUntilSpawn = spawner.getTimeUntilNextSpawn();
      expect(timeUntilSpawn).toBeGreaterThan(0);
      expect(timeUntilSpawn).toBeLessThanOrEqual(3000); // Max spawn interval
    });

    it('should not spawn when disabled', () => {
      const spawner = new ObstacleSpawner(canvasWidth, canvasHeight, {
        minSpawnInterval: 0,
        maxSpawnInterval: 0,
        enabled: false
      });
      
      let spawnedCount = 0;
      spawner.setObstacleSpawnCallback(() => spawnedCount++);
      spawner.setEnemySpawnCallback(() => spawnedCount++);

      // Force time to pass
      spawner.reset();
      spawner.update([], 16);
      
      expect(spawnedCount).toBe(0);
    });
  });

  describe('obstacle spawning', () => {
    it('should spawn obstacles with callback', () => {
      const spawner = new ObstacleSpawner(canvasWidth, canvasHeight);
      
      let spawnedObstacle: Obstacle | null = null;
      spawner.setObstacleSpawnCallback((obstacle) => {
        spawnedObstacle = obstacle;
      });

      const obstacle = spawner.forceSpawnObstacle(100, 200);
      
      expect(obstacle).not.toBeNull();
      expect(spawnedObstacle).toBe(obstacle);
      expect(obstacle?.active).toBe(true);
    });

    it('should spawn obstacles at correct position', () => {
      const spawner = new ObstacleSpawner(canvasWidth, canvasHeight);
      
      const obstacle = spawner.forceSpawnObstacle(150, 250);
      const position = obstacle?.getPosition();
      
      expect(position?.x).toBe(150);
      expect(position?.y).toBe(250);
    });

    it('should spawn obstacles with specific configuration', () => {
      const spawner = new ObstacleSpawner(canvasWidth, canvasHeight);
      const configs = spawner.getObstacleConfigs();
      
      const obstacle = spawner.forceSpawnObstacle(100, 200, 0);
      const obstacleConfig = obstacle?.getConfig();
      
      expect(obstacleConfig).toEqual(configs[0]);
    });

    it('should handle invalid config index gracefully', () => {
      const spawner = new ObstacleSpawner(canvasWidth, canvasHeight);
      
      const obstacle = spawner.forceSpawnObstacle(100, 200, 999);
      
      expect(obstacle).toBeNull();
    });
  });

  describe('enemy spawning', () => {
    it('should spawn enemies with callback', () => {
      const spawner = new ObstacleSpawner(canvasWidth, canvasHeight);
      
      let spawnedEnemy: Enemy | null = null;
      spawner.setEnemySpawnCallback((enemy) => {
        spawnedEnemy = enemy;
      });

      const enemy = spawner.forceSpawnEnemy(100, 200);
      
      expect(enemy).not.toBeNull();
      expect(spawnedEnemy).toBe(enemy);
      expect(enemy?.active).toBe(true);
    });

    it('should spawn enemies at correct position', () => {
      const spawner = new ObstacleSpawner(canvasWidth, canvasHeight);
      
      const enemy = spawner.forceSpawnEnemy(150, 250);
      const position = enemy?.getPosition();
      
      expect(position?.x).toBe(150);
      expect(position?.y).toBe(250);
    });

    it('should spawn enemies with specific configuration', () => {
      const spawner = new ObstacleSpawner(canvasWidth, canvasHeight);
      const configs = spawner.getEnemyConfigs();
      
      const enemy = spawner.forceSpawnEnemy(100, 200, 0);
      const enemyConfig = enemy?.getConfig();
      
      expect(enemyConfig).toEqual(configs[0]);
    });

    it('should handle invalid config index gracefully', () => {
      const spawner = new ObstacleSpawner(canvasWidth, canvasHeight);
      
      const enemy = spawner.forceSpawnEnemy(100, 200, 999);
      
      expect(enemy).toBeNull();
    });
  });

  describe('configuration access', () => {
    it('should provide obstacle configurations', () => {
      const spawner = new ObstacleSpawner(canvasWidth, canvasHeight);
      const configs = spawner.getObstacleConfigs();
      
      expect(Array.isArray(configs)).toBe(true);
      expect(configs.length).toBeGreaterThan(0);
      
      // Check that each config has required properties
      configs.forEach(config => {
        expect(config.width).toBeGreaterThan(0);
        expect(config.height).toBeGreaterThan(0);
        expect(typeof config.destructible).toBe('boolean');
      });
    });

    it('should provide enemy configurations', () => {
      const spawner = new ObstacleSpawner(canvasWidth, canvasHeight);
      const configs = spawner.getEnemyConfigs();
      
      expect(Array.isArray(configs)).toBe(true);
      expect(configs.length).toBeGreaterThan(0);
      
      // Check that each config has required properties
      configs.forEach(config => {
        expect(config.width).toBeGreaterThan(0);
        expect(config.height).toBeGreaterThan(0);
        expect(config.speed).toBeGreaterThan(0);
        expect(config.health).toBeGreaterThan(0);
        expect(config.movementPattern).toBeDefined();
      });
    });

    it('should return copies of configurations', () => {
      const spawner = new ObstacleSpawner(canvasWidth, canvasHeight);
      
      const obstacleConfigs1 = spawner.getObstacleConfigs();
      const obstacleConfigs2 = spawner.getObstacleConfigs();
      
      expect(obstacleConfigs1).toEqual(obstacleConfigs2);
      expect(obstacleConfigs1).not.toBe(obstacleConfigs2); // Should be different arrays
    });
  });

  describe('reset functionality', () => {
    it('should reset spawn timing', () => {
      const spawner = new ObstacleSpawner(canvasWidth, canvasHeight);
      
      const initialTime = spawner.getTimeUntilNextSpawn();
      
      // Wait a bit to let time pass
      setTimeout(() => {
        spawner.reset();
        const resetTime = spawner.getTimeUntilNextSpawn();
        
        // After reset, time until spawn should be close to max interval
        expect(resetTime).toBeGreaterThan(initialTime);
      }, 10);
    });
  });

  describe('spawn position validation', () => {
    it('should adjust spawn positions to fit within screen bounds', () => {
      const spawner = new ObstacleSpawner(canvasWidth, canvasHeight);
      
      // Try to spawn at extreme positions
      const obstacle1 = spawner.forceSpawnObstacle(100, -50); // Above screen
      const obstacle2 = spawner.forceSpawnObstacle(100, canvasHeight + 50); // Below screen
      
      const pos1 = obstacle1?.getPosition();
      const pos2 = obstacle2?.getPosition();
      const dims1 = obstacle1?.getDimensions();
      const dims2 = obstacle2?.getDimensions();
      
      // Positions should be adjusted to keep obstacles on screen
      expect(pos1?.y).toBeGreaterThanOrEqual((dims1?.height || 0) / 2);
      expect(pos2?.y).toBeLessThanOrEqual(canvasHeight - (dims2?.height || 0) / 2);
    });
  });
});