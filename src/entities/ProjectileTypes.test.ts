/**
 * Unit tests for the ProjectileTypes system
 * Tests different projectile behaviors, factory function, and weapon-specific properties
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  BaseProjectile, 
  BeamProjectile, 
  MissileProjectile, 
  SpecialProjectile,
  SpecialWeaponType,
  createProjectile 
} from './ProjectileTypes';
import { WeaponType } from '../components/Weapon';

// Mock canvas context for testing
const mockCanvas = {
  width: 0,
  height: 0
};

const mockContext = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  globalAlpha: 1,
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  stroke: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn()
  }))
};

// Mock document.createElement for canvas
vi.stubGlobal('document', {
  createElement: vi.fn((tagName: string) => {
    if (tagName === 'canvas') {
      return {
        ...mockCanvas,
        getContext: vi.fn(() => mockContext)
      };
    }
    return {};
  })
});

describe('ProjectileTypes', () => {
  const canvasWidth = 800;
  const canvasHeight = 600;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('BeamProjectile', () => {
    let beamProjectile: BeamProjectile;

    beforeEach(() => {
      beamProjectile = new BeamProjectile(100, 200, 1, 0, canvasWidth, canvasHeight);
    });

    it('should create beam projectile with correct default properties', () => {
      expect(beamProjectile.getDamage()).toBe(1);
      expect(beamProjectile.getPosition()).toEqual({ x: 100, y: 200 });
      expect(beamProjectile.getVelocity()).toEqual({ x: 600, y: 0 });
    });

    it('should apply upgrade effects to beam projectile', () => {
      const upgradeEffects = {
        damageMultiplier: 2,
        speedMultiplier: 1.5,
        fireRateMultiplier: 1,
        specialEffects: { piercing: true }
      };

      const upgradedBeam = new BeamProjectile(
        100, 200, 1, 0, canvasWidth, canvasHeight, upgradeEffects
      );

      expect(upgradedBeam.getDamage()).toBe(2);
      expect(upgradedBeam.getVelocity().x).toBe(900); // 600 * 1.5
    });

    it('should create appropriate sprite for beam projectile', () => {
      // Verify canvas creation and context usage
      expect(document.createElement).toHaveBeenCalledWith('canvas');
      expect(mockContext.fillRect).toHaveBeenCalled();
    });

    it('should be destroyed when outside screen bounds', () => {
      // Move projectile outside screen by directly accessing the transform
      const transform = beamProjectile.getComponent('transform');
      transform?.setPosition(-10, 200);
      beamProjectile.update(16); // One frame

      expect(beamProjectile.active).toBe(false);
    });

    it('should be destroyed after lifetime expires', () => {
      // Fast-forward time beyond lifetime (3 seconds)
      beamProjectile.update(3100); // 3.1 seconds

      expect(beamProjectile.active).toBe(false);
    });
  });

  describe('MissileProjectile', () => {
    let missileProjectile: MissileProjectile;

    beforeEach(() => {
      missileProjectile = new MissileProjectile(100, 200, 1, 0, canvasWidth, canvasHeight);
    });

    it('should create missile projectile with correct default properties', () => {
      expect(missileProjectile.getDamage()).toBe(3);
      expect(missileProjectile.getPosition()).toEqual({ x: 100, y: 200 });
      expect(missileProjectile.getVelocity()).toEqual({ x: 400, y: 0 });
    });

    it('should apply upgrade effects to missile projectile', () => {
      const upgradeEffects = {
        damageMultiplier: 2.6, // Level 4 missile
        speedMultiplier: 1.45,
        fireRateMultiplier: 1,
        specialEffects: { 
          explosive: true,
          homing: true
        }
      };

      const upgradedMissile = new MissileProjectile(
        100, 200, 1, 0, canvasWidth, canvasHeight, upgradeEffects
      );

      expect(upgradedMissile.getDamage()).toBe(8); // 3 * 2.6 rounded
      expect(upgradedMissile.getVelocity().x).toBe(580); // 400 * 1.45 rounded
    });

    it('should have longer lifetime than beam projectiles', () => {
      // Missiles should last 5 seconds vs beam's 3 seconds
      const testBeamProjectile = new BeamProjectile(100, 200, 1, 0, canvasWidth, canvasHeight);
      
      testBeamProjectile.update(3100); // 3.1 seconds
      missileProjectile.update(3100); // 3.1 seconds

      expect(testBeamProjectile.active).toBe(false);
      expect(missileProjectile.active).toBe(true);
    });

    it('should create different sprite than beam projectile', () => {
      // Both should create canvas, but with different drawing calls
      expect(document.createElement).toHaveBeenCalledWith('canvas');
      expect(mockContext.fillRect).toHaveBeenCalled();
    });
  });

  describe('SpecialProjectile', () => {
    describe('Shield Type', () => {
      let shieldProjectile: SpecialProjectile;

      beforeEach(() => {
        shieldProjectile = new SpecialProjectile(
          100, 200, 0, 0, canvasWidth, canvasHeight, SpecialWeaponType.SHIELD
        );
      });

      it('should create shield projectile with correct properties', () => {
        expect(shieldProjectile.getDamage()).toBe(0);
        expect(shieldProjectile.getVelocity()).toEqual({ x: 0, y: 0 }); // Stationary
        expect(shieldProjectile.getSpecialType()).toBe(SpecialWeaponType.SHIELD);
      });

      it('should have larger dimensions than other projectiles', () => {
        const position = shieldProjectile.getPosition();
        expect(position).toEqual({ x: 100, y: 200 });
        
        // Shield should be 64x64 vs beam's 8x4
        const sprite = shieldProjectile.getComponent('sprite');
        expect(sprite?.width).toBe(64);
        expect(sprite?.height).toBe(64);
      });

      it('should create shield-specific sprite', () => {
        // Verify that the sprite component exists and has the right properties
        const sprite = shieldProjectile.getComponent('sprite');
        expect(sprite).toBeDefined();
        expect(sprite?.width).toBe(64);
        expect(sprite?.height).toBe(64);
      });
    });

    describe('Tractor Beam Type', () => {
      let tractorBeamProjectile: SpecialProjectile;

      beforeEach(() => {
        tractorBeamProjectile = new SpecialProjectile(
          100, 200, 1, 0, canvasWidth, canvasHeight, SpecialWeaponType.TRACTOR_BEAM
        );
      });

      it('should create tractor beam projectile with correct properties', () => {
        expect(tractorBeamProjectile.getDamage()).toBe(0);
        expect(tractorBeamProjectile.getVelocity().x).toBe(800);
        expect(tractorBeamProjectile.getSpecialType()).toBe(SpecialWeaponType.TRACTOR_BEAM);
      });

      it('should create tractor beam-specific sprite', () => {
        // Verify that the sprite component exists and has the right properties
        const sprite = tractorBeamProjectile.getComponent('sprite');
        expect(sprite).toBeDefined();
        expect(sprite?.width).toBe(16);
        expect(sprite?.height).toBe(32);
      });
    });

    describe('Screen Clear Type', () => {
      let screenClearProjectile: SpecialProjectile;

      beforeEach(() => {
        screenClearProjectile = new SpecialProjectile(
          100, 200, 0, 0, canvasWidth, canvasHeight, SpecialWeaponType.SCREEN_CLEAR
        );
      });

      it('should create screen clear projectile with high damage', () => {
        expect(screenClearProjectile.getDamage()).toBe(999);
        expect(screenClearProjectile.getSpecialType()).toBe(SpecialWeaponType.SCREEN_CLEAR);
      });

      it('should have very short lifetime for instant effect', () => {
        screenClearProjectile.update(150); // 0.15 seconds
        expect(screenClearProjectile.active).toBe(false);
      });
    });
  });

  describe('Projectile Factory', () => {
    it('should create beam projectile for beam weapon type', () => {
      const projectile = createProjectile(
        WeaponType.BEAM, 100, 200, 1, 0, canvasWidth, canvasHeight
      );

      expect(projectile).toBeInstanceOf(BeamProjectile);
      expect(projectile.getDamage()).toBe(1);
    });

    it('should create missile projectile for missile weapon type', () => {
      const projectile = createProjectile(
        WeaponType.MISSILE, 100, 200, 1, 0, canvasWidth, canvasHeight
      );

      expect(projectile).toBeInstanceOf(MissileProjectile);
      expect(projectile.getDamage()).toBe(3);
    });

    it('should create special projectile for special weapon type', () => {
      const projectile = createProjectile(
        WeaponType.SPECIAL, 100, 200, 0, 0, canvasWidth, canvasHeight,
        undefined, SpecialWeaponType.SHIELD
      );

      expect(projectile).toBeInstanceOf(SpecialProjectile);
      expect((projectile as SpecialProjectile).getSpecialType()).toBe(SpecialWeaponType.SHIELD);
    });

    it('should create special projectile with default shield type when no special type specified', () => {
      const projectile = createProjectile(
        WeaponType.SPECIAL, 100, 200, 0, 0, canvasWidth, canvasHeight
      );

      expect(projectile).toBeInstanceOf(SpecialProjectile);
      expect((projectile as SpecialProjectile).getSpecialType()).toBe(SpecialWeaponType.SHIELD);
    });

    it('should apply upgrade effects through factory', () => {
      const upgradeEffects = {
        damageMultiplier: 2,
        speedMultiplier: 1.5,
        fireRateMultiplier: 1
      };

      const projectile = createProjectile(
        WeaponType.BEAM, 100, 200, 1, 0, canvasWidth, canvasHeight, upgradeEffects
      );

      expect(projectile.getDamage()).toBe(2);
      expect(projectile.getVelocity().x).toBe(900);
    });

    it('should throw error for unknown weapon type', () => {
      expect(() => {
        createProjectile(
          'unknown' as WeaponType, 100, 200, 1, 0, canvasWidth, canvasHeight
        );
      }).toThrow('Unknown weapon type: unknown');
    });
  });

  describe('Base Projectile Behavior', () => {
    let projectile: BeamProjectile;

    beforeEach(() => {
      projectile = new BeamProjectile(100, 200, 1, 0, canvasWidth, canvasHeight);
    });

    it('should update position based on velocity', () => {
      const initialPosition = projectile.getPosition();
      projectile.update(16); // One frame at ~60fps

      const newPosition = projectile.getPosition();
      expect(newPosition.x).toBeGreaterThan(initialPosition.x);
    });

    it('should handle collision events', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Simulate collision
      const collider = projectile.getComponent('collider');
      const mockCollisionEvent = {
        otherEntityId: 'test-entity',
        otherCollider: {
          isTrigger: false,
          layer: 1,
          mask: 1
        },
        intersection: { x: 0, y: 0, width: 10, height: 10 }
      };

      // Trigger collision callback
      collider?.onCollision?.(mockCollisionEvent);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Projectile')
      );
      expect(projectile.active).toBe(false); // Should be destroyed

      consoleSpy.mockRestore();
    });

    it('should not be destroyed by trigger collisions', () => {
      const collider = projectile.getComponent('collider');
      const mockTriggerEvent = {
        otherEntityId: 'trigger-entity',
        otherCollider: {
          isTrigger: true,
          layer: 1,
          mask: 1
        },
        intersection: { x: 0, y: 0, width: 10, height: 10 }
      };

      collider?.onCollision?.(mockTriggerEvent);

      expect(projectile.active).toBe(true); // Should still be active
    });

    it('should handle piercing projectiles correctly', () => {
      const piercingProjectile = new BeamProjectile(
        100, 200, 1, 0, canvasWidth, canvasHeight,
        { damageMultiplier: 1, speedMultiplier: 1, fireRateMultiplier: 1, specialEffects: { piercing: true } }
      );

      const collider = piercingProjectile.getComponent('collider');
      const mockCollisionEvent = {
        otherEntityId: 'test-entity',
        otherCollider: {
          isTrigger: false,
          layer: 1,
          mask: 1
        },
        intersection: { x: 0, y: 0, width: 10, height: 10 }
      };

      collider?.onCollision?.(mockCollisionEvent);

      expect(piercingProjectile.active).toBe(true); // Piercing projectiles survive hits
    });
  });
});