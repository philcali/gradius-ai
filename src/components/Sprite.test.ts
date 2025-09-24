import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Sprite } from './Sprite.js';
import { ComponentTypes } from '../core/Component.js';

// Mock HTMLImageElement
global.Image = class {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src: string = '';
  width: number = 0;
  height: number = 0;
  complete: boolean = false;

  constructor() {
    // Simulate async loading
    setTimeout(() => {
      this.width = 64;
      this.height = 64;
      this.complete = true;
      if (this.onload) this.onload();
    }, 0);
  }
} as any;

describe('Sprite Component', () => {
  let sprite: Sprite;

  beforeEach(() => {
    sprite = new Sprite(32, 32);
  });

  describe('Constructor', () => {
    it('should create with default values', () => {
      expect(sprite.type).toBe(ComponentTypes.SPRITE);
      expect(sprite.width).toBe(32);
      expect(sprite.height).toBe(32);
      expect(sprite.visible).toBe(true);
      expect(sprite.alpha).toBe(1.0);
      expect(sprite.layer).toBe(0);
      expect(sprite.anchorX).toBe(0.5);
      expect(sprite.anchorY).toBe(0.5);
    });

    it('should create with custom dimensions', () => {
      const customSprite = new Sprite(64, 48);
      expect(customSprite.width).toBe(64);
      expect(customSprite.height).toBe(48);
    });
  });

  describe('Source Rectangle', () => {
    it('should set source rectangle correctly', () => {
      sprite.setSourceRect(10, 20, 30, 40);
      expect(sprite.sourceRect).toEqual({ x: 10, y: 20, width: 30, height: 40 });
    });
  });  describe
('Animation', () => {
    it('should setup animation correctly', () => {
      sprite.setupAnimation(4, 16, 16, 200);
      expect(sprite.frameCount).toBe(4);
      expect(sprite.frameTime).toBe(200);
      expect(sprite.currentFrame).toBe(0);
      expect(sprite.sourceRect).toEqual({ x: 0, y: 0, width: 16, height: 16 });
    });

    it('should play animation', () => {
      sprite.setupAnimation(3, 16, 16, 100);
      sprite.play();
      expect(sprite.playing).toBe(true);
    });

    it('should stop animation and reset frame', () => {
      sprite.setupAnimation(3, 16, 16, 100);
      sprite.setFrame(2);
      sprite.stop();
      expect(sprite.playing).toBe(false);
      expect(sprite.currentFrame).toBe(0);
    });

    it('should pause animation without resetting frame', () => {
      sprite.setupAnimation(3, 16, 16, 100);
      sprite.setFrame(1);
      sprite.pause();
      expect(sprite.playing).toBe(false);
      expect(sprite.currentFrame).toBe(1);
    });

    it('should advance frames during update', () => {
      sprite.setupAnimation(3, 16, 16, 100);
      sprite.play();
      
      sprite.update(100); // Should advance to frame 1
      expect(sprite.currentFrame).toBe(1);
      
      sprite.update(100); // Should advance to frame 2
      expect(sprite.currentFrame).toBe(2);
      
      sprite.update(100); // Should loop back to frame 0
      expect(sprite.currentFrame).toBe(0);
    });

    it('should not loop when loop is false', () => {
      sprite.setupAnimation(2, 16, 16, 100);
      sprite.loop = false;
      sprite.play();
      
      sprite.update(100); // Frame 1
      sprite.update(100); // Should stay at frame 1 and stop playing
      
      expect(sprite.currentFrame).toBe(1);
      expect(sprite.playing).toBe(false);
    });
  });

  describe('Properties', () => {
    it('should set visibility', () => {
      sprite.setVisible(false);
      expect(sprite.visible).toBe(false);
    });

    it('should clamp alpha between 0 and 1', () => {
      sprite.setAlpha(1.5);
      expect(sprite.alpha).toBe(1);
      
      sprite.setAlpha(-0.5);
      expect(sprite.alpha).toBe(0);
      
      sprite.setAlpha(0.7);
      expect(sprite.alpha).toBe(0.7);
    });

    it('should set tint color', () => {
      sprite.setTint('#ff0000');
      expect(sprite.tint).toBe('#ff0000');
      
      sprite.setTint(null);
      expect(sprite.tint).toBe(null);
    });

    it('should set render layer', () => {
      sprite.setLayer(5);
      expect(sprite.layer).toBe(5);
    });

    it('should set anchor point', () => {
      sprite.setAnchor(0.2, 0.8);
      expect(sprite.anchorX).toBe(0.2);
      expect(sprite.anchorY).toBe(0.8);
    });
  });

  describe('Clone', () => {
    it('should create a copy with same properties', () => {
      sprite.setVisible(false);
      sprite.setAlpha(0.5);
      sprite.setTint('#00ff00');
      sprite.setLayer(3);
      sprite.setAnchor(0.3, 0.7);
      sprite.setupAnimation(2, 16, 16, 150);

      const clone = sprite.clone();
      
      expect(clone.visible).toBe(sprite.visible);
      expect(clone.alpha).toBe(sprite.alpha);
      expect(clone.tint).toBe(sprite.tint);
      expect(clone.layer).toBe(sprite.layer);
      expect(clone.anchorX).toBe(sprite.anchorX);
      expect(clone.anchorY).toBe(sprite.anchorY);
      expect(clone.frameCount).toBe(sprite.frameCount);
      expect(clone.frameTime).toBe(sprite.frameTime);
      
      // Ensure it's a different object
      expect(clone).not.toBe(sprite);
    });
  });
});