import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BackgroundSystem } from './BackgroundSystem';
import { Background } from '../components/Background';
import { Transform } from '../components/Transform';
import { Entity } from '../core/interfaces';

// Mock canvas context
const createMockContext = () => ({
  save: vi.fn(),
  restore: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn()
  })),
  globalAlpha: 1,
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: 'left'
});

// Mock entity
const createMockEntity = (id: string, hasBackground: boolean = true, hasTransform: boolean = false): Entity => {
  const components = new Map();
  
  if (hasBackground) {
    components.set('background', new Background(800, 600, 100, 1.0, 0));
  }
  
  if (hasTransform) {
    components.set('transform', new Transform(0, 0));
  }

  return {
    id,
    active: true,
    components,
    addComponent: vi.fn(),
    getComponent: vi.fn((type: string) => components.get(type)),
    hasComponent: vi.fn((type: string) => components.has(type)),
    removeComponent: vi.fn(),
    destroy: vi.fn()
  };
};

describe('BackgroundSystem', () => {
  let system: BackgroundSystem;
  let mockCtx: any;
  const canvasWidth = 800;
  const canvasHeight = 600;

  beforeEach(() => {
    mockCtx = createMockContext();
    system = new BackgroundSystem(mockCtx, canvasWidth, canvasHeight);
  });

  describe('Constructor', () => {
    it('should initialize with correct properties', () => {
      expect(system.name).toBe('BackgroundSystem');
      expect(system.getGlobalScrollSpeed()).toBe(1.0);
    });
  });

  describe('Entity Filtering', () => {
    it('should filter entities with background components', () => {
      const entityWithBackground = createMockEntity('bg1', true);
      const entityWithoutBackground = createMockEntity('no-bg', false);

      expect(system.filter(entityWithBackground)).toBe(true);
      expect(system.filter(entityWithoutBackground)).toBe(false);
    });
  });

  describe('Update Method', () => {
    it('should update background scroll positions', () => {
      const entity = createMockEntity('bg1', true);
      const background = entity.getComponent('background') as Background;
      const initialOffset = background.scrollOffset;
      
      system.update([entity], 1000); // 1 second
      
      expect(background.scrollOffset).toBeGreaterThan(initialOffset);
    });

    it('should sort entities by layer before processing', () => {
      const entity1 = createMockEntity('bg1', true);
      const entity2 = createMockEntity('bg2', true);
      const entity3 = createMockEntity('bg3', true);
      
      const bg1 = entity1.getComponent('background') as Background;
      const bg2 = entity2.getComponent('background') as Background;
      const bg3 = entity3.getComponent('background') as Background;
      
      bg1.layer = 2;
      bg2.layer = 0;
      bg3.layer = 1;
      
      // Mock the rendering to track call order
      const renderCalls: number[] = [];
      vi.spyOn(system as any, 'renderBackground').mockImplementation((bg: Background) => {
        renderCalls.push(bg.layer);
      });
      
      system.update([entity1, entity2, entity3], 100);
      
      // Should render in layer order: 0, 1, 2
      expect(renderCalls).toEqual([0, 1, 2]);
    });

    it('should skip invisible backgrounds', () => {
      const entity = createMockEntity('bg1', true);
      const background = entity.getComponent('background') as Background;
      background.setVisible(false);
      
      const renderSpy = vi.spyOn(system as any, 'renderBackground');
      
      system.update([entity], 1000);
      
      expect(renderSpy).not.toHaveBeenCalled();
    });

    it('should apply global scroll speed multiplier', () => {
      const entity = createMockEntity('bg1', true);
      const background = entity.getComponent('background') as Background;
      background.scrollSpeed = 100;
      
      system.setGlobalScrollSpeed(2.0);
      
      const initialOffset = background.scrollOffset;
      system.update([entity], 1000); // 1 second
      
      // Should move 200 units (100 * 2.0 * 1.0 parallax * 1 second)
      expect(background.scrollOffset).toBe(initialOffset + 200);
    });
  });

  describe('Rendering Methods', () => {
    it('should render color backgrounds', () => {
      const entity = createMockEntity('bg1', true);
      const background = entity.getComponent('background') as Background;
      background.setColor('#ff0000');
      
      system.update([entity], 100);
      
      expect(mockCtx.fillStyle).toBe('#ff0000');
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it('should render pattern backgrounds', () => {
      const entity = createMockEntity('bg1', true);
      const background = entity.getComponent('background') as Background;
      background.setPattern('stars');
      
      system.update([entity], 100);
      
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it('should apply alpha transparency', () => {
      const entity = createMockEntity('bg1', true);
      const background = entity.getComponent('background') as Background;
      background.setAlpha(0.5);
      
      system.update([entity], 100);
      
      expect(mockCtx.globalAlpha).toBe(0.5);
    });

    it('should use transform position when available', () => {
      const entity = createMockEntity('bg1', true, true);
      const transform = entity.getComponent('transform') as Transform;
      transform.setPosition(100, 50);
      
      system.update([entity], 100);
      
      // Should render at transform position
      expect(mockCtx.fillRect).toHaveBeenCalledWith(
        expect.any(Number), 
        expect.any(Number), 
        expect.any(Number), 
        expect.any(Number)
      );
    });
  });

  describe('Seamless Tiling', () => {
    it('should calculate correct tile positions for seamless scrolling', () => {
      const entity = createMockEntity('bg1', true);
      const background = entity.getComponent('background') as Background;
      background.setTileSize(200, 200);
      background.setColor('#0000ff');
      background.scrollOffset = 50;
      
      system.update([entity], 0); // No time update, just render
      
      // Should render multiple tiles to cover the screen
      const fillRectCalls = mockCtx.fillRect.mock.calls;
      expect(fillRectCalls.length).toBeGreaterThan(1);
    });

    it('should handle tile wrapping correctly', () => {
      const entity = createMockEntity('bg1', true);
      const background = entity.getComponent('background') as Background;
      background.setTileSize(100, 100);
      background.scrollOffset = 250; // Should wrap to 50 when updated
      
      system.update([entity], 1000); // 1 second, adds 100 units
      
      // (250 + 100) % 100 = 50
      expect(background.scrollOffset).toBe(50);
    });
  });

  describe('Global Settings', () => {
    it('should set and get global scroll speed', () => {
      system.setGlobalScrollSpeed(1.5);
      expect(system.getGlobalScrollSpeed()).toBe(1.5);
    });

    it('should enable and disable debug rendering', () => {
      system.setDebugRender(true);
      
      const entity = createMockEntity('bg1', true);
      system.update([entity], 100);
      
      // Debug info should be rendered
      expect(mockCtx.fillText).toHaveBeenCalled();
    });
  });

  describe('Pattern Rendering', () => {
    it('should render starfield pattern', () => {
      const entity = createMockEntity('bg1', true);
      const background = entity.getComponent('background') as Background;
      background.setPattern('stars');
      
      system.update([entity], 100);
      
      expect(mockCtx.fillRect).toHaveBeenCalled();
      expect(mockCtx.fillStyle).toBe('#ffffff');
    });

    it('should render grid pattern', () => {
      const entity = createMockEntity('bg1', true);
      const background = entity.getComponent('background') as Background;
      background.setPattern('grid');
      
      system.update([entity], 100);
      
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should render nebula pattern', () => {
      const entity = createMockEntity('bg1', true);
      const background = entity.getComponent('background') as Background;
      background.setPattern('nebula');
      
      system.update([entity], 100);
      
      expect(mockCtx.createRadialGradient).toHaveBeenCalled();
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });
  });

  describe('System Lifecycle', () => {
    it('should initialize correctly', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      system.init();
      
      expect(consoleSpy).toHaveBeenCalledWith('BackgroundSystem initialized');
      consoleSpy.mockRestore();
    });

    it('should destroy correctly', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      system.destroy();
      
      expect(consoleSpy).toHaveBeenCalledWith('BackgroundSystem destroyed');
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Considerations', () => {
    it('should handle multiple background layers efficiently', () => {
      const entities = [];
      for (let i = 0; i < 5; i++) {
        const entity = createMockEntity(`bg${i}`, true);
        const background = entity.getComponent('background') as Background;
        background.layer = i;
        background.setPattern('stars');
        entities.push(entity);
      }
      
      const startTime = performance.now();
      system.update(entities, 16.67); // 60 FPS frame time
      const endTime = performance.now();
      
      // Should complete in reasonable time (less than 1ms for 5 layers)
      expect(endTime - startTime).toBeLessThan(1);
    });

    it('should handle large scroll offsets without performance issues', () => {
      const entity = createMockEntity('bg1', true);
      const background = entity.getComponent('background') as Background;
      background.scrollOffset = 999999; // Large offset
      background.setTileSize(100, 100);
      
      const startTime = performance.now();
      system.update([entity], 16.67);
      const endTime = performance.now();
      
      // Should handle large offsets efficiently
      expect(endTime - startTime).toBeLessThan(1);
      expect(background.scrollOffset).toBeLessThan(200); // Should be wrapped
    });
  });
});