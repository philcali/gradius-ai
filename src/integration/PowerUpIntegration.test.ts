/**
 * Integration tests for power-up system
 * Tests the complete power-up collection flow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Player } from '../entities/Player';
import { PowerUp, PowerUpType, PowerUpConfig } from '../entities/PowerUp';
import { InputManager } from '../core/InputManager';
import { WeaponType } from '../components/Weapon';
import { SpecialEffectType } from '../components/SpecialEffects';

describe('Power-Up Integration', () => {
  let player: Player;
  let mockInputManager: InputManager;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    // Create mock canvas
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;

    // Create mock input manager
    mockInputManager = new InputManager(mockCanvas);
    vi.spyOn(mockInputManager, 'isKeyPressed').mockReturnValue(false);

    // Create player
    player = new Player(100, 300, 800, 600, mockInputManager);
  });

  describe('Weapon Upgrade Collection', () => {
    it('should upgrade beam weapon when collecting beam upgrade power-up', () => {
      const config: PowerUpConfig = {
        type: PowerUpType.WEAPON_UPGRADE_BEAM,
        value: 2, // 2 levels
        scoreBonus: 200
      };
      const powerUp = new PowerUp(200, 300, config);

      // Get initial weapon level
      const initialLevel = player.getWeapon().getWeaponConfig(WeaponType.BEAM)?.currentLevel || 1;
      const initialScore = player.getScore();

      // Collect power-up
      const collected = player.collectPowerUp(powerUp);

      expect(collected).toBe(true);
      
      // Check weapon was upgraded
      const newLevel = player.getWeapon().getWeaponConfig(WeaponType.BEAM)?.currentLevel || 1;
      expect(newLevel).toBe(initialLevel + 2);

      // Check score was increased
      expect(player.getScore()).toBe(initialScore + 200);
    });

    it('should upgrade missile weapon when collecting missile upgrade power-up', () => {
      const config: PowerUpConfig = {
        type: PowerUpType.WEAPON_UPGRADE_MISSILE,
        value: 1,
        scoreBonus: 100
      };
      const powerUp = new PowerUp(200, 300, config);

      const initialLevel = player.getWeapon().getWeaponConfig(WeaponType.MISSILE)?.currentLevel || 1;
      
      const collected = player.collectPowerUp(powerUp);

      expect(collected).toBe(true);
      
      const newLevel = player.getWeapon().getWeaponConfig(WeaponType.MISSILE)?.currentLevel || 1;
      expect(newLevel).toBe(initialLevel + 1);
    });

    it('should upgrade special weapon when collecting special upgrade power-up', () => {
      const config: PowerUpConfig = {
        type: PowerUpType.WEAPON_UPGRADE_SPECIAL,
        value: 1,
        scoreBonus: 100
      };
      const powerUp = new PowerUp(200, 300, config);

      const initialLevel = player.getWeapon().getWeaponConfig(WeaponType.SPECIAL)?.currentLevel || 1;
      
      const collected = player.collectPowerUp(powerUp);

      expect(collected).toBe(true);
      
      const newLevel = player.getWeapon().getWeaponConfig(WeaponType.SPECIAL)?.currentLevel || 1;
      expect(newLevel).toBe(initialLevel + 1);
    });
  });

  describe('Ammunition Collection', () => {
    it('should add missile ammunition when collecting missile ammo power-up', () => {
      const config: PowerUpConfig = {
        type: PowerUpType.AMMUNITION_MISSILE,
        value: 10,
        scoreBonus: 50
      };
      const powerUp = new PowerUp(200, 300, config);

      const initialAmmo = player.getAmmo(WeaponType.MISSILE) || 0;
      const maxAmmo = player.getMaxAmmo(WeaponType.MISSILE) || 0;
      
      const collected = player.collectPowerUp(powerUp);

      expect(collected).toBe(true);
      
      const newAmmo = player.getAmmo(WeaponType.MISSILE) || 0;
      // Ammo should increase, but may be capped at max ammo
      const expectedAmmo = Math.min(initialAmmo + 10, maxAmmo);
      expect(newAmmo).toBe(expectedAmmo);
    });

    it('should add special ammunition when collecting special ammo power-up', () => {
      const config: PowerUpConfig = {
        type: PowerUpType.AMMUNITION_SPECIAL,
        value: 5,
        scoreBonus: 75
      };
      const powerUp = new PowerUp(200, 300, config);

      const initialAmmo = player.getAmmo(WeaponType.SPECIAL) || 0;
      const maxAmmo = player.getMaxAmmo(WeaponType.SPECIAL) || 0;
      
      const collected = player.collectPowerUp(powerUp);

      expect(collected).toBe(true);
      
      const newAmmo = player.getAmmo(WeaponType.SPECIAL) || 0;
      // Ammo should increase, but may be capped at max ammo
      const expectedAmmo = Math.min(initialAmmo + 5, maxAmmo);
      expect(newAmmo).toBe(expectedAmmo);
    });
  });

  describe('Special Effect Collection', () => {
    it('should upgrade shield effect when collecting shield power-up', () => {
      const config: PowerUpConfig = {
        type: PowerUpType.SPECIAL_EFFECT_SHIELD,
        value: 1,
        scoreBonus: 150,
        duration: 5000
      };
      const powerUp = new PowerUp(200, 300, config);

      const collected = player.collectPowerUp(powerUp);

      expect(collected).toBe(true);
      
      // Check that shield effect was upgraded or uses were added
      const specialEffects = player.getSpecialEffects();
      const shieldUses = specialEffects.getRemainingUses(SpecialEffectType.SHIELD);
      expect(shieldUses).toBeGreaterThan(0);
    });

    it('should upgrade tractor beam effect when collecting tractor power-up', () => {
      const config: PowerUpConfig = {
        type: PowerUpType.SPECIAL_EFFECT_TRACTOR,
        value: 1,
        scoreBonus: 150,
        duration: 5000
      };
      const powerUp = new PowerUp(200, 300, config);

      const collected = player.collectPowerUp(powerUp);

      expect(collected).toBe(true);
      
      const specialEffects = player.getSpecialEffects();
      const tractorUses = specialEffects.getRemainingUses(SpecialEffectType.TRACTOR_BEAM);
      expect(tractorUses).toBeGreaterThan(0);
    });

    it('should upgrade screen clear effect when collecting clear power-up', () => {
      const config: PowerUpConfig = {
        type: PowerUpType.SPECIAL_EFFECT_CLEAR,
        value: 1,
        scoreBonus: 150,
        duration: 5000
      };
      const powerUp = new PowerUp(200, 300, config);

      const collected = player.collectPowerUp(powerUp);

      expect(collected).toBe(true);
      
      const specialEffects = player.getSpecialEffects();
      const clearUses = specialEffects.getRemainingUses(SpecialEffectType.SCREEN_CLEAR);
      expect(clearUses).toBeGreaterThan(0);
    });
  });

  describe('Score Multiplier Collection', () => {
    it('should handle score multiplier power-up collection', () => {
      const config: PowerUpConfig = {
        type: PowerUpType.SCORE_MULTIPLIER,
        value: 2,
        scoreBonus: 200,
        duration: 10000
      };
      const powerUp = new PowerUp(200, 300, config);

      const initialScore = player.getScore();
      
      const collected = player.collectPowerUp(powerUp);

      expect(collected).toBe(true);
      expect(player.getScore()).toBe(initialScore + 200);
    });
  });

  describe('Power-Up Collection Callback', () => {
    it('should call collection callback when power-up is collected', () => {
      const mockCallback = vi.fn();
      player.setPowerUpCollectionCallback(mockCallback);

      const config: PowerUpConfig = {
        type: PowerUpType.WEAPON_UPGRADE_BEAM,
        value: 1,
        scoreBonus: 100
      };
      const powerUp = new PowerUp(200, 300, config);

      player.collectPowerUp(powerUp);

      expect(mockCallback).toHaveBeenCalledWith(powerUp, player);
    });
  });

  describe('Score Management', () => {
    it('should track score correctly across multiple power-up collections', () => {
      const powerUp1 = new PowerUp(200, 300, {
        type: PowerUpType.WEAPON_UPGRADE_BEAM,
        value: 1,
        scoreBonus: 100
      });

      const powerUp2 = new PowerUp(250, 300, {
        type: PowerUpType.AMMUNITION_MISSILE,
        value: 10,
        scoreBonus: 50
      });

      const powerUp3 = new PowerUp(300, 300, {
        type: PowerUpType.SCORE_MULTIPLIER,
        value: 2,
        scoreBonus: 200
      });

      expect(player.getScore()).toBe(0);

      player.collectPowerUp(powerUp1);
      expect(player.getScore()).toBe(100);

      player.collectPowerUp(powerUp2);
      expect(player.getScore()).toBe(150);

      player.collectPowerUp(powerUp3);
      expect(player.getScore()).toBe(350);
    });

    it('should allow manual score manipulation', () => {
      expect(player.getScore()).toBe(0);

      player.addScore(500);
      expect(player.getScore()).toBe(500);

      player.addScore(250);
      expect(player.getScore()).toBe(750);

      player.resetScore();
      expect(player.getScore()).toBe(0);
    });
  });
});