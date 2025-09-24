/**
 * ObstacleSpawner system manages spawning of obstacles and enemies from the right side of the screen
 * Handles spawn timing, positioning, and variety of obstacle/enemy types
 */

import { System } from '../core/interfaces';
import { Obstacle, ObstacleConfig } from '../entities/Obstacle';
import { Enemy, EnemyConfig, EnemyMovementPattern } from '../entities/Enemy';

export interface SpawnConfig {
  /** Minimum time between spawns in milliseconds */
  minSpawnInterval: number;
  /** Maximum time between spawns in milliseconds */
  maxSpawnInterval: number;
  /** Probability of spawning an enemy vs obstacle (0-1) */
  enemySpawnChance: number;
  /** Whether spawning is currently enabled */
  enabled: boolean;
}

export class ObstacleSpawner implements System {
  public readonly name = 'ObstacleSpawner';

  private readonly canvasWidth: number;
  private readonly canvasHeight: number;
  private config: SpawnConfig;
  
  // Spawn timing
  private lastSpawnTime: number = 0;
  private nextSpawnDelay: number = 0;
  
  // Spawn callbacks
  private onObstacleSpawned?: (obstacle: Obstacle) => void;
  private onEnemySpawned?: (enemy: Enemy) => void;

  // Predefined obstacle configurations
  private readonly obstacleConfigs: ObstacleConfig[] = [
    // Small destructible crystal
    {
      width: 24,
      height: 24,
      destructible: true,
      color: '#66ff66',
      health: 1
    },
    // Medium destructible crystal
    {
      width: 32,
      height: 32,
      destructible: true,
      color: '#ffff66',
      health: 2
    },
    // Large destructible crystal
    {
      width: 48,
      height: 48,
      destructible: true,
      color: '#ff6666',
      health: 3
    },
    // Small indestructible block
    {
      width: 32,
      height: 32,
      destructible: false,
      color: '#888888'
    },
    // Large indestructible block
    {
      width: 64,
      height: 48,
      destructible: false,
      color: '#666666'
    },
    // Tall narrow obstacle
    {
      width: 16,
      height: 64,
      destructible: true,
      color: '#66ffff',
      health: 2
    }
  ];

  // Predefined enemy configurations
  private readonly enemyConfigs: EnemyConfig[] = [
    // Basic straight-moving enemy
    {
      width: 28,
      height: 20,
      movementPattern: EnemyMovementPattern.STRAIGHT,
      speed: 20,
      health: 1,
      color: '#ff4444'
    },
    // Sine wave enemy
    {
      width: 24,
      height: 24,
      movementPattern: EnemyMovementPattern.SINE_WAVE,
      speed: 30,
      health: 2,
      color: '#ff6644',
      amplitude: 40,
      frequency: 2
    },
    // Zigzag enemy
    {
      width: 32,
      height: 16,
      movementPattern: EnemyMovementPattern.ZIGZAG,
      speed: 40,
      health: 1,
      color: '#ff8844',
      amplitude: 30,
      frequency: 1.5
    },
    // Circular movement enemy (tougher)
    {
      width: 36,
      height: 28,
      movementPattern: EnemyMovementPattern.CIRCULAR,
      speed: 15,
      health: 3,
      color: '#ff2222',
      amplitude: 25,
      frequency: 1
    }
  ];

  constructor(canvasWidth: number, canvasHeight: number, config?: Partial<SpawnConfig>) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    
    // Default spawn configuration
    this.config = {
      minSpawnInterval: 1500, // 1.5 seconds
      maxSpawnInterval: 3000, // 3 seconds
      enemySpawnChance: 0.3,  // 30% chance for enemies
      enabled: true,
      ...config
    };

    this.lastSpawnTime = Date.now();
    this.scheduleNextSpawn();
  }

  /**
   * Update the spawner system
   */
  update(_entities: any[], _deltaTime: number): void {
    if (!this.config.enabled) return;

    const currentTime = Date.now();
    
    // Check if it's time to spawn
    if (currentTime - this.lastSpawnTime >= this.nextSpawnDelay) {
      this.spawnEntity();
      this.lastSpawnTime = currentTime;
      this.scheduleNextSpawn();
    }
  }

  /**
   * Schedule the next spawn
   */
  private scheduleNextSpawn(): void {
    const min = this.config.minSpawnInterval;
    const max = this.config.maxSpawnInterval;
    this.nextSpawnDelay = min + Math.random() * (max - min);
  }

  /**
   * Spawn a new entity (obstacle or enemy)
   */
  private spawnEntity(): void {
    // Determine spawn position
    const spawnX = this.canvasWidth + 50; // Start off-screen to the right
    const spawnY = this.getRandomSpawnY();

    // Decide whether to spawn enemy or obstacle
    if (Math.random() < this.config.enemySpawnChance) {
      this.spawnEnemy(spawnX, spawnY);
    } else {
      this.spawnObstacle(spawnX, spawnY);
    }
  }

  /**
   * Get a random Y position for spawning, avoiding screen edges
   */
  private getRandomSpawnY(): number {
    const margin = 50; // Keep entities away from screen edges
    const minY = margin;
    const maxY = this.canvasHeight - margin;
    return minY + Math.random() * (maxY - minY);
  }

  /**
   * Spawn an obstacle
   */
  private spawnObstacle(x: number, y: number): void {
    // Choose random obstacle configuration
    const config = this.obstacleConfigs[Math.floor(Math.random() * this.obstacleConfigs.length)];
    
    // Ensure obstacle fits on screen vertically
    const adjustedY = this.adjustYPosition(y, config.height);
    
    const obstacle = new Obstacle(x, adjustedY, this.canvasWidth, this.canvasHeight, config);
    
    if (this.onObstacleSpawned) {
      this.onObstacleSpawned(obstacle);
    }
  }

  /**
   * Spawn an enemy
   */
  private spawnEnemy(x: number, y: number): void {
    // Choose random enemy configuration
    const config = this.enemyConfigs[Math.floor(Math.random() * this.enemyConfigs.length)];
    
    // Ensure enemy fits on screen vertically
    const adjustedY = this.adjustYPosition(y, config.height);
    
    const enemy = new Enemy(x, adjustedY, this.canvasWidth, this.canvasHeight, config);
    
    if (this.onEnemySpawned) {
      this.onEnemySpawned(enemy);
    }
  }

  /**
   * Set callback for when obstacles are spawned
   */
  setObstacleSpawnCallback(callback: (obstacle: Obstacle) => void): void {
    this.onObstacleSpawned = callback;
  }

  /**
   * Set callback for when enemies are spawned
   */
  setEnemySpawnCallback(callback: (enemy: Enemy) => void): void {
    this.onEnemySpawned = callback;
  }

  /**
   * Update spawn configuration
   */
  updateConfig(newConfig: Partial<SpawnConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current spawn configuration
   */
  getConfig(): SpawnConfig {
    return { ...this.config };
  }

  /**
   * Enable or disable spawning
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Check if spawning is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get time until next spawn
   */
  getTimeUntilNextSpawn(): number {
    const currentTime = Date.now();
    const elapsed = currentTime - this.lastSpawnTime;
    return Math.max(0, this.nextSpawnDelay - elapsed);
  }

  /**
   * Force spawn an obstacle at specific position
   */
  forceSpawnObstacle(x: number, y: number, configIndex?: number): Obstacle | null {
    if (configIndex !== undefined && (configIndex < 0 || configIndex >= this.obstacleConfigs.length)) {
      console.warn('Invalid obstacle config index');
      return null;
    }

    const config = configIndex !== undefined 
      ? this.obstacleConfigs[configIndex]
      : this.obstacleConfigs[Math.floor(Math.random() * this.obstacleConfigs.length)];
    
    const adjustedY = this.adjustYPosition(y, config.height);
    const obstacle = new Obstacle(x, adjustedY, this.canvasWidth, this.canvasHeight, config);
    
    if (this.onObstacleSpawned) {
      this.onObstacleSpawned(obstacle);
    }

    return obstacle;
  }

  /**
   * Force spawn an enemy at specific position
   */
  forceSpawnEnemy(x: number, y: number, configIndex?: number): Enemy | null {
    if (configIndex !== undefined && (configIndex < 0 || configIndex >= this.enemyConfigs.length)) {
      console.warn('Invalid enemy config index');
      return null;
    }

    const config = configIndex !== undefined 
      ? this.enemyConfigs[configIndex]
      : this.enemyConfigs[Math.floor(Math.random() * this.enemyConfigs.length)];
    
    const adjustedY = this.adjustYPosition(y, config.height);
    const enemy = new Enemy(x, adjustedY, this.canvasWidth, this.canvasHeight, config);
    
    if (this.onEnemySpawned) {
      this.onEnemySpawned(enemy);
    }

    return enemy;
  }

  /**
   * Get available obstacle configurations
   */
  getObstacleConfigs(): ObstacleConfig[] {
    return [...this.obstacleConfigs];
  }

  /**
   * Get available enemy configurations
   */
  getEnemyConfigs(): EnemyConfig[] {
    return [...this.enemyConfigs];
  }

  /**
   * Reset spawn timing
   */
  reset(): void {
    this.lastSpawnTime = Date.now();
    this.scheduleNextSpawn();
  }

  /**
   * Adjust Y position to ensure entity fits within screen bounds
   */
  private adjustYPosition(y: number, entityHeight: number): number {
    const halfHeight = entityHeight / 2;
    return Math.max(halfHeight, Math.min(y, this.canvasHeight - halfHeight));
  }
}