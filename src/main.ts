/**
 * Main entry point for the Space Shooter game
 */


import { GameEngine, InputManager, GameState, GameScene, SceneManager } from './core/index';
import { MenuScene, GameplayScene, PausedScene, GameOverScene } from './scenes/index';

/**
 * Main Game class that manages the overall game state and scene management
 */
class Game {
  private gameEngine: GameEngine;
  private gameState: GameState;
  private sceneManager: SceneManager;
  private inputManager: InputManager;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    // Initialize the game engine with the canvas
    this.gameEngine = new GameEngine('gameCanvas');
    this.ctx = this.gameEngine.getContext();

    // Initialize input manager
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.inputManager = new InputManager(canvas);

    // Initialize game state
    this.gameState = new GameState();

    // Initialize scene manager
    this.sceneManager = new SceneManager(this.gameState, this.ctx);

    console.log('Space Shooter initialized');
    const canvasSize = this.gameEngine.getCanvasSize();
    console.log(`Canvas size: ${canvasSize.width}x${canvasSize.height}`);

    // Set up scenes
    this.setupScenes(canvasSize);

    // Set up game state callbacks
    this.setupGameStateCallbacks();
  }

  /**
   * Set up all game scenes
   */
  private setupScenes(canvasSize: { width: number; height: number }): void {
    // Create and register menu scene
    const menuScene = new MenuScene(this.gameState, this.ctx, canvasSize.width, canvasSize.height);
    this.sceneManager.registerScene(GameScene.MENU, menuScene);

    // Create and register gameplay scene
    const gameplayScene = new GameplayScene(this.gameState, this.ctx, canvasSize.width, canvasSize.height, this.inputManager);
    this.sceneManager.registerScene(GameScene.GAMEPLAY, gameplayScene);

    // Create and register paused scene
    const pausedScene = new PausedScene(this.gameState, this.ctx, canvasSize.width, canvasSize.height);
    this.sceneManager.registerScene(GameScene.PAUSED, pausedScene);

    // Create and register game over scene
    const gameOverScene = new GameOverScene(this.gameState, this.ctx, canvasSize.width, canvasSize.height);
    this.sceneManager.registerScene(GameScene.GAME_OVER, gameOverScene);

    // Start with menu scene
    this.gameState.transitionToScene(GameScene.MENU);
  }

  /**
   * Set up game state event callbacks
   */
  private setupGameStateCallbacks(): void {
    this.gameState.setCallbacks({
      onScoreChange: (newScore: number, oldScore: number) => {
        console.log(`Score changed: ${Math.floor(oldScore)} -> ${Math.floor(newScore)}`);
      },
      onLivesChange: (newLives: number, oldLives: number) => {
        console.log(`Lives changed: ${oldLives} -> ${newLives}`);
        if (newLives <= 0) {
          console.log('Game Over - No lives remaining');
        }
      },
      onLevelChange: (newLevel: number, oldLevel: number) => {
        console.log(`Level changed: ${oldLevel} -> ${newLevel}`);
      },
      onGameOver: (finalScore: number) => {
        console.log(`Game Over! Final Score: ${Math.floor(finalScore)}`);
      },
      onRestart: () => {
        console.log('Game restarted');
      }
    });
  }

  /**
   * Update game logic - called by the game engine
   */
  private updateGame(deltaTime: number): void {
    // Handle input for current scene
    const inputState = this.inputManager.getInputState();
    
    this.sceneManager.handleInput(inputState);
    
    // Update current scene
    this.sceneManager.update(deltaTime);
  }

  /**
   * Render game - called by the game engine
   */
  private renderGame(): void {
    // Scene manager handles rendering
    this.sceneManager.render();
  }

  /**
   * Get the game engine instance
   */
  getEngine(): GameEngine {
    return this.gameEngine;
  }

  /**
   * Get the current game state
   */
  getGameState(): GameState {
    return this.gameState;
  }

  /**
   * Get the scene manager
   */
  getSceneManager(): SceneManager {
    return this.sceneManager;
  }

  /**
   * Start the game
   */
  start(): void {
    console.log('Starting Space Shooter...');
    
    // Override the game engine's update and render methods to use scene management
    const gameLoop = (currentTime: number) => {
      // Calculate delta time
      const deltaTime = currentTime - this.gameEngine.lastTime;
      this.gameEngine.lastTime = currentTime;
      this.gameEngine.deltaTime = deltaTime;

      // Update FPS counter
      this.gameEngine.updateFPS(currentTime);

      // Update game through scene manager
      this.updateGame(deltaTime);

      // Render game through scene manager
      this.renderGame();

      // Render FPS counter
      // this.gameEngine.renderFPS();

      // Continue the loop if still running
      if (this.gameEngine.running) {
        requestAnimationFrame(gameLoop);
      }
    };

    // Replace the game loop
    (this.gameEngine as any).gameLoop = gameLoop;

    this.gameEngine.start();
  }

  /**
   * Stop the game
   */
  stop(): void {
    console.log('Stopping Space Shooter...');
    this.gameEngine.stop();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.sceneManager.destroy();
    this.gameEngine.stop();
  }
}

// Initialize and start the game when the page loads
window.addEventListener('load', () => {
  try {
    const game = new Game();
    
    // Expose game instance for debugging
    (window as any).game = game;
    
    game.start();

    // Add some debug info to console
    setInterval(() => {
      const engine = game.getEngine();
      console.log(`FPS: ${engine.getFPS()}, Delta: ${engine.getDeltaTime().toFixed(2)}ms`);
      console.log(`Entities: ${engine.getEntities().length}, Systems: ${engine.getSystems().length}`);
    }, 5000); // Log performance info every 5 seconds

  } catch (error) {
    console.error('Failed to initialize game:', error);
    document.body.innerHTML = '<div class="loading">Error: Failed to initialize game. Check console for details.</div>';
  }
});

// Export for potential testing
export { Game };