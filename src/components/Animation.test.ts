/**
 * Unit tests for Animation component
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Animation, AnimationType } from './Animation';

describe('Animation', () => {
    let animation: Animation;

    beforeEach(() => {
        animation = new Animation();
    });

    describe('Component Interface', () => {
        it('should have correct component type', () => {
            expect(animation.type).toBe('animation');
        });

        it('should implement update method', () => {
            expect(typeof animation.update).toBe('function');
        });
    });

    describe('Animation Sequences', () => {
        it('should add animation sequences', () => {
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
            expect(animation.hasSequence('test')).toBe(true);
            expect(animation.getSequences()).toContain('test');
        });

        it('should play animation sequences', () => {
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
            const result = animation.play('test');

            expect(result).toBe(true);
            expect(animation.getCurrentSequence()).toBe('test');
            expect(animation.getIsPlaying()).toBe(true);
            expect(animation.getCurrentFrameIndex()).toBe(0);
        });

        it('should not play non-existent sequences', () => {
            const result = animation.play('nonexistent');
            expect(result).toBe(false);
            expect(animation.getIsPlaying()).toBe(false);
        });
    });

    describe('Animation Playback', () => {
        beforeEach(() => {
            const sequence = {
                name: 'test',
                frames: [
                    { sourceX: 0, sourceY: 0, width: 32, height: 32, duration: 100 },
                    { sourceX: 32, sourceY: 0, width: 32, height: 32, duration: 100 },
                    { sourceX: 64, sourceY: 0, width: 32, height: 32, duration: 100 }
                ],
                type: AnimationType.LOOP,
                speed: 1
            };
            animation.addSequence(sequence);
        });

        it('should advance frames over time', () => {
            animation.play('test');
            expect(animation.getCurrentFrameIndex()).toBe(0);

            animation.update(150); // More than frame duration
            expect(animation.getCurrentFrameIndex()).toBe(1);

            animation.update(150);
            expect(animation.getCurrentFrameIndex()).toBe(2);
        });

        it('should loop animation when type is LOOP', () => {
            animation.play('test');
            
            // Advance through all frames
            animation.update(150);
            animation.update(150);
            animation.update(150); // Should loop back to frame 0
            
            expect(animation.getCurrentFrameIndex()).toBe(0);
            expect(animation.getIsPlaying()).toBe(true);
        });

        it('should stop animation when type is ONCE', () => {
            const sequence = {
                name: 'once',
                frames: [
                    { sourceX: 0, sourceY: 0, width: 32, height: 32, duration: 100 },
                    { sourceX: 32, sourceY: 0, width: 32, height: 32, duration: 100 }
                ],
                type: AnimationType.ONCE,
                speed: 1
            };
            animation.addSequence(sequence);
            animation.play('once');

            animation.update(150); // Advance to last frame
            expect(animation.getCurrentFrameIndex()).toBe(1);
            expect(animation.getIsPlaying()).toBe(true);

            animation.update(150); // Should stop
            expect(animation.getIsPlaying()).toBe(false);
        });

        it('should ping pong animation when type is PING_PONG', () => {
            const sequence = {
                name: 'pingpong',
                frames: [
                    { sourceX: 0, sourceY: 0, width: 32, height: 32, duration: 100 },
                    { sourceX: 32, sourceY: 0, width: 32, height: 32, duration: 100 },
                    { sourceX: 64, sourceY: 0, width: 32, height: 32, duration: 100 }
                ],
                type: AnimationType.PING_PONG,
                speed: 1
            };
            animation.addSequence(sequence);
            animation.play('pingpong');

            // Forward direction
            animation.update(150);
            expect(animation.getCurrentFrameIndex()).toBe(1);
            animation.update(150);
            expect(animation.getCurrentFrameIndex()).toBe(2);

            // Should reverse
            animation.update(150);
            expect(animation.getCurrentFrameIndex()).toBe(1);
            animation.update(150);
            expect(animation.getCurrentFrameIndex()).toBe(0);

            // Should go forward again
            animation.update(150);
            expect(animation.getCurrentFrameIndex()).toBe(1);
        });

        it('should call completion callback for ONCE animations', () => {
            let callbackCalled = false;
            const sequence = {
                name: 'once',
                frames: [
                    { sourceX: 0, sourceY: 0, width: 32, height: 32, duration: 100 }
                ],
                type: AnimationType.ONCE,
                speed: 1
            };
            animation.addSequence(sequence);
            animation.play('once', () => {
                callbackCalled = true;
            });

            animation.update(150); // Should complete
            expect(callbackCalled).toBe(true);
        });
    });

    describe('Animation Control', () => {
        beforeEach(() => {
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
        });

        it('should stop animation', () => {
            expect(animation.getIsPlaying()).toBe(true);
            
            animation.stop();
            
            expect(animation.getIsPlaying()).toBe(false);
            expect(animation.getCurrentFrameIndex()).toBe(0);
        });

        it('should pause and resume animation', () => {
            expect(animation.getIsPlaying()).toBe(true);
            
            animation.pause();
            expect(animation.getIsPlaying()).toBe(false);
            
            animation.resume();
            expect(animation.getIsPlaying()).toBe(true);
        });

        it('should set specific frame', () => {
            animation.setFrame(1);
            expect(animation.getCurrentFrameIndex()).toBe(1);
            
            // Should clamp to valid range
            animation.setFrame(10);
            expect(animation.getCurrentFrameIndex()).toBe(1); // Max frame index
            
            animation.setFrame(-1);
            expect(animation.getCurrentFrameIndex()).toBe(0); // Min frame index
        });
    });

    describe('Frame Data', () => {
        beforeEach(() => {
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
        });

        it('should return current frame data', () => {
            const frame = animation.getCurrentFrame();
            expect(frame).not.toBeNull();
            expect(frame?.sourceX).toBe(0);
            expect(frame?.sourceY).toBe(0);
            expect(frame?.width).toBe(32);
            expect(frame?.height).toBe(32);
        });

        it('should return null for no current sequence', () => {
            animation.stop();
            const frame = animation.getCurrentFrame();
            expect(frame).toBeNull();
        });
    });

    describe('Static Factory Methods', () => {
        it('should create destruction sequence', () => {
            const sequence = Animation.createDestructionSequence(32, 32, 4, 100);
            
            expect(sequence.name).toBe('destruction');
            expect(sequence.type).toBe(AnimationType.DESTRUCTION);
            expect(sequence.frames).toHaveLength(4);
            expect(sequence.frames[0].width).toBe(32);
            expect(sequence.frames[0].height).toBe(32);
            expect(sequence.frames[0].duration).toBe(100);
        });

        it('should create muzzle flash sequence', () => {
            const sequence = Animation.createMuzzleFlashSequence(16, 16, 3, 50);
            
            expect(sequence.name).toBe('muzzle_flash');
            expect(sequence.type).toBe(AnimationType.ONCE);
            expect(sequence.frames).toHaveLength(3);
            expect(sequence.frames[0].width).toBe(16);
            expect(sequence.frames[0].height).toBe(16);
            expect(sequence.frames[0].duration).toBe(50);
        });

        it('should create explosion sequence', () => {
            const sequence = Animation.createExplosionSequence(48, 48, 6, 80);
            
            expect(sequence.name).toBe('explosion');
            expect(sequence.type).toBe(AnimationType.ONCE);
            expect(sequence.frames).toHaveLength(6);
            expect(sequence.frames[0].width).toBe(48);
            expect(sequence.frames[0].height).toBe(48);
            expect(sequence.frames[0].duration).toBe(80);
        });

        it('should create shield sequence', () => {
            const sequence = Animation.createShieldSequence(64, 64, 8, 100);
            
            expect(sequence.name).toBe('shield');
            expect(sequence.type).toBe(AnimationType.LOOP);
            expect(sequence.frames).toHaveLength(8);
            expect(sequence.frames[0].width).toBe(64);
            expect(sequence.frames[0].height).toBe(64);
            expect(sequence.frames[0].duration).toBe(100);
        });
    });

    describe('Sequence Management', () => {
        it('should remove sequences', () => {
            const sequence = {
                name: 'test',
                frames: [
                    { sourceX: 0, sourceY: 0, width: 32, height: 32, duration: 100 }
                ],
                type: AnimationType.LOOP,
                speed: 1
            };
            animation.addSequence(sequence);
            
            expect(animation.hasSequence('test')).toBe(true);
            
            const removed = animation.removeSequence('test');
            expect(removed).toBe(true);
            expect(animation.hasSequence('test')).toBe(false);
        });

        it('should clear all sequences', () => {
            const sequence1 = {
                name: 'test1',
                frames: [
                    { sourceX: 0, sourceY: 0, width: 32, height: 32, duration: 100 }
                ],
                type: AnimationType.LOOP,
                speed: 1
            };
            const sequence2 = {
                name: 'test2',
                frames: [
                    { sourceX: 0, sourceY: 0, width: 32, height: 32, duration: 100 }
                ],
                type: AnimationType.LOOP,
                speed: 1
            };
            
            animation.addSequence(sequence1);
            animation.addSequence(sequence2);
            animation.play('test1');
            
            expect(animation.getSequences()).toHaveLength(2);
            expect(animation.getIsPlaying()).toBe(true);
            
            animation.clearSequences();
            
            expect(animation.getSequences()).toHaveLength(0);
            expect(animation.getIsPlaying()).toBe(false);
        });
    });
});