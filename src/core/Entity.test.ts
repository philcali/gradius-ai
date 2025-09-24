import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Entity } from './Entity.js';
import { Component } from './Component.js';

// Mock component for testing
class MockComponent extends Component {
  public readonly type = 'mock';
  public updateCalled = false;
  public destroyCalled = false;

  update(deltaTime: number): void {
    this.updateCalled = true;
  }

  destroy(): void {
    this.destroyCalled = true;
  }
}

// Another mock component for testing multiple components
class AnotherMockComponent extends Component {
  public readonly type = 'another';
}

describe('Entity', () => {
  let entity: Entity;

  beforeEach(() => {
    entity = new Entity();
  });

  describe('constructor', () => {
    it('should create entity with generated ID when no ID provided', () => {
      const entity = new Entity();
      expect(entity.id).toBeDefined();
      expect(entity.id).toMatch(/^entity_\d+_[a-z0-9]+$/);
    });

    it('should create entity with provided ID', () => {
      const entity = new Entity('test-id');
      expect(entity.id).toBe('test-id');
    });

    it('should initialize as active', () => {
      expect(entity.active).toBe(true);
    });

    it('should initialize with empty components map', () => {
      expect(entity.components.size).toBe(0);
    });
  });

  describe('addComponent', () => {
    it('should add component successfully', () => {
      const component = new MockComponent();
      entity.addComponent(component);

      expect(entity.components.size).toBe(1);
      expect(entity.components.get('mock')).toBe(component);
    });

    it('should warn when adding duplicate component type', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const component1 = new MockComponent();
      const component2 = new MockComponent();

      entity.addComponent(component1);
      entity.addComponent(component2);

      expect(consoleSpy).toHaveBeenCalledWith(
        `Entity ${entity.id} already has component of type mock`
      );
      expect(entity.components.size).toBe(1);
      expect(entity.components.get('mock')).toBe(component1);

      consoleSpy.mockRestore();
    });
  });

  describe('getComponent', () => {
    it('should return component when it exists', () => {
      const component = new MockComponent();
      entity.addComponent(component);

      const retrieved = entity.getComponent<MockComponent>('mock');
      expect(retrieved).toBe(component);
    });

    it('should return undefined when component does not exist', () => {
      const retrieved = entity.getComponent<MockComponent>('nonexistent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('hasComponent', () => {
    it('should return true when component exists', () => {
      const component = new MockComponent();
      entity.addComponent(component);

      expect(entity.hasComponent('mock')).toBe(true);
    });

    it('should return false when component does not exist', () => {
      expect(entity.hasComponent('nonexistent')).toBe(false);
    });
  });

  describe('removeComponent', () => {
    it('should remove component and call destroy', () => {
      const component = new MockComponent();
      entity.addComponent(component);

      const result = entity.removeComponent('mock');

      expect(result).toBe(true);
      expect(entity.components.size).toBe(0);
      expect(component.destroyCalled).toBe(true);
    });

    it('should return false when component does not exist', () => {
      const result = entity.removeComponent('nonexistent');
      expect(result).toBe(false);
    });

    it('should handle components without destroy method', () => {
      const component = new AnotherMockComponent();
      entity.addComponent(component);

      const result = entity.removeComponent('another');
      expect(result).toBe(true);
      expect(entity.components.size).toBe(0);
    });
  });

  describe('destroy', () => {
    it('should mark entity as inactive', () => {
      entity.destroy();
      expect(entity.active).toBe(false);
    });

    it('should call destroy on all components', () => {
      const component1 = new MockComponent();
      const component2 = new AnotherMockComponent();
      // Add destroy method to AnotherMockComponent for this test
      component2.destroy = vi.fn();
      
      entity.addComponent(component1);
      entity.addComponent(component2);

      entity.destroy();

      expect(component1.destroyCalled).toBe(true);
      expect(component2.destroy).toHaveBeenCalled();
    });

    it('should clear all components', () => {
      const component = new MockComponent();
      entity.addComponent(component);

      entity.destroy();

      expect(entity.components.size).toBe(0);
    });
  });

  describe('update', () => {
    it('should call update on all components with update method', () => {
      const component1 = new MockComponent();
      const component2 = new AnotherMockComponent(); // no update method
      entity.addComponent(component1);
      entity.addComponent(component2);

      entity.update(16.67);

      expect(component1.updateCalled).toBe(true);
    });

    it('should not update when entity is inactive', () => {
      const component = new MockComponent();
      entity.addComponent(component);
      entity.active = false;

      entity.update(16.67);

      expect(component.updateCalled).toBe(false);
    });
  });
});