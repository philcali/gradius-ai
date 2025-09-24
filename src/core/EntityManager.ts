import { Entity } from './Entity';

/**
 * EntityManager handles the lifecycle of all entities in the game
 * Provides methods for creating, retrieving, and managing entities
 */
export class EntityManager {
  private entities: Map<string, Entity> = new Map();
  private entitiesToRemove: Set<string> = new Set();

  /**
   * Create a new entity and add it to the manager
   */
  createEntity(id?: string): Entity {
    const entity = new Entity(id);
    this.entities.set(entity.id, entity);
    return entity;
  }

  /**
   * Get an entity by its ID
   */
  getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  /**
   * Get all active entities
   */
  getAllEntities(): Entity[] {
    return Array.from(this.entities.values()).filter(entity => entity.active);
  }

  /**
   * Get all entities that have a specific component type
   */
  getEntitiesWithComponent(componentType: string): Entity[] {
    return this.getAllEntities().filter(entity => entity.hasComponent(componentType));
  }

  /**
   * Get all entities that have all of the specified component types
   */
  getEntitiesWithComponents(componentTypes: string[]): Entity[] {
    return this.getAllEntities().filter(entity => 
      componentTypes.every(type => entity.hasComponent(type))
    );
  }

  /**
   * Remove an entity by ID
   */
  removeEntity(id: string): boolean {
    const entity = this.entities.get(id);
    if (entity) {
      entity.destroy();
      this.entitiesToRemove.add(id);
      return true;
    }
    return false;
  }

  /**
   * Mark an entity for removal (will be removed on next cleanup)
   */
  markForRemoval(entity: Entity): void {
    entity.destroy();
    this.entitiesToRemove.add(entity.id);
  }

  /**
   * Update all active entities
   */
  update(deltaTime: number): void {
    for (const entity of this.entities.values()) {
      if (entity.active) {
        entity.update(deltaTime);
      }
    }
  }

  /**
   * Remove all entities marked for removal
   * Should be called at the end of each frame
   */
  cleanup(): void {
    for (const id of this.entitiesToRemove) {
      this.entities.delete(id);
    }
    this.entitiesToRemove.clear();
  }

  /**
   * Get the total number of entities (including inactive ones)
   */
  getTotalEntityCount(): number {
    return this.entities.size;
  }

  /**
   * Get the number of active entities
   */
  getActiveEntityCount(): number {
    return this.getAllEntities().length;
  }

  /**
   * Clear all entities
   */
  clear(): void {
    for (const entity of this.entities.values()) {
      entity.destroy();
    }
    this.entities.clear();
    this.entitiesToRemove.clear();
  }

  /**
   * Check if an entity exists
   */
  hasEntity(id: string): boolean {
    return this.entities.has(id);
  }
}