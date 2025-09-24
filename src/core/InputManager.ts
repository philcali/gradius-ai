/**
 * InputManager handles keyboard and mouse input for the game
 * Provides a centralized way to check input state and register callbacks
 */

import { Vector2D, InputState } from './interfaces';

export class InputManager {
  private inputState: InputState;
  private canvas: HTMLCanvasElement;

  private keyDownCallbacks: Map<string, () => void> = new Map();
  private keyUpCallbacks: Map<string, () => void> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.inputState = {
      keys: new Set<string>(),
      mousePosition: { x: 0, y: 0 },
      mouseButtons: new Set<number>()
    };

    this.setupEventListeners();
  }

  /**
   * Set up event listeners for keyboard and mouse input
   */
  private setupEventListeners(): void {
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));

    // Mouse events
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Focus canvas to receive keyboard events
    this.canvas.tabIndex = 0;
    this.canvas.focus();
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.code.toLowerCase();
    
    // Add key to active keys set
    this.inputState.keys.add(key);

    // Call keydown callback if registered
    const callback = this.keyDownCallbacks.get(key);
    if (callback) {
      callback();
    }

    // Prevent default behavior for game keys
    if (this.isGameKey(key)) {
      event.preventDefault();
    }
  }

  /**
   * Handle keyup events
   */
  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.code.toLowerCase();
    
    // Remove key from active keys set
    this.inputState.keys.delete(key);

    // Call keyup callback if registered
    const callback = this.keyUpCallbacks.get(key);
    if (callback) {
      callback();
    }

    // Prevent default behavior for game keys
    if (this.isGameKey(key)) {
      event.preventDefault();
    }
  }

  /**
   * Handle mouse move events
   */
  private handleMouseMove(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.inputState.mousePosition.x = event.clientX - rect.left;
    this.inputState.mousePosition.y = event.clientY - rect.top;
  }

  /**
   * Handle mouse down events
   */
  private handleMouseDown(event: MouseEvent): void {
    this.inputState.mouseButtons.add(event.button);
    event.preventDefault();
  }

  /**
   * Handle mouse up events
   */
  private handleMouseUp(event: MouseEvent): void {
    this.inputState.mouseButtons.delete(event.button);
    event.preventDefault();
  }

  /**
   * Check if a key is currently pressed
   */
  isKeyPressed(key: string): boolean {
    return this.inputState.keys.has(key.toLowerCase());
  }

  /**
   * Check if any of the provided keys are pressed
   */
  isAnyKeyPressed(keys: string[]): boolean {
    return keys.some(key => this.isKeyPressed(key));
  }

  /**
   * Check if a mouse button is currently pressed
   */
  isMouseButtonPressed(button: number): boolean {
    return this.inputState.mouseButtons.has(button);
  }

  /**
   * Get current mouse position
   */
  getMousePosition(): Vector2D {
    return { ...this.inputState.mousePosition };
  }

  /**
   * Register a callback for when a key is pressed down
   */
  onKeyDown(key: string, callback: () => void): void {
    this.keyDownCallbacks.set(key.toLowerCase(), callback);
  }

  /**
   * Register a callback for when a key is released
   */
  onKeyUp(key: string, callback: () => void): void {
    this.keyUpCallbacks.set(key.toLowerCase(), callback);
  }

  /**
   * Remove a key callback
   */
  removeKeyCallback(key: string, type: 'down' | 'up'): void {
    const callbacks = type === 'down' ? this.keyDownCallbacks : this.keyUpCallbacks;
    callbacks.delete(key.toLowerCase());
  }

  /**
   * Check if a key is considered a game key (should prevent default behavior)
   */
  private isGameKey(key: string): boolean {
    const gameKeys = [
      'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
      'keyw', 'keya', 'keys', 'keyd',
      'space', 'enter', 'escape'
    ];
    return gameKeys.includes(key);
  }

  /**
   * Get the current input state (read-only)
   */
  getInputState(): Readonly<InputState> {
    return {
      keys: new Set(this.inputState.keys),
      mousePosition: { ...this.inputState.mousePosition },
      mouseButtons: new Set(this.inputState.mouseButtons)
    };
  }

  /**
   * Clear all input state (useful for scene transitions)
   */
  clearInput(): void {
    this.inputState.keys.clear();
    this.inputState.mouseButtons.clear();
  }

  /**
   * Cleanup event listeners
   */
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
  }
}