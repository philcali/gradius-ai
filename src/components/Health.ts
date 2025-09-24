/**
 * Health component for entities that can take damage and be destroyed
 * Provides health management, damage handling, and destruction callbacks
 */

import { Component, ComponentTypes } from '../core/Component';

export interface HealthConfig {
  /** Maximum health points */
  maxHealth: number;
  /** Current health points (defaults to maxHealth if not specified) */
  currentHealth?: number;
  /** Whether the entity can be damaged */
  invulnerable?: boolean;
  /** Duration of invulnerability frames after taking damage (in seconds) */
  invulnerabilityDuration?: number;
}

export interface DamageEvent {
  /** Amount of damage dealt */
  damage: number;
  /** ID of the entity that caused the damage */
  sourceEntityId?: string | undefined;
  /** Type of damage (for future expansion) */
  damageType?: string | undefined;
}

export type DeathCallback = (entityId: string) => void;
export type DamageCallback = (event: DamageEvent, remainingHealth: number) => void;

export class Health extends Component {
  public readonly type = ComponentTypes.HEALTH;

  private maxHealth: number;
  private currentHealth: number;
  private invulnerable: boolean;
  private invulnerabilityDuration: number;
  private invulnerabilityTimer: number = 0;

  // Callbacks
  private onDeath?: DeathCallback | undefined;
  private onDamage?: DamageCallback | undefined;

  constructor(config: HealthConfig) {
    super();
    
    this.maxHealth = Math.max(1, config.maxHealth);
    this.currentHealth = config.currentHealth ?? this.maxHealth;
    this.invulnerable = config.invulnerable ?? false;
    this.invulnerabilityDuration = config.invulnerabilityDuration ?? 0;

    // Ensure current health is within valid bounds
    this.currentHealth = Math.max(0, Math.min(this.currentHealth, this.maxHealth));
  }

  /**
   * Update the health component (handles invulnerability timer)
   */
  update(deltaTime: number): void {
    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer -= deltaTime / 1000; // Convert to seconds
      if (this.invulnerabilityTimer <= 0) {
        this.invulnerabilityTimer = 0;
      }
    }
  }

  /**
   * Deal damage to this entity
   * @param damage Amount of damage to deal
   * @param sourceEntityId ID of the entity causing the damage
   * @param damageType Type of damage (optional)
   * @returns true if the entity was destroyed, false otherwise
   */
  takeDamage(damage: number, sourceEntityId?: string, damageType?: string): boolean {
    // Can't take damage if invulnerable or already dead
    if (this.invulnerable || this.currentHealth <= 0 || this.isInvulnerable()) {
      return false;
    }

    const actualDamage = Math.max(0, damage);
    const previousHealth = this.currentHealth;
    
    this.currentHealth = Math.max(0, this.currentHealth - actualDamage);

    // Trigger invulnerability frames if configured
    if (this.invulnerabilityDuration > 0 && this.currentHealth > 0) {
      this.invulnerabilityTimer = this.invulnerabilityDuration;
    }

    // Call damage callback
    if (this.onDamage && actualDamage > 0) {
      const damageEvent: DamageEvent = {
        damage: actualDamage,
        sourceEntityId,
        damageType
      };
      this.onDamage(damageEvent, this.currentHealth);
    }

    // Check if entity was destroyed
    const wasDestroyed = previousHealth > 0 && this.currentHealth <= 0;
    if (wasDestroyed && this.onDeath) {
      this.onDeath(sourceEntityId || 'unknown');
    }

    return wasDestroyed;
  }

  /**
   * Heal the entity
   * @param amount Amount of health to restore
   * @returns Actual amount healed
   */
  heal(amount: number): number {
    if (this.currentHealth <= 0) {
      return 0; // Can't heal dead entities
    }

    const actualHeal = Math.max(0, amount);
    const previousHealth = this.currentHealth;
    
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + actualHeal);
    
    return this.currentHealth - previousHealth;
  }

  /**
   * Set the entity's health to a specific value
   * @param health New health value
   */
  setHealth(health: number): void {
    const previousHealth = this.currentHealth;
    this.currentHealth = Math.max(0, Math.min(health, this.maxHealth));

    // Check if entity was destroyed
    const wasDestroyed = previousHealth > 0 && this.currentHealth <= 0;
    if (wasDestroyed && this.onDeath) {
      this.onDeath('direct');
    }
  }

  /**
   * Get current health
   */
  getCurrentHealth(): number {
    return this.currentHealth;
  }

  /**
   * Get maximum health
   */
  getMaxHealth(): number {
    return this.maxHealth;
  }

  /**
   * Get health as a percentage (0.0 to 1.0)
   */
  getHealthPercentage(): number {
    return this.maxHealth > 0 ? this.currentHealth / this.maxHealth : 0;
  }

  /**
   * Check if the entity is alive
   */
  isAlive(): boolean {
    return this.currentHealth > 0;
  }

  /**
   * Check if the entity is dead
   */
  isDead(): boolean {
    return this.currentHealth <= 0;
  }

  /**
   * Check if the entity is currently invulnerable
   */
  isInvulnerable(): boolean {
    return this.invulnerable || this.invulnerabilityTimer > 0;
  }

  /**
   * Set permanent invulnerability
   */
  setInvulnerable(invulnerable: boolean): void {
    this.invulnerable = invulnerable;
  }

  /**
   * Get remaining invulnerability time
   */
  getRemainingInvulnerabilityTime(): number {
    return this.invulnerabilityTimer;
  }

  /**
   * Set the maximum health (also adjusts current health if necessary)
   */
  setMaxHealth(maxHealth: number): void {
    this.maxHealth = Math.max(1, maxHealth);
    this.currentHealth = Math.min(this.currentHealth, this.maxHealth);
  }

  /**
   * Set death callback
   */
  setDeathCallback(callback: DeathCallback): void {
    this.onDeath = callback;
  }

  /**
   * Set damage callback
   */
  setDamageCallback(callback: DamageCallback): void {
    this.onDamage = callback;
  }

  /**
   * Remove death callback
   */
  clearDeathCallback(): void {
    this.onDeath = undefined;
  }

  /**
   * Remove damage callback
   */
  clearDamageCallback(): void {
    this.onDamage = undefined;
  }

  /**
   * Reset health to maximum
   */
  resetHealth(): void {
    this.currentHealth = this.maxHealth;
    this.invulnerabilityTimer = 0;
  }

  /**
   * Get a copy of the health configuration
   */
  getConfig(): HealthConfig {
    return {
      maxHealth: this.maxHealth,
      currentHealth: this.currentHealth,
      invulnerable: this.invulnerable,
      invulnerabilityDuration: this.invulnerabilityDuration
    };
  }
}