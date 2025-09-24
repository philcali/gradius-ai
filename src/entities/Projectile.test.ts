/**
 * Unit tests for Projectile entity
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Projectile } from './Projectile';
import { ComponentTypes } from '../core/Component';

describe('Projectile', () => {
  let projectile: Projectile;
  const canvasWidth = 800;
  const canvasHeight = 600;

  beforeEach(() => {
    // Mock Date.now for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01'));

    projectile = new Projectile(
      100, // x
      200, // y
      1,   // velocityX
      0,   // velocityY
      canvasWidth,
      canvasHeight,
      600, // speed
      1,   // damage
      3    // lifetime
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create a projectile with correct initial properties', () => {
      expect(projectile.getPosition()).toEqual({ x: 100, y: 200 });
      expect(projectile.getVelocity()).toEqual({ x: 600, y: 0 });
      expect(projectile.getDamage()).toBe(1);
      expect(projectile.getSpeed()).toBe(600);
      expect(projectile.getDimensions()).toEqual({ width: 8, height: 4 });
      expect(projectile.getRemainingLifetime()).toBe(3);
      expect(projectile.isAlive()).toBe(true);
      expect(projectile.active).toBe(true);
    });

    it('should have Transform and Sprite components', () => {
      expect(projectile.hasComponent(ComponentTypes.TRANSFORM)).toBe(true);
      expect(projectile.hasComponent(ComponentTypes.SPRITE)).toBe(true);
    });

    it('should create projectile with custom parameters', () => {
      const customProjectile = new Projectile(
        50, 100, 0, 1, canvasWidth, canvasHeight, 300, 5, 2
      );
      
      expect(customProjectile.getPosition()).toEqual({ x: 50, y: 100 });
      expect(customProjectile.getVelocity()).toEqual({ x: 0, y: 300 });
      expect(customProjectile.getDamage()).toBe(5);
      expect(customProjectile.getSpeed()).toBe(300);
      expect(customProjectile.getRemainingLifetime()).toBe(2);
    });
  });

  describe('update', () => {
    it('should update position based on velocity and delta time', () => {
      const deltaTime = 16.67; // ~60 FPS
      
      projectile.update(deltaTime);
      
      const position = projectile.getPosition();
      // Position should move right by velocity * deltaTime
      // 600 pixels/second * (16.67/1000) seconds = ~10 pixels
      expect(position.x).toBeCloseTo(110, 0);
      expect(position.y).toBe(200); // No Y movement
    });

    it('should update lifetime and destroy when expired', () => {
      // Update with enough deltaTime to exceed lifetime (3.1 seconds)
      projectile.update(3100); // 3.1 seconds in milliseconds
      
      expect(projectile.active).toBe(false);
      expect(projectile.isAlive()).toBe(false);
    });

    it('should destroy when outside screen boundaries', () => {
      // Move projectile far to the right
      const farProjectile = new Projectile(
        canvasWidth + 100, 200, 1, 0, canvasWidth, canvasHeight
      );
      
      farProjectile.update(16.67);
      
      expect(farProjectile.active).toBe(false);
      expect(farProjectile.isAlive()).toBe(false);
    });

    it('should not update when inactive', () => {
      projectile.destroy();
      const initialPosition = projectile.getPosition();
      
      projectile.update(16.67);
      
      expect(projectile.getPosition()).toEqual(initialPosition);
    });
  });

  describe('screen boundary checking', () => {
    it('should detect when projectile is outside left boundary', () => {
      const leftProjectile = new Projectile(
        -10, 200, -1, 0, canvasWidth, canvasHeight
      );
      
      leftProjectile.update(16.67);
      
      expect(leftProjectile.isAlive()).toBe(false);
    });

    it('should detect when projectile is outside right boundary', () => {
      const rightProjectile = new Projectile(
        canvasWidth + 10, 200, 1, 0, canvasWidth, canvasHeight
      );
      
      rightProjectile.update(16.67);
      
      expect(rightProjectile.isAlive()).toBe(false);
    });

    it('should detect when projectile is outside top boundary', () => {
      const topProjectile = new Projectile(
        400, -10, 0, -1, canvasWidth, canvasHeight
      );
      
      topProjectile.update(16.67);
      
      expect(topProjectile.isAlive()).toBe(false);
    });

    it('should detect when projectile is outside bottom boundary', () => {
      const bottomProjectile = new Projectile(
        400, canvasHeight + 10, 0, 1, canvasWidth, canvasHeight
      );
      
      bottomProjectile.update(16.67);
      
      expect(bottomProjectile.isAlive()).toBe(false);
    });

    it('should remain alive when within boundaries', () => {
      const centerProjectile = new Projectile(
        canvasWidth / 2, canvasHeight / 2, 1, 0, canvasWidth, canvasHeight
      );
      
      centerProjectile.update(16.67);
      
      expect(centerProjectile.isAlive()).toBe(true);
    });
  });

  describe('lifetime management', () => {
    it('should track remaining lifetime correctly', () => {
      expect(projectile.getRemainingLifetime()).toBe(3);
      
      // Update with 1 second of deltaTime
      projectile.update(1000);
      
      expect(projectile.getRemainingLifetime()).toBeCloseTo(2, 1);
    });

    it('should return 0 for remaining lifetime when expired', () => {
      // Update with time beyond lifetime
      projectile.update(4000);
      
      expect(projectile.getRemainingLifetime()).toBe(0);
    });
  });

  describe('getters', () => {
    it('should return correct position', () => {
      const position = projectile.getPosition();
      expect(position).toEqual({ x: 100, y: 200 });
      
      // Ensure it returns a copy, not reference
      position.x = 999;
      expect(projectile.getPosition().x).toBe(100);
    });

    it('should return correct velocity', () => {
      const velocity = projectile.getVelocity();
      expect(velocity).toEqual({ x: 600, y: 0 });
      
      // Ensure it returns a copy, not reference
      velocity.x = 999;
      expect(projectile.getVelocity().x).toBe(600);
    });

    it('should return correct damage', () => {
      expect(projectile.getDamage()).toBe(1);
    });

    it('should return correct speed', () => {
      expect(projectile.getSpeed()).toBe(600);
    });

    it('should return correct dimensions', () => {
      expect(projectile.getDimensions()).toEqual({ width: 8, height: 4 });
    });
  });

  describe('isAlive', () => {
    it('should return true for active projectile within lifetime and bounds', () => {
      expect(projectile.isAlive()).toBe(true);
    });

    it('should return false when projectile is destroyed', () => {
      projectile.destroy();
      expect(projectile.isAlive()).toBe(false);
    });

    it('should return false when lifetime is exceeded', () => {
      projectile.update(3100);
      expect(projectile.isAlive()).toBe(false);
    });

    it('should return false when outside screen bounds', () => {
      const outsideProjectile = new Projectile(
        -100, 200, -1, 0, canvasWidth, canvasHeight
      );
      expect(outsideProjectile.isAlive()).toBe(false);
    });
  });
});