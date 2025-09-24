/**
 * Projectile entity represents projectiles fired by the player or enemies
 * Handles movement, lifetime, and screen boundary checking
 */

import { Entity } from '../core/Entity';
import { Transform } from '../components/Transform';
import { Sprite } from '../components/Sprite';
import { Collider, CollisionLayers, CollisionMasks, CollisionEvent } from '../components/Collider';

export class Projectile extends Entity {
  private transform: Transform;
  private sprite: Sprite;
  private collider: Collider;
  
  // Projectile properties
  private readonly speed: number;
  private readonly damage: number;
  private readonly lifetime: number; // Maximum lifetime in seconds
  private currentLifetime: number = 0;
  
  // Screen boundaries for cleanup
  private readonly canvasWidth: number;
  private readonly canvasHeight: number;
  
  // Projectile dimensions
  private readonly projectileWidth: number = 8;
  private readonly projectileHeight: number = 4;

  constructor(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    canvasWidth: number,
    canvasHeight: number,
    speed: number = 600,
    damage: number = 1,
    lifetime: number = 3,
    id?: string
  ) {
    super(id);

    this.speed = speed;
    this.damage = damage;
    this.lifetime = lifetime;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // Create and add Transform component
    this.transform = new Transform(x, y, velocityX * speed, velocityY * speed, 0);
    this.addComponent(this.transform);

    // Create and add Sprite component
    this.sprite = new Sprite(this.projectileWidth, this.projectileHeight);
    this.sprite.setLayer(2); // Projectiles should render above most other objects
    this.addComponent(this.sprite);

    // Create and add Collider component
    this.collider = new Collider(
      this.projectileWidth,
      this.projectileHeight,
      0, // Offset X (centered)
      0, // Offset Y (centered)
      CollisionLayers.PROJECTILE,
      CollisionMasks.PLAYER_PROJECTILE
    );
    
    // Set up collision callback
    this.collider.setCollisionCallback((event) => {
      this.handleCollision(event);
    });
    
    this.addComponent(this.collider);

    // Create a simple projectile sprite
    this.createProjectileSprite();
  }

  /**
   * Create a placeholder sprite for the projectile
   */
  private createProjectileSprite(): void {
    const canvas = document.createElement('canvas');
    canvas.width = this.projectileWidth;
    canvas.height = this.projectileHeight;
    const ctx = canvas.getContext('2d');

    // If context is not available (e.g., in test environment), skip drawing
    if (!ctx) {
      this.sprite.image = canvas;
      return;
    }

    // Draw a simple beam projectile (bright blue/white)
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(0, 1, canvas.width, canvas.height - 2);
    
    // Add a bright white core
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(1, 2, canvas.width - 2, 1);

    this.sprite.image = canvas;
  }

  /**
   * Update projectile logic including movement and lifetime
   */
  update(deltaTime: number): void {
    if (!this.active) return;

    // Update lifetime
    this.currentLifetime += deltaTime / 1000; // Convert to seconds
    
    // Check if projectile has exceeded its lifetime
    if (this.currentLifetime >= this.lifetime) {
      this.destroy();
      return;
    }

    // Check screen boundaries and destroy if outside
    if (this.isOutsideScreen()) {
      this.destroy();
      return;
    }

    // Call parent update to update components
    super.update(deltaTime);
  }

  /**
   * Check if projectile is outside screen boundaries
   */
  private isOutsideScreen(): boolean {
    const pos = this.transform.position;
    const halfWidth = this.projectileWidth / 2;
    const halfHeight = this.projectileHeight / 2;

    return (
      pos.x + halfWidth < 0 ||
      pos.x - halfWidth > this.canvasWidth ||
      pos.y + halfHeight < 0 ||
      pos.y - halfHeight > this.canvasHeight
    );
  }

  /**
   * Get the projectile's current position
   */
  getPosition(): { x: number; y: number } {
    return { ...this.transform.position };
  }

  /**
   * Get the projectile's current velocity
   */
  getVelocity(): { x: number; y: number } {
    return { ...this.transform.velocity };
  }

  /**
   * Get the projectile's damage value
   */
  getDamage(): number {
    return this.damage;
  }

  /**
   * Get the projectile's speed
   */
  getSpeed(): number {
    return this.speed;
  }

  /**
   * Get the projectile's dimensions
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.projectileWidth, height: this.projectileHeight };
  }

  /**
   * Get the projectile's remaining lifetime
   */
  getRemainingLifetime(): number {
    return Math.max(0, this.lifetime - this.currentLifetime);
  }

  /**
   * Handle collision with other entities
   */
  private handleCollision(event: CollisionEvent): void {
    console.log(`Projectile ${this.id} hit entity ${event.otherEntityId}`);
    
    // Destroy the projectile when it hits something solid
    // (Triggers would not destroy the projectile)
    if (!event.otherCollider.isTrigger) {
      this.destroy();
    }
  }

  /**
   * Check if the projectile is still alive (within lifetime and screen bounds)
   */
  isAlive(): boolean {
    return this.active && this.currentLifetime < this.lifetime && !this.isOutsideScreen();
  }
}