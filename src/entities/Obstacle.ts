/**
 * Obstacle entity represents static or moving obstacles in the game world
 * Obstacles move with the background scrolling and can be destructible or indestructible
 */

import { Entity } from '../core/Entity';
import { Transform } from '../components/Transform';
import { Sprite } from '../components/Sprite';
import { Collider, CollisionLayers, CollisionMasks, CollisionEvent } from '../components/Collider';
import { Health, HealthConfig } from '../components/Health';

export interface ObstacleConfig {
  /** Width of the obstacle */
  width: number;
  /** Height of the obstacle */
  height: number;
  /** Whether the obstacle can be destroyed by projectiles */
  destructible: boolean;
  /** Color tint for the obstacle sprite */
  color?: string;
  /** Health points (only used if destructible) */
  health?: number;
  /** Movement speed relative to background scrolling */
  moveSpeed?: number;
}

export class Obstacle extends Entity {
  private transform: Transform;
  private sprite: Sprite;
  private collider: Collider;
  private health?: Health;

  // Obstacle properties
  private readonly config: ObstacleConfig;

  // Movement properties
  private readonly baseScrollSpeed: number = 80; // Base background scroll speed
  private readonly moveSpeed: number;

  // Visual effects callback
  private visualEffectsCallback?: (effectType: string, position: { x: number; y: number }, data?: any) => void;

  constructor(
    x: number,
    y: number,
    _canvasWidth: number,
    _canvasHeight: number,
    config: ObstacleConfig,
    id?: string
  ) {
    super(id);
    this.config = config;
    this.moveSpeed = config.moveSpeed || 0;

    // Create and add Transform component
    this.transform = new Transform(x, y, 0, 0, 0);
    // Set velocity to move with background scrolling
    this.transform.setVelocity(-this.baseScrollSpeed + this.moveSpeed, 0);
    this.addComponent(this.transform);

    // Create and add Sprite component
    this.sprite = new Sprite(config.width, config.height);
    this.sprite.setLayer(0); // Render at same layer as other obstacles
    this.addComponent(this.sprite);

    // Create and add Collider component
    this.collider = new Collider(
      config.width - 2, // Slightly smaller for better gameplay feel
      config.height - 2,
      0, // Centered offset
      0,
      CollisionLayers.OBSTACLE,
      CollisionMasks.OBSTACLE
    );

    // Set up collision callback
    this.collider.setCollisionCallback((event) => {
      this.handleCollision(event);
    });

    this.addComponent(this.collider);

    // Add Health component for destructible obstacles
    if (this.config.destructible) {
      const healthConfig: HealthConfig = {
        maxHealth: config.health || 1,
        invulnerabilityDuration: 0.1 // Brief invulnerability to prevent multiple hits from same projectile
      };
      
      this.health = new Health(healthConfig);
      this.health.setDeathCallback(() => {
        this.onDestroyed();
      });
      
      this.addComponent(this.health);
    }

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

    // Choose color based on obstacle type
    const baseColor = this.config.color || (this.config.destructible ? '#ff6666' : '#666666');
    
    // Draw obstacle shape
    ctx.fillStyle = baseColor;
    
    if (this.config.destructible) {
      // Destructible obstacles - draw as diamond/crystal shape
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 2); // Top
      ctx.lineTo(canvas.width - 2, canvas.height / 2); // Right
      ctx.lineTo(canvas.width / 2, canvas.height - 2); // Bottom
      ctx.lineTo(2, canvas.height / 2); // Left
      ctx.closePath();
      ctx.fill();

      // Add inner highlight
      ctx.fillStyle = this.lightenColor(baseColor, 0.3);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 6);
      ctx.lineTo(canvas.width - 6, canvas.height / 2);
      ctx.lineTo(canvas.width / 2, canvas.height - 6);
      ctx.lineTo(6, canvas.height / 2);
      ctx.closePath();
      ctx.fill();
    } else {
      // Indestructible obstacles - draw as solid rectangle with metallic look
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add metallic gradient effect
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, this.lightenColor(baseColor, 0.4));
      gradient.addColorStop(0.5, baseColor);
      gradient.addColorStop(1, this.darkenColor(baseColor, 0.3));
      
      ctx.fillStyle = gradient;
      ctx.fillRect(2, 2, canvas.width - 4, canvas.height - 4);

      // Add border lines
      ctx.strokeStyle = this.lightenColor(baseColor, 0.6);
      ctx.lineWidth = 1;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    }

    // Add health indicator for destructible obstacles
    if (this.config.destructible && this.health && this.health.getMaxHealth() > 1) {
      this.addHealthBar(ctx, canvas.width, canvas.height);
    }

    this.sprite.image = canvas;
  }

  /**
   * Add a health bar to the sprite
   */
  private addHealthBar(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const barWidth = width - 4;
    const barHeight = 3;
    const barX = 2;
    const barY = height - barHeight - 2;

    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health bar
    const healthPercent = this.health ? this.health.getHealthPercentage() : 0;
    const healthWidth = barWidth * healthPercent;
    
    if (healthPercent > 0.6) {
      ctx.fillStyle = '#00ff00';
    } else if (healthPercent > 0.3) {
      ctx.fillStyle = '#ffff00';
    } else {
      ctx.fillStyle = '#ff0000';
    }
    
    ctx.fillRect(barX, barY, healthWidth, barHeight);
  }

  /**
   * Update obstacle logic
   */
  update(deltaTime: number): void {
    if (!this.active) return;

    // Check if obstacle has moved off screen
    if (this.transform.position.x + this.config.width < 0) {
      this.destroy();
      return;
    }

    // Update sprite if health changed (for destructible obstacles)
    if (this.config.destructible && this.health && this.health.getMaxHealth() > 1) {
      this.updateHealthDisplay();
    }

    // Call parent update to update components
    super.update(deltaTime);
  }

  /**
   * Handle collision with other entities
   */
  private handleCollision(event: CollisionEvent): void {
    // Check if collision is with a projectile
    if (event.otherCollider.layer === CollisionLayers.PROJECTILE) {
      this.handleProjectileCollision(event.otherEntityId);
    }
  }

  /**
   * Handle collision with projectiles
   */
  private handleProjectileCollision(projectileId: string): void {
    if (!this.config.destructible || !this.health) {
      return; // Indestructible obstacles don't take damage
    }

    // Deal damage to the obstacle
    const damage = 1; // Default projectile damage - could be passed from projectile entity
    const wasDestroyed = this.health.takeDamage(damage, projectileId);

    if (wasDestroyed) {
      console.log(`Obstacle ${this.id} was destroyed by projectile ${projectileId}`);
    } else {
      // Update sprite to show damage
      this.updateHealthDisplay();
    }
  }

  /**
   * Called when the obstacle is destroyed
   */
  private onDestroyed(): void {
    // Create destruction effect (placeholder for now)
    this.createDestructionEffect();
    
    // Trigger scoring event (will be handled by scoring system)
    this.triggerScoringEvent();
    
    // Mark entity for removal
    this.destroy();
  }

  /**
   * Trigger scoring event for destruction
   */
  private triggerScoringEvent(): void {
    // Dispatch custom event that scoring system can listen to
    const event = new CustomEvent('obstacleDestroyed', {
      detail: { obstacle: this }
    });
    window.dispatchEvent(event);
  }

  /**
   * Take damage (for destructible obstacles)
   */
  takeDamage(damage: number, sourceEntityId?: string): boolean {
    if (!this.config.destructible || !this.health) {
      return false; // Indestructible obstacles don't take damage
    }

    return this.health.takeDamage(damage, sourceEntityId);
  }

  /**
   * Update health display on sprite
   */
  private updateHealthDisplay(): void {
    if (this.config.destructible && this.health) {
      // Recreate sprite with updated health bar
      this.createPlaceholderSprite();
    }
  }

  /**
   * Create destruction effect when obstacle is destroyed
   */
  private createDestructionEffect(): void {
    // Create explosion effect
    if (this.visualEffectsCallback) {
      const explosionPosition = {
        x: this.transform.position.x + this.config.width / 2,
        y: this.transform.position.y + this.config.height / 2
      };
      this.visualEffectsCallback('explosion', explosionPosition, { intensity: 0.8 });
    }
    
    console.log(`Creating destruction effect for obstacle ${this.id}`);
  }

  /**
   * Get current health
   */
  getHealth(): number {
    return this.health?.getCurrentHealth() || 0;
  }

  /**
   * Set visual effects callback
   */
  setVisualEffectsCallback(callback: (effectType: string, position: { x: number; y: number }, data?: any) => void): void {
    this.visualEffectsCallback = callback;
  }

  /**
   * Get maximum health
   */
  getMaxHealth(): number {
    return this.health?.getMaxHealth() || 0;
  }

  /**
   * Check if obstacle is destructible
   */
  isDestructible(): boolean {
    return this.config.destructible;
  }

  /**
   * Get obstacle configuration
   */
  getConfig(): ObstacleConfig {
    return { ...this.config };
  }

  /**
   * Get current position
   */
  getPosition(): { x: number; y: number } {
    return { ...this.transform.position };
  }

  /**
   * Get obstacle dimensions
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.config.width, height: this.config.height };
  }

  /**
   * Utility function to lighten a color
   */
  private lightenColor(color: string, factor: number): string {
    // Simple color lightening - in a real game you'd use a proper color library
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + Math.floor(255 * factor));
      const g = Math.min(255, parseInt(hex.slice(2, 4), 16) + Math.floor(255 * factor));
      const b = Math.min(255, parseInt(hex.slice(4, 6), 16) + Math.floor(255 * factor));
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    return color;
  }

  /**
   * Utility function to darken a color
   */
  private darkenColor(color: string, factor: number): string {
    // Simple color darkening
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = Math.max(0, parseInt(hex.slice(0, 2), 16) - Math.floor(255 * factor));
      const g = Math.max(0, parseInt(hex.slice(2, 4), 16) - Math.floor(255 * factor));
      const b = Math.max(0, parseInt(hex.slice(4, 6), 16) - Math.floor(255 * factor));
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    return color;
  }
}