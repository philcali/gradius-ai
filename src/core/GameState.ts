/**
 * GameState class for managing overall game state including score, lives, level tracking
 * and game flow control
 */

export interface GameStateData {
  score: number;
  lives: number;
  level: number;
  difficulty: number;
  weaponUpgrades: {
    beam: number;
    missile: number;
    special: number;
  };
  ammunition: {
    missiles: number;
    specialUses: number;
  };
}

export enum GameScene {
  MENU = 'menu',
  GAMEPLAY = 'gameplay',
  PAUSED = 'paused',
  GAME_OVER = 'game_over'
}

export interface GameStateEventCallbacks {
  onScoreChange?: (newScore: number, oldScore: number) => void;
  onLivesChange?: (newLives: number, oldLives: number) => void;
  onLevelChange?: (newLevel: number, oldLevel: number) => void;
  onSceneChange?: (newScene: GameScene, oldScene: GameScene) => void;
  onGameOver?: (finalScore: number) => void;
  onRestart?: () => void;
}

export class GameState {
  private data: GameStateData;
  private currentScene: GameScene;
  private previousScene: GameScene | null = null;
  private callbacks: GameStateEventCallbacks = {};

  constructor(initialData?: Partial<GameStateData>) {
    this.data = {
      score: 0,
      lives: 3,
      level: 1,
      difficulty: 1,
      weaponUpgrades: {
        beam: 1,
        missile: 1,
        special: 1
      },
      ammunition: {
        missiles: 10,
        specialUses: 3
      },
      ...initialData
    };
    
    this.currentScene = GameScene.MENU;
  }

  /**
   * Set event callbacks for state changes
   */
  setCallbacks(callbacks: GameStateEventCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get current game data (read-only)
   */
  getData(): Readonly<GameStateData> {
    return { ...this.data };
  }

  /**
   * Get current scene
   */
  getCurrentScene(): GameScene {
    return this.currentScene;
  }

  /**
   * Get previous scene (useful for pause/resume)
   */
  getPreviousScene(): GameScene | null {
    return this.previousScene;
  }

  /**
   * Transition to a new scene
   */
  transitionToScene(newScene: GameScene): void {
    const oldScene = this.currentScene;
    this.previousScene = oldScene;
    this.currentScene = newScene;

    if (this.callbacks.onSceneChange) {
      this.callbacks.onSceneChange(newScene, oldScene);
    }

    // Handle special scene transitions
    if (newScene === GameScene.GAME_OVER && this.callbacks.onGameOver) {
      this.callbacks.onGameOver(this.data.score);
    }
  }

  /**
   * Start a new game
   */
  startNewGame(): void {
    this.resetToDefaults();
    this.transitionToScene(GameScene.GAMEPLAY);
  }

  /**
   * Pause the game
   */
  pauseGame(): void {
    if (this.currentScene === GameScene.GAMEPLAY) {
      this.transitionToScene(GameScene.PAUSED);
    }
  }

  /**
   * Resume the game from pause
   */
  resumeGame(): void {
    if (this.currentScene === GameScene.PAUSED) {
      this.transitionToScene(GameScene.GAMEPLAY);
    }
  }

  /**
   * End the current game
   */
  endGame(): void {
    this.transitionToScene(GameScene.GAME_OVER);
  }

  /**
   * Restart the game from game over state
   */
  restartGame(): void {
    this.resetToDefaults();
    this.transitionToScene(GameScene.GAMEPLAY);
    
    if (this.callbacks.onRestart) {
      this.callbacks.onRestart();
    }
  }

  /**
   * Return to main menu
   */
  returnToMenu(): void {
    this.transitionToScene(GameScene.MENU);
  }

  /**
   * Reset game data to default values
   */
  private resetToDefaults(): void {
    const oldScore = this.data.score;
    const oldLives = this.data.lives;
    const oldLevel = this.data.level;

    this.data = {
      score: 0,
      lives: 3,
      level: 1,
      difficulty: 1,
      weaponUpgrades: {
        beam: 1,
        missile: 1,
        special: 1
      },
      ammunition: {
        missiles: 10,
        specialUses: 3
      }
    };

    // Trigger callbacks for changes
    if (this.callbacks.onScoreChange && oldScore !== 0) {
      this.callbacks.onScoreChange(0, oldScore);
    }
    if (this.callbacks.onLivesChange && oldLives !== 3) {
      this.callbacks.onLivesChange(3, oldLives);
    }
    if (this.callbacks.onLevelChange && oldLevel !== 1) {
      this.callbacks.onLevelChange(1, oldLevel);
    }
  }

  /**
   * Add to score
   */
  addScore(points: number): void {
    const oldScore = this.data.score;
    this.data.score += points;
    
    if (this.callbacks.onScoreChange) {
      this.callbacks.onScoreChange(this.data.score, oldScore);
    }
  }

  /**
   * Set score directly
   */
  setScore(score: number): void {
    const oldScore = this.data.score;
    this.data.score = Math.max(0, score);
    
    if (this.callbacks.onScoreChange) {
      this.callbacks.onScoreChange(this.data.score, oldScore);
    }
  }

  /**
   * Lose a life
   */
  loseLife(): boolean {
    const oldLives = this.data.lives;
    this.data.lives = Math.max(0, this.data.lives - 1);
    
    if (this.callbacks.onLivesChange) {
      this.callbacks.onLivesChange(this.data.lives, oldLives);
    }

    // Check for game over
    if (this.data.lives <= 0) {
      return true; // Game over
    }
    
    return false; // Still alive
  }

  /**
   * Gain a life
   */
  gainLife(): void {
    const oldLives = this.data.lives;
    this.data.lives += 1;
    
    if (this.callbacks.onLivesChange) {
      this.callbacks.onLivesChange(this.data.lives, oldLives);
    }
  }

  /**
   * Set lives directly
   */
  setLives(lives: number): void {
    const oldLives = this.data.lives;
    this.data.lives = Math.max(0, lives);
    
    if (this.callbacks.onLivesChange) {
      this.callbacks.onLivesChange(this.data.lives, oldLives);
    }

    // Check for game over
    if (this.data.lives <= 0) {
      this.endGame();
    }
  }

  /**
   * Advance to next level
   */
  nextLevel(): void {
    const oldLevel = this.data.level;
    this.data.level += 1;
    this.data.difficulty = Math.min(10, this.data.difficulty + 0.5); // Cap difficulty at 10
    
    if (this.callbacks.onLevelChange) {
      this.callbacks.onLevelChange(this.data.level, oldLevel);
    }
  }

  /**
   * Set level directly
   */
  setLevel(level: number): void {
    const oldLevel = this.data.level;
    this.data.level = Math.max(1, level);
    this.data.difficulty = Math.min(10, 1 + (this.data.level - 1) * 0.5);
    
    if (this.callbacks.onLevelChange) {
      this.callbacks.onLevelChange(this.data.level, oldLevel);
    }
  }

  /**
   * Upgrade a weapon
   */
  upgradeWeapon(weaponType: keyof GameStateData['weaponUpgrades']): void {
    const maxLevel = 5;
    if (this.data.weaponUpgrades[weaponType] < maxLevel) {
      this.data.weaponUpgrades[weaponType] += 1;
    }
  }

  /**
   * Add ammunition
   */
  addAmmunition(ammoType: keyof GameStateData['ammunition'], amount: number): void {
    this.data.ammunition[ammoType] += amount;
  }

  /**
   * Use ammunition
   */
  useAmmunition(ammoType: keyof GameStateData['ammunition'], amount: number = 1): boolean {
    if (this.data.ammunition[ammoType] >= amount) {
      this.data.ammunition[ammoType] -= amount;
      return true;
    }
    return false;
  }

  /**
   * Check if game is in a playable state
   */
  isPlayable(): boolean {
    return this.currentScene === GameScene.GAMEPLAY;
  }

  /**
   * Check if game is paused
   */
  isPaused(): boolean {
    return this.currentScene === GameScene.PAUSED;
  }

  /**
   * Check if game is over
   */
  isGameOver(): boolean {
    return this.currentScene === GameScene.GAME_OVER;
  }

  /**
   * Check if in menu
   */
  isInMenu(): boolean {
    return this.currentScene === GameScene.MENU;
  }

  /**
   * Serialize state to JSON for persistence
   */
  serialize(): string {
    return JSON.stringify({
      data: this.data,
      currentScene: this.currentScene,
      previousScene: this.previousScene
    });
  }

  /**
   * Deserialize state from JSON
   */
  deserialize(json: string): boolean {
    try {
      const parsed = JSON.parse(json);
      if (parsed.data && parsed.currentScene) {
        this.data = parsed.data;
        this.currentScene = parsed.currentScene;
        this.previousScene = parsed.previousScene || null;
        return true;
      }
    } catch (error) {
      console.error('Failed to deserialize game state:', error);
    }
    return false;
  }
}