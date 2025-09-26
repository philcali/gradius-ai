/**
 * Unit tests for SceneManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SceneManager, Scene } from './SceneManager';
import { GameState, GameScene } from './GameState';
import { Entity, System } from './interfaces';

// Mock canvas context
const mockCtx = {
  fillRect: vi.fn(),
  fillStyle: '',
  font: '',
  textAlign: '',
  fillText: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  clearRect: vi.fn(),
  drawImage: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
} as any;

// Mock scene implementation
class MockScene implements Scene {
  readonly name: string;
  entities: Entity[] = [];
  systems: System[] = [];
  
  onEnterCalled = false;
  onExitCalled = false;
  updateCalled = false;
  renderCalled = false;
  handleInputCalled = false;
  destroyCalled = false;

  constructor(name: string) {
    this.name = name;
  }

  onEnter(): void {
    this.onEnterCalled = true;
  }

  onExit(): void {
    this.onExitCalled = true;
  }

  update(deltaTime: number): void {
    this.updateCalled = true;
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.renderCalled = true;
  }

  handleInput(inputState: any): void {
    this.handleInputCalled = true;
  }

  destroy(): void {
    this.destroyCalled = true;
  }
}

// Mock entity
function createMockEntity(id: string, active: boolean = true): Entity {
  return {
    id,
    active,
    components: new Map(),
    addComponent: vi.fn(),
    getComponent: vi.fn(),
    hasComponent: vi.fn(),
    removeComponent: vi.fn(),
    destroy: vi.fn(),
    update: vi.fn()
  };
}

// Mock system
function createMockSystem(name: string): System {
  return {
    name,
    update: vi.fn(),
    init: vi.fn(),
    destroy: vi.fn()
  };
}

describe('SceneManager', () => {
  let sceneManager: SceneManager;
  let gameState: GameState;
  let mockScene1: MockScene;
  let mockScene2: MockScene;

  beforeEach(() => {
    gameState = new GameState();
    sceneManager = new SceneManager(gameState, mockCtx);
    mockScene1 = new MockScene('TestScene1');
    mockScene2 = new MockScene('TestScene2');
  });

  describe('scene registration', () => {
    it('should register scenes correctly', () => {
      sceneManager.registerScene(GameScene.MENU, mockScene1);
      sceneManager.registerScene(GameScene.GAMEPLAY, mockScene2);

      // Verify scenes are registered by transitioning to them
      sceneManager.transitionToScene(GameScene.MENU);
      expect(sceneManager.getCurrentScene()).toBe(mockScene1);

      sceneManager.transitionToScene(GameScene.GAMEPLAY);
      expect(sceneManager.getCurrentScene()).toBe(mockScene2);
    });

    it('should handle transitioning to unregistered scene', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      sceneManager.transitionToScene(GameScene.MENU);
      
      expect(consoleSpy).toHaveBeenCalledWith('Scene menu not found');
      expect(sceneManager.getCurrentScene()).toBeNull();
      
      consoleSpy.mockRestore();
    });
  });

  describe('scene transitions', () => {
    beforeEach(() => {
      sceneManager.registerScene(GameScene.MENU, mockScene1);
      sceneManager.registerScene(GameScene.GAMEPLAY, mockScene2);
    });

    it('should call onExit on current scene and onEnter on new scene', () => {
      sceneManager.transitionToScene(GameScene.MENU);
      expect(mockScene1.onEnterCalled).toBe(true);

      sceneManager.transitionToScene(GameScene.GAMEPLAY);
      expect(mockScene1.onExitCalled).toBe(true);
      expect(mockScene2.onEnterCalled).toBe(true);
    });

    it('should update current scene correctly', () => {
      sceneManager.transitionToScene(GameScene.MENU);
      expect(sceneManager.getCurrentScene()).toBe(mockScene1);

      sceneManager.transitionToScene(GameScene.GAMEPLAY);
      expect(sceneManager.getCurrentScene()).toBe(mockScene2);
    });

    it('should handle transition when no current scene exists', () => {
      expect(sceneManager.getCurrentScene()).toBeNull();
      
      sceneManager.transitionToScene(GameScene.MENU);
      expect(mockScene1.onEnterCalled).toBe(true);
      expect(sceneManager.getCurrentScene()).toBe(mockScene1);
    });
  });

  describe('scene updates', () => {
    beforeEach(() => {
      sceneManager.registerScene(GameScene.MENU, mockScene1);
      sceneManager.transitionToScene(GameScene.MENU);
    });

    it('should update current scene', () => {
      sceneManager.update(16.67);
      expect(mockScene1.updateCalled).toBe(true);
    });

    it('should update scene systems', () => {
      const mockSystem = createMockSystem('TestSystem');
      mockScene1.systems.push(mockSystem);

      sceneManager.update(16.67);
      expect(mockSystem.update).toHaveBeenCalledWith(mockScene1.entities, 16.67);
    });

    it('should update scene entities', () => {
      const mockEntity = createMockEntity('test-entity');
      mockScene1.entities.push(mockEntity);

      sceneManager.update(16.67);
      expect(mockEntity.update).toHaveBeenCalledWith(16.67);
    });

    it('should clean up inactive entities', () => {
      const activeEntity = createMockEntity('active', true);
      const inactiveEntity = createMockEntity('inactive', false);
      mockScene1.entities.push(activeEntity, inactiveEntity);

      sceneManager.update(16.67);

      expect(mockScene1.entities).toHaveLength(1);
      expect(mockScene1.entities[0]).toBe(activeEntity);
      expect(inactiveEntity.destroy).toHaveBeenCalled();
    });

    it('should handle no current scene gracefully', () => {
      sceneManager.transitionToScene(GameScene.GAMEPLAY); // Unregistered scene
      expect(() => sceneManager.update(16.67)).not.toThrow();
    });
  });

  describe('scene rendering', () => {
    beforeEach(() => {
      sceneManager.registerScene(GameScene.MENU, mockScene1);
      sceneManager.transitionToScene(GameScene.MENU);
    });

    it('should render current scene', () => {
      sceneManager.render();
      expect(mockScene1.renderCalled).toBe(true);
    });

    it('should handle no current scene gracefully', () => {
      sceneManager.transitionToScene(GameScene.GAMEPLAY); // Unregistered scene
      expect(() => sceneManager.render()).not.toThrow();
    });
  });

  describe('input handling', () => {
    beforeEach(() => {
      sceneManager.registerScene(GameScene.MENU, mockScene1);
      sceneManager.transitionToScene(GameScene.MENU);
    });

    it('should handle input for current scene', () => {
      const inputState = { keys: new Set(['Space']) };
      sceneManager.handleInput(inputState);
      expect(mockScene1.handleInputCalled).toBe(true);
    });

    it('should handle no current scene gracefully', () => {
      sceneManager.transitionToScene(GameScene.GAMEPLAY); // Unregistered scene
      const inputState = { keys: new Set(['Space']) };
      expect(() => sceneManager.handleInput(inputState)).not.toThrow();
    });
  });

  describe('entity management', () => {
    beforeEach(() => {
      sceneManager.registerScene(GameScene.MENU, mockScene1);
      sceneManager.transitionToScene(GameScene.MENU);
    });

    it('should add entity to current scene', () => {
      const entity = createMockEntity('test-entity');
      sceneManager.addEntity(entity);
      
      expect(mockScene1.entities).toContain(entity);
    });

    it('should remove entity from current scene', () => {
      const entity = createMockEntity('test-entity');
      mockScene1.entities.push(entity);

      const removed = sceneManager.removeEntity('test-entity');
      
      expect(removed).toBe(true);
      expect(mockScene1.entities).not.toContain(entity);
      expect(entity.destroy).toHaveBeenCalled();
    });

    it('should return false when removing non-existent entity', () => {
      const removed = sceneManager.removeEntity('non-existent');
      expect(removed).toBe(false);
    });

    it('should handle entity operations with no current scene', () => {
      // Create a fresh scene manager without any registered scenes
      const freshGameState = new GameState();
      const freshSceneManager = new SceneManager(freshGameState, mockCtx);
      
      const entity = createMockEntity('test-entity');
      expect(() => freshSceneManager.addEntity(entity)).not.toThrow();
      expect(freshSceneManager.removeEntity('test-entity')).toBe(false);
    });

    it('should get entities from current scene', () => {
      const entity1 = createMockEntity('entity1');
      const entity2 = createMockEntity('entity2');
      mockScene1.entities.push(entity1, entity2);

      const entities = sceneManager.getEntities();
      expect(entities).toHaveLength(2);
      expect(entities).toContain(entity1);
      expect(entities).toContain(entity2);
    });

    it('should return empty array when no current scene', () => {
      sceneManager.transitionToScene(GameScene.GAMEPLAY); // Unregistered scene
      const entities = sceneManager.getEntities();
      expect(entities).toEqual([]);
    });
  });

  describe('system management', () => {
    beforeEach(() => {
      sceneManager.registerScene(GameScene.MENU, mockScene1);
      sceneManager.transitionToScene(GameScene.MENU);
    });

    it('should add system to current scene', () => {
      const system = createMockSystem('TestSystem');
      sceneManager.addSystem(system);
      
      expect(mockScene1.systems).toContain(system);
      expect(system.init).toHaveBeenCalled();
    });

    it('should remove system from current scene', () => {
      const system = createMockSystem('TestSystem');
      mockScene1.systems.push(system);

      const removed = sceneManager.removeSystem('TestSystem');
      
      expect(removed).toBe(true);
      expect(mockScene1.systems).not.toContain(system);
      expect(system.destroy).toHaveBeenCalled();
    });

    it('should return false when removing non-existent system', () => {
      const removed = sceneManager.removeSystem('NonExistentSystem');
      expect(removed).toBe(false);
    });

    it('should handle system operations with no current scene', () => {
      // Create a fresh scene manager without any registered scenes
      const freshGameState = new GameState();
      const freshSceneManager = new SceneManager(freshGameState, mockCtx);
      
      const system = createMockSystem('TestSystem');
      expect(() => freshSceneManager.addSystem(system)).not.toThrow();
      expect(freshSceneManager.removeSystem('TestSystem')).toBe(false);
    });

    it('should get systems from current scene', () => {
      const system1 = createMockSystem('System1');
      const system2 = createMockSystem('System2');
      mockScene1.systems.push(system1, system2);

      const systems = sceneManager.getSystems();
      expect(systems).toHaveLength(2);
      expect(systems).toContain(system1);
      expect(systems).toContain(system2);
    });

    it('should return empty array when no current scene', () => {
      sceneManager.transitionToScene(GameScene.GAMEPLAY); // Unregistered scene
      const systems = sceneManager.getSystems();
      expect(systems).toEqual([]);
    });
  });

  describe('integration with GameState', () => {
    it('should respond to game state scene changes', () => {
      sceneManager.registerScene(GameScene.MENU, mockScene1);
      sceneManager.registerScene(GameScene.GAMEPLAY, mockScene2);

      // Trigger scene change through game state
      gameState.transitionToScene(GameScene.MENU);
      expect(sceneManager.getCurrentScene()).toBe(mockScene1);

      gameState.transitionToScene(GameScene.GAMEPLAY);
      expect(sceneManager.getCurrentScene()).toBe(mockScene2);
    });
  });

  describe('cleanup', () => {
    it('should destroy all scenes on cleanup', () => {
      sceneManager.registerScene(GameScene.MENU, mockScene1);
      sceneManager.registerScene(GameScene.GAMEPLAY, mockScene2);

      sceneManager.destroy();

      expect(mockScene1.destroyCalled).toBe(true);
      expect(mockScene2.destroyCalled).toBe(true);
      expect(sceneManager.getCurrentScene()).toBeNull();
    });
  });
});