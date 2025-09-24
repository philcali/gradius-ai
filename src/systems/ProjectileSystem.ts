/**
 * ProjectileSystem manages the lifecycle of all projectiles in the game
 * Handles projectile updates, cleanup, and collision preparation
 */

import { System, Entity } from '../core/interfaces';
import { ComponentTypes } from '../core/Component';
import { Projectile } from '../entities/Projectile';

export class ProjectileSystem implements System {
  public readonly name = 'ProjectileSystem';
  
  private projectilesToRemove: Set<string> = new Set();

  constructor(_canvasWidth: number, _canvasHeight: number) {
    // Canvas dimensions are stored in individual projectiles
  }

  /**
   * Filter entities that are projectiles (have Transform and Sprite components)
   */
  filter(entity: Entity): boolean {
    return entity.hasComponent(ComponentTypes.TRANSFORM) && 
           entity.hasComponent(ComponentTypes.SPRITE) &&
           entity instanceof Projectile;
  }

  /**
   * Update all projectiles
   */
  update(entities: Entity[], deltaTime: number): void {
    // Clear the removal set from previous frame
    this.projectilesToRemove.clear();

    // Process all projectile entities
    const projectiles = entities.filter(this.filter);
    
    for (const entity of projectiles) {
      const projectile = entity as Projectile;
      
      // Update the projectile
      projectile.update(deltaTime);
      
      // Check if projectile should be removed
      if (!projectile.isAlive()) {
        this.projectilesToRemove.add(projectile.id);
      }
    }
  }

  /**
   * Get projectiles that should be removed this frame
   */
  getProjectilesToRemove(): Set<string> {
    return new Set(this.projectilesToRemove);
  }

  /**
   * Get all active projectiles
   */
  getActiveProjectiles(entities: Entity[]): Projectile[] {
    return entities.filter(this.filter) as Projectile[];
  }

  /**
   * Get projectiles within a specific area (useful for collision detection)
   */
  getProjectilesInArea(
    entities: Entity[], 
    x: number, 
    y: number, 
    width: number, 
    height: number
  ): Projectile[] {
    const projectiles = this.getActiveProjectiles(entities);
    
    return projectiles.filter(projectile => {
      const pos = projectile.getPosition();
      const dims = projectile.getDimensions();
      
      // Simple AABB intersection check
      return (
        pos.x - dims.width / 2 < x + width &&
        pos.x + dims.width / 2 > x &&
        pos.y - dims.height / 2 < y + height &&
        pos.y + dims.height / 2 > y
      );
    });
  }

  /**
   * Count active projectiles
   */
  getProjectileCount(entities: Entity[]): number {
    return entities.filter(this.filter).length;
  }

  /**
   * Update canvas size (call when canvas is resized)
   */
  updateCanvasSize(_width: number, _height: number): void {
    // Canvas dimensions are stored in individual projectiles
    // This method is kept for API compatibility
  }

  /**
   * Clear all projectiles (useful for scene transitions)
   */
  markAllProjectilesForRemoval(entities: Entity[]): void {
    const projectiles = entities.filter(this.filter);
    for (const projectile of projectiles) {
      this.projectilesToRemove.add(projectile.id);
      projectile.destroy();
    }
  }
}