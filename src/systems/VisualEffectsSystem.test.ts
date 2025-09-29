/**
 * Unit tests for VisualEffectsSystem
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VisualEffectsSystem } from './VisualEffectsSystem';
import { Entity } from '../core/Entity';
import { ComponentTypes } from '../core/Component';
import { ParticleSystem } from '../components/ParticleSystem';
import { VisualEffects } from '../components/VisualEffects';
import { Animation, AnimationType } from '../components/Animation';
import { Sprite } from '../components/Sprite';

// Mock canvas context
const createMockContext = () => ({
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    lineWidth: 1,
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    drawImage: vi.fn(),
    createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn()
    }))
});

describe('VisualEffectsSystem', () => {
    let system: VisualEffectsSystem;
    let mockCtx: any;
    let entities: Entity[];

    beforeEach(() => {
        mockCtx = createMockContext();
        system = new VisualEffectsSystem(mockCtx, 800, 600);
        entities = [];
    });

    describe('System Interface', () => {
        it('should have correct system name', () => {
            expect(system.name).toBe('VisualEffectsSystem');
        });

        it('should implement update method', () => {
            expect(typeof system.update).toBe('function');
        });

        it('should implement render method', () => {
            expect(typeof system.render).toBe('function');
        });
    });

    describe('Entity Filtering', () => {
        it('should filter entities with particle systems', () => {
            const entity = new Entity();
            entity.addComponent(new ParticleSystem());
            
            expect(system.filter(entity)).toBe(true);
        });

        it('should filter entities with visual effects', () => {
            const entity = new Entity();
            entity.addComponent(new VisualEffects());
            
            expect(system.filter(entity)).toBe(true);
        });

        it('should filter entities with animations', () => {
            const entity = new Entity();
            entity.addComponent(new Animation());
            
            expect(system.filter(entity)).toBe(true);
        });

        it('should not filter entities without visual effects components', () => {
            const entity = new Entity();
            
            expect(system.filter(entity)).toBe(false);
        });
    });

    describe('System Updates', () => {
        it('should update particle systems', () => {
            const entity = new Entity();
            const particleSystem = new ParticleSystem();
            const updateSpy = vi.spyOn(particleSystem, 'update');
            
            entity.addComponent(particleSystem);
            entities.push(entity);

            system.update(entities, 16);

            expect(updateSpy).toHaveBeenCalledWith(16);
        });

        it('should update visual effects', () => {
            const entity = new Entity();
            const visualEffects = new VisualEffects();
            const updateSpy = vi.spyOn(visualEffects, 'update');
            
            entity.addComponent(visualEffects);
            entities.push(entity);

            system.update(entities, 16);

            expect(updateSpy).toHaveBeenCalledWith(16);
        });

        it('should update animations', () => {
            const entity = new Entity();
            const animation = new Animation();
            const updateSpy = vi.spyOn(animation, 'update');
            
            entity.addComponent(animation);
            entities.push(entity);

            system.update(entities, 16);

            expect(updateSpy).toHaveBeenCalledWith(16);
        });

        it('should update sprite based on animation frame', () => {
            const entity = new Entity();
            const animation = new Animation();
            const sprite = new Sprite();
            
            // Add animation sequence
            const sequence = {
                name: 'test',
                frames: [
                    { sourceX: 0, sourceY: 0, width: 32, height: 32, duration: 100 },
                    { sourceX: 32, sourceY: 0, width: 32, height: 32, duration: 100 }
                ],
                type: AnimationType.LOOP,
                speed: 1
            };
            animation.addSequence(sequence);
            animation.play('test');
            
            entity.addComponent(animation);
            entity.addComponent(sprite);
            entities.push(entity);

            system.update(entities, 16);

            // Sprite should be updated with current frame
            expect(sprite.sourceRect.x).toBe(0);
            expect(sprite.sourceRect.y).toBe(0);
            expect(sprite.sourceRect.width).toBe(32);
            expect(sprite.sourceRect.height).toBe(32);
        });
    });

    describe('Effect Creation', () => {
        beforeEach(() => {
            // Create entities with required components
            const particleEntity = new Entity();
            particleEntity.addComponent(new ParticleSystem());
            entities.push(particleEntity);

            const visualEffectsEntity = new Entity();
            visualEffectsEntity.addComponent(new VisualEffects());
            entities.push(visualEffectsEntity);
        });

        it('should create explosion effects', () => {
            const position = { x: 100, y: 100 };
            
            system.createExplosion(entities, position, 1);

            const particleEntity = entities.find(e => e.hasComponent(ComponentTypes.PARTICLE_SYSTEM));
            const particleSystem = particleEntity?.getComponent<ParticleSystem>(ComponentTypes.PARTICLE_SYSTEM);
            expect(particleSystem?.getParticleCount()).toBeGreaterThan(0);

            const visualEffectsEntity = entities.find(e => e.hasComponent(ComponentTypes.VISUAL_EFFECTS));
            const visualEffects = visualEffectsEntity?.getComponent<VisualEffects>(ComponentTypes.VISUAL_EFFECTS);
            expect(visualEffects?.isEffectActive('screen_shake' as any)).toBe(true);
        });

        it('should create muzzle flash effects', () => {
            const position = { x: 50, y: 50 };
            const direction = { x: 1, y: 0 };
            
            system.createMuzzleFlash(entities, position, direction);

            const particleEntity = entities.find(e => e.hasComponent(ComponentTypes.PARTICLE_SYSTEM));
            const particleSystem = particleEntity?.getComponent<ParticleSystem>(ComponentTypes.PARTICLE_SYSTEM);
            expect(particleSystem?.getParticleCount()).toBeGreaterThan(0);
        });

        it('should create impact effects', () => {
            const position = { x: 75, y: 75 };
            
            system.createImpact(entities, position);

            const particleEntity = entities.find(e => e.hasComponent(ComponentTypes.PARTICLE_SYSTEM));
            const particleSystem = particleEntity?.getComponent<ParticleSystem>(ComponentTypes.PARTICLE_SYSTEM);
            expect(particleSystem?.getParticleCount()).toBeGreaterThan(0);
        });

        it('should create damage flash', () => {
            system.createDamageFlash(entities);

            const visualEffectsEntity = entities.find(e => e.hasComponent(ComponentTypes.VISUAL_EFFECTS));
            const visualEffects = visualEffectsEntity?.getComponent<VisualEffects>(ComponentTypes.VISUAL_EFFECTS);
            expect(visualEffects?.isEffectActive('flash' as any)).toBe(true);
        });

        it('should create fade effects', () => {
            system.createFadeToBlack(entities, 500);

            const visualEffectsEntity = entities.find(e => e.hasComponent(ComponentTypes.VISUAL_EFFECTS));
            const visualEffects = visualEffectsEntity?.getComponent<VisualEffects>(ComponentTypes.VISUAL_EFFECTS);
            expect(visualEffects?.isEffectActive('fade' as any)).toBe(true);

            system.createFadeFromBlack(entities, 500);
            expect(visualEffects?.isEffectActive('fade' as any)).toBe(true);
        });
    });

    describe('Animation Management', () => {
        it('should start destruction animation', () => {
            const entity = new Entity();
            const animation = new Animation();
            const sprite = new Sprite();
            
            entity.addComponent(animation);
            entity.addComponent(sprite);

            let callbackCalled = false;
            system.startDestructionAnimation(entity, () => {
                callbackCalled = true;
            });

            expect(animation.hasSequence('destruction')).toBe(true);
            expect(animation.getIsPlaying()).toBe(true);
        });

        it('should not start destruction animation without animation component', () => {
            const entity = new Entity();
            
            expect(() => {
                system.startDestructionAnimation(entity);
            }).not.toThrow();
        });
    });

    describe('Rendering', () => {
        it('should render without errors', () => {
            const particleEntity = new Entity();
            particleEntity.addComponent(new ParticleSystem());
            entities.push(particleEntity);

            const visualEffectsEntity = new Entity();
            visualEffectsEntity.addComponent(new VisualEffects());
            entities.push(visualEffectsEntity);

            expect(() => {
                system.render(entities);
            }).not.toThrow();

            expect(mockCtx.save).toHaveBeenCalled();
            expect(mockCtx.restore).toHaveBeenCalled();
        });

        it('should apply visual effects to context', () => {
            const visualEffectsEntity = new Entity();
            const visualEffects = new VisualEffects();
            visualEffects.startScreenShake({
                intensity: 10,
                duration: 500,
                frequency: 20
            });
            
            // Update the visual effects to generate screen offset
            visualEffects.update(100);
            
            visualEffectsEntity.addComponent(visualEffects);
            entities.push(visualEffectsEntity);

            system.render(entities);

            // Should have applied screen shake translation
            expect(mockCtx.translate).toHaveBeenCalled();
        });
    });

    describe('Utility Methods', () => {
        it('should update canvas size', () => {
            system.updateCanvasSize(1024, 768);
            
            // Should not throw and should accept new dimensions
            expect(() => {
                system.render([]);
            }).not.toThrow();
        });

        it('should clear all effects', () => {
            const particleEntity = new Entity();
            const particleSystem = new ParticleSystem();
            particleSystem.createExplosion({ x: 100, y: 100 }, 1);
            particleEntity.addComponent(particleSystem);
            entities.push(particleEntity);

            const visualEffectsEntity = new Entity();
            const visualEffects = new VisualEffects();
            visualEffects.startScreenShake({
                intensity: 10,
                duration: 500,
                frequency: 20
            });
            visualEffectsEntity.addComponent(visualEffects);
            entities.push(visualEffectsEntity);

            const animationEntity = new Entity();
            const animation = new Animation();
            const sequence = {
                name: 'test',
                frames: [
                    { sourceX: 0, sourceY: 0, width: 32, height: 32, duration: 100 }
                ],
                type: AnimationType.LOOP,
                speed: 1
            };
            animation.addSequence(sequence);
            animation.play('test');
            animationEntity.addComponent(animation);
            entities.push(animationEntity);

            // Verify effects are active
            expect(particleSystem.getParticleCount()).toBeGreaterThan(0);
            expect(visualEffects.isEffectActive('screen_shake' as any)).toBe(true);
            expect(animation.getIsPlaying()).toBe(true);

            system.clearAllEffects(entities);

            // Verify effects are cleared
            expect(particleSystem.getParticleCount()).toBe(0);
            expect(visualEffects.isEffectActive('screen_shake' as any)).toBe(false);
            expect(animation.getIsPlaying()).toBe(false);
        });
    });
});