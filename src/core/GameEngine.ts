/**
 * Core game engine responsible for managing the main game loop,
 * canvas operations, and performance monitoring
 */

import { Entity, System } from './interfaces';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lastTime: number = 0;
  private deltaTime: number = 0;
  private running: boolean = false;
  
  // FPS counter properties
  private fps: number = 0;
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;
  private readonly FPS_UPDATE_INTERVAL = 1000; // Update FPS every second
  
  // Game objects
  private entities: Entity[] = [];
  private systems: System[] = [];

  constructor(canvasId: string) {
    // Get canvas element
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas element with id '${canvasId}' not found`);
    }

    // Get 2D rendering context
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D rendering context from canvas');
    }
    this.ctx = context;

    // Set up canvas properties for crisp pixel art
    this.ctx.imageSmoothingEnabled = false;
    
    console.log('GameEngine initialized');
    console.log(`Canvas size: ${this.canvas.width}x${this.canvas.height}`);
  }

  /**
   * Add an entity to the game engine
   */
  addEntity(entity: Entity): void {
    this.entities.push(entity);
  }

  /**
   * Remove an entity from the game engine
   */
  removeEntity(entityId: string): boolean {
    const index = this.entities.findIndex(entity => entity.id === entityId);
    if (index !== -1) {
      this.entities.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Add a system to the game engine
   */
  addSystem(system: System): void {
    this.systems.push(system);
    if (system.init) {
      system.init();
    }
  }

  /**
   * Remove a system from the game engine
   */
  removeSystem(systemName: string): boolean {
    const index = this.systems.findIndex(system => system.name === systemName);
    if (index !== -1) {
      const system = this.systems[index];
      if (system.destroy) {
        system.destroy();
      }
      this.systems.splice(index, 1);
      return true;
    }
    return false;
  }



  /**
   * Update FPS counter
   */
  private updateFPS(currentTime: number): void {
    this.frameCount++;
    
    if (currentTime - this.fpsUpdateTime >= this.FPS_UPDATE_INTERVAL) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.fpsUpdateTime));
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }
  }

  /**
   * Render FPS counter on screen
   */
  private renderFPS(): void {
    this.ctx.save();
    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = '14px Courier New';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`FPS: ${this.fps}`, 10, 25);
    this.ctx.fillText(`Delta: ${this.deltaTime.toFixed(2)}ms`, 10, 45);
    this.ctx.restore();
  }

  /**
   * Update all systems with current entities
   */
  private update(): void {
    // First, update all entities
    for (const entity of this.entities) {
      if (entity.active && entity.update) {
        entity.update(this.deltaTime);
      }
    }

    // Then update all systems
    for (const system of this.systems) {
      const filteredEntities = system.filter 
        ? this.entities.filter(system.filter)
        : this.entities;
      system.update(filteredEntities, this.deltaTime);
    }

    // Clean up inactive entities
    this.entities = this.entities.filter(entity => {
      if (!entity.active) {
        entity.destroy();
        return false;
      }
      return true;
    });
  }

  /**
   * Render the current frame
   */
  private render(): void {
    // Render FPS counter (after all systems have rendered)
    this.renderFPS();
  }

  /**
   * Main game loop using requestAnimationFrame
   */
  private gameLoop = (currentTime: number): void => {
    // Calculate delta time in milliseconds
    this.deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Update FPS counter
    this.updateFPS(currentTime);

    // Update game logic
    this.update();

    // Render the frame
    this.render();

    // Continue the loop if still running
    if (this.running) {
      requestAnimationFrame(this.gameLoop);
    }
  };

  /**
   * Start the game engine
   */
  start(): void {
    if (this.running) {
      console.warn('GameEngine is already running');
      return;
    }

    console.log('Starting GameEngine...');
    this.running = true;
    this.lastTime = performance.now();
    this.fpsUpdateTime = this.lastTime;
    requestAnimationFrame(this.gameLoop);
  }

  /**
   * Stop the game engine
   */
  stop(): void {
    console.log('Stopping GameEngine...');
    this.running = false;
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * Get current delta time
   */
  getDeltaTime(): number {
    return this.deltaTime;
  }

  /**
   * Get canvas dimensions
   */
  getCanvasSize(): { width: number; height: number } {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }

  /**
   * Get rendering context (for systems that need direct canvas access)
   */
  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  /**
   * Get all entities (read-only access)
   */
  getEntities(): readonly Entity[] {
    return this.entities;
  }

  /**
   * Get all systems (read-only access)
   */
  getSystems(): readonly System[] {
    return this.systems;
  }
}