/**
 * Comprehensive unit tests for weapon upgrade system
 * Tests upgrade calculations, effects, and level progression
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Weapon, WeaponType, WeaponUpgradeEffects } from './Weapon';

describe('Weapon Upgrade System', () => {
  let weapon: Weapon;

  beforeEach(() => {
    weapon = new Weapon(WeaponType.BEAM);
  });

  describe('Upgrade Level Management', () => {
    it('should initialize all weapons at level 1', () => {
      expect(weapon.getWeaponLevel(WeaponType.BEAM)).toBe(1);
      expect(weapon.getWeaponLevel(WeaponType.MISSILE)).toBe(1);
      expect(weapon.getWeaponLevel(WeaponType.SPECIAL)).toBe(1);
    });

    it('should have correct maximum levels for each weapon type', () => {
      expect(weapon.getMaxWeaponLevel(WeaponType.BEAM)).toBe(5);
      expect(weapon.getMaxWeaponLevel(WeaponType.MISSILE)).toBe(5);
      expect(weapon.getMaxWeaponLevel(WeaponType.SPECIAL)).toBe(3);
    });

    it('should upgrade weapon level correctly', () => {
      const initialLevel = weapon.getWeaponLevel(WeaponType.BEAM);
      const upgraded = weapon.upgradeWeapon(WeaponType.BEAM);
      
      expect(upgraded).toBe(true);
      expect(weapon.getWeaponLevel(WeaponType.BEAM)).toBe(initialLevel + 1);
    });

    it('should not upgrade beyond maximum level', () => {
      // Upgrade to maximum level
      for (let i = 1; i < weapon.getMaxWeaponLevel(WeaponType.BEAM); i++) {
        weapon.upgradeWeapon(WeaponType.BEAM);
      }
      
      expect(weapon.getWeaponLevel(WeaponType.BEAM)).toBe(5);
      
      // Try to upgrade beyond max
      const upgraded = weapon.upgradeWeapon(WeaponType.BEAM);
      expect(upgraded).toBe(false);
      expect(weapon.getWeaponLevel(WeaponType.BEAM)).toBe(5);
    });

    it('should correctly identify upgradeable weapons', () => {
      expect(weapon.canUpgrade(WeaponType.BEAM)).toBe(true);
      expect(weapon.canUpgrade(WeaponType.MISSILE)).toBe(true);
      expect(weapon.canUpgrade(WeaponType.SPECIAL)).toBe(true);
      
      // Upgrade to max level
      for (let i = 1; i < weapon.getMaxWeaponLevel(WeaponType.SPECIAL); i++) {
        weapon.upgradeWeapon(WeaponType.SPECIAL);
      }
      
      expect(weapon.canUpgrade(WeaponType.SPECIAL)).toBe(false);
    });
  });

  describe('Beam Weapon Upgrade Effects', () => {
    it('should calculate correct damage multiplier for beam weapon', () => {
      const level1Effects = weapon.getUpgradeEffects(WeaponType.BEAM, 1);
      const level2Effects = weapon.getUpgradeEffects(WeaponType.BEAM, 2);
      const level5Effects = weapon.getUpgradeEffects(WeaponType.BEAM, 5);
      
      expect(level1Effects.damageMultiplier).toBe(1.0); // No bonus at level 1
      expect(level2Effects.damageMultiplier).toBe(1.5); // +50% at level 2
      expect(level5Effects.damageMultiplier).toBe(3.0); // +200% at level 5
    });

    it('should calculate correct fire rate multiplier for beam weapon', () => {
      const level1Effects = weapon.getUpgradeEffects(WeaponType.BEAM, 1);
      const level2Effects = weapon.getUpgradeEffects(WeaponType.BEAM, 2);
      const level5Effects = weapon.getUpgradeEffects(WeaponType.BEAM, 5);
      
      expect(level1Effects.fireRateMultiplier).toBe(1.0); // No bonus at level 1
      expect(level2Effects.fireRateMultiplier).toBe(0.85); // 15% faster at level 2
      expect(level5Effects.fireRateMultiplier).toBe(0.4); // Much faster at level 5, capped at 0.3
    });

    it('should calculate correct speed multiplier for beam weapon', () => {
      const level1Effects = weapon.getUpgradeEffects(WeaponType.BEAM, 1);
      const level2Effects = weapon.getUpgradeEffects(WeaponType.BEAM, 2);
      const level5Effects = weapon.getUpgradeEffects(WeaponType.BEAM, 5);
      
      expect(level1Effects.speedMultiplier).toBe(1.0); // No bonus at level 1
      expect(level2Effects.speedMultiplier).toBe(1.2); // +20% at level 2
      expect(level5Effects.speedMultiplier).toBe(1.8); // +80% at level 5
    });

    it('should add piercing effect at level 3+', () => {
      const level2Effects = weapon.getUpgradeEffects(WeaponType.BEAM, 2);
      const level3Effects = weapon.getUpgradeEffects(WeaponType.BEAM, 3);
      const level5Effects = weapon.getUpgradeEffects(WeaponType.BEAM, 5);
      
      expect(level2Effects.specialEffects?.piercing).toBeUndefined();
      expect(level3Effects.specialEffects?.piercing).toBe(true);
      expect(level5Effects.specialEffects?.piercing).toBe(true);
    });

    it('should apply upgrade effects to weapon configuration', () => {
      const initialConfig = weapon.getWeaponConfig(WeaponType.BEAM)!;
      const initialDamage = initialConfig.damage;
      const initialFireRate = initialConfig.fireRate;
      const initialSpeed = initialConfig.projectileSpeed;
      
      weapon.upgradeWeapon(WeaponType.BEAM);
      
      const upgradedConfig = weapon.getWeaponConfig(WeaponType.BEAM)!;
      expect(upgradedConfig.damage).toBeGreaterThan(initialDamage);
      expect(upgradedConfig.fireRate).toBeLessThan(initialFireRate); // Faster fire rate
      expect(upgradedConfig.projectileSpeed).toBeGreaterThan(initialSpeed);
    });
  });

  describe('Missile Weapon Upgrade Effects', () => {
    it('should calculate correct damage multiplier for missile weapon', () => {
      const level1Effects = weapon.getUpgradeEffects(WeaponType.MISSILE, 1);
      const level2Effects = weapon.getUpgradeEffects(WeaponType.MISSILE, 2);
      const level5Effects = weapon.getUpgradeEffects(WeaponType.MISSILE, 5);
      
      expect(level1Effects.damageMultiplier).toBe(1.0); // No bonus at level 1
      expect(level2Effects.damageMultiplier).toBe(1.8); // +80% at level 2
      expect(level5Effects.damageMultiplier).toBe(4.2); // +320% at level 5
    });

    it('should calculate correct fire rate multiplier for missile weapon', () => {
      const level1Effects = weapon.getUpgradeEffects(WeaponType.MISSILE, 1);
      const level2Effects = weapon.getUpgradeEffects(WeaponType.MISSILE, 2);
      const level5Effects = weapon.getUpgradeEffects(WeaponType.MISSILE, 5);
      
      expect(level1Effects.fireRateMultiplier).toBe(1.0); // No bonus at level 1
      expect(level2Effects.fireRateMultiplier).toBe(0.9); // 10% faster at level 2
      expect(level5Effects.fireRateMultiplier).toBe(0.6); // 40% faster at level 5
    });

    it('should add explosive effect at level 2+', () => {
      const level1Effects = weapon.getUpgradeEffects(WeaponType.MISSILE, 1);
      const level2Effects = weapon.getUpgradeEffects(WeaponType.MISSILE, 2);
      const level5Effects = weapon.getUpgradeEffects(WeaponType.MISSILE, 5);
      
      expect(level1Effects.specialEffects?.explosive).toBe(false);
      expect(level2Effects.specialEffects?.explosive).toBe(true);
      expect(level5Effects.specialEffects?.explosive).toBe(true);
    });

    it('should add homing effect at level 4+', () => {
      const level3Effects = weapon.getUpgradeEffects(WeaponType.MISSILE, 3);
      const level4Effects = weapon.getUpgradeEffects(WeaponType.MISSILE, 4);
      const level5Effects = weapon.getUpgradeEffects(WeaponType.MISSILE, 5);
      
      expect(level3Effects.specialEffects?.homing).toBe(false);
      expect(level4Effects.specialEffects?.homing).toBe(true);
      expect(level5Effects.specialEffects?.homing).toBe(true);
    });

    it('should increase maximum ammunition when upgrading', () => {
      const initialMaxAmmo = weapon.getMaxAmmo(WeaponType.MISSILE);
      expect(initialMaxAmmo).toBe(20);
      
      weapon.upgradeWeapon(WeaponType.MISSILE);
      expect(weapon.getMaxAmmo(WeaponType.MISSILE)).toBe(25);
      
      weapon.upgradeWeapon(WeaponType.MISSILE);
      expect(weapon.getMaxAmmo(WeaponType.MISSILE)).toBe(30);
      
      weapon.upgradeWeapon(WeaponType.MISSILE);
      expect(weapon.getMaxAmmo(WeaponType.MISSILE)).toBe(35);
    });
  });

  describe('Special Weapon Upgrade Effects', () => {
    it('should calculate correct fire rate multiplier for special weapon', () => {
      const level1Effects = weapon.getUpgradeEffects(WeaponType.SPECIAL, 1);
      const level2Effects = weapon.getUpgradeEffects(WeaponType.SPECIAL, 2);
      const level3Effects = weapon.getUpgradeEffects(WeaponType.SPECIAL, 3);
      
      expect(level1Effects.fireRateMultiplier).toBe(1.0); // No bonus at level 1
      expect(level2Effects.fireRateMultiplier).toBe(0.8); // 20% faster cooldown at level 2
      expect(level3Effects.fireRateMultiplier).toBe(0.6); // 40% faster cooldown at level 3
    });

    it('should not modify damage for special weapons', () => {
      const effects = weapon.getUpgradeEffects(WeaponType.SPECIAL, 3);
      expect(effects.damageMultiplier).toBe(1.0);
      expect(effects.speedMultiplier).toBe(1.0);
    });

    it('should have special effects configuration', () => {
      const effects = weapon.getUpgradeEffects(WeaponType.SPECIAL, 2);
      expect(effects.specialEffects).toBeDefined();
    });
  });

  describe('Upgrade Persistence and State', () => {
    it('should maintain upgrade levels across weapon switches', () => {
      weapon.upgradeWeapon(WeaponType.BEAM);
      weapon.upgradeWeapon(WeaponType.MISSILE);
      weapon.upgradeWeapon(WeaponType.MISSILE);
      
      weapon.switchWeapon(WeaponType.BEAM);
      expect(weapon.getWeaponLevel(WeaponType.BEAM)).toBe(2);
      
      weapon.switchWeapon(WeaponType.MISSILE);
      expect(weapon.getWeaponLevel(WeaponType.MISSILE)).toBe(3);
    });

    it('should preserve current ammunition when upgrading', () => {
      weapon.switchWeapon(WeaponType.MISSILE);
      
      // Use some ammunition
      const config = weapon.getWeaponConfig(WeaponType.MISSILE)!;
      config.currentAmmo = 15;
      
      // Upgrade weapon
      weapon.upgradeWeapon(WeaponType.MISSILE);
      
      // Current ammo should be preserved
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(15);
      // But max ammo should increase
      expect(weapon.getMaxAmmo(WeaponType.MISSILE)).toBe(25);
    });

    it('should reset all upgrades when weapon is reset', () => {
      // Upgrade all weapons
      weapon.upgradeWeapon(WeaponType.BEAM);
      weapon.upgradeWeapon(WeaponType.BEAM);
      weapon.upgradeWeapon(WeaponType.MISSILE);
      weapon.upgradeWeapon(WeaponType.SPECIAL);
      
      expect(weapon.getWeaponLevel(WeaponType.BEAM)).toBe(3);
      expect(weapon.getWeaponLevel(WeaponType.MISSILE)).toBe(2);
      expect(weapon.getWeaponLevel(WeaponType.SPECIAL)).toBe(2);
      
      // Reset weapon
      weapon.reset();
      
      expect(weapon.getWeaponLevel(WeaponType.BEAM)).toBe(1);
      expect(weapon.getWeaponLevel(WeaponType.MISSILE)).toBe(1);
      expect(weapon.getWeaponLevel(WeaponType.SPECIAL)).toBe(1);
    });

    it('should return complete weapon states for serialization', () => {
      weapon.upgradeWeapon(WeaponType.BEAM);
      weapon.upgradeWeapon(WeaponType.MISSILE);
      
      const states = weapon.getWeaponStates();
      
      expect(states[WeaponType.BEAM].currentLevel).toBe(2);
      expect(states[WeaponType.MISSILE].currentLevel).toBe(2);
      expect(states[WeaponType.SPECIAL].currentLevel).toBe(1);
      
      // Should include all weapon properties
      expect(states[WeaponType.BEAM]).toHaveProperty('damage');
      expect(states[WeaponType.BEAM]).toHaveProperty('fireRate');
      expect(states[WeaponType.BEAM]).toHaveProperty('projectileSpeed');
      expect(states[WeaponType.BEAM]).toHaveProperty('maxLevel');
    });
  });

  describe('Upgrade Effects Calculation Edge Cases', () => {
    it('should handle level 0 gracefully', () => {
      const effects = weapon.getUpgradeEffects(WeaponType.BEAM, 0);
      expect(effects.damageMultiplier).toBe(0.5); // Level 0 = -1 * 0.5 = -0.5, so 1 + (-0.5) = 0.5
      expect(effects.fireRateMultiplier).toBe(1.15); // Level 0 = -1 * -0.15 = 0.15, so 1 + 0.15 = 1.15
    });

    it('should handle very high levels', () => {
      const effects = weapon.getUpgradeEffects(WeaponType.BEAM, 100);
      expect(effects.damageMultiplier).toBe(50.5); // 1 + (99 * 0.5)
      expect(effects.fireRateMultiplier).toBe(0.3); // Capped at minimum 0.3
      expect(effects.speedMultiplier).toBe(20.8); // 1 + (99 * 0.2)
    });

    it('should maintain fire rate minimum bounds', () => {
      const beamEffects = weapon.getUpgradeEffects(WeaponType.BEAM, 10);
      const missileEffects = weapon.getUpgradeEffects(WeaponType.MISSILE, 10);
      const specialEffects = weapon.getUpgradeEffects(WeaponType.SPECIAL, 10);
      
      expect(beamEffects.fireRateMultiplier).toBeGreaterThanOrEqual(0.3);
      expect(missileEffects.fireRateMultiplier).toBeGreaterThanOrEqual(0.4);
      expect(specialEffects.fireRateMultiplier).toBeGreaterThanOrEqual(0.5);
    });

    it('should handle invalid weapon types', () => {
      const invalidWeapon = 'invalid' as WeaponType;
      const effects = weapon.getUpgradeEffects(invalidWeapon, 5);
      
      expect(effects.damageMultiplier).toBe(1);
      expect(effects.fireRateMultiplier).toBe(1);
      expect(effects.speedMultiplier).toBe(1);
      expect(effects.specialEffects).toBeUndefined();
    });
  });

  describe('Upgrade Integration with Weapon Systems', () => {
    it('should apply upgrades to actual weapon stats when upgrading', () => {
      const initialBeamConfig = weapon.getWeaponConfig(WeaponType.BEAM)!;
      const initialDamage = initialBeamConfig.damage;
      const initialFireRate = initialBeamConfig.fireRate;
      const initialSpeed = initialBeamConfig.projectileSpeed;
      
      // Upgrade beam weapon multiple times
      weapon.upgradeWeapon(WeaponType.BEAM);
      weapon.upgradeWeapon(WeaponType.BEAM);
      weapon.upgradeWeapon(WeaponType.BEAM);
      
      const upgradedConfig = weapon.getWeaponConfig(WeaponType.BEAM)!;
      
      // Damage should increase significantly
      expect(upgradedConfig.damage).toBeGreaterThan(initialDamage * 2);
      
      // Fire rate should decrease (faster firing)
      expect(upgradedConfig.fireRate).toBeLessThan(initialFireRate * 0.8);
      
      // Speed should increase
      expect(upgradedConfig.projectileSpeed).toBeGreaterThan(initialSpeed * 1.4);
      
      // Level should be correct
      expect(upgradedConfig.currentLevel).toBe(4);
    });

    it('should maintain upgrade effects after weapon switching', () => {
      // Upgrade beam weapon
      weapon.upgradeWeapon(WeaponType.BEAM);
      weapon.upgradeWeapon(WeaponType.BEAM);
      
      const beamConfigAfterUpgrade = weapon.getWeaponConfig(WeaponType.BEAM)!;
      const upgradedDamage = beamConfigAfterUpgrade.damage;
      
      // Switch to missile and back
      weapon.switchWeapon(WeaponType.MISSILE);
      weapon.switchWeapon(WeaponType.BEAM);
      
      const beamConfigAfterSwitch = weapon.getWeaponConfig(WeaponType.BEAM)!;
      expect(beamConfigAfterSwitch.damage).toBe(upgradedDamage);
      expect(beamConfigAfterSwitch.currentLevel).toBe(3);
    });

    it('should correctly calculate upgrade effects for all levels', () => {
      // Test all levels for beam weapon
      for (let level = 1; level <= 5; level++) {
        const effects = weapon.getUpgradeEffects(WeaponType.BEAM, level);
        
        // Damage should increase with level
        expect(effects.damageMultiplier).toBe(1 + (level - 1) * 0.5);
        
        // Fire rate should improve (decrease) with level, but have a minimum
        const expectedFireRate = Math.max(0.3, 1 - (level - 1) * 0.15);
        expect(effects.fireRateMultiplier).toBe(expectedFireRate);
        
        // Speed should increase with level
        expect(effects.speedMultiplier).toBe(1 + (level - 1) * 0.2);
        
        // Piercing should be available at level 3+
        if (level >= 3) {
          expect(effects.specialEffects?.piercing).toBe(true);
        } else {
          expect(effects.specialEffects?.piercing).toBeUndefined();
        }
      }
    });
  });
});