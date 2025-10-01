/**
 * Health component manages entity health, damage, and death
 */

import { Component } from '../core/interfaces';

export interface HealthConfig {
  maxHealth: number;
  currentHealth: number;
  invulnerabilityDuration?: number; // Milliseconds of invulnerability after taking damage
  regeneration?: {
    enabled: boolean;
    rate: number; // Health per second
    delay: number; // Milliseconds before regeneration starts after taking damage
  };
}

export class Health implements Component {
  readonly type = 'health';

  private maxHealth: number;
  private currentHealth: number;
  private invulnerabilityDuration: number;
  private lastDamageTime: number = 0;
  private regeneration: {
    enabled: boolean;
    rate: number;
    delay: number;
  } | undefined;

  // Callbacks
  private onDamageCallback: ((damage: number, currentHealth: number, maxHealth: number) => void) | undefined;
  private onDeathCallback: (() => void) | undefined;
  private onHealCallback: ((healAmount: number, currentHealth: number, maxHealth: number) => void) | undefined;

  constructor(config: HealthConfig) {
    this.maxHealth = config.maxHealth;
    this.currentHealth = config.currentHealth;
    this.invulnerabilityDuration = config.invulnerabilityDuration || 0;
    this.regeneration = config.regeneration;
  }

  /**
   * Update health component (handles regeneration)
   */
  update(deltaTime: number): void {
    if (this.regeneration?.enabled && this.currentHealth < this.maxHealth && this.lastDamageTime > 0) {
      const timeSinceLastDamage = Date.now() - this.lastDamageTime;

      if (timeSinceLastDamage >= this.regeneration.delay) {
        const regenAmount = (this.regeneration.rate * deltaTime) / 1000;
        this.heal(regenAmount, false); // Don't trigger heal callback for regeneration
      }
    }
  }

  /**
   * Take damage
   */
  takeDamage(damage: number): boolean {
    if (damage <= 0) return false;

    // Check invulnerability
    if (this.isInvulnerable()) {
      return false;
    }

    const actualDamage = Math.min(damage, this.currentHealth);
    this.currentHealth -= actualDamage;
    this.lastDamageTime = Date.now();

    // Trigger damage callback
    if (this.onDamageCallback) {
      this.onDamageCallback(actualDamage, this.currentHealth, this.maxHealth);
    }

    // Check for death
    if (this.currentHealth <= 0) {
      this.currentHealth = 0;
      if (this.onDeathCallback) {
        this.onDeathCallback();
      }
      return true; // Entity died
    }

    return false; // Entity survived
  }

  /**
   * Heal health
   */
  heal(amount: number, triggerCallback: boolean = true): number {
    if (amount <= 0) return 0;

    const oldHealth = this.currentHealth;
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    const actualHeal = this.currentHealth - oldHealth;

    if (triggerCallback && actualHeal > 0 && this.onHealCallback) {
      this.onHealCallback(actualHeal, this.currentHealth, this.maxHealth);
    }

    return actualHeal;
  }

  /**
   * Set health to a specific value
   */
  setHealth(health: number): void {
    const oldHealth = this.currentHealth;
    this.currentHealth = Math.max(0, Math.min(this.maxHealth, health));

    // Check for death if health was reduced to 0
    if (oldHealth > 0 && this.currentHealth <= 0) {
      if (this.onDeathCallback) {
        this.onDeathCallback();
      }
    }
  }

  /**
   * Set maximum health and optionally adjust current health
   */
  setMaxHealth(maxHealth: number, adjustCurrent: boolean = false): void {
    const oldMaxHealth = this.maxHealth;
    this.maxHealth = Math.max(1, maxHealth);

    if (adjustCurrent && oldMaxHealth > 0) {
      // Scale current health proportionally
      const healthRatio = this.currentHealth / oldMaxHealth;
      this.currentHealth = Math.floor(this.maxHealth * healthRatio);
    } else {
      // Just clamp current health to new maximum
      this.currentHealth = Math.min(this.currentHealth, this.maxHealth);
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
   * Get health as a percentage (0-1)
   */
  getHealthPercentage(): number {
    return this.maxHealth > 0 ? this.currentHealth / this.maxHealth : 0;
  }

  /**
   * Check if entity is alive
   */
  isAlive(): boolean {
    return this.currentHealth > 0;
  }

  /**
   * Check if entity is at full health
   */
  isFullHealth(): boolean {
    return this.currentHealth >= this.maxHealth;
  }

  /**
   * Check if entity is currently invulnerable
   */
  isInvulnerable(): boolean {
    if (this.invulnerabilityDuration <= 0) return false;
    return (Date.now() - this.lastDamageTime) < this.invulnerabilityDuration;
  }

  /**
   * Get remaining invulnerability time in milliseconds
   */
  getRemainingInvulnerabilityTime(): number {
    if (this.invulnerabilityDuration <= 0) return 0;
    const elapsed = Date.now() - this.lastDamageTime;
    return Math.max(0, this.invulnerabilityDuration - elapsed);
  }

  /**
   * Force invulnerability for a duration
   */
  setInvulnerable(duration: number): void {
    this.invulnerabilityDuration = duration;
    this.lastDamageTime = Date.now();
  }

  /**
   * Fully restore health
   */
  fullHeal(): void {
    this.setHealth(this.maxHealth);
  }

  /**
   * Set damage callback
   */
  setOnDamageCallback(callback: (damage: number, currentHealth: number, maxHealth: number) => void): void {
    this.onDamageCallback = callback;
  }

  /**
   * Set death callback
   */
  setOnDeathCallback(callback: () => void): void {
    this.onDeathCallback = callback;
  }

  /**
   * Set heal callback
   */
  setOnHealCallback(callback: (healAmount: number, currentHealth: number, maxHealth: number) => void): void {
    this.onHealCallback = callback;
  }

  /**
   * Enable or disable health regeneration
   */
  setRegeneration(config: { enabled: boolean; rate: number; delay: number }): void {
    this.regeneration = config;
  }

  /**
   * Get regeneration config
   */
  getRegeneration(): { enabled: boolean; rate: number; delay: number } | undefined {
    return this.regeneration ? { ...this.regeneration } : undefined;
  }

  /**
   * Reset health to maximum and clear damage state
   */
  reset(): void {
    this.currentHealth = this.maxHealth;
    this.lastDamageTime = 0;
  }

  /**
   * Get time since last damage in milliseconds
   */
  getTimeSinceLastDamage(): number {
    return Date.now() - this.lastDamageTime;
  }

  /**
   * Destroy the component
   */
  destroy(): void {
    this.onDamageCallback = undefined;
    this.onDeathCallback = undefined;
    this.onHealCallback = undefined;
  }
}