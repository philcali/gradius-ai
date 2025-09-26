/**
 * Unit tests for GameState class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState, GameScene, GameStateEventCallbacks } from './GameState';

describe('GameState', () => {
  let gameState: GameState;
  let mockCallbacks: GameStateEventCallbacks;

  beforeEach(() => {
    mockCallbacks = {
      onScoreChange: vi.fn(),
      onLivesChange: vi.fn(),
      onLevelChange: vi.fn(),
      onSceneChange: vi.fn(),
      onGameOver: vi.fn(),
      onRestart: vi.fn()
    };
    gameState = new GameState();
    gameState.setCallbacks(mockCallbacks);
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const data = gameState.getData();
      expect(data.score).toBe(0);
      expect(data.lives).toBe(3);
      expect(data.level).toBe(1);
      expect(data.difficulty).toBe(1);
      expect(data.weaponUpgrades.beam).toBe(1);
      expect(data.weaponUpgrades.missile).toBe(1);
      expect(data.weaponUpgrades.special).toBe(1);
      expect(data.ammunition.missiles).toBe(10);
      expect(data.ammunition.specialUses).toBe(3);
    });

    it('should start in menu scene', () => {
      expect(gameState.getCurrentScene()).toBe(GameScene.MENU);
      expect(gameState.isInMenu()).toBe(true);
    });

    it('should accept custom initial data', () => {
      const customGameState = new GameState({
        score: 1000,
        lives: 5,
        level: 3
      });
      const data = customGameState.getData();
      expect(data.score).toBe(1000);
      expect(data.lives).toBe(5);
      expect(data.level).toBe(3);
    });
  });

  describe('scene transitions', () => {
    it('should transition between scenes correctly', () => {
      gameState.transitionToScene(GameScene.GAMEPLAY);
      expect(gameState.getCurrentScene()).toBe(GameScene.GAMEPLAY);
      expect(gameState.getPreviousScene()).toBe(GameScene.MENU);
      expect(mockCallbacks.onSceneChange).toHaveBeenCalledWith(GameScene.GAMEPLAY, GameScene.MENU);
    });

    it('should start new game and transition to gameplay', () => {
      gameState.startNewGame();
      expect(gameState.getCurrentScene()).toBe(GameScene.GAMEPLAY);
      expect(gameState.isPlayable()).toBe(true);
    });

    it('should pause and resume game correctly', () => {
      gameState.transitionToScene(GameScene.GAMEPLAY);
      gameState.pauseGame();
      
      expect(gameState.getCurrentScene()).toBe(GameScene.PAUSED);
      expect(gameState.isPaused()).toBe(true);
      
      gameState.resumeGame();
      expect(gameState.getCurrentScene()).toBe(GameScene.GAMEPLAY);
      expect(gameState.isPlayable()).toBe(true);
    });

    it('should not pause if not in gameplay', () => {
      gameState.pauseGame();
      expect(gameState.getCurrentScene()).toBe(GameScene.MENU);
    });

    it('should not resume if not paused', () => {
      gameState.resumeGame();
      expect(gameState.getCurrentScene()).toBe(GameScene.MENU);
    });

    it('should end game and transition to game over', () => {
      gameState.transitionToScene(GameScene.GAMEPLAY);
      gameState.addScore(500);
      gameState.endGame();
      
      expect(gameState.getCurrentScene()).toBe(GameScene.GAME_OVER);
      expect(gameState.isGameOver()).toBe(true);
      expect(mockCallbacks.onGameOver).toHaveBeenCalledWith(500);
    });

    it('should restart game from game over', () => {
      gameState.transitionToScene(GameScene.GAME_OVER);
      gameState.restartGame();
      
      expect(gameState.getCurrentScene()).toBe(GameScene.GAMEPLAY);
      expect(mockCallbacks.onRestart).toHaveBeenCalled();
    });

    it('should return to menu', () => {
      gameState.transitionToScene(GameScene.GAMEPLAY);
      gameState.returnToMenu();
      expect(gameState.getCurrentScene()).toBe(GameScene.MENU);
    });
  });

  describe('score management', () => {
    it('should add score correctly', () => {
      gameState.addScore(100);
      expect(gameState.getData().score).toBe(100);
      expect(mockCallbacks.onScoreChange).toHaveBeenCalledWith(100, 0);
    });

    it('should set score directly', () => {
      gameState.setScore(500);
      expect(gameState.getData().score).toBe(500);
      expect(mockCallbacks.onScoreChange).toHaveBeenCalledWith(500, 0);
    });

    it('should not allow negative scores', () => {
      gameState.setScore(-100);
      expect(gameState.getData().score).toBe(0);
    });

    it('should accumulate score additions', () => {
      gameState.addScore(100);
      gameState.addScore(50);
      expect(gameState.getData().score).toBe(150);
    });
  });

  describe('lives management', () => {
    it('should lose life correctly', () => {
      const gameOver = gameState.loseLife();
      expect(gameState.getData().lives).toBe(2);
      expect(gameOver).toBe(false);
      expect(mockCallbacks.onLivesChange).toHaveBeenCalledWith(2, 3);
    });

    it('should trigger game over when lives reach zero', () => {
      gameState.setLives(1);
      const gameOver = gameState.loseLife();
      
      expect(gameState.getData().lives).toBe(0);
      expect(gameOver).toBe(true);
      expect(gameState.getCurrentScene()).toBe(GameScene.GAME_OVER);
    });

    it('should gain life correctly', () => {
      gameState.loseLife(); // Lives = 2
      gameState.gainLife(); // Lives = 3
      expect(gameState.getData().lives).toBe(3);
      expect(mockCallbacks.onLivesChange).toHaveBeenCalledWith(3, 2);
    });

    it('should set lives directly', () => {
      gameState.setLives(5);
      expect(gameState.getData().lives).toBe(5);
      expect(mockCallbacks.onLivesChange).toHaveBeenCalledWith(5, 3);
    });

    it('should not allow negative lives', () => {
      gameState.setLives(-1);
      expect(gameState.getData().lives).toBe(0);
      expect(gameState.getCurrentScene()).toBe(GameScene.GAME_OVER);
    });
  });

  describe('level management', () => {
    it('should advance to next level', () => {
      gameState.nextLevel();
      expect(gameState.getData().level).toBe(2);
      expect(gameState.getData().difficulty).toBe(1.5);
      expect(mockCallbacks.onLevelChange).toHaveBeenCalledWith(2, 1);
    });

    it('should set level directly', () => {
      gameState.setLevel(5);
      expect(gameState.getData().level).toBe(5);
      expect(gameState.getData().difficulty).toBe(3);
      expect(mockCallbacks.onLevelChange).toHaveBeenCalledWith(5, 1);
    });

    it('should not allow level below 1', () => {
      gameState.setLevel(0);
      expect(gameState.getData().level).toBe(1);
    });

    it('should cap difficulty at 10', () => {
      gameState.setLevel(25); // Would result in difficulty > 10
      expect(gameState.getData().difficulty).toBe(10);
    });
  });

  describe('weapon upgrades', () => {
    it('should upgrade weapons correctly', () => {
      gameState.upgradeWeapon('beam');
      expect(gameState.getData().weaponUpgrades.beam).toBe(2);
      
      gameState.upgradeWeapon('missile');
      expect(gameState.getData().weaponUpgrades.missile).toBe(2);
      
      gameState.upgradeWeapon('special');
      expect(gameState.getData().weaponUpgrades.special).toBe(2);
    });

    it('should not upgrade beyond max level', () => {
      // Upgrade to max level (5)
      for (let i = 0; i < 5; i++) {
        gameState.upgradeWeapon('beam');
      }
      expect(gameState.getData().weaponUpgrades.beam).toBe(5);
      
      // Try to upgrade beyond max
      gameState.upgradeWeapon('beam');
      expect(gameState.getData().weaponUpgrades.beam).toBe(5);
    });
  });

  describe('ammunition management', () => {
    it('should add ammunition correctly', () => {
      gameState.addAmmunition('missiles', 5);
      expect(gameState.getData().ammunition.missiles).toBe(15);
      
      gameState.addAmmunition('specialUses', 2);
      expect(gameState.getData().ammunition.specialUses).toBe(5);
    });

    it('should use ammunition correctly', () => {
      const success = gameState.useAmmunition('missiles', 3);
      expect(success).toBe(true);
      expect(gameState.getData().ammunition.missiles).toBe(7);
    });

    it('should fail to use ammunition when insufficient', () => {
      const success = gameState.useAmmunition('missiles', 15);
      expect(success).toBe(false);
      expect(gameState.getData().ammunition.missiles).toBe(10);
    });

    it('should use default amount of 1', () => {
      const success = gameState.useAmmunition('specialUses');
      expect(success).toBe(true);
      expect(gameState.getData().ammunition.specialUses).toBe(2);
    });
  });

  describe('state queries', () => {
    it('should correctly identify playable state', () => {
      expect(gameState.isPlayable()).toBe(false);
      gameState.transitionToScene(GameScene.GAMEPLAY);
      expect(gameState.isPlayable()).toBe(true);
    });

    it('should correctly identify paused state', () => {
      expect(gameState.isPaused()).toBe(false);
      gameState.transitionToScene(GameScene.PAUSED);
      expect(gameState.isPaused()).toBe(true);
    });

    it('should correctly identify game over state', () => {
      expect(gameState.isGameOver()).toBe(false);
      gameState.transitionToScene(GameScene.GAME_OVER);
      expect(gameState.isGameOver()).toBe(true);
    });

    it('should correctly identify menu state', () => {
      expect(gameState.isInMenu()).toBe(true);
      gameState.transitionToScene(GameScene.GAMEPLAY);
      expect(gameState.isInMenu()).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should serialize state to JSON', () => {
      gameState.addScore(500);
      gameState.setLevel(3);
      gameState.transitionToScene(GameScene.GAMEPLAY);
      
      const serialized = gameState.serialize();
      const parsed = JSON.parse(serialized);
      
      expect(parsed.data.score).toBe(500);
      expect(parsed.data.level).toBe(3);
      expect(parsed.currentScene).toBe(GameScene.GAMEPLAY);
    });

    it('should deserialize state from JSON', () => {
      const testData = {
        data: {
          score: 1000,
          lives: 2,
          level: 5,
          difficulty: 3,
          weaponUpgrades: { beam: 3, missile: 2, special: 4 },
          ammunition: { missiles: 20, specialUses: 5 }
        },
        currentScene: GameScene.PAUSED,
        previousScene: GameScene.GAMEPLAY
      };
      
      const success = gameState.deserialize(JSON.stringify(testData));
      expect(success).toBe(true);
      
      const data = gameState.getData();
      expect(data.score).toBe(1000);
      expect(data.lives).toBe(2);
      expect(data.level).toBe(5);
      expect(gameState.getCurrentScene()).toBe(GameScene.PAUSED);
      expect(gameState.getPreviousScene()).toBe(GameScene.GAMEPLAY);
    });

    it('should handle invalid JSON gracefully', () => {
      const success = gameState.deserialize('invalid json');
      expect(success).toBe(false);
    });

    it('should handle incomplete data gracefully', () => {
      const success = gameState.deserialize('{"incomplete": true}');
      expect(success).toBe(false);
    });
  });

  describe('pause state preservation', () => {
    it('should preserve state when pausing and resuming', () => {
      gameState.transitionToScene(GameScene.GAMEPLAY);
      gameState.addScore(500);
      gameState.setLevel(3);
      
      gameState.pauseGame();
      
      // Modify state while paused (shouldn't affect resumed state)
      gameState.addScore(100);
      
      gameState.resumeGame();
      
      // Should restore the paused state
      const data = gameState.getData();
      expect(data.score).toBe(600); // 500 + 100 (modifications during pause are kept)
      expect(data.level).toBe(3);
    });
  });

  describe('game restart', () => {
    it('should reset all data when restarting', () => {
      // Set up some game state
      gameState.addScore(1000);
      gameState.setLevel(5);
      gameState.loseLife();
      gameState.upgradeWeapon('beam');
      gameState.useAmmunition('missiles', 5);
      
      gameState.restartGame();
      
      // Should be back to defaults
      const data = gameState.getData();
      expect(data.score).toBe(0);
      expect(data.lives).toBe(3);
      expect(data.level).toBe(1);
      expect(data.difficulty).toBe(1);
      expect(data.weaponUpgrades.beam).toBe(1);
      expect(data.ammunition.missiles).toBe(10);
      expect(gameState.getCurrentScene()).toBe(GameScene.GAMEPLAY);
    });
  });
});