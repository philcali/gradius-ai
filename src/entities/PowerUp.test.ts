/**
 * Unit tests for PowerUp entity
 * Tests power-up creation, collection, and upgrade application
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PowerUp, PowerUpType, PowerUpConfig } from './PowerUp';
import { WeaponType } from '../components/Weapon';
import { SpecialEffectType } from '../components/SpecialEffects';
import { CollisionLayers } from '../components/Collider';

describe('PowerUp Entity', () => {
  const canvasWidth = 800;
  const canvasHeight = 600;
  let powerUp: PowerUp;
  let mockCollectionCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockCollectionCallback = vi.fn();
  });

  describe('PowerUp Creation and Configuration', () => {
    it('should create weapon upgrade power-up with correct configuration', () => {
      const config: PowerUpConfig = {
        type: PowerUpType.WEAPON_UPGRADE_BEAM,
        value: 1,
        scoreBonus: 100
      };

      powerUp = new PowerUp(100, 200, config);

      expect(powerUp.getType()).toBe(PowerUpType.WEAPON_UPGRADE_BEAM);
      expect(powerUp.getValue()).toBe(1);
      expect(powerUp.getScoreBonus()).toBe(100);
      expect(powerUp.getWeaponType()).toBe(WeaponType.BEAM);
      expect(powerUp.isWeaponUpgrade()).toBe(true);
      expect(powerUp.isAmmunition()).toBe(false);
      expect(powerUp.isSpecialEffect()).toBe(false);
    });

    it('should create ammunition power-up with correct configuration', () => {
      const config: PowerUpConfig = {
        type: PowerUpType.AMMUNITION_MISSILE,
        value: 10,
        scoreBonus: 50
      };

      powerUp = new PowerUp(150, 250, config);

      expect(powerUp.getType()).toBe(PowerUpType.AMMUNITION_MISSILE);
      expect(powerUp.getValue()).toBe(10);
      expect(powerUp.getScoreBonus()).toBe(50);
      expect(powerUp.isWeaponUpgrade()).toBe(false);
      expect(powerUp.isAmmunition()).toBe(true);
      expect(powerUp.isSpecialEffect()).toBe(false);
    });

    it('should create special effect power-up with correct configuration', () => {
      const config: PowerUpConfig = {
        type: PowerUpType.SPECIAL_EFFECT_SHIELD,
        value: 1,
        scoreBonus: 200,
        duration: 5000
      };

      powerUp = new PowerUp(200, 300, config);

      expect(powerUp.getType()).toBe(PowerUpType.SPECIAL_EFFECT_SHIELD);
      expect(powerUp.getValue()).toBe(1);
      expect(powerUp.getScoreBonus()).toBe(200);
      expect(powerUp.getDuration()).toBe(5000);
      expect(powerUp.getSpecialEffectType()).toBe(SpecialEffectType.SHIELD);
      expect(powerUp.isWeaponUpgrade()).toBe(false);
      expect(powerUp.isAmmunition()).toBe(false);
      expect(powerUp.isSpecialEffect()).toBe(true);
    });
  });

  describe('PowerUp Factory Methods', () => {
    it('should create beam weapon upgrade using factory method', () => {
      powerUp = PowerUp.createWeaponUpgrade(100, 200, WeaponType.BEAM, 2);

      expect(powerUp.getType()).toBe(PowerUpType.WEAPON_UPGRADE_BEAM);
      expect(powerUp.getValue()).toBe(2);
      expect(powerUp.getScoreBonus()).toBe(200); // 100 * upgradeLevel
      expect(powerUp.getWeaponType()).toBe(WeaponType.BEAM);
    });

    it('should create missile weapon upgrade using factory method', () => {
      powerUp = PowerUp.createWeaponUpgrade(100, 200, WeaponType.MISSILE, 3);

      expect(powerUp.getType()).toBe(PowerUpType.WEAPON_UPGRADE_MISSILE);
      expect(powerUp.getValue()).toBe(3);
      expect(powerUp.getScoreBonus()).toBe(300);
      expect(powerUp.getWeaponType()).toBe(WeaponType.MISSILE);
    });

    it('should create special weapon upgrade using factory method', () => {
      powerUp = PowerUp.createWeaponUpgrade(100, 200, WeaponType.SPECIAL, 1);

      expect(powerUp.getType()).toBe(PowerUpType.WEAPON_UPGRADE_SPECIAL);
      expect(powerUp.getValue()).toBe(1);
      expect(powerUp.getScoreBonus()).toBe(100);
      expect(powerUp.getWeaponType()).toBe(WeaponType.SPECIAL);
    });

    it('should create missile ammunition using factory method', () => {
      powerUp = PowerUp.createAmmunition(100, 200, WeaponType.MISSILE, 15);

      expect(powerUp.getType()).toBe(PowerUpType.AMMUNITION_MISSILE);
      expect(powerUp.getValue()).toBe(15);
      expect(powerUp.getScoreBonus()).toBe(50);
      expect(powerUp.isAmmunition()).toBe(true);
    });

    it('should create special ammunition using factory method', () => {
      powerUp = PowerUp.createAmmunition(100, 200, WeaponType.SPECIAL, 3);

      expect(powerUp.getType()).toBe(PowerUpType.AMMUNITION_SPECIAL);
      expect(powerUp.getValue()).toBe(3);
      expect(powerUp.getScoreBonus()).toBe(50);
      expect(powerUp.isAmmunition()).toBe(true);
    });

    it('should throw error when creating ammunition for beam weapon', () => {
      expect(() => {
        PowerUp.createAmmunition(100, 200, WeaponType.BEAM, 10);
      }).toThrow('Cannot create ammunition for weapon type: beam');
    });
  });

  describe('PowerUp Movement and Lifecycle', () => {
    beforeEach(() => {
      const config: PowerUpConfig = {
        type: PowerUpType.WEAPON_UPGRADE_BEAM,
        value: 1,
        scoreBonus: 100
      };
      powerUp = new PowerUp(100, 200, config);
    });

    it('should initialize with correct position and velocity', () => {
      const position = powerUp.getPosition();
      expect(position.x).toBe(100);
      expect(position.y).toBe(200);

      // Should have leftward velocity to match scrolling background
      const transform = powerUp.getComponent('transform');
      expect(transform).toBeDefined();
      expect(transform.velocity.x).toBe(-150); // Scroll speed
      expect(transform.velocity.y).toBe(0);
    });

    it('should move left with background scrolling', () => {
      const initialX = powerUp.getPosition().x;
      
      // Update for 1 second
      powerUp.update(1000);
      
      const newPosition = powerUp.getPosition();
      expect(newPosition.x).toBeLessThan(initialX);
      expect(newPosition.x).toBe(initialX - 150); // Moved by scroll speed
    });

    it('should deactivate when moving off screen', () => {
      // Position power-up far off left edge (beyond width)
      const transform = powerUp.getComponent('transform');
      transform.setPosition(-50, 200); // -50 is definitely off screen for 24px wide power-up
      
      expect(powerUp.active).toBe(true);
      
      powerUp.update(16); // One frame
      
      expect(powerUp.active).toBe(false);
    });

    it('should have correct dimensions', () => {
      const dimensions = powerUp.getDimensions();
      expect(dimensions.width).toBe(24);
      expect(dimensions.height).toBe(24);
    });
  });

  describe('PowerUp Collection System', () => {
    beforeEach(() => {
      const config: PowerUpConfig = {
        type: PowerUpType.WEAPON_UPGRADE_BEAM,
        value: 1,
        scoreBonus: 100
      };
      powerUp = new PowerUp(100, 200, config);
      powerUp.setCollectionCallback(mockCollectionCallback);
    });

    it('should have correct collision configuration', () => {
      const collider = powerUp.getComponent('collider');
      expect(collider).toBeDefined();
      expect(collider.layer).toBe(CollisionLayers.POWERUP);
      expect(collider.mask).toBe(CollisionLayers.PLAYER); // Only collides with player
    });

    it('should call collection callback when collected by player', () => {
      const collider = powerUp.getComponent('collider');
      
      // Simulate collision with player
      const mockCollisionEvent = {
        otherEntityId: 'test-player',
        otherCollider: {
          layer: CollisionLayers.PLAYER
        } as any,
        intersection: { x: 100, y: 200, width: 10, height: 10 }
      };

      expect(powerUp.active).toBe(true);
      
      // Trigger collision callback
      collider.onCollision!(mockCollisionEvent);
      
      expect(mockCollectionCallback).toHaveBeenCalledWith(powerUp);
      expect(powerUp.active).toBe(false);
    });

    it('should not trigger collection for non-player collisions', () => {
      const collider = powerUp.getComponent('collider');
      
      // Simulate collision with enemy
      const mockCollisionEvent = {
        otherEntityId: 'test-enemy',
        otherCollider: {
          layer: CollisionLayers.ENEMY
        } as any,
        intersection: { x: 100, y: 200, width: 10, height: 10 }
      };

      expect(powerUp.active).toBe(true);
      
      // Trigger collision callback
      collider.onCollision!(mockCollisionEvent);
      
      expect(mockCollectionCallback).not.toHaveBeenCalled();
      expect(powerUp.active).toBe(true);
    });
  });

  describe('PowerUp Type Classification', () => {
    it('should correctly classify weapon upgrade power-ups', () => {
      const beamUpgrade = PowerUp.createWeaponUpgrade(0, 0, WeaponType.BEAM);
      const missileUpgrade = PowerUp.createWeaponUpgrade(0, 0, WeaponType.MISSILE);
      const specialUpgrade = PowerUp.createWeaponUpgrade(0, 0, WeaponType.SPECIAL);

      expect(beamUpgrade.isWeaponUpgrade()).toBe(true);
      expect(beamUpgrade.getWeaponType()).toBe(WeaponType.BEAM);

      expect(missileUpgrade.isWeaponUpgrade()).toBe(true);
      expect(missileUpgrade.getWeaponType()).toBe(WeaponType.MISSILE);

      expect(specialUpgrade.isWeaponUpgrade()).toBe(true);
      expect(specialUpgrade.getWeaponType()).toBe(WeaponType.SPECIAL);
    });

    it('should correctly classify ammunition power-ups', () => {
      const missileAmmo = PowerUp.createAmmunition(0, 0, WeaponType.MISSILE, 10);
      const specialAmmo = PowerUp.createAmmunition(0, 0, WeaponType.SPECIAL, 5);

      expect(missileAmmo.isAmmunition()).toBe(true);
      expect(missileAmmo.isWeaponUpgrade()).toBe(false);
      expect(missileAmmo.isSpecialEffect()).toBe(false);

      expect(specialAmmo.isAmmunition()).toBe(true);
      expect(specialAmmo.isWeaponUpgrade()).toBe(false);
      expect(specialAmmo.isSpecialEffect()).toBe(false);
    });

    it('should correctly classify special effect power-ups', () => {
      const shieldConfig: PowerUpConfig = {
        type: PowerUpType.SPECIAL_EFFECT_SHIELD,
        value: 1,
        scoreBonus: 200
      };
      const tractorConfig: PowerUpConfig = {
        type: PowerUpType.SPECIAL_EFFECT_TRACTOR,
        value: 1,
        scoreBonus: 200
      };
      const clearConfig: PowerUpConfig = {
        type: PowerUpType.SPECIAL_EFFECT_CLEAR,
        value: 1,
        scoreBonus: 200
      };

      const shieldPowerUp = new PowerUp(0, 0, shieldConfig);
      const tractorPowerUp = new PowerUp(0, 0, tractorConfig);
      const clearPowerUp = new PowerUp(0, 0, clearConfig);

      expect(shieldPowerUp.isSpecialEffect()).toBe(true);
      expect(shieldPowerUp.getSpecialEffectType()).toBe(SpecialEffectType.SHIELD);

      expect(tractorPowerUp.isSpecialEffect()).toBe(true);
      expect(tractorPowerUp.getSpecialEffectType()).toBe(SpecialEffectType.TRACTOR_BEAM);

      expect(clearPowerUp.isSpecialEffect()).toBe(true);
      expect(clearPowerUp.getSpecialEffectType()).toBe(SpecialEffectType.SCREEN_CLEAR);
    });

    it('should return undefined for non-matching types', () => {
      const scoreConfig: PowerUpConfig = {
        type: PowerUpType.SCORE_MULTIPLIER,
        value: 2,
        scoreBonus: 500
      };
      const scorePowerUp = new PowerUp(0, 0, scoreConfig);

      expect(scorePowerUp.getWeaponType()).toBeUndefined();
      expect(scorePowerUp.getSpecialEffectType()).toBeUndefined();
      expect(scorePowerUp.isWeaponUpgrade()).toBe(false);
      expect(scorePowerUp.isAmmunition()).toBe(false);
      expect(scorePowerUp.isSpecialEffect()).toBe(false);
    });
  });

  describe('PowerUp Visual Representation', () => {
    it('should create sprite component with correct dimensions', () => {
      const config: PowerUpConfig = {
        type: PowerUpType.WEAPON_UPGRADE_BEAM,
        value: 1,
        scoreBonus: 100
      };
      powerUp = new PowerUp(100, 200, config);

      const sprite = powerUp.getComponent('sprite');
      expect(sprite).toBeDefined();
      expect(sprite.width).toBe(24);
      expect(sprite.height).toBe(24);
      expect(sprite.layer).toBe(2); // Above background, below UI
    });

    it('should have different visual representations for different types', () => {
      const beamConfig: PowerUpConfig = { type: PowerUpType.WEAPON_UPGRADE_BEAM, value: 1, scoreBonus: 100 };
      const missileConfig: PowerUpConfig = { type: PowerUpType.AMMUNITION_MISSILE, value: 10, scoreBonus: 50 };
      const shieldConfig: PowerUpConfig = { type: PowerUpType.SPECIAL_EFFECT_SHIELD, value: 1, scoreBonus: 200 };

      const beamPowerUp = new PowerUp(0, 0, beamConfig);
      const missilePowerUp = new PowerUp(0, 0, missileConfig);
      const shieldPowerUp = new PowerUp(0, 0, shieldConfig);

      // All should have sprites (visual representation created)
      expect(beamPowerUp.getComponent('sprite').image).toBeDefined();
      expect(missilePowerUp.getComponent('sprite').image).toBeDefined();
      expect(shieldPowerUp.getComponent('sprite').image).toBeDefined();

      // Images should be different (different canvas objects)
      expect(beamPowerUp.getComponent('sprite').image).not.toBe(missilePowerUp.getComponent('sprite').image);
      expect(beamPowerUp.getComponent('sprite').image).not.toBe(shieldPowerUp.getComponent('sprite').image);
    });
  });

  describe('PowerUp Configuration Edge Cases', () => {
    it('should handle zero values gracefully', () => {
      const config: PowerUpConfig = {
        type: PowerUpType.WEAPON_UPGRADE_BEAM,
        value: 0,
        scoreBonus: 0
      };
      powerUp = new PowerUp(100, 200, config);

      expect(powerUp.getValue()).toBe(0);
      expect(powerUp.getScoreBonus()).toBe(0);
      expect(powerUp.active).toBe(true);
    });

    it('should handle negative values', () => {
      const config: PowerUpConfig = {
        type: PowerUpType.AMMUNITION_MISSILE,
        value: -5,
        scoreBonus: -10
      };
      powerUp = new PowerUp(100, 200, config);

      expect(powerUp.getValue()).toBe(-5);
      expect(powerUp.getScoreBonus()).toBe(-10);
    });

    it('should handle very large values', () => {
      const config: PowerUpConfig = {
        type: PowerUpType.SCORE_MULTIPLIER,
        value: Number.MAX_SAFE_INTEGER,
        scoreBonus: Number.MAX_SAFE_INTEGER
      };
      powerUp = new PowerUp(100, 200, config);

      expect(powerUp.getValue()).toBe(Number.MAX_SAFE_INTEGER);
      expect(powerUp.getScoreBonus()).toBe(Number.MAX_SAFE_INTEGER);
    });
  });
});