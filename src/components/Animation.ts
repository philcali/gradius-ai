/**
 * Animation component handles sprite animations and destruction sequences
 */

import { Component } from '../core/interfaces';

export enum AnimationType {
    LOOP = 'loop',
    ONCE = 'once',
    PING_PONG = 'ping_pong',
    DESTRUCTION = 'destruction'
}

export interface AnimationFrame {
    sourceX: number;
    sourceY: number;
    width: number;
    height: number;
    duration: number;
}

export interface AnimationSequence {
    name: string;
    frames: AnimationFrame[];
    type: AnimationType;
    speed: number; // Speed multiplier
}

import { ComponentTypes } from '../core/Component';

export class Animation implements Component {
    readonly type = ComponentTypes.ANIMATION;

    private sequences: Map<string, AnimationSequence> = new Map();
    private currentSequence: string | null = null;
    private currentFrame: number = 0;
    private frameTime: number = 0;
    private isPlaying: boolean = false;
    private isPingPongReverse: boolean = false;
    private onComplete?: () => void = undefined;

    constructor() {}

    update(deltaTime: number): void {
        if (!this.isPlaying || !this.currentSequence) {
            return;
        }

        const sequence = this.sequences.get(this.currentSequence);
        if (!sequence || sequence.frames.length === 0) {
            return;
        }

        this.frameTime += deltaTime;
        const currentFrameData = sequence.frames[this.currentFrame];
        const frameDuration = currentFrameData.duration / sequence.speed;

        if (this.frameTime >= frameDuration) {
            this.frameTime = 0;
            this.advanceFrame(sequence);
        }
    }

    /**
     * Add an animation sequence
     */
    addSequence(sequence: AnimationSequence): void {
        this.sequences.set(sequence.name, { ...sequence });
    }

    /**
     * Play an animation sequence
     */
    play(sequenceName: string, onComplete?: () => void): boolean {
        const sequence = this.sequences.get(sequenceName);
        if (!sequence) {
            console.warn(`Animation sequence '${sequenceName}' not found`);
            return false;
        }

        this.currentSequence = sequenceName;
        this.currentFrame = 0;
        this.frameTime = 0;
        this.isPlaying = true;
        this.isPingPongReverse = false;
        if (onComplete) {
            this.onComplete = onComplete;
        }

        return true;
    }

    /**
     * Stop the current animation
     */
    stop(): void {
        this.isPlaying = false;
        this.currentSequence = null;
        this.currentFrame = 0;
        this.frameTime = 0;
        this.isPingPongReverse = false;
    }

    /**
     * Pause the current animation
     */
    pause(): void {
        this.isPlaying = false;
    }

    /**
     * Resume the current animation
     */
    resume(): void {
        if (this.currentSequence) {
            this.isPlaying = true;
        }
    }

    /**
     * Get the current frame data
     */
    getCurrentFrame(): AnimationFrame | null {
        if (!this.currentSequence) {
            return null;
        }

        const sequence = this.sequences.get(this.currentSequence);
        if (!sequence || this.currentFrame >= sequence.frames.length) {
            return null;
        }

        return sequence.frames[this.currentFrame];
    }

    /**
     * Get the current sequence name
     */
    getCurrentSequence(): string | null {
        return this.currentSequence;
    }

    /**
     * Check if animation is playing
     */
    getIsPlaying(): boolean {
        return this.isPlaying;
    }

    /**
     * Get current frame index
     */
    getCurrentFrameIndex(): number {
        return this.currentFrame;
    }

    /**
     * Set the current frame
     */
    setFrame(frameIndex: number): void {
        if (!this.currentSequence) {
            return;
        }

        const sequence = this.sequences.get(this.currentSequence);
        if (!sequence) {
            return;
        }

        this.currentFrame = Math.max(0, Math.min(frameIndex, sequence.frames.length - 1));
        this.frameTime = 0;
    }

    /**
     * Advance to the next frame based on animation type
     */
    private advanceFrame(sequence: AnimationSequence): void {
        switch (sequence.type) {
            case AnimationType.LOOP:
                this.currentFrame = (this.currentFrame + 1) % sequence.frames.length;
                break;

            case AnimationType.ONCE:
                if (this.currentFrame < sequence.frames.length - 1) {
                    this.currentFrame++;
                } else {
                    this.isPlaying = false;
                    if (this.onComplete) {
                        this.onComplete();
                    }
                }
                break;

            case AnimationType.PING_PONG:
                if (!this.isPingPongReverse) {
                    if (this.currentFrame < sequence.frames.length - 1) {
                        this.currentFrame++;
                    } else {
                        this.isPingPongReverse = true;
                        this.currentFrame--;
                    }
                } else {
                    if (this.currentFrame > 0) {
                        this.currentFrame--;
                    } else {
                        this.isPingPongReverse = false;
                        this.currentFrame++;
                    }
                }
                break;

            case AnimationType.DESTRUCTION:
                if (this.currentFrame < sequence.frames.length - 1) {
                    this.currentFrame++;
                } else {
                    this.isPlaying = false;
                    if (this.onComplete) {
                        this.onComplete();
                    }
                }
                break;
        }
    }

    /**
     * Create a simple destruction animation sequence
     */
    static createDestructionSequence(
        spriteWidth: number,
        spriteHeight: number,
        frameCount: number = 4,
        frameDuration: number = 100
    ): AnimationSequence {
        const frames: AnimationFrame[] = [];
        
        for (let i = 0; i < frameCount; i++) {
            frames.push({
                sourceX: i * spriteWidth,
                sourceY: 0,
                width: spriteWidth,
                height: spriteHeight,
                duration: frameDuration
            });
        }

        return {
            name: 'destruction',
            frames,
            type: AnimationType.DESTRUCTION,
            speed: 1
        };
    }

    /**
     * Create a muzzle flash animation sequence
     */
    static createMuzzleFlashSequence(
        spriteWidth: number,
        spriteHeight: number,
        frameCount: number = 3,
        frameDuration: number = 50
    ): AnimationSequence {
        const frames: AnimationFrame[] = [];
        
        for (let i = 0; i < frameCount; i++) {
            frames.push({
                sourceX: i * spriteWidth,
                sourceY: 0,
                width: spriteWidth,
                height: spriteHeight,
                duration: frameDuration
            });
        }

        return {
            name: 'muzzle_flash',
            frames,
            type: AnimationType.ONCE,
            speed: 1
        };
    }

    /**
     * Create an explosion animation sequence
     */
    static createExplosionSequence(
        spriteWidth: number,
        spriteHeight: number,
        frameCount: number = 6,
        frameDuration: number = 80
    ): AnimationSequence {
        const frames: AnimationFrame[] = [];
        
        for (let i = 0; i < frameCount; i++) {
            frames.push({
                sourceX: i * spriteWidth,
                sourceY: 0,
                width: spriteWidth,
                height: spriteHeight,
                duration: frameDuration
            });
        }

        return {
            name: 'explosion',
            frames,
            type: AnimationType.ONCE,
            speed: 1
        };
    }

    /**
     * Create a shield effect animation sequence
     */
    static createShieldSequence(
        spriteWidth: number,
        spriteHeight: number,
        frameCount: number = 8,
        frameDuration: number = 100
    ): AnimationSequence {
        const frames: AnimationFrame[] = [];
        
        for (let i = 0; i < frameCount; i++) {
            frames.push({
                sourceX: i * spriteWidth,
                sourceY: 0,
                width: spriteWidth,
                height: spriteHeight,
                duration: frameDuration
            });
        }

        return {
            name: 'shield',
            frames,
            type: AnimationType.LOOP,
            speed: 1
        };
    }

    /**
     * Get all available sequences
     */
    getSequences(): string[] {
        return Array.from(this.sequences.keys());
    }

    /**
     * Check if a sequence exists
     */
    hasSequence(sequenceName: string): boolean {
        return this.sequences.has(sequenceName);
    }

    /**
     * Remove a sequence
     */
    removeSequence(sequenceName: string): boolean {
        return this.sequences.delete(sequenceName);
    }

    /**
     * Clear all sequences
     */
    clearSequences(): void {
        this.sequences.clear();
        this.stop();
    }
}