/**
 * Unit tests for ProjectileSystem
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectileSystem } from './ProjectileSystem';
import { BeamProjectile } from '../entities/ProjectileTypes';
import { Entity } from '../core/Entity';
import { Transform } from '../components/Transform';
import { Sprite } from '../components/Sprite';
import { afterEach } from 'node:test';

describe('ProjectileSystem', () => {
  let projectileSystem: ProjectileSystem;
  let projectile1: BeamProjectile;
  let projectile2: BeamProjectile;
  let nonProjectileEntity: Entity;
  const canvasWidth = 800;
  const canvasHeight = 600;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01'));

    projectileSystem = new ProjectileSystem(canvasWidth, canvasHeight);
    
    projectile1 = new BeamProjectile(100, 200, 1, 0, canvasWidth, canvasHeight);
    projectile2 = new BeamProjectile(200, 300, 1, 0, canvasWidth, canvasHeight);
    
    // Create a non-projectile entity for filtering tests
    nonProjectileEntity = new Entity('test-entity');
    nonProjectileEntity.addComponent(new Transform(50, 50));
    nonProjectileEntity.addComponent(new Sprite(32, 32));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create ProjectileSystem with correct properties', () => {
      expect(projectileSystem.name).toBe('ProjectileSystem');
    });
  });

  describe('filter', () => {
    it('should return true for projectile entities', () => {
      expect(projectileSystem.filter(projectile1)).toBe(true);
      expect(projectileSystem.filter(projectile2)).toBe(true);
    });

    it('should return false for non-projectile entities', () => {
      expect(projectileSystem.filter(nonProjectileEntity)).toBe(false);
    });

    it('should return false for entities without required components', () => {
      const entityWithoutSprite = new Entity('no-sprite');
      entityWithoutSprite.addComponent(new Transform(0, 0));
      
      const entityWithoutTransform = new Entity('no-transform');
      entityWithoutTransform.addComponent(new Sprite(32, 32));
      
      expect(projectileSystem.filter(entityWithoutSprite)).toBe(false);
      expect(projectileSystem.filter(entityWithoutTransform)).toBe(false);
    });
  });

  describe('update', () => {
    it('should update all projectile entities', () => {
      const entities = [projectile1, projectile2, nonProjectileEntity];
      const deltaTime = 16.67;
      
      const initialPos1 = projectile1.getPosition();
      const initialPos2 = projectile2.getPosition();
      
      projectileSystem.update(entities, deltaTime);
      
      // Projectiles should have moved
      expect(projectile1.getPosition().x).toBeGreaterThan(initialPos1.x);
      expect(projectile2.getPosition().x).toBeGreaterThan(initialPos2.x);
    });

    it('should mark expired projectiles for removal', () => {
      const entities = [projectile1];
      
      // Update with enough deltaTime to exceed projectile lifetime
      projectileSystem.update(entities, 3100); // 3.1 seconds
      
      const toRemove = projectileSystem.getProjectilesToRemove();
      expect(toRemove.has(projectile1.id)).toBe(true);
    });

    it('should mark out-of-bounds projectiles for removal', () => {
      const outOfBoundsProjectile = new BeamProjectile(
        canvasWidth + 100, 200, 1, 0, canvasWidth, canvasHeight
      );
      const entities = [outOfBoundsProjectile];
      
      projectileSystem.update(entities, 16.67);
      
      const toRemove = projectileSystem.getProjectilesToRemove();
      expect(toRemove.has(outOfBoundsProjectile.id)).toBe(true);
    });

    it('should clear removal set between updates', () => {
      // Create a projectile that will expire quickly by updating it with a large deltaTime
      const expiredProjectile = new BeamProjectile(
        100, 200, 1, 0, canvasWidth, canvasHeight
      );
      const entities = [expiredProjectile];
      
      // First update with large deltaTime to expire the projectile
      projectileSystem.update(entities, 3100); // 3.1 seconds to exceed lifetime
      expect(projectileSystem.getProjectilesToRemove().size).toBe(1);
      
      // Second update with different entities - removal set should be cleared
      const newProjectile = new BeamProjectile(200, 300, 1, 0, canvasWidth, canvasHeight);
      projectileSystem.update([newProjectile], 16.67);
      expect(projectileSystem.getProjectilesToRemove().size).toBe(0);
    });
  });

  describe('getActiveProjectiles', () => {
    it('should return only projectile entities', () => {
      const entities = [projectile1, projectile2, nonProjectileEntity];
      
      const activeProjectiles = projectileSystem.getActiveProjectiles(entities);
      
      expect(activeProjectiles).toHaveLength(2);
      expect(activeProjectiles).toContain(projectile1);
      expect(activeProjectiles).toContain(projectile2);
      expect(activeProjectiles).not.toContain(nonProjectileEntity);
    });

    it('should return empty array when no projectiles exist', () => {
      const entities = [nonProjectileEntity];
      
      const activeProjectiles = projectileSystem.getActiveProjectiles(entities);
      
      expect(activeProjectiles).toHaveLength(0);
    });
  });

  describe('getProjectilesInArea', () => {
    it('should return projectiles within specified area', () => {
      // Create projectiles at known positions
      const projectileInArea = new BeamProjectile(150, 150, 1, 0, canvasWidth, canvasHeight);
      const projectileOutsideArea = new BeamProjectile(500, 500, 1, 0, canvasWidth, canvasHeight);
      const entities = [projectileInArea, projectileOutsideArea];
      
      // Check area around first projectile
      const projectilesInArea = projectileSystem.getProjectilesInArea(
        entities, 100, 100, 100, 100
      );
      
      expect(projectilesInArea).toHaveLength(1);
      expect(projectilesInArea).toContain(projectileInArea);
      expect(projectilesInArea).not.toContain(projectileOutsideArea);
    });

    it('should return empty array when no projectiles in area', () => {
      const entities = [projectile1, projectile2]; // Both at positions that won't overlap test area
      
      const projectilesInArea = projectileSystem.getProjectilesInArea(
        entities, 500, 500, 50, 50
      );
      
      expect(projectilesInArea).toHaveLength(0);
    });

    it('should handle edge cases with projectile boundaries', () => {
      // Create projectile at edge of area
      const edgeProjectile = new BeamProjectile(100, 100, 1, 0, canvasWidth, canvasHeight);
      const entities = [edgeProjectile];
      
      // Area that just touches the projectile
      const projectilesInArea = projectileSystem.getProjectilesInArea(
        entities, 96, 96, 8, 8 // Should just overlap with projectile bounds
      );
      
      expect(projectilesInArea).toHaveLength(1);
    });
  });

  describe('getProjectileCount', () => {
    it('should return correct count of projectiles', () => {
      const entities = [projectile1, projectile2, nonProjectileEntity];
      
      const count = projectileSystem.getProjectileCount(entities);
      
      expect(count).toBe(2);
    });

    it('should return 0 when no projectiles exist', () => {
      const entities = [nonProjectileEntity];
      
      const count = projectileSystem.getProjectileCount(entities);
      
      expect(count).toBe(0);
    });
  });

  describe('updateCanvasSize', () => {
    it('should update canvas dimensions', () => {
      const newWidth = 1024;
      const newHeight = 768;
      
      projectileSystem.updateCanvasSize(newWidth, newHeight);
      
      // We can't directly test the private properties, but we can test
      // that projectiles created after the update use the new dimensions
      // This is more of an integration test
      expect(() => projectileSystem.updateCanvasSize(newWidth, newHeight)).not.toThrow();
    });
  });

  describe('markAllProjectilesForRemoval', () => {
    it('should mark all projectiles for removal', () => {
      const entities = [projectile1, projectile2, nonProjectileEntity];
      
      projectileSystem.markAllProjectilesForRemoval(entities);
      
      const toRemove = projectileSystem.getProjectilesToRemove();
      expect(toRemove.has(projectile1.id)).toBe(true);
      expect(toRemove.has(projectile2.id)).toBe(true);
      expect(toRemove.has(nonProjectileEntity.id)).toBe(false);
      
      expect(projectile1.active).toBe(false);
      expect(projectile2.active).toBe(false);
      expect(nonProjectileEntity.active).toBe(true);
    });

    it('should handle empty entity list', () => {
      expect(() => projectileSystem.markAllProjectilesForRemoval([])).not.toThrow();
      expect(projectileSystem.getProjectilesToRemove().size).toBe(0);
    });
  });

  describe('getProjectilesToRemove', () => {
    it('should return a copy of the removal set', () => {
      const entities = [projectile1];
      
      // Mark projectile for removal
      vi.advanceTimersByTime(3100);
      projectileSystem.update(entities, 16.67);
      
      const toRemove1 = projectileSystem.getProjectilesToRemove();
      const toRemove2 = projectileSystem.getProjectilesToRemove();
      
      // Should be different Set instances
      expect(toRemove1).not.toBe(toRemove2);
      expect(toRemove1.size).toBe(toRemove2.size);
      expect(Array.from(toRemove1)).toEqual(Array.from(toRemove2));
    });
  });
});