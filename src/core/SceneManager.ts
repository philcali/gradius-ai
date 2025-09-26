/**
 * SceneManager handles different game scenes and their transitions
 */

import { Entity, System } from './interfaces';
import { GameState, GameScene } from './GameState';

export interface Scene {
  readonly name: string;
  entities: Entity[];
  systems: System[];
  
  /** Called when scene becomes active */
  onEnter?(): void;
  
  /** Called when scene becomes inactive */
  onExit?(): void;
  
  /** Called each frame while scene is active */
  update?(deltaTime: number): void;
  
  /** Called for rendering while scene is active */
  render?(ctx: CanvasRenderingContext2D): void;
  
  /** Handle input events */
  handleInput?(inputState: any): void;
  
  /** Clean up scene resources */
  destroy?(): void;
}

export class SceneManager {
  private scenes: Map<GameScene, Scene> = new Map();
  private currentScene: Scene | null = null;
  private gameState: GameState;
  private ctx: CanvasRenderingContext2D;

  constructor(gameState: GameState, ctx: CanvasRenderingContext2D) {
    this.gameState = gameState;
    this.ctx = ctx;
    
    // Listen for scene changes from game state
    this.gameState.setCallbacks({
      ...this.gameState['callbacks'],
      onSceneChange: (newScene: GameScene, _oldScene: GameScene) => {
        this.transitionToScene(newScene);
      }
    });
  }

  /**
   * Register a scene
   */
  registerScene(sceneType: GameScene, scene: Scene): void {
    this.scenes.set(sceneType, scene);
  }

  /**
   * Get current active scene
   */
  getCurrentScene(): Scene | null {
    return this.currentScene;
  }

  /**
   * Transition to a specific scene
   */
  transitionToScene(sceneType: GameScene): void {
    const newScene = this.scenes.get(sceneType);
    if (!newScene) {
      console.warn(`Scene ${sceneType} not found`);
      return;
    }

    // Exit current scene
    if (this.currentScene && this.currentScene.onExit) {
      this.currentScene.onExit();
    }

    // Set new scene
    this.currentScene = newScene;

    // Enter new scene
    if (this.currentScene.onEnter) {
      this.currentScene.onEnter();
    }

    console.log(`Transitioned to scene: ${sceneType}`);
  }

  /**
   * Update current scene
   */
  update(deltaTime: number): void {
    if (this.currentScene && this.currentScene.update) {
      this.currentScene.update(deltaTime);
    }

    // Update scene systems
    if (this.currentScene) {
      for (const system of this.currentScene.systems) {
        const filteredEntities = system.filter 
          ? this.currentScene.entities.filter(system.filter)
          : this.currentScene.entities;
        system.update(filteredEntities, deltaTime);
      }

      // Update scene entities
      for (const entity of this.currentScene.entities) {
        if (entity.active && entity.update) {
          entity.update(deltaTime);
        }
      }

      // Clean up inactive entities
      this.currentScene.entities = this.currentScene.entities.filter(entity => {
        if (!entity.active) {
          entity.destroy();
          return false;
        }
        return true;
      });
    }
  }

  /**
   * Render current scene
   */
  render(): void {
    if (this.currentScene && this.currentScene.render) {
      this.currentScene.render(this.ctx);
    }
  }

  /**
   * Handle input for current scene
   */
  handleInput(inputState: any): void {
    if (this.currentScene && this.currentScene.handleInput) {
      this.currentScene.handleInput(inputState);
    }
  }

  /**
   * Add entity to current scene
   */
  addEntity(entity: Entity): void {
    if (this.currentScene) {
      this.currentScene.entities.push(entity);
    }
  }

  /**
   * Remove entity from current scene
   */
  removeEntity(entityId: string): boolean {
    if (!this.currentScene) return false;

    const index = this.currentScene.entities.findIndex(entity => entity.id === entityId);
    if (index !== -1) {
      const entity = this.currentScene.entities[index];
      entity.destroy();
      this.currentScene.entities.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Add system to current scene
   */
  addSystem(system: System): void {
    if (this.currentScene) {
      this.currentScene.systems.push(system);
      if (system.init) {
        system.init();
      }
    }
  }

  /**
   * Remove system from current scene
   */
  removeSystem(systemName: string): boolean {
    if (!this.currentScene) return false;

    const index = this.currentScene.systems.findIndex(system => system.name === systemName);
    if (index !== -1) {
      const system = this.currentScene.systems[index];
      if (system.destroy) {
        system.destroy();
      }
      this.currentScene.systems.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get entities from current scene
   */
  getEntities(): Entity[] {
    return this.currentScene ? [...this.currentScene.entities] : [];
  }

  /**
   * Get systems from current scene
   */
  getSystems(): System[] {
    return this.currentScene ? [...this.currentScene.systems] : [];
  }

  /**
   * Destroy all scenes and clean up
   */
  destroy(): void {
    for (const scene of this.scenes.values()) {
      if (scene.destroy) {
        scene.destroy();
      }
    }
    this.scenes.clear();
    this.currentScene = null;
  }
}