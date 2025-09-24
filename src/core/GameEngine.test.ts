/**
 * Unit tests for GameEngine class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from './GameEngine';
import { Entity, System } from './interfaces';

// Mock canvas and context
const mockCanvas = {
  width: 800,
  height: 600,
  getContext: vi.fn(() => ({
    fillStyle: '',
    fillRect: vi.fn(),
    fillText: vi.fn(),
    font: '',
    textAlign: '',
    imageSmoothingEnabled: false,
    save: vi.fn(),
    restore: vi.fn()
  }))
};

// Mock DOM
const mockGetElementById = vi.fn(() => mockCanvas);
Object.defineProperty(global, 'document', {
  value: {
    getElementById: mockGetElementById
  }
});

// Mock requestAnimationFrame
const mockRequestAnimationFrame = vi.fn((callback) => setTimeout(callback, 16));
Object.defineProperty(global, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame
});

// Mock performance.now
const mockPerformanceNow = vi.fn(() => Date.now());
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow
  }
});

describe('GameEngine', () => {
  let gameEngine: GameEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetElementById.mockReturnValue(mockCanvas);
    gameEngine = new GameEngine('testCanvas');
  });

  it('should initialize with canvas', () => {
    expect(document.getElementById).toHaveBeenCalledWith('testCanvas');
    expect(gameEngine.getCanvasSize()).toEqual({ width: 800, height: 600 });
  });

  it('should throw error if canvas not found', () => {
    mockGetElementById.mockReturnValue(null);
    expect(() => new GameEngine('nonexistent')).toThrow('Canvas element with id \'nonexistent\' not found');
  });

  it('should add and remove entities', () => {
    const mockEntity: Entity = {
      id: 'test-entity',
      active: true,
      components: new Map(),
      addComponent: vi.fn(),
      getComponent: vi.fn(),
      hasComponent: vi.fn(),
      removeComponent: vi.fn(),
      destroy: vi.fn()
    };

    gameEngine.addEntity(mockEntity);
    expect(gameEngine.getEntities()).toContain(mockEntity);

    const removed = gameEngine.removeEntity('test-entity');
    expect(removed).toBe(true);
    expect(gameEngine.getEntities()).not.toContain(mockEntity);
  });

  it('should add and remove systems', () => {
    const mockSystem: System = {
      name: 'test-system',
      update: vi.fn(),
      init: vi.fn()
    };

    gameEngine.addSystem(mockSystem);
    expect(gameEngine.getSystems()).toContain(mockSystem);
    expect(mockSystem.init).toHaveBeenCalled();

    const removed = gameEngine.removeSystem('test-system');
    expect(removed).toBe(true);
    expect(gameEngine.getSystems()).not.toContain(mockSystem);
  });

  it('should start and stop correctly', () => {
    gameEngine.start();
    expect(mockRequestAnimationFrame).toHaveBeenCalled();

    gameEngine.stop();
    // Engine should stop requesting new frames
  });

  it('should calculate delta time', () => {
    const initialTime = 1000;
    const nextTime = 1016.67; // ~60 FPS
    
    mockPerformanceNow
      .mockReturnValueOnce(initialTime)
      .mockReturnValueOnce(nextTime);

    gameEngine.start();
    
    // Simulate one frame
    const callback = mockRequestAnimationFrame.mock.calls[0][0];
    callback(nextTime);

    expect(gameEngine.getDeltaTime()).toBeCloseTo(16.67, 1);
  });

  it('should track FPS', () => {
    expect(gameEngine.getFPS()).toBe(0); // Initially 0
    
    // FPS calculation requires multiple frames over time
    // This would be tested in integration tests
  });
});