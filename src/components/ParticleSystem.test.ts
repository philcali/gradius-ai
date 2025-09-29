/**
 * Unit tests for ParticleSystem component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParticleSystem, ParticleType, Particle } from './ParticleSystem';

describe('ParticleSystem', () => {
    let particleSystem: ParticleSystem;

    beforeEach(() => {
        particleSystem = new ParticleSystem();
    });

    describe('Component Interface', () => {
        it('should have correct component type', () => {
            expect(particleSystem.type).toBe('particle_system');
        });

        it('should implement update method', () => {
            expect(typeof particleSystem.update).toBe('function');
        });
    });

    describe('Particle Management', () => {
        it('should start with no particles', () => {
            expect(particleSystem.getParticleCount()).toBe(0);
            expect(particleSystem.isEmpty()).toBe(true);
        });

        it('should create explosion particles', () => {
            const position = { x: 100, y: 100 };
            particleSystem.createExplosion(position, 1);
            
            // Should have particles after creating explosion
            expect(particleSystem.getParticleCount()).toBeGreaterThan(0);
            expect(particleSystem.isEmpty()).toBe(false);
        });

        it('should create muzzle flash particles', () => {
            const position = { x: 50, y: 50 };
            const direction = { x: 1, y: 0 };
            particleSystem.createMuzzleFlash(position, direction);
            
            expect(particleSystem.getParticleCount()).toBeGreaterThan(0);
        });

        it('should create impact particles', () => {
            const position = { x: 75, y: 75 };
            particleSystem.createImpact(position);
            
            expect(particleSystem.getParticleCount()).toBeGreaterThan(0);
        });

        it('should scale explosion intensity', () => {
            const position = { x: 100, y: 100 };
            
            particleSystem.createExplosion(position, 1);
            const normalCount = particleSystem.getParticleCount();
            
            particleSystem.clear();
            particleSystem.createExplosion(position, 2);
            const intensifiedCount = particleSystem.getParticleCount();
            
            expect(intensifiedCount).toBeGreaterThan(normalCount);
        });
    });

    describe('Particle Updates', () => {
        it('should update particles over time', () => {
            const position = { x: 100, y: 100 };
            particleSystem.createExplosion(position, 1);
            
            const initialCount = particleSystem.getParticleCount();
            
            // Update for a short time - may create more particles from emitters
            particleSystem.update(100);
            expect(particleSystem.getParticleCount()).toBeGreaterThanOrEqual(initialCount);
            
            // Update for a long time - particles should expire
            particleSystem.update(5000);
            expect(particleSystem.getParticleCount()).toBeLessThan(initialCount + 10); // Allow for some variance
        });

        it('should remove expired particles', () => {
            const position = { x: 100, y: 100 };
            particleSystem.createExplosion(position, 1);
            
            // Update for a very long time to expire all particles
            for (let i = 0; i < 100; i++) {
                particleSystem.update(100);
            }
            
            expect(particleSystem.getParticleCount()).toBe(0);
            expect(particleSystem.isEmpty()).toBe(true);
        });
    });

    describe('Particle Rendering', () => {
        it('should have render method', () => {
            expect(typeof particleSystem.render).toBe('function');
        });

        it('should render without errors', () => {
            // Create mock canvas context
            const mockCtx = {
                save: vi.fn(),
                restore: vi.fn(),
                translate: vi.fn(),
                rotate: vi.fn(),
                scale: vi.fn(),
                fillStyle: '',
                globalAlpha: 1,
                beginPath: vi.fn(),
                arc: vi.fn(),
                fill: vi.fn(),
                moveTo: vi.fn(),
                lineTo: vi.fn(),
                closePath: vi.fn(),
                fillRect: vi.fn(),
                strokeStyle: '',
                lineWidth: 1,
                stroke: vi.fn(),
                createRadialGradient: vi.fn(() => ({
                    addColorStop: vi.fn()
                }))
            } as any;

            const position = { x: 100, y: 100 };
            particleSystem.createExplosion(position, 1);
            
            expect(() => {
                particleSystem.render(mockCtx);
            }).not.toThrow();
        });
    });

    describe('Utility Methods', () => {
        it('should clear all particles and emitters', () => {
            const position = { x: 100, y: 100 };
            particleSystem.createExplosion(position, 1);
            
            expect(particleSystem.getParticleCount()).toBeGreaterThan(0);
            
            particleSystem.clear();
            
            expect(particleSystem.getParticleCount()).toBe(0);
            expect(particleSystem.isEmpty()).toBe(true);
        });
    });
});

describe('Particle', () => {
    let particle: Particle;

    beforeEach(() => {
        particle = new Particle({
            type: ParticleType.EXPLOSION,
            position: { x: 100, y: 100 },
            velocity: { x: 50, y: -25 },
            acceleration: { x: 0, y: 0 },
            color: '#ff4444',
            size: 5,
            life: 1000,
            maxLife: 1000,
            alpha: 1,
            rotation: 0,
            rotationSpeed: 1,
            scale: 1,
            scaleSpeed: 0,
            gravity: 0
        });
    });

    describe('Particle Lifecycle', () => {
        it('should start alive', () => {
            expect(particle.alive).toBe(true);
        });

        it('should update position based on velocity', () => {
            const initialX = particle.config.position.x;
            const initialY = particle.config.position.y;
            
            particle.update(1000); // 1 second
            
            expect(particle.config.position.x).toBeGreaterThan(initialX);
            expect(particle.config.position.y).toBeLessThan(initialY);
        });

        it('should update rotation', () => {
            const initialRotation = particle.config.rotation;
            
            particle.update(1000); // 1 second
            
            expect(particle.config.rotation).not.toBe(initialRotation);
        });

        it('should decrease life over time', () => {
            const initialLife = particle.config.life;
            
            particle.update(500); // 0.5 seconds
            
            expect(particle.config.life).toBeLessThan(initialLife);
        });

        it('should die when life reaches zero', () => {
            particle.update(1500); // More than max life
            
            expect(particle.alive).toBe(false);
        });

        it('should update alpha based on remaining life', () => {
            particle.update(500); // Half life
            
            expect(particle.config.alpha).toBeCloseTo(0.5, 1);
        });
    });

    describe('Particle Rendering', () => {
        it('should have render method', () => {
            expect(typeof particle.render).toBe('function');
        });

        it('should not render when dead', () => {
            const mockCtx = {
                save: vi.fn(),
                restore: vi.fn()
            } as any;

            particle.alive = false;
            particle.render(mockCtx);
            
            expect(mockCtx.save).not.toHaveBeenCalled();
        });

        it('should not render when alpha is zero', () => {
            const mockCtx = {
                save: vi.fn(),
                restore: vi.fn()
            } as any;

            particle.config.alpha = 0;
            particle.render(mockCtx);
            
            expect(mockCtx.save).not.toHaveBeenCalled();
        });
    });
});