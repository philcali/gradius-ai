/**
 * VisualEffectsSystem manages particle systems, animations, and visual effects
 */

import { System, Entity, Vector2D } from '../core/interfaces';
import { ComponentTypes } from '../core/Component';
import { Sprite } from '../components/Sprite';
import { ParticleSystem } from '../components/ParticleSystem';
import { VisualEffects } from '../components/VisualEffects';
import { Animation } from '../components/Animation';

export class VisualEffectsSystem implements System {
    public readonly name = 'VisualEffectsSystem';
    
    private ctx: CanvasRenderingContext2D;
    private canvasWidth: number;
    private canvasHeight: number;

    constructor(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
        this.ctx = ctx;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }

    /**
     * Filter entities that have visual effects components
     */
    filter(entity: Entity): boolean {
        return entity.hasComponent(ComponentTypes.PARTICLE_SYSTEM) ||
               entity.hasComponent(ComponentTypes.VISUAL_EFFECTS) ||
               entity.hasComponent(ComponentTypes.ANIMATION);
    }

    /**
     * Update all visual effects
     */
    update(entities: Entity[], deltaTime: number): void {
        // Update particle systems
        const particleEntities = entities.filter(entity => 
            entity.hasComponent(ComponentTypes.PARTICLE_SYSTEM)
        );

        for (const entity of particleEntities) {
            const particleSystem = entity.getComponent<ParticleSystem>(ComponentTypes.PARTICLE_SYSTEM)!;
            particleSystem.update(deltaTime);
        }

        // Update visual effects
        const visualEffectsEntities = entities.filter(entity => 
            entity.hasComponent(ComponentTypes.VISUAL_EFFECTS)
        );

        for (const entity of visualEffectsEntities) {
            const visualEffects = entity.getComponent<VisualEffects>(ComponentTypes.VISUAL_EFFECTS)!;
            visualEffects.update(deltaTime);
        }

        // Update animations
        const animationEntities = entities.filter(entity => 
            entity.hasComponent(ComponentTypes.ANIMATION)
        );

        for (const entity of animationEntities) {
            const animation = entity.getComponent<Animation>(ComponentTypes.ANIMATION)!;
            animation.update(deltaTime);

            // Update sprite based on current animation frame
            if (entity.hasComponent(ComponentTypes.SPRITE)) {
                const sprite = entity.getComponent<Sprite>(ComponentTypes.SPRITE)!;
                const currentFrame = animation.getCurrentFrame();
                
                if (currentFrame) {
                    sprite.sourceRect = {
                        x: currentFrame.sourceX,
                        y: currentFrame.sourceY,
                        width: currentFrame.width,
                        height: currentFrame.height
                    };
                }
            }
        }
    }

    /**
     * Render all visual effects
     */
    render(entities: Entity[]): void {
        this.ctx.save();

        // Apply global visual effects (screen shake, zoom)
        const globalEffectsEntity = entities.find(entity => 
            entity.hasComponent(ComponentTypes.VISUAL_EFFECTS)
        );

        if (globalEffectsEntity) {
            const visualEffects = globalEffectsEntity.getComponent<VisualEffects>(ComponentTypes.VISUAL_EFFECTS)!;
            visualEffects.applyEffects(this.ctx, this.canvasWidth, this.canvasHeight);
        }

        // Render particle systems
        const particleEntities = entities.filter(entity => 
            entity.hasComponent(ComponentTypes.PARTICLE_SYSTEM)
        );

        for (const entity of particleEntities) {
            const particleSystem = entity.getComponent<ParticleSystem>(ComponentTypes.PARTICLE_SYSTEM)!;
            particleSystem.render(this.ctx);
        }

        this.ctx.restore();

        // Render overlay effects (flash, fade) - these should be on top of everything
        if (globalEffectsEntity) {
            const visualEffects = globalEffectsEntity.getComponent<VisualEffects>(ComponentTypes.VISUAL_EFFECTS)!;
            visualEffects.renderOverlays(this.ctx, this.canvasWidth, this.canvasHeight);
        }
    }

    /**
     * Create an explosion effect at the specified position
     */
    createExplosion(entities: Entity[], position: Vector2D, intensity: number = 1): void {
        // Find or create a particle system entity
        let particleEntity = entities.find(entity => 
            entity.hasComponent(ComponentTypes.PARTICLE_SYSTEM)
        );

        if (particleEntity) {
            const particleSystem = particleEntity.getComponent<ParticleSystem>(ComponentTypes.PARTICLE_SYSTEM)!;
            particleSystem.createExplosion(position, intensity);
        }

        // Create screen shake and flash effects
        const visualEffectsEntity = entities.find(entity => 
            entity.hasComponent(ComponentTypes.VISUAL_EFFECTS)
        );

        if (visualEffectsEntity) {
            const visualEffects = visualEffectsEntity.getComponent<VisualEffects>(ComponentTypes.VISUAL_EFFECTS)!;
            visualEffects.createExplosionShake(intensity);
            visualEffects.createExplosionFlash();
        }
    }

    /**
     * Create a muzzle flash effect at the specified position
     */
    createMuzzleFlash(entities: Entity[], position: Vector2D, direction: Vector2D): void {
        const particleEntity = entities.find(entity => 
            entity.hasComponent(ComponentTypes.PARTICLE_SYSTEM)
        );

        if (particleEntity) {
            const particleSystem = particleEntity.getComponent<ParticleSystem>(ComponentTypes.PARTICLE_SYSTEM)!;
            particleSystem.createMuzzleFlash(position, direction);
        }

        // Small screen shake for weapon firing
        const visualEffectsEntity = entities.find(entity => 
            entity.hasComponent(ComponentTypes.VISUAL_EFFECTS)
        );

        if (visualEffectsEntity) {
            const visualEffects = visualEffectsEntity.getComponent<VisualEffects>(ComponentTypes.VISUAL_EFFECTS)!;
            visualEffects.createWeaponShake();
        }
    }

    /**
     * Create an impact effect at the specified position
     */
    createImpact(entities: Entity[], position: Vector2D): void {
        const particleEntity = entities.find(entity => 
            entity.hasComponent(ComponentTypes.PARTICLE_SYSTEM)
        );

        if (particleEntity) {
            const particleSystem = particleEntity.getComponent<ParticleSystem>(ComponentTypes.PARTICLE_SYSTEM)!;
            particleSystem.createImpact(position);
        }

        // Medium screen shake for impacts
        const visualEffectsEntity = entities.find(entity => 
            entity.hasComponent(ComponentTypes.VISUAL_EFFECTS)
        );

        if (visualEffectsEntity) {
            const visualEffects = visualEffectsEntity.getComponent<VisualEffects>(ComponentTypes.VISUAL_EFFECTS)!;
            visualEffects.createImpactShake();
        }
    }

    /**
     * Start a destruction animation for an entity
     */
    startDestructionAnimation(entity: Entity, onComplete?: () => void): void {
        if (!entity.hasComponent(ComponentTypes.ANIMATION)) {
            return;
        }

        const animation = entity.getComponent<Animation>(ComponentTypes.ANIMATION)!;
        
        // If the entity doesn't have a destruction sequence, create a simple one
        if (!animation.hasSequence('destruction')) {
            const sprite = entity.getComponent<Sprite>(ComponentTypes.SPRITE);
            if (sprite) {
                const destructionSequence = Animation.createDestructionSequence(
                    sprite.width,
                    sprite.height,
                    4,
                    150
                );
                animation.addSequence(destructionSequence);
            }
        }

        animation.play('destruction', onComplete);
    }

    /**
     * Create damage flash effect
     */
    createDamageFlash(entities: Entity[]): void {
        const visualEffectsEntity = entities.find(entity => 
            entity.hasComponent(ComponentTypes.VISUAL_EFFECTS)
        );

        if (visualEffectsEntity) {
            const visualEffects = visualEffectsEntity.getComponent<VisualEffects>(ComponentTypes.VISUAL_EFFECTS)!;
            visualEffects.createDamageFlash();
        }
    }

    /**
     * Create fade to black effect
     */
    createFadeToBlack(entities: Entity[], duration: number = 1000): void {
        const visualEffectsEntity = entities.find(entity => 
            entity.hasComponent(ComponentTypes.VISUAL_EFFECTS)
        );

        if (visualEffectsEntity) {
            const visualEffects = visualEffectsEntity.getComponent<VisualEffects>(ComponentTypes.VISUAL_EFFECTS)!;
            visualEffects.createFadeToBlack(duration);
        }
    }

    /**
     * Create fade from black effect
     */
    createFadeFromBlack(entities: Entity[], duration: number = 1000): void {
        const visualEffectsEntity = entities.find(entity => 
            entity.hasComponent(ComponentTypes.VISUAL_EFFECTS)
        );

        if (visualEffectsEntity) {
            const visualEffects = visualEffectsEntity.getComponent<VisualEffects>(ComponentTypes.VISUAL_EFFECTS)!;
            visualEffects.createFadeFromBlack(duration);
        }
    }

    /**
     * Update canvas size
     */
    updateCanvasSize(width: number, height: number): void {
        this.canvasWidth = width;
        this.canvasHeight = height;
    }

    /**
     * Clear all visual effects
     */
    clearAllEffects(entities: Entity[]): void {
        // Clear particle systems
        const particleEntities = entities.filter(entity => 
            entity.hasComponent(ComponentTypes.PARTICLE_SYSTEM)
        );

        for (const entity of particleEntities) {
            const particleSystem = entity.getComponent<ParticleSystem>(ComponentTypes.PARTICLE_SYSTEM)!;
            particleSystem.clear();
        }

        // Clear visual effects
        const visualEffectsEntities = entities.filter(entity => 
            entity.hasComponent(ComponentTypes.VISUAL_EFFECTS)
        );

        for (const entity of visualEffectsEntities) {
            const visualEffects = entity.getComponent<VisualEffects>(ComponentTypes.VISUAL_EFFECTS)!;
            visualEffects.stopAllEffects();
        }

        // Stop all animations
        const animationEntities = entities.filter(entity => 
            entity.hasComponent(ComponentTypes.ANIMATION)
        );

        for (const entity of animationEntities) {
            const animation = entity.getComponent<Animation>(ComponentTypes.ANIMATION)!;
            animation.stop();
        }
    }
}