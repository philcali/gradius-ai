/**
 * ScoringSystem handles score calculation and progression mechanics
 * Tracks destroyed entities, calculates scores, and manages difficulty progression
 */

import { System, Entity } from '../core/interfaces';
import { GameState } from '../core/GameState';
import { Obstacle } from '../entities/Obstacle';
import { Enemy } from '../entities/Enemy';
import { PowerUp } from '../entities/PowerUp';

export interface ScoreValues {
    /** Base score for destroying small obstacles */
    smallObstacle: number;
    /** Base score for destroying medium obstacles */
    mediumObstacle: number;
    /** Base score for destroying large obstacles */
    largeObstacle: number;
    /** Base score for destroying basic enemies */
    basicEnemy: number;
    /** Base score for destroying advanced enemies */
    advancedEnemy: number;
    /** Base score for collecting power-ups */
    powerUpCollection: number;
    /** Multiplier for consecutive hits without taking damage */
    comboMultiplier: number;
}

export interface ProgressionConfig {
    /** Score threshold for level progression */
    levelScoreThreshold: number;
    /** Time threshold for level progression (milliseconds) */
    levelTimeThreshold: number;
    /** Maximum difficulty level */
    maxDifficultyLevel: number;
    /** Difficulty increase rate per level */
    difficultyIncreaseRate: number;
}

export class ScoringSystem implements System {
    public readonly name = 'ScoringSystem';

    private gameState: GameState;
    private scoreValues: ScoreValues;
    private progressionConfig: ProgressionConfig;

    // Progression tracking
    private gameStartTime: number = 0;
    private lastLevelTime: number = 0;
    private currentCombo: number = 0;
    private maxCombo: number = 0;

    // Score tracking
    private totalEnemiesDestroyed: number = 0;
    private totalObstaclesDestroyed: number = 0;
    private totalPowerUpsCollected: number = 0;

    // Callbacks for progression events
    private onLevelUp?: (newLevel: number, oldLevel: number) => void;
    private onDifficultyIncrease?: (newDifficulty: number, oldDifficulty: number) => void;
    private onComboAchieved?: (comboCount: number) => void;

    constructor(
        gameState: GameState,
        scoreValues?: Partial<ScoreValues>,
        progressionConfig?: Partial<ProgressionConfig>
    ) {
        this.gameState = gameState;

        // Default score values
        this.scoreValues = {
            smallObstacle: 10,
            mediumObstacle: 25,
            largeObstacle: 50,
            basicEnemy: 100,
            advancedEnemy: 200,
            powerUpCollection: 50,
            comboMultiplier: 1.5,
            ...scoreValues
        };

        // Default progression configuration
        this.progressionConfig = {
            levelScoreThreshold: 1000, // Level up every 1000 points
            levelTimeThreshold: 30000, // Or every 30 seconds
            maxDifficultyLevel: 10,
            difficultyIncreaseRate: 0.5,
            ...progressionConfig
        };

        this.gameStartTime = Date.now();
        this.lastLevelTime = this.gameStartTime;

        // Set up event listeners for entity destruction/collection
        this.setupEventListeners();
    }

    /**
     * Filter for entities that can provide score
     */
    filter(entity: Entity): boolean {
        return entity instanceof Obstacle ||
            entity instanceof Enemy ||
            entity instanceof PowerUp;
    }

    /**
     * Update scoring system
     */
    update(entities: Entity[], _deltaTime: number): void {
        // Check for level progression based on time and score
        this.checkLevelProgression();

        // Update difficulty based on current level
        this.updateDifficulty();

        // Track entity destruction for scoring
        this.trackEntityDestruction(entities);
    }

    /**
     * Check if player should level up
     */
    private checkLevelProgression(): void {
        const currentTime = Date.now();
        const gameData = this.gameState.getData();
        const timeSinceLastLevel = currentTime - this.lastLevelTime;

        let shouldLevelUp = false;

        // Check score threshold
        const scoreThreshold = this.progressionConfig.levelScoreThreshold * gameData.level;
        if (gameData.score >= scoreThreshold) {
            shouldLevelUp = true;
        }

        // Check time threshold
        if (timeSinceLastLevel >= this.progressionConfig.levelTimeThreshold) {
            shouldLevelUp = true;
        }

        if (shouldLevelUp) {
            this.levelUp();
        }
    }

    /**
     * Level up the player
     */
    private levelUp(): void {
        const oldLevel = this.gameState.getData().level;
        this.gameState.nextLevel();
        const newLevel = this.gameState.getData().level;

        this.lastLevelTime = Date.now();

        if (this.onLevelUp) {
            this.onLevelUp(newLevel, oldLevel);
        }

        console.log(`Level up! Now level ${newLevel}`);
    }

    /**
     * Update difficulty based on current level
     */
    private updateDifficulty(): void {
        const gameData = this.gameState.getData();
        const targetDifficulty = Math.min(
            this.progressionConfig.maxDifficultyLevel,
            1 + (gameData.level - 1) * this.progressionConfig.difficultyIncreaseRate
        );

        if (Math.abs(gameData.difficulty - targetDifficulty) > 0.1) {
            const oldDifficulty = gameData.difficulty;
            // Update difficulty through game state (this will trigger callbacks)
            this.gameState.setLevel(gameData.level); // This recalculates difficulty

            if (this.onDifficultyIncrease) {
                this.onDifficultyIncrease(targetDifficulty, oldDifficulty);
            }
        }
    }

    /**
     * Track entity destruction for scoring
     */
    private trackEntityDestruction(entities: Entity[]): void {
        // This method would be called by collision system or entity destruction events
        // For now, it's a placeholder for the integration point
        console.log(entities);
    }

    /**
     * Award score for destroying an obstacle
     */
    awardObstacleScore(obstacle: Obstacle): number {
        const config = obstacle.getConfig();
        let baseScore = this.scoreValues.smallObstacle;

        // Determine score based on obstacle size and type
        if (config.width >= 48 || config.height >= 48) {
            baseScore = this.scoreValues.largeObstacle;
        } else if (config.width >= 32 || config.height >= 32) {
            baseScore = this.scoreValues.mediumObstacle;
        }

        // Bonus for destructible obstacles
        if (config.destructible) {
            baseScore *= 1.5;
        }

        // Apply combo multiplier
        const finalScore = Math.floor(baseScore * this.getComboMultiplier());

        this.gameState.addScore(finalScore);
        this.totalObstaclesDestroyed++;
        this.incrementCombo();

        return finalScore;
    }

    /**
     * Award score for destroying an enemy
     */
    awardEnemyScore(enemy: Enemy): number {
        const config = enemy.getConfig();
        let baseScore = this.scoreValues.basicEnemy;

        // Advanced enemies (with complex movement patterns) give more points
        if (config.movementPattern !== 'straight' || config.health > 1) {
            baseScore = this.scoreValues.advancedEnemy;
        }

        // Bonus based on enemy health
        baseScore *= config.health;

        // Apply combo multiplier
        const finalScore = Math.floor(baseScore * this.getComboMultiplier());

        this.gameState.addScore(finalScore);
        this.totalEnemiesDestroyed++;
        this.incrementCombo();

        return finalScore;
    }

    /**
     * Award score for collecting a power-up
     */
    awardPowerUpScore(powerUp: PowerUp): number {
        const config = powerUp.getConfig();
        const baseScore = config.scoreBonus || this.scoreValues.powerUpCollection;

        // Apply combo multiplier
        const finalScore = Math.floor(baseScore * this.getComboMultiplier());

        this.gameState.addScore(finalScore);
        this.totalPowerUpsCollected++;
        this.incrementCombo();

        return finalScore;
    }

    /**
     * Increment combo counter
     */
    private incrementCombo(): void {
        this.currentCombo++;
        this.maxCombo = Math.max(this.maxCombo, this.currentCombo);

        // Trigger combo achievement callback
        if (this.currentCombo > 0 && this.currentCombo % 10 === 0 && this.onComboAchieved) {
            this.onComboAchieved(this.currentCombo);
        }
    }

    /**
     * Reset combo (called when player takes damage)
     */
    resetCombo(): void {
        this.currentCombo = 0;
    }

    /**
     * Get current combo multiplier
     */
    private getComboMultiplier(): number {
        if (this.currentCombo < 5) return 1.0;
        if (this.currentCombo < 10) return this.scoreValues.comboMultiplier;
        if (this.currentCombo < 20) return this.scoreValues.comboMultiplier * 1.5;
        return this.scoreValues.comboMultiplier * 2.0; // Max multiplier
    }

    /**
     * Get current difficulty multiplier for spawn systems
     */
    getDifficultyMultiplier(): number {
        return this.gameState.getData().difficulty;
    }

    /**
     * Get spawn rate multiplier based on difficulty
     */
    getSpawnRateMultiplier(): number {
        const difficulty = this.gameState.getData().difficulty;
        return Math.min(3.0, 1.0 + (difficulty - 1) * 0.3); // Max 3x spawn rate
    }

    /**
     * Get enemy speed multiplier based on difficulty
     */
    getEnemySpeedMultiplier(): number {
        const difficulty = this.gameState.getData().difficulty;
        return Math.min(2.0, 1.0 + (difficulty - 1) * 0.2); // Max 2x speed
    }

    /**
     * Get game statistics
     */
    getGameStats(): {
        totalScore: number;
        currentLevel: number;
        currentDifficulty: number;
        enemiesDestroyed: number;
        obstaclesDestroyed: number;
        powerUpsCollected: number;
        currentCombo: number;
        maxCombo: number;
        gameTime: number;
    } {
        const gameData = this.gameState.getData();
        return {
            totalScore: gameData.score,
            currentLevel: gameData.level,
            currentDifficulty: gameData.difficulty,
            enemiesDestroyed: this.totalEnemiesDestroyed,
            obstaclesDestroyed: this.totalObstaclesDestroyed,
            powerUpsCollected: this.totalPowerUpsCollected,
            currentCombo: this.currentCombo,
            maxCombo: this.maxCombo,
            gameTime: Date.now() - this.gameStartTime
        };
    }

    /**
     * Set level up callback
     */
    setLevelUpCallback(callback: (newLevel: number, oldLevel: number) => void): void {
        this.onLevelUp = callback;
    }

    /**
     * Set difficulty increase callback
     */
    setDifficultyIncreaseCallback(callback: (newDifficulty: number, oldDifficulty: number) => void): void {
        this.onDifficultyIncrease = callback;
    }

    /**
     * Set combo achievement callback
     */
    setComboAchievementCallback(callback: (comboCount: number) => void): void {
        this.onComboAchieved = callback;
    }

    /**
     * Reset all scoring data (for new game)
     */
    reset(): void {
        this.gameStartTime = Date.now();
        this.lastLevelTime = this.gameStartTime;
        this.currentCombo = 0;
        this.maxCombo = 0;
        this.totalEnemiesDestroyed = 0;
        this.totalObstaclesDestroyed = 0;
        this.totalPowerUpsCollected = 0;
    }

    /**
     * Update score values configuration
     */
    updateScoreValues(newValues: Partial<ScoreValues>): void {
        this.scoreValues = { ...this.scoreValues, ...newValues };
    }

    /**
     * Update progression configuration
     */
    updateProgressionConfig(newConfig: Partial<ProgressionConfig>): void {
        this.progressionConfig = { ...this.progressionConfig, ...newConfig };
    }

    /**
     * Get current score values
     */
    getScoreValues(): ScoreValues {
        return { ...this.scoreValues };
    }

    /**
     * Get current progression config
     */
    getProgressionConfig(): ProgressionConfig {
        return { ...this.progressionConfig };
    }

    /**
     * Set up event listeners for scoring events
     */
    private setupEventListeners(): void {
        // Listen for obstacle destruction
        window.addEventListener('obstacleDestroyed', this.obstacleDestroyedListener);

        // Listen for enemy destruction
        window.addEventListener('enemyDestroyed', this.enemyDestroyedListener);

        // Listen for power-up collection
        window.addEventListener('powerUpCollected', this.powerUpCollectedListener);

        // Listen for player damage to reset combo
        window.addEventListener('playerDamaged', this.playerDamagedListener);
    }

    // Store event listener references for proper cleanup
    private obstacleDestroyedListener = (event: Event) => {
        const customEvent = event as CustomEvent;
        const obstacle = customEvent.detail.obstacle as Obstacle;
        this.awardObstacleScore(obstacle);
    };

    private enemyDestroyedListener = (event: Event) => {
        const customEvent = event as CustomEvent;
        const enemy = customEvent.detail.enemy as Enemy;
        this.awardEnemyScore(enemy);
    };

    private powerUpCollectedListener = (event: Event) => {
        const customEvent = event as CustomEvent;
        const powerUp = customEvent.detail.powerUp as PowerUp;
        this.awardPowerUpScore(powerUp);
    };

    private playerDamagedListener = () => {
        this.resetCombo();
    };

    /**
     * Clean up event listeners
     */
    destroy(): void {
        window.removeEventListener('obstacleDestroyed', this.obstacleDestroyedListener);
        window.removeEventListener('enemyDestroyed', this.enemyDestroyedListener);
        window.removeEventListener('powerUpCollected', this.powerUpCollectedListener);
        window.removeEventListener('playerDamaged', this.playerDamagedListener);
    }
}