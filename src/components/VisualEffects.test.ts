/**
 * Unit tests for VisualEffects component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VisualEffects, EffectType } from './VisualEffects';

describe('VisualEffects', () => {
    let visualEffects: VisualEffects;

    beforeEach(() => {
        visualEffects = new VisualEffects();
        // Mock Date.now for consistent testing
        vi.spyOn(Date, 'now').mockReturnValue(1000);
    });

    describe('Component Interface', () => {
        it('should have correct component type', () => {
            expect(visualEffects.type).toBe('visual_effects');
        });

        it('should implement update method', () => {
            expect(typeof visualEffects.update).toBe('function');
        });
    });

    describe('Screen Shake Effects', () => {
        it('should start screen shake effect', () => {
            visualEffects.startScreenShake({
                intensity: 10,
                duration: 500,
                frequency: 20
            });

            expect(visualEffects.isEffectActive(EffectType.SCREEN_SHAKE)).toBe(true);
        });

        it('should generate screen offset during shake', () => {
            visualEffects.startScreenShake({
                intensity: 10,
                duration: 500,
                frequency: 20
            });

            visualEffects.update(100);
            const offset = visualEffects.getScreenOffset();
            
            // Should have some offset during shake
            expect(Math.abs(offset.x) + Math.abs(offset.y)).toBeGreaterThan(0);
        });

        it('should end screen shake after duration', () => {
            visualEffects.startScreenShake({
                intensity: 10,
                duration: 500,
                frequency: 20
            });

            // Mock time progression
            vi.spyOn(Date, 'now').mockReturnValue(1600); // 600ms later
            visualEffects.update(100);

            expect(visualEffects.isEffectActive(EffectType.SCREEN_SHAKE)).toBe(false);
            
            const offset = visualEffects.getScreenOffset();
            expect(offset.x).toBe(0);
            expect(offset.y).toBe(0);
        });

        it('should provide convenience methods for different shake types', () => {
            visualEffects.createWeaponShake();
            expect(visualEffects.isEffectActive(EffectType.SCREEN_SHAKE)).toBe(true);

            visualEffects.stopAllEffects();
            visualEffects.createImpactShake();
            expect(visualEffects.isEffectActive(EffectType.SCREEN_SHAKE)).toBe(true);

            visualEffects.stopAllEffects();
            visualEffects.createExplosionShake(2);
            expect(visualEffects.isEffectActive(EffectType.SCREEN_SHAKE)).toBe(true);
        });
    });

    describe('Flash Effects', () => {
        it('should start flash effect', () => {
            visualEffects.startFlash({
                color: '#ffffff',
                intensity: 0.8,
                duration: 200
            });

            expect(visualEffects.isEffectActive(EffectType.FLASH)).toBe(true);
        });

        it('should end flash after duration', () => {
            visualEffects.startFlash({
                color: '#ffffff',
                intensity: 0.8,
                duration: 200
            });

            // Mock time progression
            vi.spyOn(Date, 'now').mockReturnValue(1300); // 300ms later
            visualEffects.update(100);

            expect(visualEffects.isEffectActive(EffectType.FLASH)).toBe(false);
        });

        it('should provide convenience methods for different flash types', () => {
            visualEffects.createExplosionFlash();
            expect(visualEffects.isEffectActive(EffectType.FLASH)).toBe(true);

            visualEffects.stopAllEffects();
            visualEffects.createDamageFlash();
            expect(visualEffects.isEffectActive(EffectType.FLASH)).toBe(true);
        });
    });

    describe('Fade Effects', () => {
        it('should start fade effect', () => {
            visualEffects.startFade({
                color: '#000000',
                startAlpha: 0,
                endAlpha: 1,
                duration: 1000
            });

            expect(visualEffects.isEffectActive(EffectType.FADE)).toBe(true);
        });

        it('should end fade after duration', () => {
            visualEffects.startFade({
                color: '#000000',
                startAlpha: 0,
                endAlpha: 1,
                duration: 1000
            });

            // Mock time progression
            vi.spyOn(Date, 'now').mockReturnValue(2100); // 1100ms later
            visualEffects.update(100);

            expect(visualEffects.isEffectActive(EffectType.FADE)).toBe(false);
        });

        it('should provide convenience methods for fade types', () => {
            visualEffects.createFadeToBlack(500);
            expect(visualEffects.isEffectActive(EffectType.FADE)).toBe(true);

            visualEffects.stopAllEffects();
            visualEffects.createFadeFromBlack(500);
            expect(visualEffects.isEffectActive(EffectType.FADE)).toBe(true);
        });
    });

    describe('Zoom Effects', () => {
        it('should start zoom effect', () => {
            visualEffects.startZoom({
                startScale: 1,
                endScale: 1.2,
                duration: 300,
                centerX: 400,
                centerY: 300
            });

            expect(visualEffects.isEffectActive(EffectType.ZOOM)).toBe(true);
        });

        it('should end zoom after duration', () => {
            visualEffects.startZoom({
                startScale: 1,
                endScale: 1.2,
                duration: 300,
                centerX: 400,
                centerY: 300
            });

            // Mock time progression
            vi.spyOn(Date, 'now').mockReturnValue(1400); // 400ms later
            visualEffects.update(100);

            expect(visualEffects.isEffectActive(EffectType.ZOOM)).toBe(false);
        });
    });

    describe('Effect Management', () => {
        it('should track effect progress', () => {
            visualEffects.startFlash({
                color: '#ffffff',
                intensity: 0.8,
                duration: 200
            });

            // Mock time progression to 50%
            vi.spyOn(Date, 'now').mockReturnValue(1100); // 100ms later
            visualEffects.update(50);

            const progress = visualEffects.getEffectProgress(EffectType.FLASH);
            expect(progress).toBeCloseTo(0.5, 1);
        });

        it('should stop specific effects', () => {
            visualEffects.startScreenShake({
                intensity: 10,
                duration: 500,
                frequency: 20
            });
            visualEffects.startFlash({
                color: '#ffffff',
                intensity: 0.8,
                duration: 200
            });

            expect(visualEffects.isEffectActive(EffectType.SCREEN_SHAKE)).toBe(true);
            expect(visualEffects.isEffectActive(EffectType.FLASH)).toBe(true);

            visualEffects.stopEffect(EffectType.SCREEN_SHAKE);

            expect(visualEffects.isEffectActive(EffectType.SCREEN_SHAKE)).toBe(false);
            expect(visualEffects.isEffectActive(EffectType.FLASH)).toBe(true);
        });

        it('should stop all effects', () => {
            visualEffects.startScreenShake({
                intensity: 10,
                duration: 500,
                frequency: 20
            });
            visualEffects.startFlash({
                color: '#ffffff',
                intensity: 0.8,
                duration: 200
            });

            visualEffects.stopAllEffects();

            expect(visualEffects.isEffectActive(EffectType.SCREEN_SHAKE)).toBe(false);
            expect(visualEffects.isEffectActive(EffectType.FLASH)).toBe(false);
        });
    });

    describe('Rendering', () => {
        it('should have apply effects method', () => {
            expect(typeof visualEffects.applyEffects).toBe('function');
        });

        it('should have render overlays method', () => {
            expect(typeof visualEffects.renderOverlays).toBe('function');
        });

        it('should apply effects without errors', () => {
            const mockCtx = {
                translate: vi.fn(),
                scale: vi.fn()
            } as any;

            visualEffects.startScreenShake({
                intensity: 10,
                duration: 500,
                frequency: 20
            });

            expect(() => {
                visualEffects.applyEffects(mockCtx, 800, 600);
            }).not.toThrow();
        });

        it('should render overlays without errors', () => {
            const mockCtx = {
                save: vi.fn(),
                restore: vi.fn(),
                fillStyle: '',
                globalAlpha: 1,
                fillRect: vi.fn()
            } as any;

            visualEffects.startFlash({
                color: '#ffffff',
                intensity: 0.8,
                duration: 200
            });

            expect(() => {
                visualEffects.renderOverlays(mockCtx, 800, 600);
            }).not.toThrow();
        });
    });
});