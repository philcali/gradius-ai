import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Obstacle, ObstacleConfig } from './Obstacle';
import { BeamProjectile } from './ProjectileTypes';
import { CollisionSystem } from '../systems/CollisionSystem';
import { Health } from '../components/Health';
import { ComponentTypes } from '../core/Component';

describe('Projectile-Obstacle Collision System', () => {
  let collisionSystem: CollisionSystem;
  let canvasWidth: number;
  let canvasHeight: number;
  let mockTime: number;

  beforeEach(() => {
    collisionSystem = new CollisionSystem();
    canvasWidth = 800;
    canvasHeight = 600;
    
    // Mock Date.now for consistent timing in tests
    mockTime = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => mockTime);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper function to advance mock time
  const advanceTime = (ms: number) => {
    mockTime += ms;
    vi.spyOn(Date, 'now').mockImplementation(() => mockTime);
  };

  describe('Destructible Obstacle Collisions', () => {
    it('should damage destructible obstacle when hit by projectile', () => {
      // Create a destructible obstacle with 3 health
      const obstacleConfig: ObstacleConfig = {
        width: 50,
        height: 50,
        destructible: true,
        health: 3
      };
      const obstacle = new Obstacle(400, 300, canvasWidth, canvasHeight, obstacleConfig);
      
      // Create a projectile overlapping with the obstacle (same position)
      const projectile = new BeamProjectile(400, 300, 1, 0, canvasWidth, canvasHeight);
      
      const entities = [obstacle, projectile];
      
      // Initial health check
      expect(obstacle.getHealth()).toBe(3);
      expect(obstacle.isDestructible()).toBe(true);
      
      // Simulate collision by calling the collision system
      collisionSystem.update(entities, 16);
      
      // The obstacle should have taken damage
      expect(obstacle.getHealth()).toBe(2);
      expect(obstacle.active).toBe(true); // Still alive
    });

    it('should destroy destructible obstacle when health reaches zero', () => {
      // Create a destructible obstacle with 1 health
      const obstacleConfig: ObstacleConfig = {
        width: 50,
        height: 50,
        destructible: true,
        health: 1
      };
      const obstacle = new Obstacle(400, 300, canvasWidth, canvasHeight, obstacleConfig);
      
      // Create a projectile overlapping with the obstacle
      const projectile = new BeamProjectile(400, 300, 1, 0, canvasWidth, canvasHeight);
      
      const entities = [obstacle, projectile];
      
      // Initial state
      expect(obstacle.getHealth()).toBe(1);
      expect(obstacle.active).toBe(true);
      
      // Simulate collision
      collisionSystem.update(entities, 16);
      
      // The obstacle should be destroyed
      expect(obstacle.getHealth()).toBe(0);
      expect(obstacle.active).toBe(false);
    });

    it('should destroy projectile when it hits destructible obstacle', () => {
      const obstacleConfig: ObstacleConfig = {
        width: 50,
        height: 50,
        destructible: true,
        health: 2
      };
      const obstacle = new Obstacle(400, 300, canvasWidth, canvasHeight, obstacleConfig);
      const projectile = new BeamProjectile(400, 300, 1, 0, canvasWidth, canvasHeight);
      
      const entities = [obstacle, projectile];
      
      // Initial state
      expect(projectile.active).toBe(true);
      
      // Simulate collision
      collisionSystem.update(entities, 16);
      
      // The projectile should be destroyed
      expect(projectile.active).toBe(false);
    });

    it('should handle multiple projectile hits on same obstacle', () => {
      const obstacleConfig: ObstacleConfig = {
        width: 50,
        height: 50,
        destructible: true,
        health: 3
      };
      const obstacle = new Obstacle(400, 300, canvasWidth, canvasHeight, obstacleConfig);
      
      // First collision
      const projectile1 = new BeamProjectile(400, 300, 1, 0, canvasWidth, canvasHeight);
      let entities = [obstacle, projectile1];
      collisionSystem.update(entities, 16);
      
      expect(obstacle.getHealth()).toBe(2);
      expect(projectile1.active).toBe(false);
      
      // Wait for invulnerability frames to expire
      const healthComponent = obstacle.getComponent<Health>(ComponentTypes.HEALTH);
      advanceTime(200); // Advance time by 200ms (invulnerability is 100ms)
      
      // Second collision (need to create new projectile since first was destroyed)
      const projectile3 = new BeamProjectile(400, 300, 1, 0, canvasWidth, canvasHeight);
      entities = [obstacle, projectile3];
      collisionSystem.update(entities, 16);
      
      expect(obstacle.getHealth()).toBe(1);
      expect(projectile3.active).toBe(false);
    });

    it('should use Health component for destructible obstacles', () => {
      const obstacleConfig: ObstacleConfig = {
        width: 50,
        height: 50,
        destructible: true,
        health: 5
      };
      const obstacle = new Obstacle(400, 300, canvasWidth, canvasHeight, obstacleConfig);
      
      // Check that Health component was added
      const healthComponent = obstacle.getComponent<Health>(ComponentTypes.HEALTH);
      expect(healthComponent).toBeDefined();
      expect(healthComponent?.getCurrentHealth()).toBe(5);
      expect(healthComponent?.getMaxHealth()).toBe(5);
    });
  });

  describe('Indestructible Obstacle Collisions', () => {
    it('should not damage indestructible obstacle when hit by projectile', () => {
      const obstacleConfig: ObstacleConfig = {
        width: 50,
        height: 50,
        destructible: false
      };
      const obstacle = new Obstacle(400, 300, canvasWidth, canvasHeight, obstacleConfig);
      const projectile = new BeamProjectile(350, 300, 1, 0, canvasWidth, canvasHeight);
      
      const entities = [obstacle, projectile];
      
      // Initial state
      expect(obstacle.isDestructible()).toBe(false);
      expect(obstacle.getHealth()).toBe(0); // Indestructible obstacles have no health
      
      // Simulate collision
      collisionSystem.update(entities, 16);
      
      // The obstacle should remain unchanged
      expect(obstacle.active).toBe(true);
      expect(obstacle.getHealth()).toBe(0);
    });

    it('should still destroy projectile when hitting indestructible obstacle', () => {
      const obstacleConfig: ObstacleConfig = {
        width: 50,
        height: 50,
        destructible: false
      };
      const obstacle = new Obstacle(400, 300, canvasWidth, canvasHeight, obstacleConfig);
      const projectile = new BeamProjectile(400, 300, 1, 0, canvasWidth, canvasHeight);
      
      const entities = [obstacle, projectile];
      
      // Initial state
      expect(projectile.active).toBe(true);
      
      // Simulate collision
      collisionSystem.update(entities, 16);
      
      // The projectile should be destroyed even though obstacle is indestructible
      expect(projectile.active).toBe(false);
    });

    it('should not have Health component for indestructible obstacles', () => {
      const obstacleConfig: ObstacleConfig = {
        width: 50,
        height: 50,
        destructible: false
      };
      const obstacle = new Obstacle(400, 300, canvasWidth, canvasHeight, obstacleConfig);
      
      // Check that Health component was not added
      const healthComponent = obstacle.getComponent<Health>(ComponentTypes.HEALTH);
      expect(healthComponent).toBeUndefined();
    });
  });

  describe('Collision Detection Accuracy', () => {
    it('should not trigger collision when projectile and obstacle do not overlap', () => {
      const obstacleConfig: ObstacleConfig = {
        width: 50,
        height: 50,
        destructible: true,
        health: 1
      };
      const obstacle = new Obstacle(400, 300, canvasWidth, canvasHeight, obstacleConfig);
      const projectile = new BeamProjectile(100, 100, 1, 0, canvasWidth, canvasHeight); // Far away
      
      const entities = [obstacle, projectile];
      
      // Simulate collision system
      collisionSystem.update(entities, 16);
      
      // No collision should occur
      expect(obstacle.getHealth()).toBe(1);
      expect(obstacle.active).toBe(true);
      expect(projectile.active).toBe(true);
    });

    it('should trigger collision when projectile and obstacle overlap', () => {
      const obstacleConfig: ObstacleConfig = {
        width: 50,
        height: 50,
        destructible: true,
        health: 1
      };
      // Position obstacle and projectile to overlap
      const obstacle = new Obstacle(400, 300, canvasWidth, canvasHeight, obstacleConfig);
      const projectile = new BeamProjectile(405, 305, 1, 0, canvasWidth, canvasHeight); // Overlapping
      
      const entities = [obstacle, projectile];
      
      // Simulate collision system
      collisionSystem.update(entities, 16);
      
      // Collision should occur
      expect(obstacle.active).toBe(false); // Destroyed (1 health)
      expect(projectile.active).toBe(false); // Destroyed on impact
    });
  });

  describe('Health Component Integration', () => {
    it('should properly integrate Health component damage system', () => {
      const obstacleConfig: ObstacleConfig = {
        width: 50,
        height: 50,
        destructible: true,
        health: 3
      };
      const obstacle = new Obstacle(400, 300, canvasWidth, canvasHeight, obstacleConfig);
      
      // Test direct damage through takeDamage method
      let wasDestroyed = obstacle.takeDamage(1, 'test-projectile');
      expect(wasDestroyed).toBe(false);
      expect(obstacle.getHealth()).toBe(2);
      
      // Wait for invulnerability frames to expire
      const healthComponent = obstacle.getComponent<Health>(ComponentTypes.HEALTH);
      advanceTime(200); // Advance time by 200ms (invulnerability is 100ms)
      
      wasDestroyed = obstacle.takeDamage(1, 'test-projectile');
      expect(wasDestroyed).toBe(false);
      expect(obstacle.getHealth()).toBe(1);
      
      // Wait for invulnerability frames to expire again
      advanceTime(200); // Advance time by another 200ms
      
      wasDestroyed = obstacle.takeDamage(1, 'test-projectile');
      expect(wasDestroyed).toBe(true);
      expect(obstacle.getHealth()).toBe(0);
      expect(obstacle.active).toBe(false);
    });

    it('should handle invulnerability frames correctly', () => {
      const obstacleConfig: ObstacleConfig = {
        width: 50,
        height: 50,
        destructible: true,
        health: 3
      };
      const obstacle = new Obstacle(400, 300, canvasWidth, canvasHeight, obstacleConfig);
      const healthComponent = obstacle.getComponent<Health>(ComponentTypes.HEALTH);
      
      // Take damage to activate invulnerability
      obstacle.takeDamage(1, 'test-projectile');
      expect(obstacle.getHealth()).toBe(2);
      expect(healthComponent?.isInvulnerable()).toBe(true);
      
      // Try to take damage again immediately (should be blocked)
      const wasDestroyed = obstacle.takeDamage(1, 'test-projectile');
      expect(wasDestroyed).toBe(false);
      expect(obstacle.getHealth()).toBe(2); // No additional damage
      
      // Update to expire invulnerability
      advanceTime(200); // Advance time by 200ms (invulnerability is 100ms)
      expect(healthComponent?.isInvulnerable()).toBe(false);
      
      // Now damage should work again
      obstacle.takeDamage(1, 'test-projectile');
      expect(obstacle.getHealth()).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle obstacle with zero health configuration', () => {
      const obstacleConfig: ObstacleConfig = {
        width: 50,
        height: 50,
        destructible: true,
        health: 0 // Invalid health
      };
      const obstacle = new Obstacle(400, 300, canvasWidth, canvasHeight, obstacleConfig);
      
      // Health component should enforce minimum health of 1
      expect(obstacle.getHealth()).toBe(1);
      expect(obstacle.getMaxHealth()).toBe(1);
    });

    it('should handle projectile collision with already destroyed obstacle', () => {
      const obstacleConfig: ObstacleConfig = {
        width: 50,
        height: 50,
        destructible: true,
        health: 1
      };
      const obstacle = new Obstacle(400, 300, canvasWidth, canvasHeight, obstacleConfig);
      
      // Destroy the obstacle first
      obstacle.destroy();
      expect(obstacle.active).toBe(false);
      
      const projectile = new BeamProjectile(350, 300, 1, 0, canvasWidth, canvasHeight);
      const entities = [obstacle, projectile];
      
      // Collision system should handle inactive entities gracefully
      collisionSystem.update(entities, 16);
      
      // Projectile should remain active since collision with inactive entity shouldn't occur
      expect(projectile.active).toBe(true);
    });
  });
});