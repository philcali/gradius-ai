/**
 * Unit tests for Weapon component missile ammunition management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Weapon, WeaponType } from './Weapon';

describe('Weapon Component - Missile Ammunition Management', () => {
  let weapon: Weapon;

  beforeEach(() => {
    weapon = new Weapon(WeaponType.BEAM);
  });

  describe('Missile Ammunition Tracking', () => {
    it('should initialize missile weapon with correct default ammunition', () => {
      const missileAmmo = weapon.getAmmo(WeaponType.MISSILE);
      const maxMissileAmmo = weapon.getMaxAmmo(WeaponType.MISSILE);
      
      expect(missileAmmo).toBe(20);
      expect(maxMissileAmmo).toBe(20);
    });

    it('should consume ammunition when firing missile weapon', () => {
      weapon.switchWeapon(WeaponType.MISSILE);
      
      const initialAmmo = weapon.getAmmo(WeaponType.MISSILE);
      expect(initialAmmo).toBe(20);
      
      // Fire missile
      const fired = weapon.fire();
      expect(fired).toBe(true);
      
      const remainingAmmo = weapon.getAmmo(WeaponType.MISSILE);
      expect(remainingAmmo).toBe(19);
    });

    it('should prevent firing when missile ammunition is empty', () => {
      weapon.switchWeapon(WeaponType.MISSILE);
      
      // Drain all ammunition
      const config = weapon.getWeaponConfig(WeaponType.MISSILE)!;
      config.currentAmmo = 0;
      
      const canFire = weapon.canFire();
      expect(canFire).toBe(false);
      
      const fired = weapon.fire();
      expect(fired).toBe(false);
    });

    it('should not consume ammunition for beam weapon (unlimited)', () => {
      weapon.switchWeapon(WeaponType.BEAM);
      
      const initialAmmo = weapon.getAmmo(WeaponType.BEAM);
      expect(initialAmmo).toBeUndefined(); // Unlimited ammo
      
      // Fire beam multiple times (bypassing cooldown for testing)
      for (let i = 0; i < 10; i++) {
        // Simulate time passing to bypass cooldown
        (weapon as any).lastFireTimes.set(WeaponType.BEAM, Date.now() - 1000);
        const fired = weapon.fire();
        expect(fired).toBe(true);
      }
      
      const remainingAmmo = weapon.getAmmo(WeaponType.BEAM);
      expect(remainingAmmo).toBeUndefined(); // Still unlimited
    });
  });

  describe('Ammunition Management', () => {
    it('should add ammunition to missile weapon', () => {
      weapon.switchWeapon(WeaponType.MISSILE);
      
      // Use some ammo first (bypass cooldown)
      (weapon as any).lastFireTimes.set(WeaponType.MISSILE, Date.now() - 1000);
      weapon.fire();
      (weapon as any).lastFireTimes.set(WeaponType.MISSILE, Date.now() - 1000);
      weapon.fire();
      (weapon as any).lastFireTimes.set(WeaponType.MISSILE, Date.now() - 1000);
      weapon.fire();
      (weapon as any).lastFireTimes.set(WeaponType.MISSILE, Date.now() - 1000);
      weapon.fire();
      (weapon as any).lastFireTimes.set(WeaponType.MISSILE, Date.now() - 1000);
      weapon.fire();
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(15);
      
      // Add ammo (should not exceed max)
      const added = weapon.addAmmo(WeaponType.MISSILE, 3);
      expect(added).toBe(true);
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(18);
    });

    it('should not exceed maximum ammunition when adding ammo', () => {
      weapon.switchWeapon(WeaponType.MISSILE);
      
      const maxAmmo = weapon.getMaxAmmo(WeaponType.MISSILE)!;
      
      // Try to add more than max
      const added = weapon.addAmmo(WeaponType.MISSILE, 50);
      expect(added).toBe(true);
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(maxAmmo);
    });

    it('should refill ammunition to maximum', () => {
      weapon.switchWeapon(WeaponType.MISSILE);
      
      // Use some ammo (bypass cooldown)
      (weapon as any).lastFireTimes.set(WeaponType.MISSILE, Date.now() - 1000);
      weapon.fire();
      (weapon as any).lastFireTimes.set(WeaponType.MISSILE, Date.now() - 1000);
      weapon.fire();
      (weapon as any).lastFireTimes.set(WeaponType.MISSILE, Date.now() - 1000);
      weapon.fire();
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(17);
      
      // Refill
      const refilled = weapon.refillAmmo(WeaponType.MISSILE);
      expect(refilled).toBe(true);
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(20);
    });

    it('should not add ammunition to beam weapon (unlimited)', () => {
      const added = weapon.addAmmo(WeaponType.BEAM, 10);
      expect(added).toBe(false);
      expect(weapon.getAmmo(WeaponType.BEAM)).toBeUndefined();
    });

    it('should reject negative ammunition amounts', () => {
      const added = weapon.addAmmo(WeaponType.MISSILE, -5);
      expect(added).toBe(false);
    });
  });

  describe('Fire Rate and Cooldown', () => {
    it('should respect missile weapon fire rate', () => {
      weapon.switchWeapon(WeaponType.MISSILE);
      
      // Fire first missile
      const fired1 = weapon.fire();
      expect(fired1).toBe(true);
      
      // Try to fire immediately (should fail due to cooldown)
      const fired2 = weapon.fire();
      expect(fired2).toBe(false);
      
      // Check that ammo was only consumed once
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(19);
    });

    it('should return correct time until ready', () => {
      weapon.switchWeapon(WeaponType.MISSILE);
      
      // Fire missile
      weapon.fire();
      
      const timeUntilReady = weapon.getTimeUntilReady();
      expect(timeUntilReady).toBeGreaterThan(0);
      expect(timeUntilReady).toBeLessThanOrEqual(800); // Missile fire rate
    });

    it('should allow firing after cooldown period', async () => {
      weapon.switchWeapon(WeaponType.MISSILE);
      
      // Fire first missile
      weapon.fire();
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(19);
      
      // Wait for cooldown (simulate time passing)
      const config = weapon.getWeaponConfig(WeaponType.MISSILE)!;
      const lastFireTime = Date.now() - config.fireRate - 1;
      
      // Manually set last fire time to simulate cooldown completion
      (weapon as any).lastFireTimes.set(WeaponType.MISSILE, lastFireTime);
      
      // Should be able to fire again
      const canFire = weapon.canFire();
      expect(canFire).toBe(true);
      
      const fired = weapon.fire();
      expect(fired).toBe(true);
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(18);
    });
  });

  describe('Weapon Upgrades and Ammunition', () => {
    it('should increase maximum ammunition when upgrading missile weapon', () => {
      const initialMaxAmmo = weapon.getMaxAmmo(WeaponType.MISSILE);
      expect(initialMaxAmmo).toBe(20);
      
      // Upgrade missile weapon
      const upgraded = weapon.upgradeWeapon(WeaponType.MISSILE);
      expect(upgraded).toBe(true);
      
      const newMaxAmmo = weapon.getMaxAmmo(WeaponType.MISSILE);
      expect(newMaxAmmo).toBe(25); // Should increase by 5
    });

    it('should maintain current ammo ratio when upgrading', () => {
      weapon.switchWeapon(WeaponType.MISSILE);
      
      // Use half the ammo
      for (let i = 0; i < 10; i++) {
        weapon.fire();
        // Simulate time passing to bypass cooldown
        (weapon as any).lastFireTimes.set(WeaponType.MISSILE, Date.now() - 1000);
      }
      
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(10);
      
      // Upgrade weapon
      weapon.upgradeWeapon(WeaponType.MISSILE);
      
      // Current ammo should remain the same, but max should increase
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(10);
      expect(weapon.getMaxAmmo(WeaponType.MISSILE)).toBe(25);
    });
  });

  describe('Weapon State Management', () => {
    it('should maintain separate ammunition counts for different weapons', () => {
      // Use missile ammo
      weapon.switchWeapon(WeaponType.MISSILE);
      weapon.fire();
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(19);
      
      // Use special ammo
      weapon.switchWeapon(WeaponType.SPECIAL);
      weapon.fire();
      expect(weapon.getAmmo(WeaponType.SPECIAL)).toBe(2);
      
      // Missile ammo should be unchanged
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(19);
    });

    it('should reset all weapon states correctly', () => {
      // Modify weapon states
      weapon.switchWeapon(WeaponType.MISSILE);
      (weapon as any).lastFireTimes.set(WeaponType.MISSILE, Date.now() - 1000);
      weapon.fire();
      (weapon as any).lastFireTimes.set(WeaponType.MISSILE, Date.now() - 1000);
      weapon.fire();
      weapon.upgradeWeapon(WeaponType.MISSILE);
      
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(18);
      expect(weapon.getWeaponLevel(WeaponType.MISSILE)).toBe(2);
      
      // Reset
      weapon.reset();
      
      // Should be back to defaults
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(20);
      expect(weapon.getWeaponLevel(WeaponType.MISSILE)).toBe(1);
      expect(weapon.getCurrentWeapon()).toBe(WeaponType.BEAM);
    });
  });

  describe('Edge Cases', () => {
    it('should handle firing with exactly 1 ammo remaining', () => {
      weapon.switchWeapon(WeaponType.MISSILE);
      
      // Set ammo to 1
      const config = weapon.getWeaponConfig(WeaponType.MISSILE)!;
      config.currentAmmo = 1;
      
      expect(weapon.canFire()).toBe(true);
      
      const fired = weapon.fire();
      expect(fired).toBe(true);
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(0);
      
      // Should not be able to fire again
      expect(weapon.canFire()).toBe(false);
    });

    it('should handle ammunition overflow gracefully', () => {
      weapon.switchWeapon(WeaponType.MISSILE);
      
      // Try to add excessive ammunition
      const added = weapon.addAmmo(WeaponType.MISSILE, Number.MAX_SAFE_INTEGER);
      expect(added).toBe(true);
      
      // Should be capped at maximum
      const maxAmmo = weapon.getMaxAmmo(WeaponType.MISSILE)!;
      expect(weapon.getAmmo(WeaponType.MISSILE)).toBe(maxAmmo);
    });

    it('should handle invalid weapon types gracefully', () => {
      const invalidWeapon = 'invalid' as WeaponType;
      
      expect(weapon.getAmmo(invalidWeapon)).toBeUndefined();
      expect(weapon.getMaxAmmo(invalidWeapon)).toBeUndefined();
      expect(weapon.addAmmo(invalidWeapon, 10)).toBe(false);
      expect(weapon.refillAmmo(invalidWeapon)).toBe(false);
    });
  });
});