/**
 * Unit tests for the Weapon component
 * Tests weapon switching, ammunition tracking, upgrades, and firing logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Weapon, WeaponType } from './Weapon';

describe('Weapon Component', () => {
  let weapon: Weapon;

  beforeEach(() => {
    weapon = new Weapon();
    // Mock Date.now for consistent testing
    vi.spyOn(Date, 'now').mockReturnValue(1000);
  });

  describe('Initialization', () => {
    it('should initialize with beam weapon as default', () => {
      expect(weapon.getCurrentWeapon()).toBe(WeaponType.BEAM);
    });

    it('should initialize with custom weapon type', () => {
      const missileWeapon = new Weapon(WeaponType.MISSILE);
      expect(missileWeapon.getCurrentWeapon()).toBe(WeaponType.MISSILE);
    });

    it('should have all three weapon types configured', () => {
      expect(weapon.getWeaponConfig(WeaponType.BEAM)).toBeDefined();
      expect(weapon.getWeaponConfig(WeaponType.MISSILE)).toBeDefined();
      expect(weapon.getWeaponConfig(WeaponType.SPECIAL)).toBeDefined();
    });

    it('should initialize beam weapon with unlimited ammo', () => {
      const beamConfig = weapon.getWeaponConfig(WeaponType.BEAM);
      expect(beamConfig?.maxAmmo).toBeUndefined();
      expect(beamConfig?.currentAmmo).toBeUndefined();
    });

    it('should initialize missile weapon with limited ammo', () => {
      const missileConfig = weapon.getWeaponConfig(WeaponType.MISSILE);
      expect(missileConfig?.maxAmmo).toBe(20);
      expect(missileConfig?.currentAmmo).toBe(20);
    });

    it('should initialize special weapon with limited uses', () => {
      const specialConfig = weapon.getWeaponConfig(WeaponType.SPECIAL);
      expect(specialConfig?.maxAmmo).toBe(3);
      expect(specialConfig?.currentAmmo).toBe(3);
    });
  });

  describe('Weapon Switching', () => {
    it('should switch to valid weapon type', () => {
      expect(weapon.switchWeapon(WeaponType.MISSILE)).toBe(true);
      expect(weapon.getCurrentWeapon()).toBe(WeaponType.MISSILE);
    });

    it('should cycle through all weapon types', () => {
      expect(weapon.getCurrentWeapon()).toBe(WeaponType.BEAM);
      
      weapon.cycleWeapon();
      expect(weapon.getCurrentWeapon()).toBe(WeaponType.MISSILE);
      
      weapon.cycleWeapon();
      expect(weapon.getCurrentWeapon()).toBe(WeaponType.SPECIAL);
      
      weapon.cycleWeapon();
      expect(weapon.getCurrentWeapon()).toBe(WeaponType.BEAM);
    });

    it('should get current weapon configuration', () => {
      weapon.switchWeapon(WeaponType.MISSILE);
      const config = weapon.getCurrentWeaponConfig();
      expect(config.damage).toBe(3);
      expect(config.maxAmmo).toBe(20);
    });
  });

  describe('Firing Logic', () => {
    it('should allow firing when weapon is ready', () => {
      expect(weapon.canFire()).toBe(true);
      expect(weapon.fire()).toBe(true);
    });

    it('should prevent firing during cooldown', () => {
      weapon.fire();
      expect(weapon.canFire()).toBe(false);
      expect(weapon.fire()).toBe(false);
    });

    it('should allow firing after cooldown period', () => {
      weapon.fire();
      
      // Advance time past fire rate
      vi.spyOn(Date, 'now').mockReturnValue(1300); // +300ms
      
      expect(weapon.canFire()).toBe(true);
      expect(weapon.fire()).toBe(true);
    });

    it('should prevent firing when out of ammo', () => {
      weapon.switchWeapon(WeaponType.MISSILE);
      
      // Deplete all ammo
      const missileConfig = weapon.getWeaponConfig(WeaponType.MISSILE)!;
      missileConfig.currentAmmo = 0;
      
      expect(weapon.canFire()).toBe(false);
      expect(weapon.fire()).toBe(false);
    });

    it('should consume ammo when firing limited ammo weapons', () => {
      weapon.switchWeapon(WeaponType.MISSILE);
      const initialAmmo = weapon.getAmmo(WeaponType.MISSILE);
      
      weapon.fire();
      
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(initialAmmo! - 1);
    });

    it('should not consume ammo for unlimited ammo weapons', () => {
      weapon.switchWeapon(WeaponType.BEAM);
      const initialAmmo = weapon.getAmmo(WeaponType.BEAM);
      
      weapon.fire();
      
      expect(weapon.getAmmo(WeaponType.BEAM)).toBe(initialAmmo);
    });

    it('should calculate time until ready correctly', () => {
      weapon.fire();
      
      // Check immediately after firing
      const timeUntilReady = weapon.getTimeUntilReady();
      expect(timeUntilReady).toBe(200); // Fire rate is 200ms
      
      // Advance time partially
      vi.spyOn(Date, 'now').mockReturnValue(1100); // +100ms
      expect(weapon.getTimeUntilReady()).toBe(100);
      
      // Advance time past cooldown
      vi.spyOn(Date, 'now').mockReturnValue(1300); // +300ms
      expect(weapon.getTimeUntilReady()).toBe(0);
    });
  });

  describe('Ammunition Management', () => {
    it('should add ammo to limited ammo weapons', () => {
      weapon.switchWeapon(WeaponType.MISSILE);
      const missileConfig = weapon.getWeaponConfig(WeaponType.MISSILE)!;
      missileConfig.currentAmmo = 10;
      
      expect(weapon.addAmmo(WeaponType.MISSILE, 5)).toBe(true);
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(15);
    });

    it('should not exceed max ammo when adding', () => {
      weapon.switchWeapon(WeaponType.MISSILE);
      const missileConfig = weapon.getWeaponConfig(WeaponType.MISSILE)!;
      missileConfig.currentAmmo = 18;
      
      expect(weapon.addAmmo(WeaponType.MISSILE, 5)).toBe(true);
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(20); // Capped at max
    });

    it('should not add ammo to unlimited ammo weapons', () => {
      expect(weapon.addAmmo(WeaponType.BEAM, 10)).toBe(false);
    });

    it('should refill ammo to maximum', () => {
      weapon.switchWeapon(WeaponType.MISSILE);
      const missileConfig = weapon.getWeaponConfig(WeaponType.MISSILE)!;
      missileConfig.currentAmmo = 5;
      
      expect(weapon.refillAmmo(WeaponType.MISSILE)).toBe(true);
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(20);
    });

    it('should not refill unlimited ammo weapons', () => {
      expect(weapon.refillAmmo(WeaponType.BEAM)).toBe(false);
    });

    it('should get correct ammo counts', () => {
      expect(weapon.getAmmo(WeaponType.BEAM)).toBeUndefined();
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(20);
      expect(weapon.getAmmo(WeaponType.SPECIAL)).toBe(3);
    });

    it('should get correct max ammo counts', () => {
      expect(weapon.getMaxAmmo(WeaponType.BEAM)).toBeUndefined();
      expect(weapon.getMaxAmmo(WeaponType.MISSILE)).toBe(20);
      expect(weapon.getMaxAmmo(WeaponType.SPECIAL)).toBe(3);
    });
  });

  describe('Weapon Upgrades', () => {
    it('should upgrade weapon to next level', () => {
      expect(weapon.upgradeWeapon(WeaponType.BEAM)).toBe(true);
      expect(weapon.getWeaponLevel(WeaponType.BEAM)).toBe(2);
    });

    it('should not upgrade beyond max level', () => {
      // Upgrade to max level
      for (let i = 1; i < 5; i++) {
        weapon.upgradeWeapon(WeaponType.BEAM);
      }
      
      expect(weapon.getWeaponLevel(WeaponType.BEAM)).toBe(5);
      expect(weapon.upgradeWeapon(WeaponType.BEAM)).toBe(false);
    });

    it('should check if weapon can be upgraded', () => {
      expect(weapon.canUpgrade(WeaponType.BEAM)).toBe(true);
      
      // Upgrade to max level
      for (let i = 1; i < 5; i++) {
        weapon.upgradeWeapon(WeaponType.BEAM);
      }
      
      expect(weapon.canUpgrade(WeaponType.BEAM)).toBe(false);
    });

    it('should apply upgrade effects to weapon stats', () => {
      const initialConfig = weapon.getWeaponConfig(WeaponType.BEAM)!;
      const initialDamage = initialConfig.damage;
      const initialFireRate = initialConfig.fireRate;
      
      weapon.upgradeWeapon(WeaponType.BEAM);
      
      const upgradedConfig = weapon.getWeaponConfig(WeaponType.BEAM)!;
      expect(upgradedConfig.damage).toBeGreaterThan(initialDamage);
      expect(upgradedConfig.fireRate).toBeLessThan(initialFireRate); // Faster fire rate
    });

    it('should increase missile max ammo on upgrade', () => {
      const initialMaxAmmo = weapon.getMaxAmmo(WeaponType.MISSILE)!;
      
      weapon.upgradeWeapon(WeaponType.MISSILE);
      
      expect(weapon.getMaxAmmo(WeaponType.MISSILE)).toBe(initialMaxAmmo + 5);
    });

    it('should get correct upgrade effects for each weapon type', () => {
      const beamEffects = weapon.getUpgradeEffects(WeaponType.BEAM, 3);
      expect(beamEffects.specialEffects?.piercing).toBe(true);
      
      const missileEffects = weapon.getUpgradeEffects(WeaponType.MISSILE, 2);
      expect(missileEffects.specialEffects?.explosive).toBe(true);
      
      const missileHomingEffects = weapon.getUpgradeEffects(WeaponType.MISSILE, 4);
      expect(missileHomingEffects.specialEffects?.homing).toBe(true);
    });

    it('should get weapon levels correctly', () => {
      expect(weapon.getWeaponLevel(WeaponType.BEAM)).toBe(1);
      expect(weapon.getMaxWeaponLevel(WeaponType.BEAM)).toBe(5);
      
      weapon.upgradeWeapon(WeaponType.BEAM);
      expect(weapon.getWeaponLevel(WeaponType.BEAM)).toBe(2);
    });
  });

  describe('State Management', () => {
    it('should reset all weapon states', () => {
      // Modify weapon states
      weapon.switchWeapon(WeaponType.MISSILE);
      weapon.upgradeWeapon(WeaponType.BEAM);
      weapon.fire();
      
      weapon.reset();
      
      expect(weapon.getCurrentWeapon()).toBe(WeaponType.BEAM);
      expect(weapon.getWeaponLevel(WeaponType.BEAM)).toBe(1);
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(20);
      expect(weapon.canFire()).toBe(true);
    });

    it('should get all weapon states for serialization', () => {
      weapon.upgradeWeapon(WeaponType.BEAM);
      weapon.switchWeapon(WeaponType.MISSILE);
      weapon.fire();
      
      const states = weapon.getWeaponStates();
      
      expect(states[WeaponType.BEAM].currentLevel).toBe(2);
      expect(states[WeaponType.MISSILE].currentAmmo).toBe(19);
      expect(states[WeaponType.SPECIAL].currentAmmo).toBe(3);
    });

    it('should have correct component type', () => {
      expect(weapon.type).toBe('Weapon');
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid weapon type gracefully', () => {
      expect(weapon.getWeaponConfig('invalid' as WeaponType)).toBeUndefined();
      expect(weapon.getWeaponLevel('invalid' as WeaponType)).toBe(1);
      expect(weapon.canUpgrade('invalid' as WeaponType)).toBe(false);
    });

    it('should handle negative ammo addition', () => {
      weapon.switchWeapon(WeaponType.MISSILE);
      const initialAmmo = weapon.getAmmo(WeaponType.MISSILE)!;
      
      weapon.addAmmo(WeaponType.MISSILE, -5);
      
      // Should not go below 0 or change unexpectedly
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(initialAmmo);
    });

    it('should handle ammo consumption when already at zero', () => {
      weapon.switchWeapon(WeaponType.MISSILE);
      const missileConfig = weapon.getWeaponConfig(WeaponType.MISSILE)!;
      missileConfig.currentAmmo = 0;
      
      weapon.fire(); // Should fail
      
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(0);
    });
  });
});