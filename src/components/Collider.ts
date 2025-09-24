import { Component, ComponentTypes } from '../core/Component';
import { Rectangle } from '../core/interfaces';

/**
 * Collision event data passed to collision callbacks
 */
export interface CollisionEvent {
  /** The other entity involved in the collision */
  otherEntityId: string;
  /** The other entity's collider component */
  otherCollider: Collider;
  /** The collision bounds that were intersecting */
  intersection: Rectangle;
}

/**
 * Callback function type for collision events
 */
export type CollisionCallback = (event: CollisionEvent) => void;

/**
 * Collider component provides rectangular collision bounds for entities
 * Supports collision layers, callbacks, and offset positioning
 */
export class Collider extends Component {
  public readonly type = ComponentTypes.COLLIDER;

  /** Collision bounds relative to entity position */
  public bounds: Rectangle;
  
  /** Offset from entity position to collision bounds */
  public offset: { x: number; y: number };
  
  /** Collision layer for filtering collisions */
  public layer: number;
  
  /** Collision mask - which layers this collider can collide with */
  public mask: number;
  
  /** Whether this collider is a trigger (doesn't block movement) */
  public isTrigger: boolean;
  
  /** Whether this collider is currently active */
  public enabled: boolean;
  
  /** Callback function called when collision occurs */
  public onCollision?: CollisionCallback;
  
  /** Callback function called when trigger is entered */
  public onTriggerEnter?: CollisionCallback;
  
  /** Callback function called when trigger is exited */
  public onTriggerExit?: CollisionCallback;
  
  /** Set of entity IDs currently in trigger contact */
  private triggerContacts: Set<string>;

  constructor(
    width: number,
    height: number,
    offsetX: number = 0,
    offsetY: number = 0,
    layer: number = 1,
    mask: number = 0xFFFFFFFF
  ) {
    super();
    
    this.bounds = { x: 0, y: 0, width, height };
    this.offset = { x: offsetX, y: offsetY };
    this.layer = layer;
    this.mask = mask;
    this.isTrigger = false;
    this.enabled = true;
    this.triggerContacts = new Set();
  }

  /**
   * Get the world-space collision bounds for this collider
   * @param entityX Entity's world X position
   * @param entityY Entity's world Y position
   * @returns World-space collision rectangle
   */
  getWorldBounds(entityX: number, entityY: number): Rectangle {
    return {
      x: entityX + this.offset.x - (this.bounds.width / 2),
      y: entityY + this.offset.y - (this.bounds.height / 2),
      width: this.bounds.width,
      height: this.bounds.height
    };
  }

  /**
   * Check if this collider can collide with another collider's layer
   */
  canCollideWith(otherLayer: number): boolean {
    return (this.mask & otherLayer) !== 0;
  }

  /**
   * Set collision callback
   */
  setCollisionCallback(callback: CollisionCallback): void {
    this.onCollision = callback;
  }

  /**
   * Set trigger enter callback
   */
  setTriggerEnterCallback(callback: CollisionCallback): void {
    this.onTriggerEnter = callback;
  }

  /**
   * Set trigger exit callback
   */
  setTriggerExitCallback(callback: CollisionCallback): void {
    this.onTriggerExit = callback;
  }

  /**
   * Add entity to trigger contacts
   */
  addTriggerContact(entityId: string): void {
    this.triggerContacts.add(entityId);
  }

  /**
   * Remove entity from trigger contacts
   */
  removeTriggerContact(entityId: string): void {
    this.triggerContacts.delete(entityId);
  }

  /**
   * Check if entity is in trigger contact
   */
  hasTriggerContact(entityId: string): boolean {
    return this.triggerContacts.has(entityId);
  }

  /**
   * Clear all trigger contacts
   */
  clearTriggerContacts(): void {
    this.triggerContacts.clear();
  }

  /**
   * Get all current trigger contacts
   */
  getTriggerContacts(): string[] {
    return Array.from(this.triggerContacts);
  }

  /**
   * Set the collision bounds size
   */
  setSize(width: number, height: number): void {
    this.bounds.width = width;
    this.bounds.height = height;
  }

  /**
   * Set the collision offset from entity position
   */
  setOffset(x: number, y: number): void {
    this.offset.x = x;
    this.offset.y = y;
  }

  /**
   * Set collision layer
   */
  setLayer(layer: number): void {
    this.layer = layer;
  }

  /**
   * Set collision mask
   */
  setMask(mask: number): void {
    this.mask = mask;
  }

  /**
   * Enable or disable this collider
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.clearTriggerContacts();
    }
  }

  /**
   * Set whether this collider is a trigger
   */
  setTrigger(isTrigger: boolean): void {
    this.isTrigger = isTrigger;
    if (!isTrigger) {
      this.clearTriggerContacts();
    }
  }

  /**
   * Clone this collider
   */
  clone(): Collider {
    const clone = new Collider(
      this.bounds.width,
      this.bounds.height,
      this.offset.x,
      this.offset.y,
      this.layer,
      this.mask
    );
    
    clone.isTrigger = this.isTrigger;
    clone.enabled = this.enabled;
    if (this.onCollision) clone.onCollision = this.onCollision;
    if (this.onTriggerEnter) clone.onTriggerEnter = this.onTriggerEnter;
    if (this.onTriggerExit) clone.onTriggerExit = this.onTriggerExit;
    
    return clone;
  }
}

/**
 * Collision layer constants for common collision types
 */
export const CollisionLayers = {
  PLAYER: 1 << 0,      // 1
  ENEMY: 1 << 1,       // 2
  PROJECTILE: 1 << 2,  // 4
  OBSTACLE: 1 << 3,    // 8
  POWERUP: 1 << 4,     // 16
  BOUNDARY: 1 << 5,    // 32
} as const;

/**
 * Common collision masks for different entity types
 */
export const CollisionMasks = {
  PLAYER: CollisionLayers.ENEMY | CollisionLayers.OBSTACLE | CollisionLayers.POWERUP | CollisionLayers.BOUNDARY,
  ENEMY: CollisionLayers.PLAYER | CollisionLayers.PROJECTILE | CollisionLayers.OBSTACLE,
  PLAYER_PROJECTILE: CollisionLayers.ENEMY | CollisionLayers.OBSTACLE | CollisionLayers.BOUNDARY,
  ENEMY_PROJECTILE: CollisionLayers.PLAYER | CollisionLayers.OBSTACLE | CollisionLayers.BOUNDARY,
  OBSTACLE: CollisionLayers.PLAYER | CollisionLayers.ENEMY | CollisionLayers.PROJECTILE,
  POWERUP: CollisionLayers.PLAYER,
  BOUNDARY: CollisionLayers.PLAYER | CollisionLayers.PROJECTILE,
} as const;