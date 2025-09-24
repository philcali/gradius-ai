import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Collider, CollisionLayers, CollisionMasks, CollisionEvent } from './Collider';

describe('Collider', () => {
  let collider: Collider;

  beforeEach(() => {
    collider = new Collider(32, 24, 5, 10, CollisionLayers.PLAYER, CollisionMasks.PLAYER);
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(collider.bounds.width).toBe(32);
      expect(collider.bounds.height).toBe(24);
      expect(collider.offset.x).toBe(5);
      expect(collider.offset.y).toBe(10);
      expect(collider.layer).toBe(CollisionLayers.PLAYER);
      expect(collider.mask).toBe(CollisionMasks.PLAYER);
      expect(collider.isTrigger).toBe(false);
      expect(collider.enabled).toBe(true);
    });

    it('should use default values when not provided', () => {
      const defaultCollider = new Collider(16, 16);
      expect(defaultCollider.offset.x).toBe(0);
      expect(defaultCollider.offset.y).toBe(0);
      expect(defaultCollider.layer).toBe(1);
      expect(defaultCollider.mask).toBe(0xFFFFFFFF);
    });
  });

  describe('getWorldBounds', () => {
    it('should return correct world bounds with offset', () => {
      const bounds = collider.getWorldBounds(100, 200);
      expect(bounds.x).toBe(89); // 84 + 5 (offset)
      expect(bounds.y).toBe(198); // 188 + 10 (offset)
      expect(bounds.width).toBe(32);
      expect(bounds.height).toBe(24);
    });

    it('should handle negative positions', () => {
      const bounds = collider.getWorldBounds(-50, -30);
      expect(bounds.x).toBe(-61); // -66 + 5 (offset)
      expect(bounds.y).toBe(-32); // -42 + 10 (offset)
    });
  });

  describe('canCollideWith', () => {
    it('should return true when mask includes the layer', () => {
      // Player mask includes ENEMY layer
      expect(collider.canCollideWith(CollisionLayers.ENEMY)).toBe(true);
    });

    it('should return false when mask excludes the layer', () => {
      // Player mask excludes PROJECTILE layer (player projectiles don\'t hit player)
      expect(collider.canCollideWith(CollisionLayers.PROJECTILE)).toBe(false);
    });

    it('should handle bitwise operations correctly', () => {
      const customCollider = new Collider(10, 10, 0, 0, 1, 0b1010); // Mask: 10 in binary
      expect(customCollider.canCollideWith(0b0010)).toBe(true);  // 2 & 10 = 2 (non-zero)
      expect(customCollider.canCollideWith(0b1000)).toBe(true);  // 8 & 10 = 8 (non-zero)
      expect(customCollider.canCollideWith(0b0001)).toBe(false); // 1 & 10 = 0
      expect(customCollider.canCollideWith(0b0100)).toBe(false); // 4 & 10 = 0
    });
  });

  describe('collision callbacks', () => {
    it('should set and call collision callback', () => {
      const callback = vi.fn();
      collider.setCollisionCallback(callback);
      expect(collider.onCollision).toBe(callback);
    });

    it('should set and call trigger enter callback', () => {
      const callback = vi.fn();
      collider.setTriggerEnterCallback(callback);
      expect(collider.onTriggerEnter).toBe(callback);
    });

    it('should set and call trigger exit callback', () => {
      const callback = vi.fn();
      collider.setTriggerExitCallback(callback);
      expect(collider.onTriggerExit).toBe(callback);
    });
  });

  describe('trigger contacts', () => {
    it('should manage trigger contacts correctly', () => {
      expect(collider.hasTriggerContact('entity1')).toBe(false);
      
      collider.addTriggerContact('entity1');
      expect(collider.hasTriggerContact('entity1')).toBe(true);
      expect(collider.getTriggerContacts()).toContain('entity1');
      
      collider.addTriggerContact('entity2');
      expect(collider.getTriggerContacts()).toHaveLength(2);
      
      collider.removeTriggerContact('entity1');
      expect(collider.hasTriggerContact('entity1')).toBe(false);
      expect(collider.hasTriggerContact('entity2')).toBe(true);
      
      collider.clearTriggerContacts();
      expect(collider.getTriggerContacts()).toHaveLength(0);
    });
  });

  describe('property setters', () => {
    it('should update size correctly', () => {
      collider.setSize(64, 48);
      expect(collider.bounds.width).toBe(64);
      expect(collider.bounds.height).toBe(48);
    });

    it('should update offset correctly', () => {
      collider.setOffset(-5, -10);
      expect(collider.offset.x).toBe(-5);
      expect(collider.offset.y).toBe(-10);
    });

    it('should update layer correctly', () => {
      collider.setLayer(CollisionLayers.ENEMY);
      expect(collider.layer).toBe(CollisionLayers.ENEMY);
    });

    it('should update mask correctly', () => {
      collider.setMask(CollisionMasks.ENEMY);
      expect(collider.mask).toBe(CollisionMasks.ENEMY);
    });

    it('should update enabled state and clear contacts when disabled', () => {
      collider.addTriggerContact('entity1');
      collider.setEnabled(false);
      expect(collider.enabled).toBe(false);
      expect(collider.getTriggerContacts()).toHaveLength(0);
    });

    it('should update trigger state and clear contacts when set to non-trigger', () => {
      collider.setTrigger(true);
      collider.addTriggerContact('entity1');
      collider.setTrigger(false);
      expect(collider.isTrigger).toBe(false);
      expect(collider.getTriggerContacts()).toHaveLength(0);
    });
  });

  describe('clone', () => {
    it('should create an exact copy of the collider', () => {
      collider.setTrigger(true);
      collider.setEnabled(false);
      const callback = vi.fn();
      collider.setCollisionCallback(callback);

      const clone = collider.clone();

      expect(clone.bounds.width).toBe(collider.bounds.width);
      expect(clone.bounds.height).toBe(collider.bounds.height);
      expect(clone.offset.x).toBe(collider.offset.x);
      expect(clone.offset.y).toBe(collider.offset.y);
      expect(clone.layer).toBe(collider.layer);
      expect(clone.mask).toBe(collider.mask);
      expect(clone.isTrigger).toBe(collider.isTrigger);
      expect(clone.enabled).toBe(collider.enabled);
      expect(clone.onCollision).toBe(collider.onCollision);
    });

    it('should create independent instances', () => {
      const clone = collider.clone();
      clone.setSize(100, 100);
      
      expect(collider.bounds.width).toBe(32); // Original unchanged
      expect(clone.bounds.width).toBe(100);   // Clone changed
    });
  });
});

describe('CollisionLayers', () => {
  it('should have unique bit values', () => {
    const layers = Object.values(CollisionLayers);
    const uniqueLayers = new Set(layers);
    expect(uniqueLayers.size).toBe(layers.length);
  });

  it('should use power-of-2 values for bitwise operations', () => {
    expect(CollisionLayers.PLAYER).toBe(1);
    expect(CollisionLayers.ENEMY).toBe(2);
    expect(CollisionLayers.PROJECTILE).toBe(4);
    expect(CollisionLayers.OBSTACLE).toBe(8);
    expect(CollisionLayers.POWERUP).toBe(16);
    expect(CollisionLayers.BOUNDARY).toBe(32);
  });
});

describe('CollisionMasks', () => {
  it('should define appropriate collision relationships', () => {
    // Player should collide with enemies, obstacles, powerups, and boundaries
    expect(CollisionMasks.PLAYER & CollisionLayers.ENEMY).toBeGreaterThan(0);
    expect(CollisionMasks.PLAYER & CollisionLayers.OBSTACLE).toBeGreaterThan(0);
    expect(CollisionMasks.PLAYER & CollisionLayers.POWERUP).toBeGreaterThan(0);
    expect(CollisionMasks.PLAYER & CollisionLayers.BOUNDARY).toBeGreaterThan(0);
    
    // Player should NOT collide with other players (not in mask)
    expect(CollisionMasks.PLAYER & CollisionLayers.PLAYER).toBe(0);
  });

  it('should define projectile collision relationships correctly', () => {
    // Player projectiles should hit enemies and obstacles but not player
    expect(CollisionMasks.PLAYER_PROJECTILE & CollisionLayers.ENEMY).toBeGreaterThan(0);
    expect(CollisionMasks.PLAYER_PROJECTILE & CollisionLayers.OBSTACLE).toBeGreaterThan(0);
    expect(CollisionMasks.PLAYER_PROJECTILE & CollisionLayers.PLAYER).toBe(0);
    
    // Enemy projectiles should hit player but not enemies
    expect(CollisionMasks.ENEMY_PROJECTILE & CollisionLayers.PLAYER).toBeGreaterThan(0);
    expect(CollisionMasks.ENEMY_PROJECTILE & CollisionLayers.ENEMY).toBe(0);
  });
});