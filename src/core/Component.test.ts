import { describe, it, expect } from 'vitest';
import { Component, ComponentTypes } from './Component.js';

// Concrete implementation for testing
class TestComponent extends Component {
  public readonly type = 'test';
  public updateCalled = false;
  public destroyCalled = false;

  update(deltaTime: number): void {
    this.updateCalled = true;
  }

  destroy(): void {
    this.destroyCalled = true;
  }
}

// Minimal implementation for testing
class MinimalComponent extends Component {
  public readonly type = 'minimal';
}

describe('Component', () => {
  describe('TestComponent', () => {
    it('should have correct type', () => {
      const component = new TestComponent();
      expect(component.type).toBe('test');
    });

    it('should call update method when implemented', () => {
      const component = new TestComponent();
      component.update(16.67);
      expect(component.updateCalled).toBe(true);
    });

    it('should call destroy method when implemented', () => {
      const component = new TestComponent();
      component.destroy();
      expect(component.destroyCalled).toBe(true);
    });
  });

  describe('MinimalComponent', () => {
    it('should work without update and destroy methods', () => {
      const component = new MinimalComponent();
      expect(component.type).toBe('minimal');
      expect(component.update).toBeUndefined();
      expect(component.destroy).toBeUndefined();
    });
  });

  describe('ComponentTypes', () => {
    it('should define standard component types', () => {
      expect(ComponentTypes.TRANSFORM).toBe('transform');
      expect(ComponentTypes.SPRITE).toBe('sprite');
      expect(ComponentTypes.COLLIDER).toBe('collider');
      expect(ComponentTypes.HEALTH).toBe('health');
      expect(ComponentTypes.WEAPON).toBe('weapon');
      expect(ComponentTypes.VELOCITY).toBe('velocity');
      expect(ComponentTypes.INPUT).toBe('input');
    });

    it('should have consistent values', () => {
      // Test that the values are what we expect
      const expectedTypes = {
        ANIMATION: 'animation',
        TRANSFORM: 'transform',
        SPRITE: 'sprite',
        COLLIDER: 'collider',
        HEALTH: 'health',
        WEAPON: 'weapon',
        VELOCITY: 'velocity',
        INPUT: 'input',
        PARTICLE_SYSTEM: 'particle_system',
        VISUAL_EFFECTS: 'visual_effects',
        BACKGROUND: 'background',
        SPECIAL_EFFECTS: 'special_effects'
      };
      
      expect(ComponentTypes).toEqual(expectedTypes);
    });
  });
});