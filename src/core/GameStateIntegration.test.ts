/**
 * Integration tests for GameState and SceneManager working together
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState, GameScene } from './GameState';
import { SceneManager, Scene } from './SceneManager';
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

  constructor(name: string) {
    this.name = name;
  }

  onEnter(): void {
    this.onEnterCalled = true;
  }

  onExit(): void {
    this.onExitCalled = true;
  }

  update(_deltaTime: number): void {}
  render(_ctx: CanvasRenderingContext2D): void {}
  handleInput(_inputState: any): void {}
  destroy(): void {}
}

describe('GameState and SceneManager Integration', () => {
  let gameState: GameState;
  let sceneManager: SceneManager;
  let menuScene: MockScene;
  let gameplayScene: MockScene;
  let pausedScene: MockScene;
  let gameOverScene: MockScene;

  beforeEach(() => {
    gameState = new GameState();
    
    menuScene = new MockScene('MenuScene');
    gameplayScene = new MockScene('GameplayScene');
    pausedScene = new MockScene('PausedScene');
    gameOverScene = new MockScene('GameOverScene');
    
    sceneManager = new SceneManager(gameState, mockCtx);
    sceneManager.registerScene(GameScene.MENU, menuScene);
    sceneManager.registerScene(GameScene.GAMEPLAY, gameplayScene);
    sceneManager.registerScene(GameScene.PAUSED, pausedScene);
    sceneManager.registerScene(GameScene.GAME_OVER, gameOverScene);
    
    // Manually trigger the initial scene transition since scenes are now registered
    sceneManager.transitionToScene(GameScene.MENU);
  });

  describe('scene transitions through game state', () => {
    it('should start in menu scene', () => {
      expect(sceneManager.getCurrentScene()).toBe(menuScene);
      expect(menuScene.onEnterCalled).toBe(true);
    });

    it('should transition to gameplay when starting new game', () => {
      gameState.startNewGame();
      
      expect(sceneManager.getCurrentScene()).toBe(gameplayScene);
      expect(menuScene.onExitCalled).toBe(true);
      expect(gameplayScene.onEnterCalled).toBe(true);
      expect(gameState.getData().score).toBe(0);
      expect(gameState.getData().lives).toBe(3);
      expect(gameState.getData().level).toBe(1);
    });

    it('should handle pause and resume flow', () => {
      gameState.startNewGame();
      gameState.addScore(500);
      gameState.setLevel(3);
      
      // Pause the game
      gameState.pauseGame();
      expect(sceneManager.getCurrentScene()).toBe(pausedScene);
      expect(gameplayScene.onExitCalled).toBe(true);
      expect(pausedScene.onEnterCalled).toBe(true);
      
      // Modify state while paused (should be preserved)
      gameState.addScore(100);
      
      // Resume the game
      gameState.resumeGame();
      expect(sceneManager.getCurrentScene()).toBe(gameplayScene);
      expect(pausedScene.onExitCalled).toBe(true);
      
      // State should be preserved
      const data = gameState.getData();
      expect(data.score).toBe(600); // 500 + 100
      expect(data.level).toBe(3);
    });

    it('should handle game over flow', () => {
      gameState.startNewGame();
      gameState.addScore(1000);
      
      // Lose all lives
      gameState.loseLife(); // 2 lives
      gameState.loseLife(); // 1 life
      gameState.loseLife(); // 0 lives - should trigger game over
      
      expect(sceneManager.getCurrentScene()).toBe(gameOverScene);
      expect(gameplayScene.onExitCalled).toBe(true);
      expect(gameOverScene.onEnterCalled).toBe(true);
      expect(gameState.isGameOver()).toBe(true);
    });

    it('should handle restart from game over', () => {
      gameState.startNewGame();
      gameState.addScore(1000);
      gameState.setLevel(5);
      gameState.endGame();
      
      // Reset scenes for clean test
      gameOverScene.onExitCalled = false;
      gameplayScene.onEnterCalled = false;
      
      // Restart game
      gameState.restartGame();
      
      expect(sceneManager.getCurrentScene()).toBe(gameplayScene);
      expect(gameOverScene.onExitCalled).toBe(true);
      expect(gameplayScene.onEnterCalled).toBe(true);
      
      // State should be reset
      const data = gameState.getData();
      expect(data.score).toBe(0);
      expect(data.lives).toBe(3);
      expect(data.level).toBe(1);
    });

    it('should handle return to menu', () => {
      gameState.startNewGame();
      
      // Reset scenes for clean test
      gameplayScene.onExitCalled = false;
      menuScene.onEnterCalled = false;
      
      gameState.returnToMenu();
      
      expect(sceneManager.getCurrentScene()).toBe(menuScene);
      expect(gameplayScene.onExitCalled).toBe(true);
      expect(menuScene.onEnterCalled).toBe(true);
    });
  });

  describe('game state callbacks integration', () => {
    it('should trigger callbacks when game state changes', () => {
      const scoreCallback = vi.fn();
      const livesCallback = vi.fn();
      const levelCallback = vi.fn();
      const gameOverCallback = vi.fn();
      const restartCallback = vi.fn();
      
      gameState.setCallbacks({
        onScoreChange: scoreCallback,
        onLivesChange: livesCallback,
        onLevelChange: levelCallback,
        onGameOver: gameOverCallback,
        onRestart: restartCallback
      });
      
      gameState.startNewGame();
      gameState.addScore(100);
      gameState.nextLevel();
      gameState.loseLife();
      gameState.loseLife();
      gameState.loseLife(); // Should trigger game over
      
      expect(scoreCallback).toHaveBeenCalled();
      expect(livesCallback).toHaveBeenCalled();
      expect(levelCallback).toHaveBeenCalled();
      expect(gameOverCallback).toHaveBeenCalled();
      
      gameState.restartGame();
      expect(restartCallback).toHaveBeenCalled();
    });
  });

  describe('state persistence', () => {
    it('should serialize and deserialize complete game state', () => {
      gameState.startNewGame();
      gameState.addScore(1500);
      gameState.setLevel(4);
      gameState.loseLife();
      gameState.upgradeWeapon('beam');
      gameState.addAmmunition('missiles', 5);
      
      // Serialize state
      const serialized = gameState.serialize();
      expect(serialized).toBeTruthy();
      
      // Create new game state and deserialize
      const newGameState = new GameState();
      const success = newGameState.deserialize(serialized);
      
      expect(success).toBe(true);
      
      const originalData = gameState.getData();
      const deserializedData = newGameState.getData();
      
      expect(deserializedData.score).toBe(originalData.score);
      expect(deserializedData.level).toBe(originalData.level);
      expect(deserializedData.lives).toBe(originalData.lives);
      expect(deserializedData.weaponUpgrades.beam).toBe(originalData.weaponUpgrades.beam);
      expect(deserializedData.ammunition.missiles).toBe(originalData.ammunition.missiles);
    });
  });
});