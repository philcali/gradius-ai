/**
 * GameplayScene handles the main game logic and entities
 */

import { Entity, System } from '../core/interfaces';
import { Scene } from '../core/SceneManager';
import { GameState } from '../core/GameState';
import { Transform, Background } from '../components/index';
import { RenderSystem, ProjectileSystem, CollisionSystem, BackgroundSystem, ObstacleSpawner, PowerUpSpawner, UISystem } from '../systems/index';
import { Player, Obstacle, Enemy, PowerUp } from '../entities/index';
import { BaseProjectile } from '../entities/ProjectileTypes';
import { InputManager } from '../core/InputManager';

export class GameplayScene implements Scene {
  readonly name = 'GameplayScene';
  entities: Entity[] = [];
  systems: System[] = [];
  
  private gameState: GameState;
  private ctx: CanvasRenderingContext2D;
  private canvasWidth: number;
  private canvasHeight: number;
  private inputManager: InputManager;
  private player: Player | null = null;
  private projectileSystem: ProjectileSystem | null = null;
  private collisionSystem: CollisionSystem | null = null;
  private obstacleSpawner: ObstacleSpawner | null = null;
  private powerUpSpawner: PowerUpSpawner | null = null;

  constructor(gameState: GameState, ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, inputManager: InputManager) {
    this.gameState = gameState;
    this.ctx = ctx;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.inputManager = inputManager;
  }

  onEnter(): void {
    console.log('Entered Gameplay Scene');
    this.setupGameplay();
  }

  onExit(): void {
    console.log('Exited Gameplay Scene');
    this.cleanup();
  }

  update(deltaTime: number): void {
    // Handle pause input
    if (this.inputManager.isKeyPressed('keyp') || this.inputManager.isKeyPressed('escape')) {
      this.gameState.pauseGame();
      return;
    }

    // Update player score based on survival time
    if (this.player) {
      // Add small score bonus for survival (1 point per second)
      this.gameState.addScore(deltaTime / 1000);
    }

    // Check for game over conditions
    if (this.player && !this.player.active) {
      // Player was destroyed
      if (this.gameState.loseLife()) {
        // Game over
        return;
      } else {
        // Respawn player
        this.respawnPlayer();
      }
    }
  }

  handleInput(_inputState: any): void {
    // Input is handled by the InputManager and passed to entities/systems
    // The player entity handles its own input through the InputManager
  }

  private setupGameplay(): void {
    // Clear any existing entities and systems
    this.entities = [];
    this.systems = [];

    // Create player
    this.player = new Player(
      100, // Start position X
      this.canvasHeight / 2, // Start position Y (center vertically)
      this.canvasWidth,
      this.canvasHeight,
      this.inputManager
    );

    // Set up player callbacks
    this.player.setProjectileCreationCallback((projectile: BaseProjectile) => {
      this.entities.push(projectile);
    });

    this.player.setPowerUpCollectionCallback((powerUp: PowerUp, player: Player) => {
      // Update game state with collected power-up
      this.gameState.setScore(player.getScore());
      
      // Log collection for debugging
      console.log(`Power-up collected! Type: ${powerUp.getType()}, Score: ${this.gameState.getData().score}`);
    });

    this.entities.push(this.player);

    // Create and add the background system (first, so it renders behind everything)
    const backgroundSystem = new BackgroundSystem(this.ctx, this.canvasWidth, this.canvasHeight);
    this.systems.push(backgroundSystem);

    // Create and add the render system
    const renderSystem = new RenderSystem(this.ctx, this.canvasWidth, this.canvasHeight);
    this.systems.push(renderSystem);

    // Create and add the projectile system
    this.projectileSystem = new ProjectileSystem(this.canvasWidth, this.canvasHeight);
    this.systems.push(this.projectileSystem);

    // Create and add the collision system
    this.collisionSystem = new CollisionSystem();
    this.collisionSystem.setDebugContext(this.ctx);
    this.collisionSystem.setDebugRender(false); // Disable debug rendering for gameplay
    this.systems.push(this.collisionSystem);

    // Create and add the obstacle spawner system
    this.obstacleSpawner = new ObstacleSpawner(this.canvasWidth, this.canvasHeight, {
      minSpawnInterval: Math.max(1000, 3000 - (this.gameState.getData().difficulty * 200)), // Faster spawning with difficulty
      maxSpawnInterval: Math.max(2000, 5000 - (this.gameState.getData().difficulty * 300)),
      enemySpawnChance: Math.min(0.6, 0.2 + (this.gameState.getData().difficulty * 0.05)), // More enemies with difficulty
      enabled: true
    });

    // Set up spawner callbacks
    this.obstacleSpawner.setObstacleSpawnCallback((obstacle: Obstacle) => {
      this.entities.push(obstacle);
    });

    this.obstacleSpawner.setEnemySpawnCallback((enemy: Enemy) => {
      this.entities.push(enemy);
    });

    this.systems.push(this.obstacleSpawner);

    // Create and add the power-up spawner system
    this.powerUpSpawner = new PowerUpSpawner(this.canvasWidth, this.canvasHeight, {
      spawnInterval: Math.max(4000, 8000 - (this.gameState.getData().level * 500)), // More frequent with level
      spawnVariance: 3000,
      weaponUpgradeChance: 0.4,
      ammunitionChance: 0.3,
      specialEffectChance: 0.2,
      scoreMultiplierChance: 0.1,
      maxPowerUpsOnScreen: 2
    });

    // Set up power-up spawner callbacks
    this.powerUpSpawner.setPowerUpCreationCallback((powerUp: PowerUp) => {
      // Set up power-up collection callback
      powerUp.setCollectionCallback((collectedPowerUp: PowerUp) => {
        if (this.player) {
          this.player.collectPowerUp(collectedPowerUp);
        }
      });
      
      this.entities.push(powerUp);
    });

    this.systems.push(this.powerUpSpawner);

    // Create and add the UI system (should render last, on top of everything)
    const uiSystem = new UISystem(this.ctx, this.canvasWidth, this.canvasHeight, {
      showAmmo: true,
      showWeaponInfo: true,
      showScore: true,
      showHealth: true,
      showFPS: false
    });
    this.systems.push(uiSystem);

    // Create background layers
    this.createBackgroundLayers();

    // Set up projectile cleanup
    this.setupProjectileCleanup();

    // Initialize all systems
    for (const system of this.systems) {
      if (system.init) {
        system.init();
      }
    }
  }

  private createBackgroundLayers(): void {
    // Deep space background (slowest parallax)
    const deepSpace = this.createEntity('background-deep-space');
    const deepSpaceBackground = new Background(
      this.canvasWidth,
      this.canvasHeight,
      30, // Slow scroll speed
      0.2, // Low parallax factor
      -3   // Render behind everything
    );
    deepSpaceBackground.setPattern('nebula');
    deepSpaceBackground.setAlpha(0.8);
    deepSpace.addComponent(deepSpaceBackground);
    this.entities.push(deepSpace);

    // Distant stars layer
    const distantStars = this.createEntity('background-distant-stars');
    const distantStarsBackground = new Background(
      this.canvasWidth,
      this.canvasHeight,
      50, // Medium-slow scroll speed
      0.4, // Medium-low parallax factor
      -2   // Render layer
    );
    distantStarsBackground.setPattern('stars');
    distantStarsBackground.setAlpha(0.6);
    distantStarsBackground.setTileSize(400, 400);
    distantStars.addComponent(distantStarsBackground);
    this.entities.push(distantStars);

    // Close stars layer (fastest parallax)
    const closeStars = this.createEntity('background-close-stars');
    const closeStarsBackground = new Background(
      this.canvasWidth,
      this.canvasHeight,
      80, // Faster scroll speed
      0.7, // Higher parallax factor
      -1   // Render layer
    );
    closeStarsBackground.setPattern('stars');
    closeStarsBackground.setAlpha(0.9);
    closeStarsBackground.setTileSize(200, 200);
    closeStars.addComponent(closeStarsBackground);
    this.entities.push(closeStars);
  }

  private createEntity(id: string): Entity {
    return {
      id,
      active: true,
      components: new Map(),
      addComponent: function<T extends import('../core/interfaces').Component>(component: T): void {
        this.components.set(component.type, component);
      },
      getComponent: function<T extends import('../core/interfaces').Component>(type: string): T | undefined {
        return this.components.get(type) as T | undefined;
      },
      hasComponent: function(type: string): boolean {
        return this.components.has(type);
      },
      removeComponent: function(type: string): boolean {
        const component = this.components.get(type);
        if (component && component.destroy) {
          component.destroy();
        }
        return this.components.delete(type);
      },
      destroy: function(): void {
        this.active = false;
        for (const component of this.components.values()) {
          if (component.destroy) {
            component.destroy();
          }
        }
        this.components.clear();
      }
    };
  }

  private setupProjectileCleanup(): void {
    // Add a cleanup system that removes dead projectiles
    const cleanupSystem = {
      name: 'ProjectileCleanupSystem',
      update: (_entities: Entity[], _deltaTime: number) => {
        if (this.projectileSystem) {
          const projectilesToRemove = this.projectileSystem.getProjectilesToRemove();
          for (const projectileId of projectilesToRemove) {
            const index = this.entities.findIndex(entity => entity.id === projectileId);
            if (index !== -1) {
              this.entities[index].destroy();
              this.entities.splice(index, 1);
            }
          }
        }
      }
    };

    this.systems.push(cleanupSystem);
  }

  private respawnPlayer(): void {
    if (this.player) {
      // Reset player position and state
      const transform = this.player.getComponent<Transform>('transform');
      if (transform) {
        transform.setPosition(100, this.canvasHeight / 2);
        transform.setVelocity(0, 0);
      }
      
      // Reactivate player
      this.player.active = true;
      
      // Give brief invincibility
      // TODO: Implement invincibility frames
      
      console.log('Player respawned');
    }
  }

  private cleanup(): void {
    // Clean up systems
    for (const system of this.systems) {
      if (system.destroy) {
        system.destroy();
      }
    }

    // Clean up entities
    for (const entity of this.entities) {
      entity.destroy();
    }

    this.entities = [];
    this.systems = [];
    this.player = null;
    this.projectileSystem = null;
    this.collisionSystem = null;
    this.obstacleSpawner = null;
    this.powerUpSpawner = null;
  }

  destroy(): void {
    this.cleanup();
  }
}