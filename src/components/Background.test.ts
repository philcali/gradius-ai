import { describe, it, expect, beforeEach } from 'vitest';
import { Background } from './Background';
import { ComponentTypes } from '../core/Component';

describe('Background Component', () => {
  let background: Background;

  beforeEach(() => {
    background = new Background(800, 600, 100, 1.0, 0);
  });

  describe('Constructor', () => {
    it('should create a background with correct properties', () => {
      expect(background.type).toBe(ComponentTypes.BACKGROUND);
      expect(background.width).toBe(800);
      expect(background.height).toBe(600);
      expect(background.scrollSpeed).toBe(100);
      expect(background.parallaxFactor).toBe(1.0);
      expect(background.layer).toBe(0);
      expect(background.scrollOffset).toBe(0);
      expect(background.visible).toBe(true);
      expect(background.alpha).toBe(1.0);
      expect(background.seamlessTiling).toBe(true);
    });

    it('should set default tile size to background size', () => {
      expect(background.tileWidth).toBe(800);
      expect(background.tileHeight).toBe(600);
    });
  });

  describe('Scroll Position Calculations', () => {
    it('should update scroll offset based on speed and delta time', () => {
      const deltaTime = 1000; // 1 second
      background.update(deltaTime);
      
      // Should move 100 units in 1 second (100 units/second * 1.0 parallax * 1 second)
      expect(background.scrollOffset).toBe(100);
    });

    it('should apply parallax factor to scroll speed', () => {
      background.parallaxFactor = 0.5;
      const deltaTime = 1000; // 1 second
      background.update(deltaTime);
      
      // Should move 50 units (100 units/second * 0.5 parallax * 1 second)
      expect(background.scrollOffset).toBe(50);
    });

    it('should handle seamless tiling with modulo operation', () => {
      background.setTileSize(200, 200);
      background.scrollOffset = 150;
      
      const deltaTime = 1000; // 1 second
      background.update(deltaTime);
      
      // Should wrap around: (150 + 100) % 200 = 50
      expect(background.scrollOffset).toBe(50);
    });

    it('should not update when invisible', () => {
      background.setVisible(false);
      const initialOffset = background.scrollOffset;
      
      background.update(1000);
      
      expect(background.scrollOffset).toBe(initialOffset);
    });

    it('should handle fractional delta times correctly', () => {
      const deltaTime = 16.67; // ~60 FPS frame time
      background.update(deltaTime);
      
      // Should move approximately 1.67 units (100 * 1.0 * 0.01667)
      expect(background.scrollOffset).toBeCloseTo(1.667, 2);
    });
  });

  describe('Configuration Methods', () => {
    it('should set tile size correctly', () => {
      background.setTileSize(256, 128);
      
      expect(background.tileWidth).toBe(256);
      expect(background.tileHeight).toBe(128);
    });

    it('should set color and clear pattern', () => {
      background.setPattern('stars');
      background.setColor('#ff0000');
      
      expect(background.color).toBe('#ff0000');
      expect(background.pattern).toBeNull();
    });

    it('should set pattern and clear color', () => {
      background.setColor('#ff0000');
      background.setPattern('nebula');
      
      expect(background.pattern).toBe('nebula');
      expect(background.color).toBeNull();
    });

    it('should clamp alpha between 0 and 1', () => {
      background.setAlpha(-0.5);
      expect(background.alpha).toBe(0);
      
      background.setAlpha(1.5);
      expect(background.alpha).toBe(1);
      
      background.setAlpha(0.7);
      expect(background.alpha).toBe(0.7);
    });

    it('should set visibility correctly', () => {
      background.setVisible(false);
      expect(background.visible).toBe(false);
      
      background.setVisible(true);
      expect(background.visible).toBe(true);
    });
  });

  describe('Scroll Management', () => {
    it('should return current scroll position', () => {
      background.scrollOffset = 123.45;
      expect(background.getScrollPosition()).toBe(123.45);
    });

    it('should reset scroll offset', () => {
      background.scrollOffset = 100;
      background.resetScroll();
      expect(background.scrollOffset).toBe(0);
    });
  });

  describe('Cloning', () => {
    it('should create an exact copy of the background', () => {
      background.setTileSize(256, 128);
      background.setColor('#ff0000');
      background.setAlpha(0.8);
      background.setVisible(false);
      background.scrollOffset = 50;
      background.seamlessTiling = false;
      
      const clone = background.clone();
      
      expect(clone.width).toBe(background.width);
      expect(clone.height).toBe(background.height);
      expect(clone.scrollSpeed).toBe(background.scrollSpeed);
      expect(clone.parallaxFactor).toBe(background.parallaxFactor);
      expect(clone.layer).toBe(background.layer);
      expect(clone.tileWidth).toBe(background.tileWidth);
      expect(clone.tileHeight).toBe(background.tileHeight);
      expect(clone.color).toBe(background.color);
      expect(clone.alpha).toBe(background.alpha);
      expect(clone.visible).toBe(background.visible);
      expect(clone.scrollOffset).toBe(background.scrollOffset);
      expect(clone.seamlessTiling).toBe(background.seamlessTiling);
    });

    it('should create independent instances', () => {
      const clone = background.clone();
      
      background.scrollOffset = 100;
      clone.scrollOffset = 200;
      
      expect(background.scrollOffset).toBe(100);
      expect(clone.scrollOffset).toBe(200);
    });
  });

  describe('Multiple Layer Scenarios', () => {
    it('should handle different parallax factors for multiple layers', () => {
      const foreground = new Background(800, 600, 100, 1.0, 1);
      const midground = new Background(800, 600, 100, 0.5, 0);
      const background = new Background(800, 600, 100, 0.2, -1);
      
      const deltaTime = 1000; // 1 second
      
      foreground.update(deltaTime);
      midground.update(deltaTime);
      background.update(deltaTime);
      
      expect(foreground.scrollOffset).toBe(100); // Full speed
      expect(midground.scrollOffset).toBe(50);   // Half speed
      expect(background.scrollOffset).toBe(20);  // 20% speed
    });

    it('should handle different tile sizes for seamless scrolling', () => {
      const layer1 = new Background(800, 600, 100, 1.0, 0);
      const layer2 = new Background(800, 600, 100, 1.0, 1);
      
      layer1.setTileSize(200, 200);
      layer2.setTileSize(400, 400);
      
      // Set initial offsets near tile boundaries
      layer1.scrollOffset = 180;
      layer2.scrollOffset = 380;
      
      const deltaTime = 500; // 0.5 seconds, should add 50 units
      
      layer1.update(deltaTime);
      layer2.update(deltaTime);
      
      // Layer 1: (180 + 50) % 200 = 30
      expect(layer1.scrollOffset).toBe(30);
      
      // Layer 2: (380 + 50) % 400 = 30
      expect(layer2.scrollOffset).toBe(30);
    });
  });
});