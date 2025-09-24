import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { InputManager } from './InputManager.js';

// Mock canvas element
const createMockCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  
  // Mock getBoundingClientRect
  canvas.getBoundingClientRect = vi.fn(() => ({
    left: 0,
    top: 0,
    right: 800,
    bottom: 600,
    width: 800,
    height: 600,
    x: 0,
    y: 0,
    toJSON: () => {}
  }));
  
  return canvas;
};

describe('InputManager', () => {
  let inputManager: InputManager;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    mockCanvas = createMockCanvas();
    document.body.appendChild(mockCanvas);
    inputManager = new InputManager(mockCanvas);
  });

  afterEach(() => {
    inputManager.destroy();
    document.body.removeChild(mockCanvas);
  });

  describe('Constructor', () => {
    it('should initialize with empty input state', () => {
      const state = inputManager.getInputState();
      expect(state.keys.size).toBe(0);
      expect(state.mouseButtons.size).toBe(0);
      expect(state.mousePosition).toEqual({ x: 0, y: 0 });
    });
  });

  describe('Keyboard Input', () => {
    it('should detect key press', () => {
      const event = new KeyboardEvent('keydown', { code: 'KeyW' });
      document.dispatchEvent(event);
      
      expect(inputManager.isKeyPressed('keyw')).toBe(true);
      expect(inputManager.isKeyPressed('keys')).toBe(false);
    });

    it('should detect key release', () => {
      // Press key
      const keyDownEvent = new KeyboardEvent('keydown', { code: 'KeyW' });
      document.dispatchEvent(keyDownEvent);
      expect(inputManager.isKeyPressed('keyw')).toBe(true);
      
      // Release key
      const keyUpEvent = new KeyboardEvent('keyup', { code: 'KeyW' });
      document.dispatchEvent(keyUpEvent);
      expect(inputManager.isKeyPressed('keyw')).toBe(false);
    });

    it('should handle case insensitive key checking', () => {
      const event = new KeyboardEvent('keydown', { code: 'KeyW' });
      document.dispatchEvent(event);
      
      expect(inputManager.isKeyPressed('KeyW')).toBe(true);
      expect(inputManager.isKeyPressed('keyw')).toBe(true);
      expect(inputManager.isKeyPressed('KEYW')).toBe(true);
    });

    it('should detect multiple keys pressed', () => {
      const eventW = new KeyboardEvent('keydown', { code: 'KeyW' });
      const eventD = new KeyboardEvent('keydown', { code: 'KeyD' });
      
      document.dispatchEvent(eventW);
      document.dispatchEvent(eventD);
      
      expect(inputManager.isKeyPressed('keyw')).toBe(true);
      expect(inputManager.isKeyPressed('keyd')).toBe(true);
      expect(inputManager.isAnyKeyPressed(['keyw', 'keyd'])).toBe(true);
      expect(inputManager.isAnyKeyPressed(['keys', 'keya'])).toBe(false);
    });

    it('should handle arrow keys', () => {
      const event = new KeyboardEvent('keydown', { code: 'ArrowUp' });
      document.dispatchEvent(event);
      
      expect(inputManager.isKeyPressed('arrowup')).toBe(true);
    });
  });

  describe('Mouse Input', () => {
    it('should track mouse position', () => {
      const event = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 150
      });
      mockCanvas.dispatchEvent(event);
      
      const position = inputManager.getMousePosition();
      expect(position.x).toBe(100);
      expect(position.y).toBe(150);
    });

    it('should detect mouse button press', () => {
      const event = new MouseEvent('mousedown', { button: 0 });
      mockCanvas.dispatchEvent(event);
      
      expect(inputManager.isMouseButtonPressed(0)).toBe(true);
      expect(inputManager.isMouseButtonPressed(1)).toBe(false);
    });

    it('should detect mouse button release', () => {
      // Press button
      const downEvent = new MouseEvent('mousedown', { button: 0 });
      mockCanvas.dispatchEvent(downEvent);
      expect(inputManager.isMouseButtonPressed(0)).toBe(true);
      
      // Release button
      const upEvent = new MouseEvent('mouseup', { button: 0 });
      mockCanvas.dispatchEvent(upEvent);
      expect(inputManager.isMouseButtonPressed(0)).toBe(false);
    });
  });

  describe('Callbacks', () => {
    it('should call keydown callback', () => {
      const callback = vi.fn();
      inputManager.onKeyDown('keyw', callback);
      
      const event = new KeyboardEvent('keydown', { code: 'KeyW' });
      document.dispatchEvent(event);
      
      expect(callback).toHaveBeenCalledOnce();
    });

    it('should call keyup callback', () => {
      const callback = vi.fn();
      inputManager.onKeyUp('keyw', callback);
      
      // First press the key
      const downEvent = new KeyboardEvent('keydown', { code: 'KeyW' });
      document.dispatchEvent(downEvent);
      
      // Then release it
      const upEvent = new KeyboardEvent('keyup', { code: 'KeyW' });
      document.dispatchEvent(upEvent);
      
      expect(callback).toHaveBeenCalledOnce();
    });

    it('should remove callbacks', () => {
      const callback = vi.fn();
      inputManager.onKeyDown('keyw', callback);
      inputManager.removeKeyCallback('keyw', 'down');
      
      const event = new KeyboardEvent('keydown', { code: 'KeyW' });
      document.dispatchEvent(event);
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Utility Methods', () => {
    it('should clear all input', () => {
      // Set some input state
      const keyEvent = new KeyboardEvent('keydown', { code: 'KeyW' });
      const mouseEvent = new MouseEvent('mousedown', { button: 0 });
      
      document.dispatchEvent(keyEvent);
      mockCanvas.dispatchEvent(mouseEvent);
      
      expect(inputManager.isKeyPressed('keyw')).toBe(true);
      expect(inputManager.isMouseButtonPressed(0)).toBe(true);
      
      // Clear input
      inputManager.clearInput();
      
      expect(inputManager.isKeyPressed('keyw')).toBe(false);
      expect(inputManager.isMouseButtonPressed(0)).toBe(false);
    });

    it('should return readonly input state', () => {
      const state = inputManager.getInputState();
      
      // Should be able to read
      expect(state.keys).toBeDefined();
      expect(state.mousePosition).toBeDefined();
      expect(state.mouseButtons).toBeDefined();
      
      // Modifying returned state should not affect internal state
      state.keys.add('test');
      expect(inputManager.isKeyPressed('test')).toBe(false);
    });
  });
});