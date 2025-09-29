/**
 * VisualEffects component handles screen shake, flash effects, and other visual feedback
 */

import { Component, Vector2D } from '../core/interfaces';

export enum EffectType {
    SCREEN_SHAKE = 'screen_shake',
    FLASH = 'flash',
    FADE = 'fade',
    ZOOM = 'zoom'
}

export interface ScreenShakeConfig {
    intensity: number;
    duration: number;
    frequency: number;
}

export interface FlashConfig {
    color: string;
    intensity: number;
    duration: number;
}

export interface FadeConfig {
    color: string;
    startAlpha: number;
    endAlpha: number;
    duration: number;
}

export interface ZoomConfig {
    startScale: number;
    endScale: number;
    duration: number;
    centerX: number;
    centerY: number;
}

export interface ActiveEffect {
    type: EffectType;
    startTime: number;
    duration: number;
    config: any;
}

import { ComponentTypes } from '../core/Component';

export class VisualEffects implements Component {
    readonly type = ComponentTypes.VISUAL_EFFECTS;

    private activeEffects: Map<EffectType, ActiveEffect> = new Map();
    private screenOffset: Vector2D = { x: 0, y: 0 };

    constructor() {}

    update(_deltaTime: number): void {
        const currentTime = Date.now();

        // Update all active effects
        for (const [effectType, effect] of this.activeEffects.entries()) {
            const elapsed = currentTime - effect.startTime;
            const progress = Math.min(elapsed / effect.duration, 1);

            switch (effectType) {
                case EffectType.SCREEN_SHAKE:
                    this.updateScreenShake(effect, progress);
                    break;
                case EffectType.FLASH:
                    this.updateFlash(effect, progress);
                    break;
                case EffectType.FADE:
                    this.updateFade(effect, progress);
                    break;
                case EffectType.ZOOM:
                    this.updateZoom(effect, progress);
                    break;
            }

            // Remove completed effects
            if (progress >= 1) {
                this.activeEffects.delete(effectType);
                
                // Reset screen offset when shake ends
                if (effectType === EffectType.SCREEN_SHAKE) {
                    this.screenOffset = { x: 0, y: 0 };
                }
            }
        }
    }

    /**
     * Start a screen shake effect
     */
    startScreenShake(config: ScreenShakeConfig): void {
        const effect: ActiveEffect = {
            type: EffectType.SCREEN_SHAKE,
            startTime: Date.now(),
            duration: config.duration,
            config: { ...config }
        };

        this.activeEffects.set(EffectType.SCREEN_SHAKE, effect);
    }

    /**
     * Start a flash effect
     */
    startFlash(config: FlashConfig): void {
        const effect: ActiveEffect = {
            type: EffectType.FLASH,
            startTime: Date.now(),
            duration: config.duration,
            config: { ...config }
        };

        this.activeEffects.set(EffectType.FLASH, effect);
    }

    /**
     * Start a fade effect
     */
    startFade(config: FadeConfig): void {
        const effect: ActiveEffect = {
            type: EffectType.FADE,
            startTime: Date.now(),
            duration: config.duration,
            config: { ...config }
        };

        this.activeEffects.set(EffectType.FADE, effect);
    }

    /**
     * Start a zoom effect
     */
    startZoom(config: ZoomConfig): void {
        const effect: ActiveEffect = {
            type: EffectType.ZOOM,
            startTime: Date.now(),
            duration: config.duration,
            config: { ...config }
        };

        this.activeEffects.set(EffectType.ZOOM, effect);
    }

    /**
     * Update screen shake effect
     */
    private updateScreenShake(effect: ActiveEffect, progress: number): void {
        const config = effect.config as ScreenShakeConfig;
        const intensity = config.intensity * (1 - progress); // Fade out over time
        const time = (Date.now() - effect.startTime) / 1000;
        
        // Generate shake offset using sine waves for smooth movement
        this.screenOffset.x = Math.sin(time * config.frequency * 2) * intensity;
        this.screenOffset.y = Math.cos(time * config.frequency * 1.7) * intensity;
    }

    /**
     * Update flash effect
     */
    private updateFlash(_effect: ActiveEffect, _progress: number): void {
        // Flash effect is handled in the render method
        // This just tracks the progress
    }

    /**
     * Update fade effect
     */
    private updateFade(_effect: ActiveEffect, _progress: number): void {
        // Fade effect is handled in the render method
        // This just tracks the progress
    }

    /**
     * Update zoom effect
     */
    private updateZoom(_effect: ActiveEffect, _progress: number): void {
        // Zoom effect is handled in the render method
        // This just tracks the progress
    }

    /**
     * Get current screen offset for shake effect
     */
    getScreenOffset(): Vector2D {
        return { ...this.screenOffset };
    }

    /**
     * Apply visual effects to the canvas context
     */
    applyEffects(ctx: CanvasRenderingContext2D, _canvasWidth: number, _canvasHeight: number): void {
        // Apply screen shake offset
        if (this.screenOffset.x !== 0 || this.screenOffset.y !== 0) {
            ctx.translate(this.screenOffset.x, this.screenOffset.y);
        }

        // Apply zoom effect
        const zoomEffect = this.activeEffects.get(EffectType.ZOOM);
        if (zoomEffect) {
            const config = zoomEffect.config as ZoomConfig;
            const elapsed = Date.now() - zoomEffect.startTime;
            const progress = Math.min(elapsed / zoomEffect.duration, 1);
            
            const currentScale = config.startScale + (config.endScale - config.startScale) * progress;
            
            ctx.translate(config.centerX, config.centerY);
            ctx.scale(currentScale, currentScale);
            ctx.translate(-config.centerX, -config.centerY);
        }
    }

    /**
     * Render overlay effects (flash, fade)
     */
    renderOverlays(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
        // Render flash effect
        const flashEffect = this.activeEffects.get(EffectType.FLASH);
        if (flashEffect) {
            const config = flashEffect.config as FlashConfig;
            const elapsed = Date.now() - flashEffect.startTime;
            const progress = Math.min(elapsed / flashEffect.duration, 1);
            
            // Flash fades out over time
            const alpha = config.intensity * (1 - progress);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = config.color;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.restore();
        }

        // Render fade effect
        const fadeEffect = this.activeEffects.get(EffectType.FADE);
        if (fadeEffect) {
            const config = fadeEffect.config as FadeConfig;
            const elapsed = Date.now() - fadeEffect.startTime;
            const progress = Math.min(elapsed / fadeEffect.duration, 1);
            
            const alpha = config.startAlpha + (config.endAlpha - config.startAlpha) * progress;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = config.color;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.restore();
        }
    }

    /**
     * Check if a specific effect is active
     */
    isEffectActive(effectType: EffectType): boolean {
        return this.activeEffects.has(effectType);
    }

    /**
     * Get the progress of a specific effect (0-1)
     */
    getEffectProgress(effectType: EffectType): number {
        const effect = this.activeEffects.get(effectType);
        if (!effect) return 0;

        const elapsed = Date.now() - effect.startTime;
        return Math.min(elapsed / effect.duration, 1);
    }

    /**
     * Stop a specific effect
     */
    stopEffect(effectType: EffectType): void {
        this.activeEffects.delete(effectType);
        
        if (effectType === EffectType.SCREEN_SHAKE) {
            this.screenOffset = { x: 0, y: 0 };
        }
    }

    /**
     * Stop all effects
     */
    stopAllEffects(): void {
        this.activeEffects.clear();
        this.screenOffset = { x: 0, y: 0 };
    }

    /**
     * Create a small screen shake for weapon firing
     */
    createWeaponShake(): void {
        this.startScreenShake({
            intensity: 2,
            duration: 100,
            frequency: 30
        });
    }

    /**
     * Create a medium screen shake for impacts
     */
    createImpactShake(): void {
        this.startScreenShake({
            intensity: 5,
            duration: 200,
            frequency: 25
        });
    }

    /**
     * Create a strong screen shake for explosions
     */
    createExplosionShake(intensity: number = 1): void {
        this.startScreenShake({
            intensity: 10 * intensity,
            duration: 300 * intensity,
            frequency: 20
        });
    }

    /**
     * Create a white flash for explosions
     */
    createExplosionFlash(): void {
        this.startFlash({
            color: '#ffffff',
            intensity: 0.6,
            duration: 150
        });
    }

    /**
     * Create a red flash for damage
     */
    createDamageFlash(): void {
        this.startFlash({
            color: '#ff4444',
            intensity: 0.4,
            duration: 100
        });
    }

    /**
     * Create a fade to black effect
     */
    createFadeToBlack(duration: number = 1000): void {
        this.startFade({
            color: '#000000',
            startAlpha: 0,
            endAlpha: 1,
            duration
        });
    }

    /**
     * Create a fade from black effect
     */
    createFadeFromBlack(duration: number = 1000): void {
        this.startFade({
            color: '#000000',
            startAlpha: 1,
            endAlpha: 0,
            duration
        });
    }
}