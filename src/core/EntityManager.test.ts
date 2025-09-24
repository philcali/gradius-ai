import { describe, it, expect, beforeEach } from 'vitest';
import { EntityManager } from './EntityManager.js';
import { Entity } from './Entity.js';
import { Component } from './Component.js';

// Mock component for testing
class TestComponent extends Component {
  public readonly type = 'test';
}

class AnotherTestComponent extends Component {
  public readonly type = 'another';
}

describe('EntityManager', () => {
  let entityManager: EntityManager;

  beforeEach(() => {
    entityManager = new EntityManager();
  });

  describe('createEntity', () => {
    it('should create entity with generated ID', () => {
      const entity = entityManager.createEntity();
      
      expect(entity).toBeInstanceOf(Entity);
      expect(entity.id).toBeDefined();
      expect(entity.active).toBe(true);
    });

    it('should create entity with provided ID', () => {
      const entity = entityManager.createEntity('test-entity');
      
      expect(entity.id).toBe('test-entity');
    });

    it('should add entity to internal collection', () => {
      const entity = entityManager.createEntity('test');
      
      expect(entityManager.getEntity('test')).toBe(entity);
      expect(entityManager.getTotalEntityCount()).toBe(1);
    });
  });

  describe('getEntity', () => {
    it('should return entity when it exists', () => {
      const entity = entityManager.createEntity('test');
      
      expect(entityManager.getEntity('test')).toBe(entity);
    });

    it('should return undefined when entity does not exist', () => {
      expect(entityManager.getEntity('nonexistent')).toBeUndefined();
    });
  });

  describe('getAllEntities', () => {
    it('should return empty array when no entities exist', () => {
      expect(entityManager.getAllEntities()).toEqual([]);
    });

    it('should return all active entities', () => {
      const entity1 = entityManager.createEntity('entity1');
      const entity2 = entityManager.createEntity('entity2');
      
      const entities = entityManager.getAllEntities();
      expect(entities).toHaveLength(2);
      expect(entities).toContain(entity1);
      expect(entities).toContain(entity2);
    });

    it('should not return inactive entities', () => {
      const entity1 = entityManager.createEntity('entity1');
      const entity2 = entityManager.createEntity('entity2');
      entity2.active = false;
      
      const entities = entityManager.getAllEntities();
      expect(entities).toHaveLength(1);
      expect(entities).toContain(entity1);
      expect(entities).not.toContain(entity2);
    });
  });

  describe('getEntitiesWithComponent', () => {
    it('should return entities that have the specified component', () => {
      const entity1 = entityManager.createEntity('entity1');
      const entity2 = entityManager.createEntity('entity2');
      const entity3 = entityManager.createEntity('entity3');
      
      entity1.addComponent(new TestComponent());
      entity3.addComponent(new TestComponent());
      
      const entities = entityManager.getEntitiesWithComponent('test');
      expect(entities).toHaveLength(2);
      expect(entities).toContain(entity1);
      expect(entities).toContain(entity3);
      expect(entities).not.toContain(entity2);
    });

    it('should return empty array when no entities have the component', () => {
      entityManager.createEntity('entity1');
      entityManager.createEntity('entity2');
      
      const entities = entityManager.getEntitiesWithComponent('nonexistent');
      expect(entities).toEqual([]);
    });
  });

  describe('getEntitiesWithComponents', () => {
    it('should return entities that have all specified components', () => {
      const entity1 = entityManager.createEntity('entity1');
      const entity2 = entityManager.createEntity('entity2');
      const entity3 = entityManager.createEntity('entity3');
      
      entity1.addComponent(new TestComponent());
      entity1.addComponent(new AnotherTestComponent());
      
      entity2.addComponent(new TestComponent());
      
      entity3.addComponent(new TestComponent());
      entity3.addComponent(new AnotherTestComponent());
      
      const entities = entityManager.getEntitiesWithComponents(['test', 'another']);
      expect(entities).toHaveLength(2);
      expect(entities).toContain(entity1);
      expect(entities).toContain(entity3);
      expect(entities).not.toContain(entity2);
    });

    it('should return empty array when no entities have all components', () => {
      const entity = entityManager.createEntity('entity1');
      entity.addComponent(new TestComponent());
      
      const entities = entityManager.getEntitiesWithComponents(['test', 'nonexistent']);
      expect(entities).toEqual([]);
    });
  });

  describe('removeEntity', () => {
    it('should remove entity and return true when entity exists', () => {
      const entity = entityManager.createEntity('test');
      
      const result = entityManager.removeEntity('test');
      
      expect(result).toBe(true);
      expect(entity.active).toBe(false);
    });

    it('should return false when entity does not exist', () => {
      const result = entityManager.removeEntity('nonexistent');
      expect(result).toBe(false);
    });

    it('should mark entity for removal but not immediately remove it', () => {
      entityManager.createEntity('test');
      
      entityManager.removeEntity('test');
      
      // Entity should still exist until cleanup
      expect(entityManager.hasEntity('test')).toBe(true);
      expect(entityManager.getTotalEntityCount()).toBe(1);
    });
  });

  describe('markForRemoval', () => {
    it('should mark entity for removal', () => {
      const entity = entityManager.createEntity('test');
      
      entityManager.markForRemoval(entity);
      
      expect(entity.active).toBe(false);
    });
  });

  describe('update', () => {
    it('should call update on all active entities', () => {
      const entity1 = entityManager.createEntity('entity1');
      const entity2 = entityManager.createEntity('entity2');
      
      // Mock the update method
      let entity1Updated = false;
      let entity2Updated = false;
      entity1.update = () => { entity1Updated = true; };
      entity2.update = () => { entity2Updated = true; };
      
      entityManager.update(16.67);
      
      expect(entity1Updated).toBe(true);
      expect(entity2Updated).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should remove entities marked for removal', () => {
      const entity = entityManager.createEntity('test');
      
      entityManager.removeEntity('test');
      expect(entityManager.getTotalEntityCount()).toBe(1);
      
      entityManager.cleanup();
      expect(entityManager.getTotalEntityCount()).toBe(0);
      expect(entityManager.hasEntity('test')).toBe(false);
    });
  });

  describe('getTotalEntityCount', () => {
    it('should return total number of entities including inactive ones', () => {
      entityManager.createEntity('entity1');
      const entity2 = entityManager.createEntity('entity2');
      entity2.active = false;
      
      expect(entityManager.getTotalEntityCount()).toBe(2);
    });
  });

  describe('getActiveEntityCount', () => {
    it('should return number of active entities only', () => {
      entityManager.createEntity('entity1');
      const entity2 = entityManager.createEntity('entity2');
      entity2.active = false;
      
      expect(entityManager.getActiveEntityCount()).toBe(1);
    });
  });

  describe('clear', () => {
    it('should remove all entities', () => {
      entityManager.createEntity('entity1');
      entityManager.createEntity('entity2');
      
      entityManager.clear();
      
      expect(entityManager.getTotalEntityCount()).toBe(0);
      expect(entityManager.getAllEntities()).toEqual([]);
    });

    it('should call destroy on all entities', () => {
      const entity1 = entityManager.createEntity('entity1');
      const entity2 = entityManager.createEntity('entity2');
      
      let entity1Destroyed = false;
      let entity2Destroyed = false;
      entity1.destroy = () => { entity1Destroyed = true; };
      entity2.destroy = () => { entity2Destroyed = true; };
      
      entityManager.clear();
      
      expect(entity1Destroyed).toBe(true);
      expect(entity2Destroyed).toBe(true);
    });
  });

  describe('hasEntity', () => {
    it('should return true when entity exists', () => {
      entityManager.createEntity('test');
      expect(entityManager.hasEntity('test')).toBe(true);
    });

    it('should return false when entity does not exist', () => {
      expect(entityManager.hasEntity('nonexistent')).toBe(false);
    });
  });
});