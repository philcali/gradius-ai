import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Health, HealthConfig, DamageEvent } from './Health';
import { ComponentTypes } from '../core/Component';

describe('Health Component', () => {
  let health: Health;
  let mockDeathCallback: ReturnType<typeof vi.fn>;
  let mockDamageCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockDeathCallback = vi.fn();
    mockDamageCallback = vi.fn();
  });

  describe('Constructor', () => {
    it('should create health component with basic config', () => {
      const config: HealthConfig = { maxHealth: 100 };
      health = new Health(config);

      expect(health.type).toBe(ComponentTypes.HEALTH);
      expect(health.getCurrentHealth()).toBe(100);
      expect(health.getMaxHealth()).toBe(100);
      expect(health.isAlive()).toBe(true);
      expect(health.isDead()).toBe(false);
      expect(health.isInvulnerable()).toBe(false);
    });

    it('should create health component with custom current health', () => {
      const config: HealthConfig = { maxHealth: 100, currentHealth: 50 };
      health = new Health(config);

      expect(health.getCurrentHealth()).toBe(50);
      expect(health.getMaxHealth()).toBe(100);
      expect(health.getHealthPercentage()).toBe(0.5);
    });

    it('should create invulnerable health component', () => {
      const config: HealthConfig = { 
        maxHealth: 100, 
        invulnerable: true,
        invulnerabilityDuration: 2.0
      };
      health = new Health(config);

      expect(health.isInvulnerable()).toBe(true);
    });

    it('should clamp current health to valid range', () => {
      const config: HealthConfig = { maxHealth: 100, currentHealth: 150 };
      health = new Health(config);

      expect(health.getCurrentHealth()).toBe(100);
    });

    it('should ensure minimum health of 1', () => {
      const config: HealthConfig = { maxHealth: 0 };
      health = new Health(config);

      expect(health.getMaxHealth()).toBe(1);
      expect(health.getCurrentHealth()).toBe(1);
    });
  });

  describe('Damage System', () => {
    beforeEach(() => {
      const config: HealthConfig = { maxHealth: 100 };
      health = new Health(config);
      health.setDeathCallback(mockDeathCallback);
      health.setDamageCallback(mockDamageCallback);
    });

    it('should take damage correctly', () => {
      const wasDestroyed = health.takeDamage(30, 'enemy1');

      expect(health.getCurrentHealth()).toBe(70);
      expect(health.getHealthPercentage()).toBe(0.7);
      expect(wasDestroyed).toBe(false);
      expect(health.isAlive()).toBe(true);
      
      expect(mockDamageCallback).toHaveBeenCalledWith(
        { damage: 30, sourceEntityId: 'enemy1' },
        70
      );
      expect(mockDeathCallback).not.toHaveBeenCalled();
    });

    it('should handle lethal damage', () => {
      const wasDestroyed = health.takeDamage(150, 'enemy1');

      expect(health.getCurrentHealth()).toBe(0);
      expect(health.getHealthPercentage()).toBe(0);
      expect(wasDestroyed).toBe(true);
      expect(health.isDead()).toBe(true);
      expect(health.isAlive()).toBe(false);
      
      expect(mockDamageCallback).toHaveBeenCalledWith(
        { damage: 150, sourceEntityId: 'enemy1' },
        0
      );
      expect(mockDeathCallback).toHaveBeenCalledWith('enemy1');
    });

    it('should ignore damage when invulnerable', () => {
      health.setInvulnerable(true);
      const wasDestroyed = health.takeDamage(50, 'enemy1');

      expect(health.getCurrentHealth()).toBe(100);
      expect(wasDestroyed).toBe(false);
      expect(mockDamageCallback).not.toHaveBeenCalled();
      expect(mockDeathCallback).not.toHaveBeenCalled();
    });

    it('should ignore damage when already dead', () => {
      health.setHealth(0);
      const wasDestroyed = health.takeDamage(50, 'enemy1');

      expect(health.getCurrentHealth()).toBe(0);
      expect(wasDestroyed).toBe(false);
    });

    it('should ignore negative damage', () => {
      const wasDestroyed = health.takeDamage(-10, 'enemy1');

      expect(health.getCurrentHealth()).toBe(100);
      expect(wasDestroyed).toBe(false);
      expect(mockDamageCallback).not.toHaveBeenCalled();
    });

    it('should handle damage with type', () => {
      health.takeDamage(25, 'enemy1', 'fire');

      expect(mockDamageCallback).toHaveBeenCalledWith(
        { damage: 25, sourceEntityId: 'enemy1', damageType: 'fire' },
        75
      );
    });
  });

  describe('Invulnerability Frames', () => {
    beforeEach(() => {
      const config: HealthConfig = { 
        maxHealth: 100, 
        invulnerabilityDuration: 1.0 
      };
      health = new Health(config);
    });

    it('should activate invulnerability frames after taking damage', () => {
      health.takeDamage(10);

      expect(health.isInvulnerable()).toBe(true);
      expect(health.getRemainingInvulnerabilityTime()).toBe(1.0);
    });

    it('should not activate invulnerability frames on death', () => {
      health.takeDamage(100);

      expect(health.isInvulnerable()).toBe(false);
      expect(health.getRemainingInvulnerabilityTime()).toBe(0);
    });

    it('should countdown invulnerability timer', () => {
      health.takeDamage(10);
      health.update(500); // 0.5 seconds

      expect(health.getRemainingInvulnerabilityTime()).toBe(0.5);
      expect(health.isInvulnerable()).toBe(true);
    });

    it('should end invulnerability after timer expires', () => {
      health.takeDamage(10);
      health.update(1000); // 1.0 seconds

      expect(health.getRemainingInvulnerabilityTime()).toBe(0);
      expect(health.isInvulnerable()).toBe(false);
    });

    it('should ignore damage during invulnerability frames', () => {
      health.takeDamage(10);
      const wasDestroyed = health.takeDamage(50);

      expect(health.getCurrentHealth()).toBe(90);
      expect(wasDestroyed).toBe(false);
    });
  });

  describe('Healing System', () => {
    beforeEach(() => {
      const config: HealthConfig = { maxHealth: 100, currentHealth: 50 };
      health = new Health(config);
    });

    it('should heal correctly', () => {
      const actualHeal = health.heal(30);

      expect(health.getCurrentHealth()).toBe(80);
      expect(actualHeal).toBe(30);
    });

    it('should not overheal', () => {
      const actualHeal = health.heal(60);

      expect(health.getCurrentHealth()).toBe(100);
      expect(actualHeal).toBe(50);
    });

    it('should not heal dead entities', () => {
      health.setHealth(0);
      const actualHeal = health.heal(50);

      expect(health.getCurrentHealth()).toBe(0);
      expect(actualHeal).toBe(0);
    });

    it('should ignore negative healing', () => {
      const actualHeal = health.heal(-10);

      expect(health.getCurrentHealth()).toBe(50);
      expect(actualHeal).toBe(0);
    });
  });

  describe('Health Management', () => {
    beforeEach(() => {
      const config: HealthConfig = { maxHealth: 100 };
      health = new Health(config);
      health.setDeathCallback(mockDeathCallback);
    });

    it('should set health directly', () => {
      health.setHealth(75);

      expect(health.getCurrentHealth()).toBe(75);
      expect(mockDeathCallback).not.toHaveBeenCalled();
    });

    it('should trigger death callback when setting health to 0', () => {
      health.setHealth(0);

      expect(health.getCurrentHealth()).toBe(0);
      expect(health.isDead()).toBe(true);
      expect(mockDeathCallback).toHaveBeenCalledWith('direct');
    });

    it('should clamp set health to valid range', () => {
      health.setHealth(150);
      expect(health.getCurrentHealth()).toBe(100);

      health.setHealth(-10);
      expect(health.getCurrentHealth()).toBe(0);
    });

    it('should reset health to maximum', () => {
      health.takeDamage(50);
      health.resetHealth();

      expect(health.getCurrentHealth()).toBe(100);
      expect(health.getRemainingInvulnerabilityTime()).toBe(0);
    });

    it('should update max health and adjust current health', () => {
      health.setMaxHealth(150);
      expect(health.getMaxHealth()).toBe(150);
      expect(health.getCurrentHealth()).toBe(100);

      health.setMaxHealth(50);
      expect(health.getMaxHealth()).toBe(50);
      expect(health.getCurrentHealth()).toBe(50);
    });
  });

  describe('Callback Management', () => {
    beforeEach(() => {
      const config: HealthConfig = { maxHealth: 100 };
      health = new Health(config);
    });

    it('should set and clear death callback', () => {
      health.setDeathCallback(mockDeathCallback);
      health.takeDamage(100);
      expect(mockDeathCallback).toHaveBeenCalled();

      health.resetHealth();
      mockDeathCallback.mockClear();
      
      health.clearDeathCallback();
      health.takeDamage(100);
      expect(mockDeathCallback).not.toHaveBeenCalled();
    });

    it('should set and clear damage callback', () => {
      health.setDamageCallback(mockDamageCallback);
      health.takeDamage(10);
      expect(mockDamageCallback).toHaveBeenCalled();

      mockDamageCallback.mockClear();
      
      health.clearDamageCallback();
      health.takeDamage(10);
      expect(mockDamageCallback).not.toHaveBeenCalled();
    });
  });

  describe('Configuration', () => {
    it('should return configuration copy', () => {
      const config: HealthConfig = { 
        maxHealth: 100, 
        currentHealth: 75,
        invulnerable: true,
        invulnerabilityDuration: 2.0
      };
      health = new Health(config);

      const returnedConfig = health.getConfig();
      
      expect(returnedConfig).toEqual({
        maxHealth: 100,
        currentHealth: 75,
        invulnerable: true,
        invulnerabilityDuration: 2.0
      });

      // Ensure it's a copy, not a reference
      expect(returnedConfig).not.toBe(config);
    });
  });
});