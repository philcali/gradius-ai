/**
 * Unit tests for Obstacle entity
 */

import { Obstacle, ObstacleConfig } from './Obstacle';
import { Transform } from '../components/Transform';
import { Sprite } from '../components/Sprite';
import { Collider } from '../components/Collider';

describe('Obstacle', () => {
  const canvasWidth = 800;
  const canvasHeight = 600;

  describe('constructor', () => {
    it('should create obstacle with correct components', () => {
      const config: ObstacleConfig = {
        width: 32,
        height: 32,
        destructible: true,
        health: 2
      };

      const obstacle = new Obstacle(100, 200, canvasWidth, canvasHeight, config);

      expect(obstacle.active).toBe(true);
      expect(obstacle.hasComponent('transform')).toBe(true);
      expect(obstacle.hasComponent('sprite')).toBe(true);
      expect(obstacle.hasComponent('collider')).toBe(true);
    });

    it('should set correct initial position', () => {
      const config: ObstacleConfig = {
        width: 32,
        height: 32,
        destructible: false
      };

      const obstacle = new Obstacle(150, 250, canvasWidth, canvasHeight, config);
      const transform = obstacle.getComponent<Transform>('transform');

      expect(transform?.position.x).toBe(150);
      expect(transform?.position.y).toBe(250);
    });

    it('should set correct velocity for background scrolling', () => {
      const config: ObstacleConfig = {
        width: 32,
        height: 32,
        destructible: true
      };

      const obstacle = new Obstacle(100, 200, canvasWidth, canvasHeight, config);
      const transform = obstacle.getComponent<Transform>('transform');

      expect(transform?.velocity.x).toBe(-80); // Base scroll speed
      expect(transform?.velocity.y).toBe(0);
    });

    it('should apply custom move speed', () => {
      const config: ObstacleConfig = {
        width: 32,
        height: 32,
        destructible: true,
        moveSpeed: 20
      };

      const obstacle = new Obstacle(100, 200, canvasWidth, canvasHeight, config);
      const transform = obstacle.getComponent<Transform>('transform');

      expect(transform?.velocity.x).toBe(-60); // -80 + 20
    });
  });

  describe('health and damage', () => {
    it('should initialize health correctly for destructible obstacles', () => {
      const config: ObstacleConfig = {
        width: 32,
        height: 32,
        destructible: true,
        health: 3
      };

      const obstacle = new Obstacle(100, 200, canvasWidth, canvasHeight, config);

      expect(obstacle.getHealth()).toBe(3);
      expect(obstacle.getMaxHealth()).toBe(3);
      expect(obstacle.isDestructible()).toBe(true);
    });

    it('should default to 1 health if not specified', () => {
      const config: ObstacleConfig = {
        width: 32,
        height: 32,
        destructible: true
      };

      const obstacle = new Obstacle(100, 200, canvasWidth, canvasHeight, config);

      expect(obstacle.getHealth()).toBe(1);
      expect(obstacle.getMaxHealth()).toBe(1);
    });

    it('should take damage when destructible', () => {
      const config: ObstacleConfig = {
        width: 32,
        height: 32,
        destructible: true,
        health: 3
      };

      const obstacle = new Obstacle(100, 200, canvasWidth, canvasHeight, config);

      const destroyed = obstacle.takeDamage(1);
      expect(destroyed).toBe(false);
      expect(obstacle.getHealth()).toBe(2);
      expect(obstacle.active).toBe(true);
    });

    it('should be destroyed when health reaches zero', () => {
      const config: ObstacleConfig = {
        width: 32,
        height: 32,
        destructible: true,
        health: 1
      };

      const obstacle = new Obstacle(100, 200, canvasWidth, canvasHeight, config);

      const destroyed = obstacle.takeDamage(1);
      expect(destroyed).toBe(true);
      expect(obstacle.getHealth()).toBe(0);
      expect(obstacle.active).toBe(false);
    });

    it('should not take damage when indestructible', () => {
      const config: ObstacleConfig = {
        width: 32,
        height: 32,
        destructible: false
      };

      const obstacle = new Obstacle(100, 200, canvasWidth, canvasHeight, config);

      const destroyed = obstacle.takeDamage(10);
      expect(destroyed).toBe(false);
      expect(obstacle.active).toBe(true);
    });

    it('should not reduce health below zero', () => {
      const config: ObstacleConfig = {
        width: 32,
        height: 32,
        destructible: true,
        health: 2
      };

      const obstacle = new Obstacle(100, 200, canvasWidth, canvasHeight, config);

      obstacle.takeDamage(5); // More damage than health
      expect(obstacle.getHealth()).toBe(0);
    });
  });

  describe('update behavior', () => {
    it('should destroy itself when moving off screen', () => {
      const config: ObstacleConfig = {
        width: 32,
        height: 32,
        destructible: true
      };

      const obstacle = new Obstacle(-50, 200, canvasWidth, canvasHeight, config);
      
      obstacle.update(16); // One frame
      
      expect(obstacle.active).toBe(false);
    });

    it('should remain active when still on screen', () => {
      const config: ObstacleConfig = {
        width: 32,
        height: 32,
        destructible: true
      };

      const obstacle = new Obstacle(100, 200, canvasWidth, canvasHeight, config);
      
      obstacle.update(16); // One frame
      
      expect(obstacle.active).toBe(true);
    });

    it('should not update when inactive', () => {
      const config: ObstacleConfig = {
        width: 32,
        height: 32,
        destructible: true
      };

      const obstacle = new Obstacle(100, 200, canvasWidth, canvasHeight, config);
      obstacle.destroy();
      
      const initialPosition = obstacle.getPosition();
      obstacle.update(16);
      const finalPosition = obstacle.getPosition();
      
      expect(finalPosition.x).toBe(initialPosition.x);
      expect(finalPosition.y).toBe(initialPosition.y);
    });
  });

  describe('getters', () => {
    it('should return correct position', () => {
      const config: ObstacleConfig = {
        width: 32,
        height: 32,
        destructible: true
      };

      const obstacle = new Obstacle(150, 250, canvasWidth, canvasHeight, config);
      const position = obstacle.getPosition();

      expect(position.x).toBe(150);
      expect(position.y).toBe(250);
    });

    it('should return correct dimensions', () => {
      const config: ObstacleConfig = {
        width: 48,
        height: 64,
        destructible: true
      };

      const obstacle = new Obstacle(100, 200, canvasWidth, canvasHeight, config);
      const dimensions = obstacle.getDimensions();

      expect(dimensions.width).toBe(48);
      expect(dimensions.height).toBe(64);
    });

    it('should return copy of config', () => {
      const config: ObstacleConfig = {
        width: 32,
        height: 32,
        destructible: true,
        color: '#ff0000'
      };

      const obstacle = new Obstacle(100, 200, canvasWidth, canvasHeight, config);
      const returnedConfig = obstacle.getConfig();

      expect(returnedConfig).toEqual(config);
      expect(returnedConfig).not.toBe(config); // Should be a copy
    });
  });

  describe('sprite creation', () => {
    it('should create sprite with correct dimensions', () => {
      const config: ObstacleConfig = {
        width: 48,
        height: 64,
        destructible: true
      };

      const obstacle = new Obstacle(100, 200, canvasWidth, canvasHeight, config);
      const sprite = obstacle.getComponent<Sprite>('sprite');

      expect(sprite?.width).toBe(48);
      expect(sprite?.height).toBe(64);
    });

    it('should handle missing canvas context gracefully', () => {
      // This test ensures the obstacle doesn't crash in test environments
      // where canvas context might not be available
      const config: ObstacleConfig = {
        width: 32,
        height: 32,
        destructible: true
      };

      expect(() => {
        new Obstacle(100, 200, canvasWidth, canvasHeight, config);
      }).not.toThrow();
    });
  });

  describe('collider setup', () => {
    it('should create collider with correct size', () => {
      const config: ObstacleConfig = {
        width: 32,
        height: 32,
        destructible: true
      };

      const obstacle = new Obstacle(100, 200, canvasWidth, canvasHeight, config);
      const collider = obstacle.getComponent<Collider>('collider');

      expect(collider?.bounds.width).toBe(30); // width - 2
      expect(collider?.bounds.height).toBe(30); // height - 2
    });

    it('should have correct collision layer and mask', () => {
      const config: ObstacleConfig = {
        width: 32,
        height: 32,
        destructible: true
      };

      const obstacle = new Obstacle(100, 200, canvasWidth, canvasHeight, config);
      const collider = obstacle.getComponent<Collider>('collider');

      expect(collider?.layer).toBe(8); // CollisionLayers.OBSTACLE
      expect(collider?.enabled).toBe(true);
    });
  });
});