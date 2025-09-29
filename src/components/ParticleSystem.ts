/**
 * ParticleSystem component manages particle effects like explosions, muzzle flashes, etc.
 */

import { Component, Vector2D } from '../core/interfaces';

export enum ParticleType {
    EXPLOSION = 'explosion',
    MUZZLE_FLASH = 'muzzle_flash',
    IMPACT = 'impact',
    DEBRIS = 'debris',
    SPARK = 'spark',
    SMOKE = 'smoke'
}

export interface ParticleConfig {
    type: ParticleType;
    position: Vector2D;
    velocity: Vector2D;
    acceleration: Vector2D;
    color: string;
    size: number;
    life: number;
    maxLife: number;
    alpha: number;
    rotation: number;
    rotationSpeed: number;
    scale: number;
    scaleSpeed: number;
    gravity: number;
}

export interface ParticleEmitterConfig {
    type: ParticleType;
    particleCount: number;
    duration: number;
    position: Vector2D;
    spread: number;
    speed: { min: number; max: number };
    size: { min: number; max: number };
    life: { min: number; max: number };
    colors: string[];
    gravity: number;
    fadeOut: boolean;
    shrink: boolean;
}

export class Particle {
    public config: ParticleConfig;
    public alive: boolean = true;

    constructor(config: ParticleConfig) {
        this.config = { ...config };
    }

    update(deltaTime: number): void {
        if (!this.alive) return;

        const dt = deltaTime / 1000; // Convert to seconds

        // Update position
        this.config.position.x += this.config.velocity.x * dt;
        this.config.position.y += this.config.velocity.y * dt;

        // Apply acceleration
        this.config.velocity.x += this.config.acceleration.x * dt;
        this.config.velocity.y += this.config.acceleration.y * dt;

        // Apply gravity
        this.config.velocity.y += this.config.gravity * dt;

        // Update rotation
        this.config.rotation += this.config.rotationSpeed * dt;

        // Update scale
        this.config.scale += this.config.scaleSpeed * dt;
        this.config.scale = Math.max(0, this.config.scale);

        // Update life
        this.config.life -= deltaTime;

        // Update alpha based on life remaining
        const lifeRatio = this.config.life / this.config.maxLife;
        this.config.alpha = Math.max(0, lifeRatio);

        // Check if particle should die
        if (this.config.life <= 0 || this.config.scale <= 0) {
            this.alive = false;
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        if (!this.alive || this.config.alpha <= 0) return;

        ctx.save();

        // Set alpha
        ctx.globalAlpha = this.config.alpha;

        // Move to particle position
        ctx.translate(this.config.position.x, this.config.position.y);

        // Apply rotation
        if (this.config.rotation !== 0) {
            ctx.rotate(this.config.rotation);
        }

        // Apply scale
        if (this.config.scale !== 1) {
            ctx.scale(this.config.scale, this.config.scale);
        }

        // Render based on particle type
        this.renderParticle(ctx);

        ctx.restore();
    }

    private renderParticle(ctx: CanvasRenderingContext2D): void {
        const size = this.config.size;
        
        switch (this.config.type) {
            case ParticleType.EXPLOSION:
                // Render as filled circle with gradient
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
                gradient.addColorStop(0, this.config.color);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();
                break;

            case ParticleType.MUZZLE_FLASH:
                // Render as bright star shape
                ctx.fillStyle = this.config.color;
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const angle = (i * Math.PI) / 4;
                    const radius = i % 2 === 0 ? size : size * 0.5;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                break;

            case ParticleType.IMPACT:
                // Render as small bright circle
                ctx.fillStyle = this.config.color;
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();
                break;

            case ParticleType.DEBRIS:
                // Render as small rectangle
                ctx.fillStyle = this.config.color;
                ctx.fillRect(-size/2, -size/2, size, size);
                break;

            case ParticleType.SPARK:
                // Render as line with trail
                ctx.strokeStyle = this.config.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-size, 0);
                ctx.lineTo(size, 0);
                ctx.stroke();
                break;

            case ParticleType.SMOKE:
                // Render as soft circle
                const smokeGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
                smokeGradient.addColorStop(0, this.config.color);
                smokeGradient.addColorStop(1, 'transparent');
                ctx.fillStyle = smokeGradient;
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();
                break;

            default:
                // Default: simple circle
                ctx.fillStyle = this.config.color;
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
    }
}

import { ComponentTypes } from '../core/Component';

export class ParticleSystem implements Component {
    readonly type = ComponentTypes.PARTICLE_SYSTEM;

    private particles: Particle[] = [];
    private emitters: Array<{
        config: ParticleEmitterConfig;
        timeRemaining: number;
        lastEmit: number;
    }> = [];

    constructor() {}

    update(deltaTime: number): void {
        // Update existing particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(deltaTime);
            
            if (!particle.alive) {
                this.particles.splice(i, 1);
            }
        }

        // Update emitters
        for (let i = this.emitters.length - 1; i >= 0; i--) {
            const emitter = this.emitters[i];
            emitter.timeRemaining -= deltaTime;
            
            // Emit particles if it's time
            const emitInterval = emitter.config.duration / emitter.config.particleCount;
            if (Date.now() - emitter.lastEmit >= emitInterval) {
                this.emitParticle(emitter.config);
                emitter.lastEmit = Date.now();
            }
            
            // Remove expired emitters
            if (emitter.timeRemaining <= 0) {
                this.emitters.splice(i, 1);
            }
        }
    }

    /**
     * Add a particle emitter
     */
    addEmitter(config: ParticleEmitterConfig): void {
        this.emitters.push({
            config: { ...config },
            timeRemaining: config.duration,
            lastEmit: 0
        });
        
        // Emit initial particles immediately
        const particlesPerEmit = Math.ceil(config.particleCount / Math.max(1, config.duration / 50));
        for (let i = 0; i < particlesPerEmit; i++) {
            this.emitParticle(config);
        }
    }

    /**
     * Create an explosion effect
     */
    createExplosion(position: Vector2D, intensity: number = 1): void {
        const config: ParticleEmitterConfig = {
            type: ParticleType.EXPLOSION,
            particleCount: Math.floor(20 * intensity),
            duration: 100,
            position: { ...position },
            spread: Math.PI * 2,
            speed: { min: 50 * intensity, max: 150 * intensity },
            size: { min: 3 * intensity, max: 8 * intensity },
            life: { min: 500, max: 1000 },
            colors: ['#ff4444', '#ff8844', '#ffaa44', '#ffffff'],
            gravity: 0,
            fadeOut: true,
            shrink: true
        };
        
        this.addEmitter(config);
        
        // Add some debris particles
        const debrisConfig: ParticleEmitterConfig = {
            type: ParticleType.DEBRIS,
            particleCount: Math.floor(10 * intensity),
            duration: 50,
            position: { ...position },
            spread: Math.PI * 2,
            speed: { min: 30 * intensity, max: 100 * intensity },
            size: { min: 2, max: 4 },
            life: { min: 800, max: 1500 },
            colors: ['#666666', '#888888', '#aaaaaa'],
            gravity: 100,
            fadeOut: true,
            shrink: false
        };
        
        this.addEmitter(debrisConfig);
    }

    /**
     * Create a muzzle flash effect
     */
    createMuzzleFlash(position: Vector2D, _direction: Vector2D): void {
        const config: ParticleEmitterConfig = {
            type: ParticleType.MUZZLE_FLASH,
            particleCount: 3,
            duration: 50,
            position: { ...position },
            spread: Math.PI / 6,
            speed: { min: 20, max: 40 },
            size: { min: 8, max: 12 },
            life: { min: 100, max: 200 },
            colors: ['#ffffff', '#ffff88', '#ffaa44'],
            gravity: 0,
            fadeOut: true,
            shrink: true
        };
        
        this.addEmitter(config);
    }

    /**
     * Create an impact effect
     */
    createImpact(position: Vector2D): void {
        const config: ParticleEmitterConfig = {
            type: ParticleType.IMPACT,
            particleCount: 8,
            duration: 50,
            position: { ...position },
            spread: Math.PI * 2,
            speed: { min: 30, max: 80 },
            size: { min: 2, max: 4 },
            life: { min: 200, max: 400 },
            colors: ['#ffffff', '#ffff88', '#88ffff'],
            gravity: 0,
            fadeOut: true,
            shrink: true
        };
        
        this.addEmitter(config);
        
        // Add sparks
        const sparkConfig: ParticleEmitterConfig = {
            type: ParticleType.SPARK,
            particleCount: 5,
            duration: 30,
            position: { ...position },
            spread: Math.PI * 2,
            speed: { min: 50, max: 120 },
            size: { min: 4, max: 8 },
            life: { min: 150, max: 300 },
            colors: ['#ffffff', '#ffff88'],
            gravity: 0,
            fadeOut: true,
            shrink: true
        };
        
        this.addEmitter(sparkConfig);
    }

    /**
     * Emit a single particle from an emitter configuration
     */
    private emitParticle(emitterConfig: ParticleEmitterConfig): void {
        const angle = Math.random() * emitterConfig.spread - emitterConfig.spread / 2;
        const speed = emitterConfig.speed.min + Math.random() * (emitterConfig.speed.max - emitterConfig.speed.min);
        const size = emitterConfig.size.min + Math.random() * (emitterConfig.size.max - emitterConfig.size.min);
        const life = emitterConfig.life.min + Math.random() * (emitterConfig.life.max - emitterConfig.life.min);
        const color = emitterConfig.colors[Math.floor(Math.random() * emitterConfig.colors.length)];

        const particle = new Particle({
            type: emitterConfig.type,
            position: { ...emitterConfig.position },
            velocity: {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            },
            acceleration: { x: 0, y: 0 },
            color,
            size,
            life,
            maxLife: life,
            alpha: 1,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 4,
            scale: 1,
            scaleSpeed: emitterConfig.shrink ? -0.5 : 0,
            gravity: emitterConfig.gravity
        });

        this.particles.push(particle);
    }

    /**
     * Render all particles
     */
    render(ctx: CanvasRenderingContext2D): void {
        for (const particle of this.particles) {
            particle.render(ctx);
        }
    }

    /**
     * Get the number of active particles
     */
    getParticleCount(): number {
        return this.particles.length;
    }

    /**
     * Clear all particles and emitters
     */
    clear(): void {
        this.particles.length = 0;
        this.emitters.length = 0;
    }

    /**
     * Check if the system has any active particles or emitters
     */
    isEmpty(): boolean {
        return this.particles.length === 0 && this.emitters.length === 0;
    }
}