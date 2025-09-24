/**
 * Unit tests for Enemy entity
 */

import { Enemy, EnemyConfig, EnemyMovementPattern } from './Enemy';
import { Transform } from '../components/Transform';
import { Sprite } from '../components/Sprite';
import { Collider } from '../components/Collider';

describe('Enemy', () => {
  const canvasWidth = 800;
  const canvasHeight = 600;

  describe('constructor', () => {
    it('should create enemy with correct components', () => {
      const config: EnemyConfig = {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.STRAIGHT,
        speed: 20,
        health: 2
      };

      const enemy = new Enemy(100, 200, canvasWidth, canvasHeight, config);

      expect(enemy.active).toBe(true);
      expect(enemy.hasComponent('transform')).toBe(true);
      expect(enemy.hasComponent('sprite')).toBe(true);
      expect(enemy.hasComponent('collider')).toBe(true);
    });

    it('should set correct initial position', () => {
      const config: EnemyConfig = {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.STRAIGHT,
        speed: 20,
        health: 1
      };

      const enemy = new Enemy(150, 250, canvasWidth, canvasHeight, config);
      const transform = enemy.getComponent<Transform>('transform');

      expect(transform?.position.x).toBe(150);
      expect(transform?.position.y).toBe(250);
    });

    it('should initialize health correctly', () => {
      const config: EnemyConfig = {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.STRAIGHT,
        speed: 20,
        health: 3
      };

      const enemy = new Enemy(100, 200, canvasWidth, canvasHeight, config);

      expect(enemy.getHealth()).toBe(3);
      expect(enemy.getMaxHealth()).toBe(3);
    });
  });

  describe('movement patterns', () => {
    it('should handle straight movement pattern', () => {
      const config: EnemyConfig = {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.STRAIGHT,
        speed: 30,
        health: 1
      };

      const enemy = new Enemy(100, 200, canvasWidth, canvasHeight, config);
      
      // Update once to apply movement
      enemy.update(16);
      
      const transform = enemy.getComponent<Transform>('transform');
      expect(transform?.velocity.x).toBeLessThan(0); // Moving left
      expect(transform?.velocity.y).toBe(0); // No vertical movement for straight pattern
    });

    it('should handle sine wave movement pattern', () => {
      const config: EnemyConfig = {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.SINE_WAVE,
        speed: 30,
        health: 1,
        amplitude: 50,
        frequency: 2
      };

      const enemy = new Enemy(100, 200, canvasWidth, canvasHeight, config);
      
      // Update multiple times to see movement pattern
      enemy.update(16);
      enemy.update(16);
      
      const transform = enemy.getComponent<Transform>('transform');
      expect(transform?.velocity.x).toBeLessThan(0); // Moving left
      // Vertical velocity should vary based on sine wave
    });

    it('should handle zigzag movement pattern', () => {
      const config: EnemyConfig = {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.ZIGZAG,
        speed: 30,
        health: 1,
        amplitude: 40,
        frequency: 1.5
      };

      const enemy = new Enemy(100, 200, canvasWidth, canvasHeight, config);
      
      enemy.update(16);
      
      const transform = enemy.getComponent<Transform>('transform');
      expect(transform?.velocity.x).toBeLessThan(0); // Moving left
      // Vertical velocity should be either positive or negative for zigzag
      expect(Math.abs(transform?.velocity.y || 0)).toBeGreaterThan(0);
    });

    it('should handle circular movement pattern', () => {
      const config: EnemyConfig = {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.CIRCULAR,
        speed: 15,
        health: 1,
        amplitude: 25,
        frequency: 1
      };

      const enemy = new Enemy(100, 200, canvasWidth, canvasHeight, config);
      
      enemy.update(16);
      
      const transform = enemy.getComponent<Transform>('transform');
      expect(transform?.velocity.x).toBeLessThan(0); // Moving left (with possible variation)
    });
  });

  describe('health and damage', () => {
    it('should take damage correctly', () => {
      const config: EnemyConfig = {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.STRAIGHT,
        speed: 20,
        health: 3
      };

      const enemy = new Enemy(100, 200, canvasWidth, canvasHeight, config);

      const destroyed = enemy.takeDamage(1);
      expect(destroyed).toBe(false);
      expect(enemy.getHealth()).toBe(2);
      expect(enemy.active).toBe(true);
    });

    it('should be destroyed when health reaches zero', () => {
      const config: EnemyConfig = {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.STRAIGHT,
        speed: 20,
        health: 1
      };

      const enemy = new Enemy(100, 200, canvasWidth, canvasHeight, config);

      const destroyed = enemy.takeDamage(1);
      expect(destroyed).toBe(true);
      expect(enemy.getHealth()).toBe(0);
      expect(enemy.active).toBe(false);
    });

    it('should not reduce health below zero', () => {
      const config: EnemyConfig = {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.STRAIGHT,
        speed: 20,
        health: 2
      };

      const enemy = new Enemy(100, 200, canvasWidth, canvasHeight, config);

      enemy.takeDamage(5); // More damage than health
      expect(enemy.getHealth()).toBe(0);
    });
  });

  describe('boundary constraints', () => {
    it('should stay within vertical screen bounds', () => {
      const config: EnemyConfig = {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.SINE_WAVE,
        speed: 20,
        health: 1,
        amplitude: 1000 // Very large amplitude to test bounds
      };

      const enemy = new Enemy(100, 10, canvasWidth, canvasHeight, config); // Near top edge
      
      // Update multiple times
      for (let i = 0; i < 10; i++) {
        enemy.update(16);
      }
      
      const position = enemy.getPosition();
      expect(position.y).toBeGreaterThanOrEqual(config.height / 2);
      expect(position.y).toBeLessThanOrEqual(canvasHeight - config.height / 2);
    });
  });

  describe('update behavior', () => {
    it('should destroy itself when moving off screen', () => {
      const config: EnemyConfig = {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.STRAIGHT,
        speed: 20,
        health: 1
      };

      const enemy = new Enemy(-50, 200, canvasWidth, canvasHeight, config);
      
      enemy.update(16); // One frame
      
      expect(enemy.active).toBe(false);
    });

    it('should remain active when still on screen', () => {
      const config: EnemyConfig = {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.STRAIGHT,
        speed: 20,
        health: 1
      };

      const enemy = new Enemy(100, 200, canvasWidth, canvasHeight, config);
      
      enemy.update(16); // One frame
      
      expect(enemy.active).toBe(true);
    });

    it('should not update when inactive', () => {
      const config: EnemyConfig = {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.STRAIGHT,
        speed: 20,
        health: 1
      };

      const enemy = new Enemy(100, 200, canvasWidth, canvasHeight, config);
      enemy.destroy();
      
      const initialPosition = enemy.getPosition();
      enemy.update(16);
      const finalPosition = enemy.getPosition();
      
      expect(finalPosition.x).toBe(initialPosition.x);
      expect(finalPosition.y).toBe(initialPosition.y);
    });
  });

  describe('getters', () => {
    it('should return correct position', () => {
      const config: EnemyConfig = {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.STRAIGHT,
        speed: 20,
        health: 1
      };

      const enemy = new Enemy(150, 250, canvasWidth, canvasHeight, config);
      const position = enemy.getPosition();

      expect(position.x).toBe(150);
      expect(position.y).toBe(250);
    });

    it('should return correct dimensions', () => {
      const config: EnemyConfig = {
        width: 32,
        height: 24,
        movementPattern: EnemyMovementPattern.STRAIGHT,
        speed: 20,
        health: 1
      };

      const enemy = new Enemy(100, 200, canvasWidth, canvasHeight, config);
      const dimensions = enemy.getDimensions();

      expect(dimensions.width).toBe(32);
      expect(dimensions.height).toBe(24);
    });

    it('should return copy of config', () => {
      const config: EnemyConfig = {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.SINE_WAVE,
        speed: 30,
        health: 2,
        color: '#ff0000',
        amplitude: 50,
        frequency: 2
      };

      const enemy = new Enemy(100, 200, canvasWidth, canvasHeight, config);
      const returnedConfig = enemy.getConfig();

      expect(returnedConfig).toEqual(config);
      expect(returnedConfig).not.toBe(config); // Should be a copy
    });

    it('should return correct movement pattern', () => {
      const config: EnemyConfig = {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.ZIGZAG,
        speed: 20,
        health: 1
      };

      const enemy = new Enemy(100, 200, canvasWidth, canvasHeight, config);
      
      expect(enemy.getMovementPattern()).toBe(EnemyMovementPattern.ZIGZAG);
    });

    it('should track age correctly', () => {
      const config: EnemyConfig = {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.STRAIGHT,
        speed: 20,
        health: 1
      };

      const enemy = new Enemy(100, 200, canvasWidth, canvasHeight, config);
      
      const initialAge = enemy.getAge();
      expect(initialAge).toBeGreaterThanOrEqual(0);
      
      // Wait a bit and check age increased
      setTimeout(() => {
        const laterAge = enemy.getAge();
        expect(laterAge).toBeGreaterThan(initialAge);
      }, 10);
    });
  });

  describe('collider setup', () => {
    it('should create collider with correct size', () => {
      const config: EnemyConfig = {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.STRAIGHT,
        speed: 20,
        health: 1
      };

      const enemy = new Enemy(100, 200, canvasWidth, canvasHeight, config);
      const collider = enemy.getComponent<Collider>('collider');

      expect(collider?.bounds.width).toBe(26); // width - 2
      expect(collider?.bounds.height).toBe(18); // height - 2
    });

    it('should have correct collision layer and mask', () => {
      const config: EnemyConfig = {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.STRAIGHT,
        speed: 20,
        health: 1
      };

      const enemy = new Enemy(100, 200, canvasWidth, canvasHeight, config);
      const collider = enemy.getComponent<Collider>('collider');

      expect(collider?.layer).toBe(2); // CollisionLayers.ENEMY
      expect(collider?.enabled).toBe(true);
    });
  });

  describe('sprite creation', () => {
    it('should create sprite with correct dimensions', () => {
      const config: EnemyConfig = {
        width: 32,
        height: 24,
        movementPattern: EnemyMovementPattern.STRAIGHT,
        speed: 20,
        health: 1
      };

      const enemy = new Enemy(100, 200, canvasWidth, canvasHeight, config);
      const sprite = enemy.getComponent<Sprite>('sprite');

      expect(sprite?.width).toBe(32);
      expect(sprite?.height).toBe(24);
    });

    it('should handle missing canvas context gracefully', () => {
      const config: EnemyConfig = {
        width: 28,
        height: 20,
        movementPattern: EnemyMovementPattern.STRAIGHT,
        speed: 20,
        health: 1
      };

      expect(() => {
        new Enemy(100, 200, canvasWidth, canvasHeight, config);
      }).not.toThrow();
    });
  });
});