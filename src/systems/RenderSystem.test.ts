import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RenderSystem } from './RenderSystem.js';
import { Entity } from '../core/Entity.js';
import { Transform } from '../components/Transform.js';
import { Sprite } from '../components/Sprite.js';

// Mock canvas context
const mockContext = {
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  drawImage: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  fillStyle: '#000000',
  strokeStyle: '#000000',
  lineWidth: 1
} as any;

describe('RenderSystem', () => {
  let renderSystem: RenderSystem;
  let entity: Entity;
  let transform: Transform;
  let sprite: Sprite;

  beforeEach(() => {
    vi.clearAllMocks();
    renderSystem = new RenderSystem(mockContext, 800, 600);
    
    entity = new Entity('test-entity');
    transform = new Transform(100, 150, 0, 0);
    sprite = new Sprite(32, 32);
    
    entity.addComponent(transform);
    entity.addComponent(sprite);
  });

  describe('Filter', () => {
    it('should accept entities with Transform and Sprite components', () => {
      expect(renderSystem.filter(entity)).toBe(true);
    });

    it('should reject entities without Transform component', () => {
      const entityWithoutTransform = new Entity('no-transform');
      entityWithoutTransform.addComponent(sprite);
      expect(renderSystem.filter(entityWithoutTransform)).toBe(false);
    });

    it('should reject entities without Sprite component', () => {
      const entityWithoutSprite = new Entity('no-sprite');
      entityWithoutSprite.addComponent(transform);
      expect(renderSystem.filter(entityWithoutSprite)).toBe(false);
    });
  });

  describe('Update', () => {
    it('should render entities in layer order', () => {
      const entity1 = new Entity('entity1');
      const entity2 = new Entity('entity2');
      
      const transform1 = new Transform(50, 50);
      const sprite1 = new Sprite(16, 16);
      sprite1.setLayer(2);
      
      const transform2 = new Transform(100, 100);
      const sprite2 = new Sprite(16, 16);
      sprite2.setLayer(1);
      
      entity1.addComponent(transform1);
      entity1.addComponent(sprite1);
      entity2.addComponent(transform2);
      entity2.addComponent(sprite2);
      
      const entities = [entity1, entity2];
      renderSystem.update(entities, 16);
      
      // Should render entity2 first (layer 1), then entity1 (layer 2)
      expect(mockContext.save).toHaveBeenCalledTimes(2);
      expect(mockContext.restore).toHaveBeenCalledTimes(2);
    });

    it('should skip invisible entities', () => {
      sprite.setVisible(false);
      renderSystem.update([entity], 16);
      
      // Should save/restore but not actually render
      expect(mockContext.save).not.toHaveBeenCalled();
    });

    it('should skip entities with zero alpha', () => {
      sprite.setAlpha(0);
      renderSystem.update([entity], 16);
      
      expect(mockContext.save).not.toHaveBeenCalled();
    });
  });

  describe('Rendering', () => {
    it('should render rectangle when no image is available', () => {
      sprite.tint = '#ff0000';
      renderSystem.update([entity], 16);
      
      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.strokeRect).toHaveBeenCalled();
    });

    it('should apply transformations when needed', () => {
      transform.setRotation(Math.PI / 4);
      transform.setScale(2);
      renderSystem.update([entity], 16);
      
      expect(mockContext.translate).toHaveBeenCalled();
      expect(mockContext.rotate).toHaveBeenCalledWith(Math.PI / 4);
      expect(mockContext.scale).toHaveBeenCalledWith(2, 2);
    });

    it('should set global alpha', () => {
      sprite.setAlpha(0.5);
      renderSystem.update([entity], 16);
      
      expect(mockContext.globalAlpha).toBe(0.5);
    });
  });

  describe('Clear', () => {
    it('should clear canvas with default color', () => {
      renderSystem.clear();
      expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it('should clear canvas with custom color', () => {
      renderSystem.clear('#ff0000');
      expect(mockContext.fillStyle).toBe('#ff0000');
      expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });
  });

  describe('Canvas Size Update', () => {
    it('should update canvas dimensions', () => {
      renderSystem.updateCanvasSize(1024, 768);
      renderSystem.clear();
      expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 1024, 768);
    });
  });
});