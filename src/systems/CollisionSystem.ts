import { System, Entity, Rectangle } from '../core/interfaces';
import { ComponentTypes } from '../core/Component';
import { Transform } from '../components/Transform';
import { Collider, CollisionEvent } from '../components/Collider';

/**
 * Collision pair for tracking collisions between entities
 */
interface CollisionPair {
  entityA: Entity;
  entityB: Entity;
  colliderA: Collider;
  colliderB: Collider;
}

/**
 * CollisionSystem handles collision detection and response between entities
 * Uses Axis-Aligned Bounding Box (AABB) collision detection
 */
export class CollisionSystem implements System {
  public readonly name = 'CollisionSystem';
  
  /** Previous frame's trigger contacts for tracking enter/exit events */
  private previousTriggerContacts: Map<string, Set<string>>;
  
  /** Debug rendering flag */
  public debugRender: boolean = false;
  
  /** Debug rendering context */
  private debugCtx?: CanvasRenderingContext2D;

  /** Visual effects callback */
  private visualEffectsCallback?: (effectType: string, position: { x: number; y: number }, data?: any) => void;

  constructor() {
    this.previousTriggerContacts = new Map();
  }

  /**
   * Set debug rendering context
   */
  setDebugContext(ctx: CanvasRenderingContext2D): void {
    this.debugCtx = ctx;
  }

  /**
   * Set visual effects callback
   */
  setVisualEffectsCallback(callback: (effectType: string, position: { x: number; y: number }, data?: any) => void): void {
    this.visualEffectsCallback = callback;
  }

  /**
   * Filter entities that have both Transform and Collider components
   */
  filter(entity: Entity): boolean {
    return entity.hasComponent(ComponentTypes.TRANSFORM) && 
           entity.hasComponent(ComponentTypes.COLLIDER);
  }

  /**
   * Update collision detection for all entities
   */
  update(entities: Entity[], _deltaTime: number): void {
    // Filter entities with collision components
    const collidableEntities = entities.filter(this.filter);
    
    // Clear all trigger contacts from previous frame
    this.clearTriggerContacts(collidableEntities);
    
    // Find all collision pairs
    const collisionPairs = this.findCollisionPairs(collidableEntities);
    
    // Process collisions
    this.processCollisions(collisionPairs);
    
    // Process trigger events
    this.processTriggerEvents(collidableEntities);
    
    // Debug rendering
    if (this.debugRender && this.debugCtx) {
      this.renderDebug(collidableEntities);
    }
  }

  /**
   * Find all potential collision pairs between entities
   */
  private findCollisionPairs(entities: Entity[]): CollisionPair[] {
    const pairs: CollisionPair[] = [];
    
    // Check all entity pairs for collisions
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entityA = entities[i];
        const entityB = entities[j];
        
        const colliderA = entityA.getComponent<Collider>(ComponentTypes.COLLIDER)!;
        const colliderB = entityB.getComponent<Collider>(ComponentTypes.COLLIDER)!;
        
        // Skip if either collider is disabled
        if (!colliderA.enabled || !colliderB.enabled) {
          continue;
        }
        
        // Skip if colliders can't collide with each other (both directions must be checked)
        if (!colliderA.canCollideWith(colliderB.layer) && !colliderB.canCollideWith(colliderA.layer)) {
          continue;
        }
        
        // Check for collision
        if (this.checkAABBCollision(entityA, entityB)) {
          pairs.push({
            entityA,
            entityB,
            colliderA,
            colliderB
          });
        }
      }
    }
    
    return pairs;
  }

  /**
   * Check AABB collision between two entities
   */
  private checkAABBCollision(entityA: Entity, entityB: Entity): boolean {
    const transformA = entityA.getComponent<Transform>(ComponentTypes.TRANSFORM)!;
    const transformB = entityB.getComponent<Transform>(ComponentTypes.TRANSFORM)!;
    const colliderA = entityA.getComponent<Collider>(ComponentTypes.COLLIDER)!;
    const colliderB = entityB.getComponent<Collider>(ComponentTypes.COLLIDER)!;
    
    const boundsA = colliderA.getWorldBounds(transformA.position.x, transformA.position.y);
    const boundsB = colliderB.getWorldBounds(transformB.position.x, transformB.position.y);
    
    return this.rectanglesIntersect(boundsA, boundsB);
  }

  /**
   * Check if two rectangles intersect
   */
  private rectanglesIntersect(rectA: Rectangle, rectB: Rectangle): boolean {
    return rectA.x < rectB.x + rectB.width &&
           rectA.x + rectA.width > rectB.x &&
           rectA.y < rectB.y + rectB.height &&
           rectA.y + rectA.height > rectB.y;
  }

  /**
   * Calculate intersection rectangle between two rectangles
   */
  private getIntersection(rectA: Rectangle, rectB: Rectangle): Rectangle {
    const left = Math.max(rectA.x, rectB.x);
    const right = Math.min(rectA.x + rectA.width, rectB.x + rectB.width);
    const top = Math.max(rectA.y, rectB.y);
    const bottom = Math.min(rectA.y + rectA.height, rectB.y + rectB.height);
    
    return {
      x: left,
      y: top,
      width: Math.max(0, right - left),
      height: Math.max(0, bottom - top)
    };
  }

  /**
   * Process all collision pairs
   */
  private processCollisions(pairs: CollisionPair[]): void {
    for (const pair of pairs) {
      const { entityA, entityB, colliderA, colliderB } = pair;
      
      // Get transforms for intersection calculation
      const transformA = entityA.getComponent<Transform>(ComponentTypes.TRANSFORM)!;
      const transformB = entityB.getComponent<Transform>(ComponentTypes.TRANSFORM)!;
      
      const boundsA = colliderA.getWorldBounds(transformA.position.x, transformA.position.y);
      const boundsB = colliderB.getWorldBounds(transformB.position.x, transformB.position.y);
      const intersection = this.getIntersection(boundsA, boundsB);
      
      // Handle trigger collisions
      if (colliderA.isTrigger || colliderB.isTrigger) {
        this.handleTriggerCollision(entityA, entityB, colliderA, colliderB, intersection);
      } else {
        // Handle solid collisions
        this.handleSolidCollision(entityA, entityB, colliderA, colliderB, intersection);
      }
    }
  }

  /**
   * Handle trigger collision (no physical response)
   */
  private handleTriggerCollision(
    entityA: Entity,
    entityB: Entity,
    colliderA: Collider,
    colliderB: Collider,
    intersection: Rectangle
  ): void {
    // Add to trigger contacts
    if (colliderA.isTrigger) {
      colliderA.addTriggerContact(entityB.id);
    }
    if (colliderB.isTrigger) {
      colliderB.addTriggerContact(entityA.id);
    }
    
    // Call trigger callbacks if they exist
    if (colliderA.isTrigger && colliderA.onCollision) {
      const event: CollisionEvent = {
        otherEntityId: entityB.id,
        otherCollider: colliderB,
        intersection
      };
      colliderA.onCollision(event);
    }
    
    if (colliderB.isTrigger && colliderB.onCollision) {
      const event: CollisionEvent = {
        otherEntityId: entityA.id,
        otherCollider: colliderA,
        intersection
      };
      colliderB.onCollision(event);
    }
  }

  /**
   * Handle solid collision (with physical response)
   */
  private handleSolidCollision(
    entityA: Entity,
    entityB: Entity,
    colliderA: Collider,
    colliderB: Collider,
    intersection: Rectangle
  ): void {
    // Call collision callbacks
    if (colliderA.onCollision) {
      const event: CollisionEvent = {
        otherEntityId: entityB.id,
        otherCollider: colliderB,
        intersection
      };
      colliderA.onCollision(event);
    }
    
    if (colliderB.onCollision) {
      const event: CollisionEvent = {
        otherEntityId: entityA.id,
        otherCollider: colliderA,
        intersection
      };
      colliderB.onCollision(event);
    }

    // Create visual effects for collisions
    if (this.visualEffectsCallback) {
      const impactPosition = {
        x: intersection.x + intersection.width / 2,
        y: intersection.y + intersection.height / 2
      };
      
      // Create impact effect for solid collisions
      this.visualEffectsCallback('impact', impactPosition);
    }
  }

  /**
   * Process trigger enter/exit events
   */
  private processTriggerEvents(entities: Entity[]): void {
    // Clear all trigger contacts first, they will be repopulated during collision detection
    for (const entity of entities) {
      const collider = entity.getComponent<Collider>(ComponentTypes.COLLIDER)!;
      if (collider?.isTrigger === true) {
        const previousContacts = this.previousTriggerContacts.get(entity.id) || new Set();
        const currentContacts = new Set(collider.getTriggerContacts());
        
        // Find new contacts (trigger enter)
        for (const contactId of currentContacts) {
          if (!previousContacts.has(contactId)) {
            this.handleTriggerEnter(entity, contactId, entities);
          }
        }
        
        // Find removed contacts (trigger exit)
        for (const contactId of previousContacts) {
          if (!currentContacts.has(contactId)) {
            this.handleTriggerExit(entity, contactId, entities);
          }
        }
        
        // Update previous contacts
        this.previousTriggerContacts.set(entity.id, new Set(currentContacts));
      }
    }
  }

  /**
   * Handle trigger enter event
   */
  private handleTriggerEnter(triggerEntity: Entity, otherEntityId: string, entities: Entity[]): void {
    const collider = triggerEntity.getComponent<Collider>(ComponentTypes.COLLIDER)!;
    const otherEntity = entities.find(e => e.id === otherEntityId);
    
    if (otherEntity && collider.onTriggerEnter) {
      const otherCollider = otherEntity.getComponent<Collider>(ComponentTypes.COLLIDER)!;
      const event: CollisionEvent = {
        otherEntityId,
        otherCollider,
        intersection: { x: 0, y: 0, width: 0, height: 0 } // Placeholder
      };
      collider.onTriggerEnter(event);
    }
  }

  /**
   * Handle trigger exit event
   */
  private handleTriggerExit(triggerEntity: Entity, otherEntityId: string, entities: Entity[]): void {
    const collider = triggerEntity.getComponent<Collider>(ComponentTypes.COLLIDER)!;
    const otherEntity = entities.find(e => e.id === otherEntityId);
    
    if (otherEntity && collider.onTriggerExit) {
      const otherCollider = otherEntity.getComponent<Collider>(ComponentTypes.COLLIDER)!;
      const event: CollisionEvent = {
        otherEntityId,
        otherCollider,
        intersection: { x: 0, y: 0, width: 0, height: 0 } // Placeholder
      };
      collider.onTriggerExit(event);
    }
  }

  /**
   * Render debug information for collision bounds
   */
  private renderDebug(entities: Entity[]): void {
    if (!this.debugCtx) return;
    
    this.debugCtx.save();
    
    for (const entity of entities) {
      const transform = entity.getComponent<Transform>(ComponentTypes.TRANSFORM)!;
      const collider = entity.getComponent<Collider>(ComponentTypes.COLLIDER)!;
      
      if (!collider?.enabled) continue;
      
      const bounds = collider.getWorldBounds(transform.position.x, transform.position.y);
      
      // Choose color based on collider type
      if (collider?.isTrigger) {
        this.debugCtx.strokeStyle = '#00ff00'; // Green for triggers
      } else {
        this.debugCtx.strokeStyle = '#ff0000'; // Red for solid colliders
      }
      
      this.debugCtx.lineWidth = 2;
      this.debugCtx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
      
      // Draw center point
      this.debugCtx.fillStyle = this.debugCtx.strokeStyle;
      this.debugCtx.beginPath();
      this.debugCtx.arc(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2,
        3,
        0,
        Math.PI * 2
      );
      this.debugCtx.fill();
    }
    
    this.debugCtx.restore();
  }

  /**
   * Enable or disable debug rendering
   */
  setDebugRender(enabled: boolean): void {
    this.debugRender = enabled;
  }

  /**
   * Clear trigger contacts for all entities
   */
  private clearTriggerContacts(entities: Entity[]): void {
    for (const entity of entities) {
      const collider = entity.getComponent<Collider>(ComponentTypes.COLLIDER)!;
      if (collider?.isTrigger) {
        collider.clearTriggerContacts();
      }
    }
  }

  /**
   * Clear all collision state (useful for scene transitions)
   */
  clearState(): void {
    this.previousTriggerContacts.clear();
  }
}