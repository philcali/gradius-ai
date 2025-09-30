/**
 * GameOverScene handles the game over state and restart functionality
 */

import { Entity, InputState, System } from '../core/interfaces';
import { Scene } from '../core/SceneManager';
import { GameState } from '../core/GameState';

export class GameOverScene implements Scene {
  readonly name = 'GameOverScene';
  entities: Entity[] = [];
  systems: System[] = [];
  
  private gameState: GameState;
  private canvasWidth: number;
  private canvasHeight: number;
  private selectedOption: number = 0;
  private gameOverOptions: string[] = ['Restart', 'Main Menu'];
  private finalScore: number = 0;
  private animationTime: number = 0;

  constructor(gameState: GameState, _ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
    this.gameState = gameState;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  onEnter(): void {
    console.log('Game Over');
    this.selectedOption = 0;
    this.finalScore = this.gameState.getData().score;
    this.animationTime = 0;
    
    // Save high score to localStorage
    this.saveHighScore();
  }

  onExit(): void {
    console.log('Exited Game Over Scene');
  }

  update(deltaTime: number): void {
    this.animationTime += deltaTime;
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Draw dark background with red tint
    ctx.fillStyle = '#110000';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Add animated red overlay
    const pulseAlpha = 0.1 + Math.sin(this.animationTime * 0.003) * 0.05;
    ctx.fillStyle = `rgba(255, 0, 0, ${pulseAlpha})`;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    ctx.save();

    // Draw "GAME OVER" title with animation
    const titleScale = 1 + Math.sin(this.animationTime * 0.002) * 0.1;
    ctx.translate(this.canvasWidth / 2, this.canvasHeight / 4);
    ctx.scale(titleScale, titleScale);
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', 0, 0);
    ctx.restore();

    // Draw final score
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Final Score: ${Math.floor(this.finalScore)}`, this.canvasWidth / 2, this.canvasHeight / 3 + 20);

    // Draw high score
    const highScore = this.getHighScore();
    if (this.finalScore >= highScore) {
      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 28px Arial';
      ctx.fillText('NEW HIGH SCORE!', this.canvasWidth / 2, this.canvasHeight / 3 + 60);
    } else {
      ctx.fillStyle = '#cccccc';
      ctx.font = '24px Arial';
      ctx.fillText(`High Score: ${Math.floor(highScore)}`, this.canvasWidth / 2, this.canvasHeight / 3 + 60);
    }

    // Draw game statistics
    const gameData = this.gameState.getData();
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '20px Arial';
    ctx.fillText(`Level Reached: ${gameData.level}`, this.canvasWidth / 2, this.canvasHeight / 3 + 100);
    ctx.fillText(`Difficulty: ${gameData.difficulty.toFixed(1)}`, this.canvasWidth / 2, this.canvasHeight / 3 + 130);

    // Draw weapon final states
    ctx.font = '18px Arial';
    ctx.fillText('Final Weapon Levels:', this.canvasWidth / 2, this.canvasHeight / 3 + 170);
    ctx.fillText(`Beam: ${gameData.weaponUpgrades.beam} | Missile: ${gameData.weaponUpgrades.missile} | Special: ${gameData.weaponUpgrades.special}`, 
                 this.canvasWidth / 2, this.canvasHeight / 3 + 195);

    // Draw menu options
    const startY = this.canvasHeight / 2 + 100;
    const optionSpacing = 60;

    for (let i = 0; i < this.gameOverOptions.length; i++) {
      const y = startY + i * optionSpacing;
      
      // Highlight selected option
      if (i === this.selectedOption) {
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 32px Arial';
        ctx.fillText('> ' + this.gameOverOptions[i] + ' <', this.canvasWidth / 2, y);
      } else {
        ctx.fillStyle = '#cccccc';
        ctx.font = '28px Arial';
        ctx.fillText(this.gameOverOptions[i], this.canvasWidth / 2, y);
      }
    }

    // Draw instructions
    ctx.fillStyle = '#888888';
    ctx.font = '16px Arial';
    ctx.fillText('Use ARROW KEYS to navigate, ENTER to select', this.canvasWidth / 2, this.canvasHeight - 80);
    ctx.fillText('Press R to restart quickly', this.canvasWidth / 2, this.canvasHeight - 60);

    // Draw motivational message
    ctx.fillStyle = '#666666';
    ctx.font = '14px Arial';
    const messages = [
      'Better luck next time!',
      'The galaxy needs you!',
      'Try again, pilot!',
      'Every failure is a lesson!',
      'The stars await your return!'
    ];
    const messageIndex = Math.floor(this.animationTime / 3000) % messages.length;
    ctx.fillText(messages[messageIndex], this.canvasWidth / 2, this.canvasHeight - 30);

    ctx.restore();
  }

  handleInput(inputState: InputState): void {
    if (inputState.justPressedKeys) {
      // Quick restart
      if (inputState.justPressedKeys.has('keyr')) {
        this.gameState.restartGame();
        return;
      }

      // Navigate up
      if (inputState.justPressedKeys.has('arrowup') || inputState.justPressedKeys.has('keyw')) {
        this.selectedOption = (this.selectedOption - 1 + this.gameOverOptions.length) % this.gameOverOptions.length;
      }
      
      // Navigate down
      if (inputState.justPressedKeys.has('arrowdown') || inputState.justPressedKeys.has('keys')) {
        this.selectedOption = (this.selectedOption + 1) % this.gameOverOptions.length;
      }
      
      // Select option
      if (inputState.justPressedKeys.has('enter') || inputState.justPressedKeys.has('space')) {
        this.selectCurrentOption();
      }
    }
  }

  private selectCurrentOption(): void {
    switch (this.selectedOption) {
      case 0: // Restart
        this.gameState.restartGame();
        break;
      case 1: // Main Menu
        this.gameState.returnToMenu();
        break;
    }
  }

  private saveHighScore(): void {
    try {
      const currentHighScore = this.getHighScore();
      if (this.finalScore > currentHighScore) {
        localStorage.setItem('spaceShooterHighScore', this.finalScore.toString());
        console.log(`New high score saved: ${Math.floor(this.finalScore)}`);
      }
    } catch (error) {
      console.warn('Could not save high score to localStorage:', error);
    }
  }

  private getHighScore(): number {
    try {
      const saved = localStorage.getItem('spaceShooterHighScore');
      return saved ? parseFloat(saved) : 0;
    } catch (error) {
      console.warn('Could not load high score from localStorage:', error);
      return 0;
    }
  }

  destroy(): void {
    // Clean up any game over specific resources
    this.entities = [];
    this.systems = [];
  }
}