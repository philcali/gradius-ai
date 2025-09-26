/**
 * Tests for core interfaces and basic entity implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Entity } from './Entity';
import { Component } from './interfaces';

// Mock component for testing
class MockComponent implements Component {
  readonly type = 'mock';
  public updateCalled = false;
  public destroyCalled = false;

  update(deltaTime: number): void {
    this.updateCalled = true;
  }

  destroy(): void {
    this.destroyCalled = true;
  }
}

describe('Entity', () => {
  let entity: Entity;
  let mockComponent: MockComponent;

  beforeEach(() => {
    entity = new Entity('test-entity');
    mockComponent = new MockComponent();
  });

  it('should create entity with correct id', () => {
    expect(entity.id).toBe('test-entity');
    expect(entity.active).toBe(true);
    expect(entity.components.size).toBe(0);
  });

  it('should add and retrieve components', () => {
    entity.addComponent(mockComponent);
    
    expect(entity.hasComponent('mock')).toBe(true);
    expect(entity.getComponent('mock')).toBe(mockComponent);
    expect(entity.components.size).toBe(1);
  });

  it('should remove components', () => {
    entity.addComponent(mockComponent);
    
    const removed = entity.removeComponent('mock');
    
    expect(removed).toBe(true);
    expect(entity.hasComponent('mock')).toBe(false);
    expect(mockComponent.destroyCalled).toBe(true);
  });

  it('should handle non-existent component removal', () => {
    const removed = entity.removeComponent('nonexistent');
    expect(removed).toBe(false);
  });

  it('should destroy entity and clean up components', () => {
    entity.addComponent(mockComponent);
    
    entity.destroy();
    
    expect(entity.active).toBe(false);
    expect(entity.components.size).toBe(0);
    expect(mockComponent.destroyCalled).toBe(true);
  });
});