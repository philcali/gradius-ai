/**
 * SpecialEffects component manages active special weapon effects
 * Handles duration tracking, cooldowns, and effect application
 */

import { Component } from '../core/interfaces';

export enum SpecialEffectType {
    SHIELD = 'shield',
    TRACTOR_BEAM = 'tractor_beam',
    SCREEN_CLEAR = 'screen_clear'
}

export interface SpecialEffectConfig {
    duration: number;        // Effect duration in milliseconds
    cooldown: number;        // Cooldown after effect ends in milliseconds
    maxUses?: number;        // Maximum uses per level/game (undefined = unlimited)
    currentUses?: number;    // Current remaining uses
    level: number;           // Effect level (affects power/duration)
}

export interface ActiveEffect {
    type: SpecialEffectType;
    startTime: number;
    duration: number;
    level: number;
    data?: any; // Additional effect-specific data
}

export class SpecialEffects implements Component {
    readonly type = 'SpecialEffects';

    private effects: Map<SpecialEffectType, SpecialEffectConfig>;
    private activeEffects: Map<SpecialEffectType, ActiveEffect>;
    private lastActivationTimes: Map<SpecialEffectType, number>;

    // Default effect configurations
    private static readonly DEFAULT_CONFIGS: Record<SpecialEffectType, SpecialEffectConfig> = {
        [SpecialEffectType.SHIELD]: {
            duration: 5000,      // 5 seconds base duration
            cooldown: 10000,     // 10 second cooldown
            maxUses: 3,          // 3 uses per level
            currentUses: 3,
            level: 1
        },
        [SpecialEffectType.TRACTOR_BEAM]: {
            duration: 3000,      // 3 seconds base duration
            cooldown: 8000,      // 8 second cooldown
            maxUses: 5,          // 5 uses per level
            currentUses: 5,
            level: 1
        },
        [SpecialEffectType.SCREEN_CLEAR]: {
            duration: 100,       // Instant effect (100ms for animation)
            cooldown: 15000,     // 15 second cooldown
            maxUses: 2,          // 2 uses per level
            currentUses: 2,
            level: 1
        }
    };

    constructor() {
        this.effects = new Map();
        this.activeEffects = new Map();
        this.lastActivationTimes = new Map();

        // Initialize all effect types with default configurations
        Object.entries(SpecialEffects.DEFAULT_CONFIGS).forEach(([type, config]) => {
            this.effects.set(type as SpecialEffectType, { ...config });
            this.lastActivationTimes.set(type as SpecialEffectType, 0);
        });
    }

    /**
     * Update active effects and handle expiration
     */
    update(deltaTime: number): void {
        const currentTime = Date.now();

        // Check for expired effects
        for (const [effectType, activeEffect] of this.activeEffects.entries()) {
            const elapsed = currentTime - activeEffect.startTime;
            
            if (elapsed >= activeEffect.duration) {
                console.log(deltaTime);
                this.deactivateEffect(effectType);
            }
        }
    }

    /**
     * Activate a special effect if possible
     */
    activateEffect(effectType: SpecialEffectType): boolean {
        if (!this.canActivateEffect(effectType)) {
            return false;
        }

        const config = this.effects.get(effectType)!;
        const currentTime = Date.now();

        // Calculate duration based on level
        const duration = this.calculateEffectDuration(effectType, config.level);

        // Create active effect
        const activeEffect: ActiveEffect = {
            type: effectType,
            startTime: currentTime,
            duration,
            level: config.level,
            data: this.createEffectData(effectType, config.level)
        };

        // Add to active effects
        this.activeEffects.set(effectType, activeEffect);
        this.lastActivationTimes.set(effectType, currentTime);

        // Consume usage if limited
        if (config.maxUses !== undefined && config.currentUses !== undefined) {
            config.currentUses = Math.max(0, config.currentUses - 1);
        }

        console.log(`Activated ${effectType} effect (Level ${config.level}) for ${duration}ms`);
        return true;
    }

    /**
     * Deactivate a special effect
     */
    deactivateEffect(effectType: SpecialEffectType): void {
        const activeEffect = this.activeEffects.get(effectType);
        if (!activeEffect) {
            return;
        }

        this.activeEffects.delete(effectType);
        console.log(`Deactivated ${effectType} effect`);
    }

    /**
     * Check if an effect can be activated
     */
    canActivateEffect(effectType: SpecialEffectType): boolean {
        const config = this.effects.get(effectType);
        if (!config) {
            return false;
        }

        // Check if already active
        if (this.isEffectActive(effectType)) {
            return false;
        }

        // Check cooldown (skip cooldown check if never activated before)
        const currentTime = Date.now();
        const lastActivation = this.lastActivationTimes.get(effectType) || 0;
        
        if (lastActivation > 0) { // Only check cooldown if previously activated
            const timeSinceLastUse = currentTime - lastActivation;
            if (timeSinceLastUse < config.cooldown) {
                return false;
            }
        }

        // Check usage limits
        if (config.maxUses !== undefined && (config.currentUses || 0) <= 0) {
            return false;
        }

        return true;
    }

    /**
     * Check if a specific effect is currently active
     */
    isEffectActive(effectType: SpecialEffectType): boolean {
        return this.activeEffects.has(effectType);
    }

    /**
     * Get active effect data
     */
    getActiveEffect(effectType: SpecialEffectType): ActiveEffect | undefined {
        return this.activeEffects.get(effectType);
    }

    /**
     * Get all currently active effects
     */
    getActiveEffects(): ActiveEffect[] {
        return Array.from(this.activeEffects.values());
    }

    /**
     * Get remaining duration for an active effect
     */
    getRemainingDuration(effectType: SpecialEffectType): number {
        const activeEffect = this.activeEffects.get(effectType);
        if (!activeEffect) {
            return 0;
        }

        const elapsed = Date.now() - activeEffect.startTime;
        return Math.max(0, activeEffect.duration - elapsed);
    }

    /**
     * Get remaining cooldown time for an effect
     */
    getRemainingCooldown(effectType: SpecialEffectType): number {
        const config = this.effects.get(effectType);
        if (!config) {
            return 0;
        }

        const currentTime = Date.now();
        const lastActivation = this.lastActivationTimes.get(effectType) || 0;
        const timeSinceLastUse = currentTime - lastActivation;

        return Math.max(0, config.cooldown - timeSinceLastUse);
    }

    /**
     * Get remaining uses for an effect
     */
    getRemainingUses(effectType: SpecialEffectType): number | undefined {
        const config = this.effects.get(effectType);
        return config?.currentUses;
    }

    /**
     * Get maximum uses for an effect
     */
    getMaxUses(effectType: SpecialEffectType): number | undefined {
        const config = this.effects.get(effectType);
        return config?.maxUses;
    }

    /**
     * Upgrade an effect to the next level
     */
    upgradeEffect(effectType: SpecialEffectType): boolean {
        const config = this.effects.get(effectType);
        if (!config || config.level >= 3) { // Max level 3
            return false;
        }

        config.level++;
        
        // Upgrade effects based on level
        this.applyLevelUpgrades(effectType, config);
        
        console.log(`Upgraded ${effectType} to level ${config.level}`);
        return true;
    }

    /**
     * Add uses to an effect (from power-ups)
     */
    addUses(effectType: SpecialEffectType, amount: number): boolean {
        const config = this.effects.get(effectType);
        if (!config || config.maxUses === undefined || amount < 0) {
            return false;
        }

        config.currentUses = Math.min(
            config.maxUses,
            (config.currentUses || 0) + amount
        );
        return true;
    }

    /**
     * Refill all uses for an effect
     */
    refillUses(effectType: SpecialEffectType): boolean {
        const config = this.effects.get(effectType);
        if (!config || config.maxUses === undefined) {
            return false;
        }

        config.currentUses = config.maxUses;
        return true;
    }

    /**
     * Calculate effect duration based on type and level
     */
    private calculateEffectDuration(effectType: SpecialEffectType, level: number): number {
        const baseConfig = SpecialEffects.DEFAULT_CONFIGS[effectType];
        const levelMultiplier = 1 + ((level - 1) * 0.5); // +50% duration per level

        return Math.round(baseConfig.duration * levelMultiplier);
    }

    /**
     * Create effect-specific data based on type and level
     */
    private createEffectData(effectType: SpecialEffectType, level: number): any {
        switch (effectType) {
            case SpecialEffectType.SHIELD:
                return {
                    invulnerable: true,
                    damageReduction: level >= 2 ? 0.5 : 0, // 50% damage reduction at level 2+
                    reflectDamage: level >= 3 // Reflect damage at level 3
                };

            case SpecialEffectType.TRACTOR_BEAM:
                return {
                    range: 100 + (level * 50), // Increased range per level
                    strength: level * 2,       // Pull strength
                    affectEnemies: level >= 3  // Can pull enemies at level 3
                };

            case SpecialEffectType.SCREEN_CLEAR:
                return {
                    damage: 999,
                    range: level >= 2 ? Infinity : 800, // Full screen at level 2+
                    bonusScore: level >= 3 // Bonus score at level 3
                };

            default:
                return {};
        }
    }

    /**
     * Apply level-based upgrades to effect configuration
     */
    private applyLevelUpgrades(effectType: SpecialEffectType, config: SpecialEffectConfig): void {
        const baseConfig = SpecialEffects.DEFAULT_CONFIGS[effectType];

        // Reduce cooldown by 20% per level
        config.cooldown = Math.round(baseConfig.cooldown * Math.max(0.4, 1 - ((config.level - 1) * 0.2)));

        // Increase max uses for some effects
        if (effectType === SpecialEffectType.TRACTOR_BEAM) {
            config.maxUses = baseConfig.maxUses! + (config.level - 1) * 2;
        } else if (effectType === SpecialEffectType.SHIELD) {
            config.maxUses = baseConfig.maxUses! + (config.level - 1);
        }
    }

    /**
     * Get effect level
     */
    getEffectLevel(effectType: SpecialEffectType): number {
        const config = this.effects.get(effectType);
        return config?.level || 1;
    }

    /**
     * Get effect configuration
     */
    getEffectConfig(effectType: SpecialEffectType): SpecialEffectConfig | undefined {
        const config = this.effects.get(effectType);
        return config ? { ...config } : undefined;
    }

    /**
     * Reset all effects (for testing or game restart)
     */
    reset(): void {
        this.activeEffects.clear();
        
        // Reset to default configurations
        Object.entries(SpecialEffects.DEFAULT_CONFIGS).forEach(([type, config]) => {
            this.effects.set(type as SpecialEffectType, { ...config });
            this.lastActivationTimes.set(type as SpecialEffectType, 0);
        });
    }

    /**
     * Get all effect states for serialization/debugging
     */
    getEffectStates(): Record<SpecialEffectType, SpecialEffectConfig> {
        const states: Record<string, SpecialEffectConfig> = {};
        this.effects.forEach((config, type) => {
            states[type] = { ...config };
        });
        return states as Record<SpecialEffectType, SpecialEffectConfig>;
    }
}