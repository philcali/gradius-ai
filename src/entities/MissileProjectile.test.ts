/**
 * Unit tests for MissileProjectile entity
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MissileProjectile } from './ProjectileTypes';
import { WeaponUpgradeEffects } from '../components/Weapon';

describe('MissileProjectile', () => {
  const canvasWidth = 800;
  const canvasHeight = 600;
  let missile: MissileProjectile;

  beforeEach(() => {
    missile = new MissileProjectile(
      100, // x
      200, // y
      1,   // velocityX
      0,   // velocityY
      canvasWidth,
      canvasHeight
    );
  });

  describe('Basic Properties', () => {
    it('should initialize with correct default properties', () => {
      expect(missile.getDamage()).toBe(3); // Base missile damage
      expect(missile.getPosition()).toEqual({ x: 100, y: 200 });
      expect(missile.getVelocity()).toEqual({ x: 400, y: 0 }); // 400 = base speed
      expect(missile.active).toBe(true);
    });

    it('should have larger dimensions than beam projectiles', () => {
      const config = (missile as any).config;
      expect(config.width).toBe(12);
      expect(config.height).toBe(6);
      expect(config.width).toBeGreaterThan(8); // Larger than beam
      expect(config.height).toBeGreaterThan(4); // Larger than beam
    });

    it('should have longer lifetime than beam projectiles', () => {
      const config = (missile as any).config;
      expect(config.lifetime).toBe(5); // 5 seconds vs 3 for beam
    });
  });

  describe('Upgrade Effects', () => {
    it('should apply damage multiplier from upgrades', () => {
      const upgradeEffects: WeaponUpgradeEffects = {
        damageMultiplier: 2.0,
        fireRateMultiplier: 1.0,
        speedMultiplier: 1.0
      };

      const upgradedMissile = new MissileProjectile(
        100, 200, 1, 0, canvasWidth, canvasHeight, upgradeEffects
      );

      expect(upgradedMissile.getDamage()).toBe(6); // 3 * 2.0
    });

    it('should apply speed multiplier from upgrades', () => {
      const upgradeEffects: WeaponUpgradeEffects = {
        damageMultiplier: 1.0,
        fireRateMultiplier: 1.0,
        speedMultiplier: 1.5
      };

      const upgradedMissile = new MissileProjectile(
        100, 200, 1, 0, canvasWidth, canvasHeight, upgradeEffects
      );

      expect(upgradedMissile.getVelocity()).toEqual({ x: 600, y: 0 }); // 400 * 1.5
    });

    it('should enable homing when upgrade effect is present', () => {
      const upgradeEffects: WeaponUpgradeEffects = {
        damageMultiplier: 1.0,
        fireRateMultiplier: 1.0,
        speedMultiplier: 1.0,
        specialEffects: {
          homing: true
        }
      };

      const homingMissile = new MissileProjectile(
        100, 200, 1, 0, canvasWidth, canvasHeight, upgradeEffects
      );

      const config = (homingMissile as any).config;
      expect(config.homing).toBe(true);
    });

    it('should enable explosive when upgrade effect is present', () => {
      const upgradeEffects: WeaponUpgradeEffects = {
        damageMultiplier: 1.0,
        fireRateMultiplier: 1.0,
        speedMultiplier: 1.0,
        specialEffects: {
          explosive: true
        }
      };

      const explosiveMissile = new MissileProjectile(
        100, 200, 1, 0, canvasWidth, canvasHeight, upgradeEffects
      );

      const config = (explosiveMissile as any).config;
      expect(config.explosive).toBe(true);
      expect(config.explosionRadius).toBe(30);
    });
  });

  describe('Movement and Lifetime', () => {
    it('should move according to velocity', () => {
      const initialPos = missile.getPosition();
      
      // Simulate one frame (16.67ms for 60fps)
      missile.update(16.67);
      
      const newPos = missile.getPosition();
      expect(newPos.x).toBeGreaterThan(initialPos.x);
      expect(newPos.y).toBe(initialPos.y); // No Y movement
    });

    it('should be destroyed when lifetime expires', () => {
      expect(missile.active).toBe(true);
      
      // Simulate 6 seconds (longer than 5 second lifetime)
      missile.update(6000);
      
      expect(missile.active).toBe(false);
    });

    it('should be destroyed when moving off screen', () => {
      // Create missile at edge of screen, moving right
      // The boundary check is: pos.x - halfWidth > canvasWidth
      // So we need pos.x > canvasWidth + halfWidth
      // Missile width is 12, so halfWidth is 6
      const edgeMissile = new MissileProjectile(
        canvasWidth + 7, 200, 1, 0, canvasWidth, canvasHeight
      );
      
      expect(edgeMissile.active).toBe(true);
      
      // The missile is positioned off screen, so it should be destroyed on first update
      edgeMissile.update(16.67); // One frame
      
      expect(edgeMissile.active).toBe(false);
    });
  });

  describe('Collision Handling', () => {
    it('should be destroyed on collision with solid objects', () => {
      expect(missile.active).toBe(true);
      
      // Simulate collision with solid object
      const mockCollisionEvent = {
        otherEntityId: 'obstacle-1',
        otherCollider: {
          isTrigger: false,
          layer: 1,
          mask: 1
        }
      };
      
      // Access private method for testing
      (missile as any).handleCollision(mockCollisionEvent);
      
      expect(missile.active).toBe(false);
    });

    it('should not be destroyed by trigger collisions', () => {
      expect(missile.active).toBe(true);
      
      // Simulate collision with trigger object
      const mockCollisionEvent = {
        otherEntityId: 'powerup-1',
        otherCollider: {
          isTrigger: true,
          layer: 1,
          mask: 1
        }
      };
      
      // Access private method for testing
      (missile as any).handleCollision(mockCollisionEvent);
      
      expect(missile.active).toBe(true);
    });
  });

  describe('Sprite Creation', () => {
    it('should create a missile sprite different from beam', () => {
      const sprite = missile.getComponent('sprite');
      expect(sprite).toBeDefined();
      expect(sprite?.image).toBeDefined();
      
      // Missile should be larger than beam
      expect(sprite?.image.width).toBe(12);
      expect(sprite?.image.height).toBe(6);
    });

    it('should create different sprite for homing missiles', () => {
      const upgradeEffects: WeaponUpgradeEffects = {
        damageMultiplier: 1.0,
        fireRateMultiplier: 1.0,
        speedMultiplier: 1.0,
        specialEffects: {
          homing: true
        }
      };

      const homingMissile = new MissileProjectile(
        100, 200, 1, 0, canvasWidth, canvasHeight, upgradeEffects
      );

      const sprite = homingMissile.getComponent('sprite');
      expect(sprite).toBeDefined();
      expect(sprite?.image).toBeDefined();
    });
  });

  describe('Explosive Effects', () => {
    it('should trigger explosion on hit when explosive', () => {
      const upgradeEffects: WeaponUpgradeEffects = {
        damageMultiplier: 1.0,
        fireRateMultiplier: 1.0,
        speedMultiplier: 1.0,
        specialEffects: {
          explosive: true
        }
      };

      const explosiveMissile = new MissileProjectile(
        100, 200, 1, 0, canvasWidth, canvasHeight, upgradeEffects
      );

      // Mock console.log to capture explosion message
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Simulate collision
      const mockCollisionEvent = {
        otherEntityId: 'obstacle-1',
        otherCollider: {
          isTrigger: false,
          layer: 1,
          mask: 1
        }
      };
      
      (explosiveMissile as any).handleCollision(mockCollisionEvent);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Missile explosion at')
      );
      
      consoleSpy.mockRestore();
    });

    it('should not trigger explosion on hit when not explosive', () => {
      // Mock console.log to capture any explosion messages
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Simulate collision with non-explosive missile
      const mockCollisionEvent = {
        otherEntityId: 'obstacle-1',
        otherCollider: {
          isTrigger: false,
          layer: 1,
          mask: 1
        }
      };
      
      (missile as any).handleCollision(mockCollisionEvent);
      
      // Should not log explosion message
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Missile explosion at')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance and Memory', () => {
    it('should clean up properly when destroyed', () => {
      expect(missile.active).toBe(true);
      
      missile.destroy();
      
      expect(missile.active).toBe(false);
      expect(missile.components.size).toBe(0);
    });

    it('should handle multiple updates without memory leaks', () => {
      const initialComponentCount = missile.components.size;
      
      // Run many update cycles
      for (let i = 0; i < 100; i++) {
        if (missile.active) {
          missile.update(16.67);
        }
      }
      
      // Component count should remain stable (if still active)
      if (missile.active) {
        expect(missile.components.size).toBe(initialComponentCount);
      }
    });
  });
});