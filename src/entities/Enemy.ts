/**
 * Enemy entity represents hostile entities with basic AI movement patterns
 * Enemies can move in various patterns and potentially fire projectiles
 */

import { Entity } from '../core/Entity';
import { Transform } from '../components/Transform';
import { Sprite } from '../components/Sprite';
import { Collider, CollisionLayers, CollisionMasks } from '../components/Collider';

export enum EnemyMovementPattern {
  STRAIGHT = 'straight',
  SINE_WAVE = 'sine_wave',
  ZIGZAG = 'zigzag',
  CIRCULAR = 'circular'
}

export interface EnemyConfig {
  /** Width of the enemy */
  width: number;
  /** Height of the enemy */
  height: number;
  /** Movement pattern for AI */
  movementPattern: EnemyMovementPattern;
  /** Base movement speed */
  speed: number;
  /** Health points */
  health: number;
  /** Color tint for the enemy sprite */
  color?: string;
  /** Amplitude for wave-based movement patterns */
  amplitude?: number;
  /** Frequency for wave-based movement patterns */
  frequency?: number;
}

export class Enemy extends Entity {
  private transform: Transform;
  private sprite: Sprite;
  private collider: Collider;

  // Enemy properties
  private readonly config: EnemyConfig;
  private readonly canvasHeight: number;
  private health: number;
  private readonly maxHealth: number;

  // Movement properties
  private readonly baseScrollSpeed: number = 80; // Base background scroll speed
  private readonly startY: number; // Initial Y position for pattern calculations
  private readonly startTime: number; // Time when enemy was created
  private movementTime: number = 0; // Time since movement started

  constructor(
    x: number,
    y: number,
    _canvasWidth: number,
    canvasHeight: number,
    config: EnemyConfig,
    id?: string
  ) {
    super(id);

    this.canvasHeight = canvasHeight;
    this.config = config;
    this.health = config.health;
    this.maxHealth = this.health;
    this.startY = y;
    this.startTime = Date.now();

    // Create and add Transform component
    this.transform = new Transform(x, y, 0, 0, 0);
    this.addComponent(this.transform);

    // Create and add Sprite component
    this.sprite = new Sprite(config.width, config.height);
    this.sprite.setLayer(0); // Render at same layer as obstacles
    this.addComponent(this.sprite);

    // Create and add Collider component
    this.collider = new Collider(
      config.width - 2, // Slightly smaller for better gameplay feel
      config.height - 2,
      0, // Centered offset
      0,
      CollisionLayers.ENEMY,
      CollisionMasks.ENEMY
    );

    // Set up collision callback
    this.collider.setCollisionCallback((event) => {
      this.handleCollision(event.otherEntityId);
    });

    this.addComponent(this.collider);

    // Create placeholder sprite
    this.createPlaceholderSprite();
  }

  /**
   * Create a placeholder sprite using canvas drawing
   */
  private createPlaceholderSprite(): void {
    const canvas = document.createElement('canvas');
    canvas.width = this.config.width;
    canvas.height = this.config.height;
    const ctx = canvas.getContext('2d');

    // If context is not available (e.g., in test environment), skip drawing
    if (!ctx) {
      this.sprite.image = canvas;
      return;
    }

    const baseColor = this.config.color || '#ff4444';
    
    // Draw enemy ship shape (triangle pointing left)
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(2, canvas.height / 2); // Nose (pointing left)
    ctx.lineTo(canvas.width - 2, 2); // Top back
    ctx.lineTo(canvas.width - 8, canvas.height / 2 - 4); // Top middle
    ctx.lineTo(canvas.width - 8, canvas.height / 2 + 4); // Bottom middle
    ctx.lineTo(canvas.width - 2, canvas.height - 2); // Bottom back
    ctx.closePath();
    ctx.fill();

    // Add engine glow (right side since enemy moves left)
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(canvas.width - 6, canvas.height / 2 - 2, 4, 4);

    // Add some detail lines
    ctx.strokeStyle = this.lightenColor(baseColor, 0.3);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvas.width - 8, canvas.height / 2 - 2);
    ctx.lineTo(canvas.width - 2, canvas.height / 2 - 2);
    ctx.moveTo(canvas.width - 8, canvas.height / 2 + 2);
    ctx.lineTo(canvas.width - 2, canvas.height / 2 + 2);
    ctx.stroke();

    // Add health indicator if health is low
    if (this.health < this.maxHealth * 0.5) {
      this.addDamageEffect(ctx, canvas.width, canvas.height);
    }

    this.sprite.image = canvas;
  }

  /**
   * Add damage effects to the sprite
   */
  private addDamageEffect(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Add some "sparks" or damage indicators
    ctx.fillStyle = '#ffff00';
    const sparkCount = Math.floor((1 - this.health / this.maxHealth) * 3);
    
    for (let i = 0; i < sparkCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  /**
   * Update enemy logic including AI movement
   */
  update(deltaTime: number): void {
    if (!this.active) return;

    // Update movement time
    this.movementTime += deltaTime;

    // Update AI movement
    this.updateMovement(deltaTime);

    // Check if enemy has moved off screen
    if (this.transform.position.x + this.config.width < 0) {
      this.destroy();
      return;
    }

    // Keep enemy within vertical bounds
    this.constrainVerticalBounds();

    // Call parent update to update components
    super.update(deltaTime);
  }

  /**
   * Update movement based on AI pattern
   */
  private updateMovement(_deltaTime: number): void {
    const timeInSeconds = this.movementTime / 1000;
    let vx = -this.baseScrollSpeed; // Base leftward movement
    let vy = 0;

    switch (this.config.movementPattern) {
      case EnemyMovementPattern.STRAIGHT:
        // Just move straight left with background
        break;

      case EnemyMovementPattern.SINE_WAVE:
        {
          const amplitude = this.config.amplitude || 50;
          const frequency = this.config.frequency || 2;
          const targetY = this.startY + Math.sin(timeInSeconds * frequency) * amplitude;
          vy = (targetY - this.transform.position.y) * 2; // Simple proportional control
        }
        break;

      case EnemyMovementPattern.ZIGZAG:
        {
          const frequency = this.config.frequency || 1.5;
          const zigzag = Math.sin(timeInSeconds * frequency) > 0 ? 1 : -1;
          vy = zigzag * this.config.speed * 0.5;
        }
        break;

      case EnemyMovementPattern.CIRCULAR:
        {
          const radius = this.config.amplitude || 30;
          const frequency = this.config.frequency || 1;
          const angle = timeInSeconds * frequency;
          const targetY = this.startY + Math.sin(angle) * radius;
          const targetX = this.transform.position.x + Math.cos(angle) * radius * 0.1; // Small horizontal variation
          
          vy = (targetY - this.transform.position.y) * 3;
          vx += (targetX - this.transform.position.x) * 0.5;
        }
        break;
    }

    // Apply additional movement speed
    vx -= this.config.speed;

    this.transform.setVelocity(vx, vy);
  }

  /**
   * Keep enemy within vertical screen bounds
   */
  private constrainVerticalBounds(): void {
    const halfHeight = this.config.height / 2;

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
   * Handle collision with other entities
   */
  private handleCollision(otherEntityId: string): void {
    console.log(`Enemy ${this.id} collided with entity ${otherEntityId}`);
    // In a full implementation, this would handle damage from projectiles
  }

  /**
   * Take damage
   */
  takeDamage(damage: number): boolean {
    this.health = Math.max(0, this.health - damage);
    
    if (this.health <= 0) {
      this.destroy();
      return true; // Enemy was destroyed
    }

    // Update sprite to reflect damage
    this.createPlaceholderSprite();
    return false;
  }

  /**
   * Get current health
   */
  getHealth(): number {
    return this.health;
  }

  /**
   * Get maximum health
   */
  getMaxHealth(): number {
    return this.maxHealth;
  }

  /**
   * Get enemy configuration
   */
  getConfig(): EnemyConfig {
    return { ...this.config };
  }

  /**
   * Get current position
   */
  getPosition(): { x: number; y: number } {
    return { ...this.transform.position };
  }

  /**
   * Get enemy dimensions
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.config.width, height: this.config.height };
  }

  /**
   * Get movement pattern
   */
  getMovementPattern(): EnemyMovementPattern {
    return this.config.movementPattern;
  }

  /**
   * Get time since enemy was created
   */
  getAge(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Utility function to lighten a color
   */
  private lightenColor(color: string, factor: number): string {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + Math.floor(255 * factor));
      const g = Math.min(255, parseInt(hex.slice(2, 4), 16) + Math.floor(255 * factor));
      const b = Math.min(255, parseInt(hex.slice(4, 6), 16) + Math.floor(255 * factor));
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    return color;
  }
}