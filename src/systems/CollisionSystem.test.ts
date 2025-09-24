import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CollisionSystem } from './CollisionSystem';
import { Entity } from '../core/interfaces';
import { Transform } from '../components/Transform';
import { Collider, CollisionLayers, CollisionMasks } from '../components/Collider';
import { ComponentTypes } from '../core/Component';

// Mock Entity implementation for testing
class MockEntity implements Entity {
  public readonly id: string;
  public active: boolean = true;
  public readonly components: Map<string, any> = new Map();

  constructor(id: string) {
    this.id = id;
  }

  addComponent<T>(component: T): void {
    this.components.set((component as any).type, component);
  }

  getComponent<T>(type: string): T | undefined {
    return this.components.get(type) as T | undefined;
  }

  hasComponent(type: string): boolean {
    return this.components.has(type);
  }

  removeComponent(type: string): boolean {
    return this.components.delete(type);
  }

  destroy(): void {
    this.active = false;
    this.components.clear();
  }
}

describe('CollisionSystem', () => {
  let collisionSystem: CollisionSystem;
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    collisionSystem = new CollisionSystem();
    
    // Mock canvas and context for debug rendering
    mockCanvas = document.createElement('canvas');
    mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      strokeRect: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      beginPath: vi.fn(),
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 1
    } as any;
    
    collisionSystem.setDebugContext(mockCtx);
  });

  describe('filter', () => {
    it('should return true for entities with Transform and Collider components', () => {
      const entity = new MockEntity('test');
      entity.addComponent(new Transform());
      entity.addComponent(new Collider(10, 10));

      expect(collisionSystem.filter(entity)).toBe(true);
    });

    it('should return false for entities missing Transform component', () => {
      const entity = new MockEntity('test');
      entity.addComponent(new Collider(10, 10));

      expect(collisionSystem.filter(entity)).toBe(false);
    });

    it('should return false for entities missing Collider component', () => {
      const entity = new MockEntity('test');
      entity.addComponent(new Transform());

      expect(collisionSystem.filter(entity)).toBe(false);
    });

    it('should return false for entities with no components', () => {
      const entity = new MockEntity('test');
      expect(collisionSystem.filter(entity)).toBe(false);
    });
  });

  describe('collision detection', () => {
    let playerEntity: MockEntity;
    let enemyEntity: MockEntity;
    let playerTransform: Transform;
    let enemyTransform: Transform;
    let playerCollider: Collider;
    let enemyCollider: Collider;

    beforeEach(() => {
      // Create player entity
      playerEntity = new MockEntity('player');
      playerTransform = new Transform(100, 100);
      playerCollider = new Collider(32, 32, 0, 0, CollisionLayers.PLAYER, CollisionMasks.PLAYER);
      playerEntity.addComponent(playerTransform);
      playerEntity.addComponent(playerCollider);

      // Create enemy entity
      enemyEntity = new MockEntity('enemy');
      enemyTransform = new Transform(150, 100);
      enemyCollider = new Collider(32, 32, 0, 0, CollisionLayers.ENEMY, CollisionMasks.ENEMY);
      enemyEntity.addComponent(enemyTransform);
      enemyEntity.addComponent(enemyCollider);
    });

    it('should detect collision when entities overlap', () => {
      const collisionCallback = vi.fn();
      playerCollider.setCollisionCallback(collisionCallback);

      // Position entities so they overlap
      enemyTransform.setPosition(110, 110); // Overlapping with player at (100, 100)

      collisionSystem.update([playerEntity, enemyEntity], 16);

      expect(collisionCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          otherEntityId: 'enemy',
          otherCollider: enemyCollider,
          intersection: expect.objectContaining({
            width: expect.any(Number),
            height: expect.any(Number)
          })
        })
      );
    });

    it('should not detect collision when entities do not overlap', () => {
      const collisionCallback = vi.fn();
      playerCollider.setCollisionCallback(collisionCallback);

      // Position entities far apart
      enemyTransform.setPosition(200, 200);

      collisionSystem.update([playerEntity, enemyEntity], 16);

      expect(collisionCallback).not.toHaveBeenCalled();
    });

    it('should not detect collision when colliders are disabled', () => {
      const collisionCallback = vi.fn();
      playerCollider.setCollisionCallback(collisionCallback);
      playerCollider.setEnabled(false);

      // Position entities so they would overlap
      enemyTransform.setPosition(110, 110);

      collisionSystem.update([playerEntity, enemyEntity], 16);

      expect(collisionCallback).not.toHaveBeenCalled();
    });

    it('should not detect collision when layers cannot collide', () => {
      const collisionCallback = vi.fn();
      playerCollider.setCollisionCallback(collisionCallback);

      // Set up layers that don't collide with each other
      playerCollider.setMask(CollisionLayers.POWERUP); // Player only collides with powerups
      playerCollider.setLayer(CollisionLayers.PLAYER); // Player is player layer
      enemyCollider.setMask(CollisionLayers.POWERUP);   // Enemy only collides with powerups
      enemyCollider.setLayer(CollisionLayers.ENEMY);    // Enemy is enemy layer

      // Position entities so they overlap
      enemyTransform.setPosition(110, 110);

      collisionSystem.update([playerEntity, enemyEntity], 16);

      expect(collisionCallback).not.toHaveBeenCalled();
    });

    it('should call collision callbacks for both entities', () => {
      const playerCallback = vi.fn();
      const enemyCallback = vi.fn();
      playerCollider.setCollisionCallback(playerCallback);
      enemyCollider.setCollisionCallback(enemyCallback);

      // Position entities so they overlap
      enemyTransform.setPosition(110, 110);

      collisionSystem.update([playerEntity, enemyEntity], 16);

      expect(playerCallback).toHaveBeenCalledWith(
        expect.objectContaining({ otherEntityId: 'enemy' })
      );
      expect(enemyCallback).toHaveBeenCalledWith(
        expect.objectContaining({ otherEntityId: 'player' })
      );
    });
  });

  describe('trigger system', () => {
    let triggerEntity: MockEntity;
    let otherEntity: MockEntity;
    let triggerTransform: Transform;
    let otherTransform: Transform;
    let triggerCollider: Collider;
    let otherCollider: Collider;

    beforeEach(() => {
      // Create trigger entity
      triggerEntity = new MockEntity('trigger');
      triggerTransform = new Transform(100, 100);
      triggerCollider = new Collider(32, 32, 0, 0, CollisionLayers.POWERUP, CollisionMasks.POWERUP);
      triggerCollider.setTrigger(true);
      triggerEntity.addComponent(triggerTransform);
      triggerEntity.addComponent(triggerCollider);

      // Create other entity
      otherEntity = new MockEntity('other');
      otherTransform = new Transform(150, 100);
      otherCollider = new Collider(32, 32, 0, 0, CollisionLayers.PLAYER, CollisionMasks.PLAYER);
      otherEntity.addComponent(otherTransform);
      otherEntity.addComponent(otherCollider);
    });

    it('should handle trigger collisions differently from solid collisions', () => {
      const triggerCallback = vi.fn();
      triggerCollider.setCollisionCallback(triggerCallback);

      // Position entities so they overlap
      otherTransform.setPosition(110, 110);

      collisionSystem.update([triggerEntity, otherEntity], 16);

      expect(triggerCallback).toHaveBeenCalled();
      expect(triggerCollider.hasTriggerContact('other')).toBe(true);
    });

    it('should track trigger enter events', () => {
      const triggerEnterCallback = vi.fn();
      triggerCollider.setTriggerEnterCallback(triggerEnterCallback);

      // First update - no collision
      collisionSystem.update([triggerEntity, otherEntity], 16);
      expect(triggerEnterCallback).not.toHaveBeenCalled();

      // Second update - entities now overlap (trigger enter)
      otherTransform.setPosition(110, 110);
      collisionSystem.update([triggerEntity, otherEntity], 16);

      expect(triggerEnterCallback).toHaveBeenCalledWith(
        expect.objectContaining({ otherEntityId: 'other' })
      );
    });

    it('should track trigger exit events', () => {
      const triggerExitCallback = vi.fn();
      triggerCollider.setTriggerExitCallback(triggerExitCallback);

      // First update - entities overlap
      otherTransform.setPosition(110, 110);
      collisionSystem.update([triggerEntity, otherEntity], 16);

      // Second update - entities no longer overlap (trigger exit)
      otherTransform.setPosition(200, 200);
      collisionSystem.update([triggerEntity, otherEntity], 16);

      expect(triggerExitCallback).toHaveBeenCalledWith(
        expect.objectContaining({ otherEntityId: 'other' })
      );
    });
  });

  describe('AABB collision detection', () => {
    it('should correctly detect overlapping rectangles', () => {
      const entity1 = new MockEntity('entity1');
      const transform1 = new Transform(0, 0);
      const collider1 = new Collider(20, 20, 0, 0, CollisionLayers.PLAYER, CollisionMasks.PLAYER);
      entity1.addComponent(transform1);
      entity1.addComponent(collider1);

      const entity2 = new MockEntity('entity2');
      const transform2 = new Transform(10, 10);
      const collider2 = new Collider(20, 20, 0, 0, CollisionLayers.ENEMY, CollisionMasks.ENEMY);
      entity2.addComponent(transform2);
      entity2.addComponent(collider2);

      const callback = vi.fn();
      collider1.setCollisionCallback(callback);

      collisionSystem.update([entity1, entity2], 16);

      expect(callback).toHaveBeenCalled();
    });

    it('should not detect collision for adjacent rectangles', () => {
      const entity1 = new MockEntity('entity1');
      const transform1 = new Transform(0, 0);
      const collider1 = new Collider(20, 20, 0, 0, CollisionLayers.PLAYER, CollisionMasks.PLAYER);
      entity1.addComponent(transform1);
      entity1.addComponent(collider1);

      const entity2 = new MockEntity('entity2');
      const transform2 = new Transform(20, 0); // Adjacent, not overlapping
      const collider2 = new Collider(20, 20, 0, 0, CollisionLayers.ENEMY, CollisionMasks.ENEMY);
      entity2.addComponent(transform2);
      entity2.addComponent(collider2);

      const callback = vi.fn();
      collider1.setCollisionCallback(callback);

      collisionSystem.update([entity1, entity2], 16);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle collider offsets correctly', () => {
      const entity1 = new MockEntity('entity1');
      const transform1 = new Transform(0, 0);
      const collider1 = new Collider(10, 10, 5, 5, CollisionLayers.PLAYER, CollisionMasks.PLAYER); // Offset by (5,5)
      entity1.addComponent(transform1);
      entity1.addComponent(collider1);

      const entity2 = new MockEntity('entity2');
      const transform2 = new Transform(10, 10);
      const collider2 = new Collider(10, 10, 0, 0, CollisionLayers.ENEMY, CollisionMasks.ENEMY);
      entity2.addComponent(transform2);
      entity2.addComponent(collider2);

      const callback = vi.fn();
      collider1.setCollisionCallback(callback);

      collisionSystem.update([entity1, entity2], 16);

      // Entity1's collider is at (5,5) to (15,15), Entity2's is at (10,10) to (20,20)
      // They should overlap
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('debug rendering', () => {
    it('should render debug information when enabled', () => {
      collisionSystem.setDebugRender(true);

      const entity = new MockEntity('test');
      entity.addComponent(new Transform(50, 50));
      entity.addComponent(new Collider(20, 20));

      collisionSystem.update([entity], 16);

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.strokeRect).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    it('should not render debug information when disabled', () => {
      collisionSystem.setDebugRender(false);

      const entity = new MockEntity('test');
      entity.addComponent(new Transform(50, 50));
      entity.addComponent(new Collider(20, 20));

      collisionSystem.update([entity], 16);

      expect(mockCtx.strokeRect).not.toHaveBeenCalled();
    });

    it('should use different colors for triggers and solid colliders', () => {
      collisionSystem.setDebugRender(true);

      const solidEntity = new MockEntity('solid');
      solidEntity.addComponent(new Transform(50, 50));
      solidEntity.addComponent(new Collider(20, 20));

      const triggerEntity = new MockEntity('trigger');
      triggerEntity.addComponent(new Transform(100, 100));
      const triggerCollider = new Collider(20, 20);
      triggerCollider.setTrigger(true);
      triggerEntity.addComponent(triggerCollider);

      collisionSystem.update([solidEntity, triggerEntity], 16);

      // Should set different stroke styles for solid vs trigger colliders
      expect(mockCtx.strokeStyle).toBe('#00ff00'); // Last set should be green for trigger
    });
  });

  describe('state management', () => {
    it('should clear all state when clearState is called', () => {
      const triggerEntity = new MockEntity('trigger');
      const triggerTransform = new Transform(100, 100);
      const triggerCollider = new Collider(32, 32);
      triggerCollider.setTrigger(true);
      triggerEntity.addComponent(triggerTransform);
      triggerEntity.addComponent(triggerCollider);

      const otherEntity = new MockEntity('other');
      const otherTransform = new Transform(110, 110);
      const otherCollider = new Collider(32, 32, 0, 0, CollisionLayers.PLAYER, CollisionMasks.PLAYER);
      otherEntity.addComponent(otherTransform);
      otherEntity.addComponent(otherCollider);

      // Create some trigger contacts
      collisionSystem.update([triggerEntity, otherEntity], 16);
      expect(triggerCollider.hasTriggerContact('other')).toBe(true);

      // Clear state
      collisionSystem.clearState();

      // Move entities apart and back together - should trigger enter event again
      otherTransform.setPosition(200, 200);
      collisionSystem.update([triggerEntity, otherEntity], 16);

      const triggerEnterCallback = vi.fn();
      triggerCollider.setTriggerEnterCallback(triggerEnterCallback);

      otherTransform.setPosition(110, 110);
      collisionSystem.update([triggerEntity, otherEntity], 16);

      expect(triggerEnterCallback).toHaveBeenCalled();
    });
  });
});