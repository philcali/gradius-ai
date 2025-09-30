/**
 * PausedScene handles the pause menu and state preservation
 */

import { Entity, InputState, System } from '../core/interfaces';
import { Scene } from '../core/SceneManager';
import { GameState } from '../core/GameState';

export class PausedScene implements Scene {
  readonly name = 'PausedScene';
  entities: Entity[] = [];
  systems: System[] = [];
  
  private gameState: GameState;
  private canvasWidth: number;
  private canvasHeight: number;
  private selectedOption: number = 0;
  private pauseOptions: string[] = ['Resume', 'Restart', 'Main Menu'];

  constructor(gameState: GameState, _ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
    this.gameState = gameState;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  onEnter(): void {
    console.log('Game Paused');
    this.selectedOption = 0;
  }

  onExit(): void {
    console.log('Game Unpaused');
  }

  update(_deltaTime: number): void {
    // Pause scene doesn't need complex updates
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Draw semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Draw pause title
    ctx.save();
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', this.canvasWidth / 2, this.canvasHeight / 3);

    // Draw game state info
    const gameData = this.gameState.getData();
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${Math.floor(gameData.score)}`, this.canvasWidth / 2, this.canvasHeight / 3 + 60);
    ctx.fillText(`Lives: ${gameData.lives}`, this.canvasWidth / 2, this.canvasHeight / 3 + 90);
    ctx.fillText(`Level: ${gameData.level}`, this.canvasWidth / 2, this.canvasHeight / 3 + 120);

    // Draw pause menu options
    const startY = this.canvasHeight / 2 + 50;
    const optionSpacing = 50;

    for (let i = 0; i < this.pauseOptions.length; i++) {
      const y = startY + i * optionSpacing;
      
      // Highlight selected option
      if (i === this.selectedOption) {
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('> ' + this.pauseOptions[i] + ' <', this.canvasWidth / 2, y);
      } else {
        ctx.fillStyle = '#cccccc';
        ctx.font = '24px Arial';
        ctx.fillText(this.pauseOptions[i], this.canvasWidth / 2, y);
      }
    }

    // Draw instructions
    ctx.fillStyle = '#888888';
    ctx.font = '16px Arial';
    ctx.fillText('Use ARROW KEYS to navigate, ENTER to select', this.canvasWidth / 2, this.canvasHeight - 80);
    ctx.fillText('Press P or ESC to resume', this.canvasWidth / 2, this.canvasHeight - 60);

    // Draw weapon upgrade info
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    const upgradeX = 50;
    const upgradeY = this.canvasHeight - 200;
    
    ctx.fillText('Weapon Upgrades:', upgradeX, upgradeY);
    ctx.fillText(`Beam: Level ${gameData.weaponUpgrades.beam}`, upgradeX, upgradeY + 25);
    ctx.fillText(`Missile: Level ${gameData.weaponUpgrades.missile}`, upgradeX, upgradeY + 50);
    ctx.fillText(`Special: Level ${gameData.weaponUpgrades.special}`, upgradeX, upgradeY + 75);
    
    ctx.fillText('Ammunition:', upgradeX, upgradeY + 110);
    ctx.fillText(`Missiles: ${gameData.ammunition.missiles}`, upgradeX, upgradeY + 135);
    ctx.fillText(`Special Uses: ${gameData.ammunition.specialUses}`, upgradeX, upgradeY + 160);

    ctx.restore();
  }

  handleInput(inputState: InputState): void {
    if (inputState.justPressedKeys) {
      // Quick resume
      if (inputState.justPressedKeys.has('keyp') || inputState.justPressedKeys.has('escape')) {
        this.gameState.resumeGame();
        return;
      }

      // Navigate up
      if (inputState.justPressedKeys.has('arrowup') || inputState.justPressedKeys.has('keyw')) {
        this.selectedOption = (this.selectedOption - 1 + this.pauseOptions.length) % this.pauseOptions.length;
      }
      
      // Navigate down
      if (inputState.justPressedKeys.has('arrowdown') || inputState.justPressedKeys.has('keys')) {
        this.selectedOption = (this.selectedOption + 1) % this.pauseOptions.length;
      }
      
      // Select option
      if (inputState.justPressedKeys.has('enter') || inputState.justPressedKeys.has('space')) {
        this.selectCurrentOption();
      }
    }
  }

  private selectCurrentOption(): void {
    switch (this.selectedOption) {
      case 0: // Resume
        this.gameState.resumeGame();
        break;
      case 1: // Restart
        if (confirm('Are you sure you want to restart? Your progress will be lost.')) {
          this.gameState.restartGame();
        }
        break;
      case 2: // Main Menu
        if (confirm('Return to main menu? Your progress will be lost.')) {
          this.gameState.returnToMenu();
        }
        break;
    }
  }

  destroy(): void {
    // Clean up any pause-specific resources
    this.entities = [];
    this.systems = [];
  }
}