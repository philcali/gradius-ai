/**
 * Unit tests for Player entity missile weapon integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Player } from './Player';
import { InputManager } from '../core/InputManager';
import { WeaponType } from '../components/Weapon';
import { BaseProjectile } from './ProjectileTypes';

// Mock InputManager
class MockInputManager extends InputManager {
  private pressedKeys: Set<string> = new Set();

  constructor() {
    super(document.createElement('canvas'));
  }

  setKeyPressed(key: string, pressed: boolean): void {
    if (pressed) {
      this.pressedKeys.add(key.toLowerCase());
    } else {
      this.pressedKeys.delete(key.toLowerCase());
    }
  }

  isKeyPressed(key: string): boolean {
    return this.pressedKeys.has(key.toLowerCase());
  }

  clearAllKeys(): void {
    this.pressedKeys.clear();
  }
}

describe('Player Missile Weapon Integration', () => {
  let player: Player;
  let mockInputManager: MockInputManager;
  let projectileCallback: vi.Mock;
  const canvasWidth = 800;
  const canvasHeight = 600;

  beforeEach(() => {
    mockInputManager = new MockInputManager();
    player = new Player(100, 200, canvasWidth, canvasHeight, mockInputManager);
    
    // Mock projectile creation callback
    projectileCallback = vi.fn();
    player.setProjectileCreationCallback(projectileCallback);
  });

  describe('Missile Weapon Firing', () => {
    it('should fire missile when X key is pressed and ammo is available', () => {
      // Ensure missile weapon has ammo
      expect(player.getAmmo(WeaponType.MISSILE)).toBe(20);
      
      // Press X key to fire missile
      mockInputManager.setKeyPressed('keyx', true);
      
      // Update player to process input
      player.update(16.67);
      
      // Should have created a projectile
      expect(projectileCallback).toHaveBeenCalledTimes(1);
      
      // Should have consumed missile ammo
      expect(player.getAmmo(WeaponType.MISSILE)).toBe(19);
    });

    it('should not fire missile when ammo is empty', () => {
      // Drain missile ammo
      const weapon = player.getWeapon();
      const config = weapon.getWeaponConfig(WeaponType.MISSILE)!;
      config.currentAmmo = 0;
      
      // Press X key to fire missile
      mockInputManager.setKeyPressed('keyx', true);
      
      // Update player to process input
      player.update(16.67);
      
      // Should not have created a projectile
      expect(projectileCallback).not.toHaveBeenCalled();
      
      // Ammo should remain at 0
      expect(player.getAmmo(WeaponType.MISSILE)).toBe(0);
    });

    it('should respect missile weapon fire rate', () => {
      // Fire first missile
      mockInputManager.setKeyPressed('keyx', true);
      player.update(16.67);
      
      expect(projectileCallback).toHaveBeenCalledTimes(1);
      expect(player.getAmmo(WeaponType.MISSILE)).toBe(19);
      
      // Try to fire immediately again (should be blocked by cooldown)
      projectileCallback.mockClear();
      player.update(16.67);
      
      expect(projectileCallback).not.toHaveBeenCalled();
      expect(player.getAmmo(WeaponType.MISSILE)).toBe(19); // No additional ammo consumed
    });

    it('should fire current weapon with space key', () => {
      // Switch to missile weapon
      player.getWeapon().switchWeapon(WeaponType.MISSILE);
      
      // Press space to fire current weapon
      mockInputManager.setKeyPressed('space', true);
      player.update(16.67);
      
      // Should have fired missile
      expect(projectileCallback).toHaveBeenCalledTimes(1);
      expect(player.getAmmo(WeaponType.MISSILE)).toBe(19);
    });
  });

  describe('Weapon Switching', () => {
    it('should switch weapons with number keys', () => {
      expect(player.getCurrentWeaponType()).toBe(WeaponType.BEAM);
      
      // Switch to missile weapon with '2' key
      mockInputManager.setKeyPressed('digit2', true);
      player.update(16.67);
      
      expect(player.getCurrentWeaponType()).toBe(WeaponType.MISSILE);
      
      // Switch to special weapon with '3' key
      mockInputManager.clearAllKeys();
      mockInputManager.setKeyPressed('digit3', true);
      player.update(16.67);
      
      expect(player.getCurrentWeaponType()).toBe(WeaponType.SPECIAL);
      
      // Switch back to beam weapon with '1' key
      mockInputManager.clearAllKeys();
      mockInputManager.setKeyPressed('digit1', true);
      player.update(16.67);
      
      expect(player.getCurrentWeaponType()).toBe(WeaponType.BEAM);
    });

    it('should cycle weapons with tab key', () => {
      expect(player.getCurrentWeaponType()).toBe(WeaponType.BEAM);
      
      // Cycle to next weapon
      mockInputManager.setKeyPressed('tab', true);
      player.update(16.67);
      
      expect(player.getCurrentWeaponType()).toBe(WeaponType.MISSILE);
      
      // Cycle to next weapon
      mockInputManager.clearAllKeys();
      mockInputManager.setKeyPressed('tab', true);
      player.update(16.67);
      
      expect(player.getCurrentWeaponType()).toBe(WeaponType.SPECIAL);
      
      // Cycle back to first weapon
      mockInputManager.clearAllKeys();
      mockInputManager.setKeyPressed('tab', true);
      player.update(16.67);
      
      expect(player.getCurrentWeaponType()).toBe(WeaponType.BEAM);
    });
  });

  describe('Projectile Creation', () => {
    it('should create missile projectile with correct properties', () => {
      // Switch to missile weapon and fire
      player.getWeapon().switchWeapon(WeaponType.MISSILE);
      mockInputManager.setKeyPressed('space', true);
      player.update(16.67);
      
      expect(projectileCallback).toHaveBeenCalledTimes(1);
      
      const createdProjectile = projectileCallback.mock.calls[0][0] as BaseProjectile;
      expect(createdProjectile).toBeDefined();
      expect(createdProjectile.getDamage()).toBe(3); // Base missile damage
      
      // Check position (should be at front of ship)
      const projectilePos = createdProjectile.getPosition();
      const playerPos = player.getPosition();
      expect(projectilePos.x).toBeGreaterThan(playerPos.x);
      expect(projectilePos.y).toBe(playerPos.y);
    });

    it('should create upgraded missile projectile when weapon is upgraded', () => {
      // Upgrade missile weapon
      player.upgradeWeapon(WeaponType.MISSILE);
      
      // Switch to missile weapon and fire
      player.getWeapon().switchWeapon(WeaponType.MISSILE);
      mockInputManager.setKeyPressed('space', true);
      player.update(16.67);
      
      expect(projectileCallback).toHaveBeenCalledTimes(1);
      
      const createdProjectile = projectileCallback.mock.calls[0][0] as BaseProjectile;
      expect(createdProjectile.getDamage()).toBeGreaterThan(3); // Should be upgraded damage
    });
  });

  describe('Ammunition Management', () => {
    it('should provide access to ammunition counts', () => {
      expect(player.getAmmo(WeaponType.BEAM)).toBeUndefined(); // Unlimited
      expect(player.getAmmo(WeaponType.MISSILE)).toBe(20);
      expect(player.getAmmo(WeaponType.SPECIAL)).toBe(3);
      
      expect(player.getMaxAmmo(WeaponType.BEAM)).toBeUndefined(); // Unlimited
      expect(player.getMaxAmmo(WeaponType.MISSILE)).toBe(20);
      expect(player.getMaxAmmo(WeaponType.SPECIAL)).toBe(3);
    });

    it('should allow adding ammunition', () => {
      // Use some missile ammo
      player.getWeapon().switchWeapon(WeaponType.MISSILE);
      mockInputManager.setKeyPressed('space', true);
      player.update(16.67);
      
      expect(player.getAmmo(WeaponType.MISSILE)).toBe(19);
      
      // Add ammo (will be capped at max)
      const added = player.addAmmo(WeaponType.MISSILE, 5);
      expect(added).toBe(true);
      expect(player.getAmmo(WeaponType.MISSILE)).toBe(20); // Capped at max ammo
    });

    it('should allow weapon upgrades', () => {
      expect(player.getWeapon().getWeaponLevel(WeaponType.MISSILE)).toBe(1);
      
      const upgraded = player.upgradeWeapon(WeaponType.MISSILE);
      expect(upgraded).toBe(true);
      expect(player.getWeapon().getWeaponLevel(WeaponType.MISSILE)).toBe(2);
      
      // Max ammo should increase with upgrade
      expect(player.getMaxAmmo(WeaponType.MISSILE)).toBe(25);
    });
  });

  describe('Weapon State Queries', () => {
    it('should provide weapon readiness information', () => {
      // Initially should be ready to fire
      expect(player.canFire()).toBe(true);
      expect(player.getTimeUntilReady()).toBe(0);
      
      // Fire weapon
      mockInputManager.setKeyPressed('space', true);
      player.update(16.67);
      
      // Should have cooldown
      expect(player.getTimeUntilReady()).toBeGreaterThan(0);
    });

    it('should track current weapon type', () => {
      expect(player.getCurrentWeaponType()).toBe(WeaponType.BEAM);
      
      player.getWeapon().switchWeapon(WeaponType.MISSILE);
      expect(player.getCurrentWeaponType()).toBe(WeaponType.MISSILE);
    });

    it('should provide access to weapon component', () => {
      const weapon = player.getWeapon();
      expect(weapon).toBeDefined();
      expect(weapon.getCurrentWeapon()).toBe(WeaponType.BEAM);
    });
  });

  describe('Integration with Movement', () => {
    it('should be able to move and fire simultaneously', () => {
      // Press movement and fire keys
      mockInputManager.setKeyPressed('arrowright', true);
      mockInputManager.setKeyPressed('keyx', true);
      
      const initialPos = player.getPosition();
      
      player.update(16.67);
      
      // Should have moved
      const newPos = player.getPosition();
      expect(newPos.x).toBeGreaterThan(initialPos.x);
      
      // Should have fired
      expect(projectileCallback).toHaveBeenCalledTimes(1);
      expect(player.getAmmo(WeaponType.MISSILE)).toBe(19);
    });

    it('should maintain weapon state during movement', () => {
      // Switch to missile weapon
      player.getWeapon().switchWeapon(WeaponType.MISSILE);
      
      // Move around
      mockInputManager.setKeyPressed('arrowup', true);
      player.update(16.67);
      
      mockInputManager.clearAllKeys();
      mockInputManager.setKeyPressed('arrowdown', true);
      player.update(16.67);
      
      // Weapon should still be missile
      expect(player.getCurrentWeaponType()).toBe(WeaponType.MISSILE);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid key presses gracefully', () => {
      // Rapidly press and release fire key
      for (let i = 0; i < 10; i++) {
        mockInputManager.setKeyPressed('keyx', true);
        player.update(1); // Very short update
        mockInputManager.setKeyPressed('keyx', false);
        player.update(1);
      }
      
      // Should only fire once due to cooldown
      expect(projectileCallback).toHaveBeenCalledTimes(1);
      expect(player.getAmmo(WeaponType.MISSILE)).toBe(19);
    });

    it('should handle multiple simultaneous key presses', () => {
      // Press multiple weapon keys simultaneously
      mockInputManager.setKeyPressed('digit1', true);
      mockInputManager.setKeyPressed('digit2', true);
      mockInputManager.setKeyPressed('digit3', true);
      mockInputManager.setKeyPressed('space', true);
      mockInputManager.setKeyPressed('keyx', true);
      
      player.update(16.67);
      
      // Should handle gracefully without errors
      expect(player.getCurrentWeaponType()).toBeDefined();
      expect(projectileCallback).toHaveBeenCalled();
    });
  });
});