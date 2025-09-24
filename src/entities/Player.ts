/**
 * Player entity represents the player's spaceship
 * Handles movement, input processing, and screen boundary constraints
 */

import { Entity } from '../core/Entity';
import { Transform } from '../components/Transform';
import { Sprite } from '../components/Sprite';
import { Collider, CollisionLayers, CollisionMasks } from '../components/Collider';
import { InputManager } from '../core/InputManager';
import { Projectile } from './Projectile';

export class Player extends Entity {
  private transform: Transform;
  private sprite: Sprite;
  private collider: Collider;
  private inputManager: InputManager;

  // Movement properties
  private readonly moveSpeed: number = 300; // pixels per second
  private readonly canvasWidth: number;
  private readonly canvasHeight: number;

  // Ship dimensions for boundary checking
  private readonly shipWidth: number = 32;
  private readonly shipHeight: number = 32;

  // Weapon properties
  private readonly fireRate: number = 200; // milliseconds between shots
  private lastFireTime: number = 0;
  private projectileCreationCallback?: (projectile: Projectile) => void;

  constructor(
    x: number,
    y: number,
    canvasWidth: number,
    canvasHeight: number,
    inputManager: InputManager,
    id?: string
  ) {
    super(id);

    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.inputManager = inputManager;

    // Create and add Transform component
    this.transform = new Transform(x, y, 0, 0, 0);
    this.addComponent(this.transform);

    // Create and add Sprite component
    this.sprite = new Sprite(this.shipWidth, this.shipHeight);
    this.sprite.setLayer(1); // Player should render above background
    this.addComponent(this.sprite);

    // Create and add Collider component
    this.collider = new Collider(
      this.shipWidth - 4, // Slightly smaller than sprite for better gameplay
      this.shipHeight - 4,
      0, // Offset X (centered)
      0, // Offset Y (centered)
      CollisionLayers.PLAYER,
      CollisionMasks.PLAYER
    );

    // Set up collision callback
    this.collider.setCollisionCallback((event) => {
      console.log(`Player collided with entity ${event.otherEntityId}`);
      // In a real game, this would handle damage, game over, etc.
    });

    this.addComponent(this.collider);

    // Create a simple rectangle sprite for now (will be replaced with actual sprite later)
    this.createPlaceholderSprite();
  }

  /**
   * Create a placeholder sprite using canvas drawing
   */
  private createPlaceholderSprite(): void {
    const canvas = document.createElement('canvas');
    canvas.width = this.shipWidth;
    canvas.height = this.shipHeight;
    const ctx = canvas.getContext('2d');

    // If context is not available (e.g., in test environment), skip drawing
    if (!ctx) {
      this.sprite.image = canvas;
      return;
    }

    // Draw a simple spaceship shape
    ctx.fillStyle = '#00aaff';

    // Ship body (triangle pointing right)
    ctx.beginPath();
    ctx.moveTo(canvas.width - 2, canvas.height / 2); // Nose
    ctx.lineTo(2, 2); // Top back
    ctx.lineTo(8, canvas.height / 2 - 4); // Top middle
    ctx.lineTo(8, canvas.height / 2 + 4); // Bottom middle
    ctx.lineTo(2, canvas.height - 2); // Bottom back
    ctx.closePath();
    ctx.fill();

    // Engine glow
    ctx.fillStyle = '#ff4400';
    ctx.fillRect(0, canvas.height / 2 - 2, 6, 4);

    this.sprite.image = canvas;
  }

  /**
   * Update player logic including input processing and movement
   */
  update(deltaTime: number): void {
    if (!this.active) return;

    this.processInput(deltaTime);
    this.processWeaponInput(deltaTime);
    this.constrainToBounds();

    // Call parent update to update components
    super.update(deltaTime);
  }

  /**
   * Process keyboard input for player movement
   */
  private processInput(_deltaTime: number): void {
    let vx = 0;
    let vy = 0;

    // Horizontal movement
    if (this.inputManager.isKeyPressed('arrowleft') || this.inputManager.isKeyPressed('keya')) {
      vx = -this.moveSpeed;
    }
    if (this.inputManager.isKeyPressed('arrowright') || this.inputManager.isKeyPressed('keyd')) {
      vx = this.moveSpeed;
    }

    // Vertical movement
    if (this.inputManager.isKeyPressed('arrowup') || this.inputManager.isKeyPressed('keyw')) {
      vy = -this.moveSpeed;
    }
    if (this.inputManager.isKeyPressed('arrowdown') || this.inputManager.isKeyPressed('keys')) {
      vy = this.moveSpeed;
    }

    // Diagonal movement normalization
    if (vx !== 0 && vy !== 0) {
      const normalizer = Math.sqrt(2) / 2; // Approximately 0.707
      vx *= normalizer;
      vy *= normalizer;
    }

    // Set velocity
    this.transform.setVelocity(vx, vy);
  }

  /**
   * Constrain player ship to screen boundaries
   */
  private constrainToBounds(): void {
    const halfWidth = this.shipWidth / 2;
    const halfHeight = this.shipHeight / 2;

    // Horizontal bounds
    if (this.transform.position.x - halfWidth < 0) {
      this.transform.position.x = halfWidth;
      if (this.transform.velocity.x < 0) {
        this.transform.velocity.x = 0;
      }
    } else if (this.transform.position.x + halfWidth > this.canvasWidth) {
      this.transform.position.x = this.canvasWidth - halfWidth;
      if (this.transform.velocity.x > 0) {
        this.transform.velocity.x = 0;
      }
    }

    // Vertical bounds
    if (this.transform.position.y - halfHeight < 0) {
      this.transform.position.y = halfHeight;
      if (this.transform.velocity.y < 0) {
        this.transform.velocity.y = 0;
      }
    } else if (this.transform.position.y + halfHeight > this.canvasHeight) {
      this.transform.position.y = this.canvasHeight - halfHeight;
      if (this.transform.velocity.y > 0) {
        this.transform.velocity.y = 0;
      }
    }
  }

  /**
   * Get the player's current position
   */
  getPosition(): { x: number; y: number } {
    return { ...this.transform.position };
  }

  /**
   * Set the player's position
   */
  setPosition(x: number, y: number): void {
    this.transform.setPosition(x, y);
  }

  /**
   * Get the player's current velocity
   */
  getVelocity(): { x: number; y: number } {
    return { ...this.transform.velocity };
  }

  /**
   * Get the player's movement speed
   */
  getMoveSpeed(): number {
    return this.moveSpeed;
  }

  /**
   * Get the player's ship dimensions
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.shipWidth, height: this.shipHeight };
  }

  /**
   * Check if the player is moving
   */
  isMoving(): boolean {
    return this.transform.velocity.x !== 0 || this.transform.velocity.y !== 0;
  }

  /**
   * Process weapon input for firing projectiles
   */
  private processWeaponInput(_deltaTime: number): void {
    const currentTime = Date.now();

    // Check if primary fire button is pressed and enough time has passed
    if (this.inputManager.isKeyPressed('space') &&
      currentTime - this.lastFireTime >= this.fireRate) {
      this.fireBeamWeapon();
      this.lastFireTime = currentTime;
    }
  }

  /**
   * Fire a beam weapon projectile
   */
  private fireBeamWeapon(): void {
    // Calculate projectile spawn position (front of the ship)
    const spawnX = this.transform.position.x + this.shipWidth / 2;
    const spawnY = this.transform.position.y;

    // Create projectile moving to the right
    const projectile = new Projectile(
      spawnX,
      spawnY,
      1, // Velocity X (normalized, will be multiplied by speed)
      0, // Velocity Y
      this.canvasWidth,
      this.canvasHeight,
      600, // Speed
      1,   // Damage
      3    // Lifetime in seconds
    );

    // Call the callback to add projectile to the game
    if (this.projectileCreationCallback) {
      this.projectileCreationCallback(projectile);
    }
  }

  /**
   * Set the callback function for creating projectiles
   */
  setProjectileCreationCallback(callback: (projectile: Projectile) => void): void {
    this.projectileCreationCallback = callback;
  }

  /**
   * Get the fire rate in milliseconds
   */
  getFireRate(): number {
    return this.fireRate;
  }

  /**
   * Get the time since last shot
   */
  getTimeSinceLastShot(): number {
    return Date.now() - this.lastFireTime;
  }

  /**
   * Check if the player can fire (fire rate cooldown check)
   */
  canFire(): boolean {
    return Date.now() - this.lastFireTime >= this.fireRate;
  }
}