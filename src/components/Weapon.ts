/**
 * Weapon component handles the three-weapon system for entities
 * Manages weapon types, ammunition, upgrades, and firing logic
 */

import { Component } from '../core/interfaces';

export enum WeaponType {
    BEAM = 'beam',
    MISSILE = 'missile',
    SPECIAL = 'special'
}

export interface WeaponConfig {
    fireRate: number;        // Milliseconds between shots
    damage: number;          // Base damage per shot
    projectileSpeed: number; // Speed of projectiles
    maxAmmo?: number;        // Maximum ammunition (undefined = unlimited)
    currentAmmo?: number;    // Current ammunition count
    maxLevel: number;        // Maximum upgrade level
    currentLevel: number;    // Current upgrade level
}

export interface WeaponUpgradeEffects {
    damageMultiplier: number;
    fireRateMultiplier: number;
    speedMultiplier: number;
    specialEffects?: {
        piercing?: boolean;
        homing?: boolean;
        explosive?: boolean;
        spread?: number;
    };
}

export class Weapon implements Component {
    readonly type = 'Weapon';

    private weapons: Map<WeaponType, WeaponConfig>;
    private currentWeapon: WeaponType;
    private lastFireTimes: Map<WeaponType, number>;

    // Default weapon configurations
    private static readonly DEFAULT_CONFIGS: Record<WeaponType, WeaponConfig> = {
        [WeaponType.BEAM]: {
            fireRate: 200,
            damage: 1,
            projectileSpeed: 600,
            maxLevel: 5,
            currentLevel: 1
        },
        [WeaponType.MISSILE]: {
            fireRate: 800,
            damage: 3,
            projectileSpeed: 400,
            maxAmmo: 20,
            currentAmmo: 20,
            maxLevel: 5,
            currentLevel: 1
        },
        [WeaponType.SPECIAL]: {
            fireRate: 3000,
            damage: 0, // Special weapons don't deal direct damage
            projectileSpeed: 0,
            maxAmmo: 3,
            currentAmmo: 3,
            maxLevel: 3,
            currentLevel: 1
        }
    };

    constructor(initialWeapon: WeaponType = WeaponType.BEAM) {
        this.weapons = new Map();
        this.lastFireTimes = new Map();
        this.currentWeapon = initialWeapon;

        // Initialize all weapon types with default configurations
        Object.entries(Weapon.DEFAULT_CONFIGS).forEach(([type, config]) => {
            this.weapons.set(type as WeaponType, { ...config });
            this.lastFireTimes.set(type as WeaponType, 0);
        });
    }

    /**
     * Switch to a different weapon type
     */
    switchWeapon(weaponType: WeaponType): boolean {
        if (this.weapons.has(weaponType)) {
            this.currentWeapon = weaponType;
            return true;
        }
        return false;
    }

    /**
     * Cycle to the next weapon type
     */
    cycleWeapon(): WeaponType {
        const weaponTypes = Object.values(WeaponType);
        const currentIndex = weaponTypes.indexOf(this.currentWeapon);
        const nextIndex = (currentIndex + 1) % weaponTypes.length;
        this.currentWeapon = weaponTypes[nextIndex];
        return this.currentWeapon;
    }

    /**
     * Get the currently selected weapon type
     */
    getCurrentWeapon(): WeaponType {
        return this.currentWeapon;
    }

    /**
     * Get weapon configuration for a specific weapon type
     */
    getWeaponConfig(weaponType: WeaponType): WeaponConfig | undefined {
        return this.weapons.get(weaponType);
    }

    /**
     * Get current weapon configuration
     */
    getCurrentWeaponConfig(): WeaponConfig {
        return this.weapons.get(this.currentWeapon)!;
    }

    /**
     * Check if the current weapon can fire (cooldown and ammo check)
     */
    canFire(): boolean {
        const config = this.getCurrentWeaponConfig();
        const currentTime = Date.now();
        const lastFireTime = this.lastFireTimes.get(this.currentWeapon) || 0;

        // Check fire rate cooldown
        if (currentTime - lastFireTime < config.fireRate) {
            return false;
        }

        // Check ammunition for weapons that have limited ammo
        if (config.maxAmmo !== undefined && (config.currentAmmo || 0) <= 0) {
            return false;
        }

        return true;
    }

    /**
     * Attempt to fire the current weapon
     * Returns true if weapon was fired, false if it couldn't fire
     */
    fire(): boolean {
        if (!this.canFire()) {
            return false;
        }

        const config = this.getCurrentWeaponConfig();
        const currentTime = Date.now();

        // Update last fire time
        this.lastFireTimes.set(this.currentWeapon, currentTime);

        // Consume ammunition if weapon has limited ammo
        if (config.maxAmmo !== undefined && config.currentAmmo !== undefined) {
            config.currentAmmo = Math.max(0, config.currentAmmo - 1);
        }

        return true;
    }

    /**
     * Add ammunition to a specific weapon type
     */
    addAmmo(weaponType: WeaponType, amount: number): boolean {
        const config = this.weapons.get(weaponType);
        if (!config || config.maxAmmo === undefined || amount < 0) {
            return false; // Weapon doesn't use ammo, doesn't exist, or negative amount
        }

        config.currentAmmo = Math.min(
            config.maxAmmo,
            (config.currentAmmo || 0) + amount
        );
        return true;
    }

    /**
     * Refill ammunition for a specific weapon type
     */
    refillAmmo(weaponType: WeaponType): boolean {
        const config = this.weapons.get(weaponType);
        if (!config || config.maxAmmo === undefined) {
            return false;
        }

        config.currentAmmo = config.maxAmmo;
        return true;
    }

    /**
     * Upgrade a weapon to the next level
     */
    upgradeWeapon(weaponType: WeaponType): boolean {
        const config = this.weapons.get(weaponType);
        if (!config || config.currentLevel >= config.maxLevel) {
            return false;
        }

        config.currentLevel++;
        this.applyUpgradeEffects(weaponType, config);
        return true;
    }

    /**
     * Apply upgrade effects to weapon configuration
     */
    private applyUpgradeEffects(weaponType: WeaponType, config: WeaponConfig): void {
        const effects = this.getUpgradeEffects(weaponType, config.currentLevel);
        const baseConfig = Weapon.DEFAULT_CONFIGS[weaponType];

        // Apply multipliers to base values
        config.damage = Math.round(baseConfig.damage * effects.damageMultiplier);
        config.fireRate = Math.round(baseConfig.fireRate * effects.fireRateMultiplier);
        config.projectileSpeed = Math.round(baseConfig.projectileSpeed * effects.speedMultiplier);

        // Increase max ammo for missile weapons
        if (weaponType === WeaponType.MISSILE && config.maxAmmo !== undefined) {
            config.maxAmmo = baseConfig.maxAmmo! + (config.currentLevel - 1) * 5;
        }
    }

    /**
     * Get upgrade effects for a specific weapon type and level
     */
    getUpgradeEffects(weaponType: WeaponType, level: number): WeaponUpgradeEffects {
        const levelMultiplier = level - 1; // Level 1 = no bonus

        switch (weaponType) {
            case WeaponType.BEAM: {
                const effects: WeaponUpgradeEffects = {
                    damageMultiplier: 1 + (levelMultiplier * 0.5), // +50% damage per level
                    fireRateMultiplier: Math.max(0.3, 1 - (levelMultiplier * 0.15)), // Faster fire rate
                    speedMultiplier: 1 + (levelMultiplier * 0.2) // +20% speed per level
                };

                if (level >= 3) {
                    effects.specialEffects = { piercing: true };
                }

                return effects;
            }

            case WeaponType.MISSILE:
                return {
                    damageMultiplier: 1 + (levelMultiplier * 0.8), // +80% damage per level
                    fireRateMultiplier: Math.max(0.4, 1 - (levelMultiplier * 0.1)), // Slightly faster
                    speedMultiplier: 1 + (levelMultiplier * 0.15), // +15% speed per level
                    specialEffects: {
                        explosive: level >= 2,
                        homing: level >= 4
                    }
                };

            case WeaponType.SPECIAL:
                return {
                    damageMultiplier: 1,
                    fireRateMultiplier: Math.max(0.5, 1 - (levelMultiplier * 0.2)), // Faster cooldown
                    speedMultiplier: 1,
                    specialEffects: {
                        // Special weapons have unique effects per level
                    }
                };

            default:
                return {
                    damageMultiplier: 1,
                    fireRateMultiplier: 1,
                    speedMultiplier: 1
                };
        }
    }

    /**
     * Get current ammunition count for a weapon type
     */
    getAmmo(weaponType: WeaponType): number | undefined {
        const config = this.weapons.get(weaponType);
        return config?.currentAmmo;
    }

    /**
     * Get maximum ammunition count for a weapon type
     */
    getMaxAmmo(weaponType: WeaponType): number | undefined {
        const config = this.weapons.get(weaponType);
        return config?.maxAmmo;
    }

    /**
     * Get current weapon level
     */
    getWeaponLevel(weaponType: WeaponType): number {
        const config = this.weapons.get(weaponType);
        return config?.currentLevel || 1;
    }

    /**
     * Get maximum weapon level
     */
    getMaxWeaponLevel(weaponType: WeaponType): number {
        const config = this.weapons.get(weaponType);
        return config?.maxLevel || 1;
    }

    /**
     * Check if a weapon can be upgraded
     */
    canUpgrade(weaponType: WeaponType): boolean {
        const config = this.weapons.get(weaponType);
        return config ? config.currentLevel < config.maxLevel : false;
    }

    /**
     * Get time until weapon can fire again (in milliseconds)
     */
    getTimeUntilReady(): number {
        const config = this.getCurrentWeaponConfig();
        const currentTime = Date.now();
        const lastFireTime = this.lastFireTimes.get(this.currentWeapon) || 0;
        const timeSinceLastFire = currentTime - lastFireTime;

        return Math.max(0, config.fireRate - timeSinceLastFire);
    }

    /**
     * Reset all weapon states (for testing or game restart)
     */
    reset(): void {
        // Reset to default configurations
        Object.entries(Weapon.DEFAULT_CONFIGS).forEach(([type, config]) => {
            this.weapons.set(type as WeaponType, { ...config });
            this.lastFireTimes.set(type as WeaponType, 0);
        });
        this.currentWeapon = WeaponType.BEAM;
    }

    /**
     * Get all weapon states for serialization/debugging
     */
    getWeaponStates(): Record<WeaponType, WeaponConfig> {
        const states: Record<string, WeaponConfig> = {};
        this.weapons.forEach((config, type) => {
            states[type] = { ...config };
        });
        return states as Record<WeaponType, WeaponConfig>;
    }
}