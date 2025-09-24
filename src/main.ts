/**
 * Main entry point for the Space Shooter game
 */

import { Entity, Component, GameState } from './core/interfaces';
import { GameEngine, InputManager } from './core/index';
import { Transform, Sprite, Background } from './components/index';
import { RenderSystem, ProjectileSystem, CollisionSystem, BackgroundSystem, ObstacleSpawner } from './systems/index';
import { Player, Projectile, Obstacle, Enemy } from './entities/index';

/**
 * Basic Entity implementation
 */
class GameEntity implements Entity {
  public readonly id: string;
  public active: boolean = true;
  public readonly components: Map<string, Component> = new Map();

  constructor(id: string) {
    this.id = id;
  }

  addComponent<T extends Component>(component: T): void {
    this.components.set(component.type, component);
  }

  getComponent<T extends Component>(type: string): T | undefined {
    return this.components.get(type) as T | undefined;
  }

  hasComponent(type: string): boolean {
    return this.components.has(type);
  }

  removeComponent(type: string): boolean {
    const component = this.components.get(type);
    if (component && component.destroy) {
      component.destroy();
    }
    return this.components.delete(type);
  }

  destroy(): void {
    this.active = false;
    // Clean up all components
    for (const component of this.components.values()) {
      if (component.destroy) {
        component.destroy();
      }
    }
    this.components.clear();
  }
}

/**
 * Main Game class that manages the overall game state and coordinates with the GameEngine
 */
class Game {
  private gameEngine: GameEngine;
  private gameState: GameState;
  private inputManager: InputManager;
  private player: Player;
  private projectileSystem!: ProjectileSystem;
  private collisionSystem!: CollisionSystem;
  private obstacleSpawner!: ObstacleSpawner;

  constructor() {
    // Initialize the game engine with the canvas
    this.gameEngine = new GameEngine('gameCanvas');

    // Initialize input manager
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.inputManager = new InputManager(canvas);

    // Initialize game state
    this.gameState = {
      score: 0,
      lives: 3,
      level: 1,
      difficulty: 1,
      paused: false,
      gameOver: false
    };

    console.log('Space Shooter initialized');
    const canvasSize = this.gameEngine.getCanvasSize();
    console.log(`Canvas size: ${canvasSize.width}x${canvasSize.height}`);

    // Create player
    this.player = new Player(
      100, // Start position X
      canvasSize.height / 2, // Start position Y (center vertically)
      canvasSize.width,
      canvasSize.height,
      this.inputManager
    );

    // Set up rendering system and add player
    this.setupGame();
  }

  /**
   * Set up the game systems and entities
   */
  private setupGame(): void {
    const canvasSize = this.gameEngine.getCanvasSize();
    const ctx = this.gameEngine.getContext();

    // Create and add the background system (first, so it renders behind everything)
    const backgroundSystem = new BackgroundSystem(ctx, canvasSize.width, canvasSize.height);
    this.gameEngine.addSystem(backgroundSystem);

    // Create and add the render system
    const renderSystem = new RenderSystem(ctx, canvasSize.width, canvasSize.height);
    this.gameEngine.addSystem(renderSystem);

    // Create and add the projectile system
    this.projectileSystem = new ProjectileSystem(canvasSize.width, canvasSize.height);
    this.gameEngine.addSystem(this.projectileSystem);

    // Create and add the collision system
    this.collisionSystem = new CollisionSystem();
    this.collisionSystem.setDebugContext(ctx);
    this.collisionSystem.setDebugRender(true); // Enable debug rendering for testing
    this.gameEngine.addSystem(this.collisionSystem);

    // Create and add the obstacle spawner system
    this.obstacleSpawner = new ObstacleSpawner(canvasSize.width, canvasSize.height, {
      minSpawnInterval: 2000, // 2 seconds
      maxSpawnInterval: 4000, // 4 seconds
      enemySpawnChance: 0.4,  // 40% chance for enemies
      enabled: true
    });

    // Set up spawner callbacks
    this.obstacleSpawner.setObstacleSpawnCallback((obstacle: Obstacle) => {
      this.gameEngine.addEntity(obstacle);
    });

    this.obstacleSpawner.setEnemySpawnCallback((enemy: Enemy) => {
      this.gameEngine.addEntity(enemy);
    });

    this.gameEngine.addSystem(this.obstacleSpawner);

    // Set up player projectile creation callback
    this.player.setProjectileCreationCallback((projectile: Projectile) => {
      this.gameEngine.addEntity(projectile);
    });

    // Add player to the game engine
    this.gameEngine.addEntity(this.player);

    // Create a simple test entity to verify rendering works
    const testEntity = new GameEntity('test-entity');
    const testTransform = new Transform(200, 200);
    const testSprite = new Sprite(64, 64);
    testSprite.setTint('#ff00ff'); // Bright magenta
    testSprite.setLayer(10); // High layer to render on top
    testEntity.addComponent(testTransform);
    testEntity.addComponent(testSprite);
    this.gameEngine.addEntity(testEntity);

    // Create some demo entities for visual reference
    this.createDemoEntities();

    // Set up projectile cleanup
    this.setupProjectileCleanup();
  }

  /**
   * Create some demo entities for visual reference
   */
  private createDemoEntities(): void {
    const canvasSize = this.gameEngine.getCanvasSize();

    // Create background layers with parallax scrolling
    this.createBackgroundLayers(canvasSize);

    // Create a target for the player to reach
    const target = new GameEntity('target');
    const targetTransform = new Transform(canvasSize.width - 100, canvasSize.height / 2);
    const targetSprite = new Sprite(32, 32);
    targetSprite.setTint('#44ff44'); // Green target
    targetSprite.setLayer(0);

    target.addComponent(targetTransform);
    target.addComponent(targetSprite);
    this.gameEngine.addEntity(target);

    // Add some visual feedback behaviors
    this.setupEntityBehaviors();
  }

  /**
   * Create multiple background layers with parallax scrolling
   */
  private createBackgroundLayers(canvasSize: { width: number; height: number }): void {
    // Deep space background (slowest parallax)
    const deepSpace = new GameEntity('background-deep-space');
    const deepSpaceBackground = new Background(
      canvasSize.width,
      canvasSize.height,
      30, // Slow scroll speed
      0.2, // Low parallax factor
      -3   // Render behind everything
    );
    deepSpaceBackground.setPattern('nebula');
    deepSpaceBackground.setAlpha(0.8);
    deepSpace.addComponent(deepSpaceBackground);
    this.gameEngine.addEntity(deepSpace);

    // Distant stars layer
    const distantStars = new GameEntity('background-distant-stars');
    const distantStarsBackground = new Background(
      canvasSize.width,
      canvasSize.height,
      50, // Medium-slow scroll speed
      0.4, // Medium-low parallax factor
      -2   // Render layer
    );
    distantStarsBackground.setPattern('stars');
    distantStarsBackground.setAlpha(0.6);
    distantStarsBackground.setTileSize(400, 400); // Larger tiles for seamless tiling
    distantStars.addComponent(distantStarsBackground);
    this.gameEngine.addEntity(distantStars);

    // Close stars layer (fastest parallax)
    const closeStars = new GameEntity('background-close-stars');
    const closeStarsBackground = new Background(
      canvasSize.width,
      canvasSize.height,
      80, // Faster scroll speed
      0.7, // Higher parallax factor
      -1   // Render layer
    );
    closeStarsBackground.setPattern('stars');
    closeStarsBackground.setAlpha(0.9);
    closeStarsBackground.setTileSize(200, 200); // Smaller tiles for more frequent tiling
    closeStars.addComponent(closeStarsBackground);
    this.gameEngine.addEntity(closeStars);

    // Optional grid overlay for debugging/retro effect
    const gridOverlay = new GameEntity('background-grid');
    const gridBackground = new Background(
      canvasSize.width,
      canvasSize.height,
      100, // Match main scroll speed
      1.0, // Full parallax factor
      -0.5 // Just behind gameplay elements
    );
    gridBackground.setPattern('grid');
    gridBackground.setAlpha(0.1); // Very subtle
    gridOverlay.addComponent(gridBackground);
    this.gameEngine.addEntity(gridOverlay);
  }

  /**
   * Set up behaviors for demo entities
   */
  private setupEntityBehaviors(): void {
    // Add a simple system to make the target pulse
    const behaviorSystem = {
      name: 'BehaviorSystem',
      update: (entities: Entity[], _deltaTime: number) => {
        for (const entity of entities) {
          const transform = entity.getComponent<Transform>('transform');
          const sprite = entity.getComponent<Sprite>('sprite');
          if (!transform || !sprite) continue;

          // Make the target pulse by changing its scale
          if (entity.id === 'target') {
            const time = Date.now() * 0.003;
            const scale = 1 + Math.sin(time) * 0.2;
            transform.setScale(scale);
          }
        }
      }
    };

    this.gameEngine.addSystem(behaviorSystem);
  }

  /**
   * Set up projectile cleanup system
   */
  private setupProjectileCleanup(): void {
    // Add a cleanup system that removes dead projectiles
    const cleanupSystem = {
      name: 'ProjectileCleanupSystem',
      update: (_entities: Entity[], _deltaTime: number) => {
        const projectilesToRemove = this.projectileSystem.getProjectilesToRemove();
        for (const projectileId of projectilesToRemove) {
          this.gameEngine.removeEntity(projectileId);
        }
      }
    };

    this.gameEngine.addSystem(cleanupSystem);
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
   * Start the game
   */
  start(): void {
    console.log('Starting Space Shooter...');
    this.gameEngine.start();
  }

  /**
   * Stop the game
   */
  stop(): void {
    console.log('Stopping Space Shooter...');
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
export { GameEntity, Game };