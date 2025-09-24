import { Entity as IEntity, Component } from './interfaces';

/**
 * Concrete implementation of the Entity interface
 * Represents a game object that can have multiple components attached
 */
export class Entity implements IEntity {
  public readonly id: string;
  public active: boolean = true;
  public readonly components: Map<string, Component> = new Map();

  constructor(id?: string) {
    this.id = id || this.generateId();
  }

  /**
   * Add a component to this entity
   */
  addComponent<T extends Component>(component: T): void {
    if (this.components.has(component.type)) {
      console.warn(`Entity ${this.id} already has component of type ${component.type}`);
      return;
    }
    this.components.set(component.type, component);
  }

  /**
   * Get a component by type
   */
  getComponent<T extends Component>(type: string): T | undefined {
    return this.components.get(type) as T | undefined;
  }

  /**
   * Check if entity has a component of the given type
   */
  hasComponent(type: string): boolean {
    return this.components.has(type);
  }

  /**
   * Remove a component by type
   */
  removeComponent(type: string): boolean {
    const component = this.components.get(type);
    if (component) {
      // Call destroy method if it exists
      if (component.destroy) {
        component.destroy();
      }
      return this.components.delete(type);
    }
    return false;
  }

  /**
   * Mark entity for removal
   */
  destroy(): void {
    this.active = false;
    // Clean up all components
    for (const component of this.components.values()) {
      if (component.destroy) {
        component.destroy();
      }
    }
    this.components.clear();
  }

  /**
   * Update all components that have an update method
   */
  update(deltaTime: number): void {
    if (!this.active) return;
    
    for (const component of this.components.values()) {
      if (component.update) {
        component.update(deltaTime);
      }
    }
  }

  /**
   * Generate a unique ID for this entity
   */
  private generateId(): string {
    return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}