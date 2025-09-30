/**
 * MenuScene handles the main menu interface
 */

import { Entity, InputState, System } from '../core/interfaces';
import { Scene } from '../core/SceneManager';
import { GameState } from '../core/GameState';

export class MenuScene implements Scene {
  readonly name = 'MenuScene';
  entities: Entity[] = [];
  systems: System[] = [];
  
  private gameState: GameState;
  private canvasWidth: number;
  private canvasHeight: number;
  private selectedOption: number = 0;
  private menuOptions: string[] = ['Start Game', 'Instructions', 'Exit'];

  constructor(gameState: GameState, _ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
    this.gameState = gameState;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  onEnter(): void {
    console.log('Entered Menu Scene');
    this.selectedOption = 0;
  }

  onExit(): void {
    console.log('Exited Menu Scene');
  }

  update(_deltaTime: number): void {
    // Menu doesn't need complex updates, just handle input
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Clear screen with dark background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Draw title
    ctx.save();
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE SHOOTER', this.canvasWidth / 2, this.canvasHeight / 3);

    // Draw subtitle
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText('Retro Side-Scrolling Action', this.canvasWidth / 2, this.canvasHeight / 3 + 50);

    // Draw menu options
    const startY = this.canvasHeight / 2 + 50;
    const optionSpacing = 60;

    for (let i = 0; i < this.menuOptions.length; i++) {
      const y = startY + i * optionSpacing;
      
      // Highlight selected option
      if (i === this.selectedOption) {
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 32px Arial';
        ctx.fillText('> ' + this.menuOptions[i] + ' <', this.canvasWidth / 2, y);
      } else {
        ctx.fillStyle = '#cccccc';
        ctx.font = '28px Arial';
        ctx.fillText(this.menuOptions[i], this.canvasWidth / 2, y);
      }
    }

    // Draw instructions at bottom
    ctx.fillStyle = '#888888';
    ctx.font = '16px Arial';
    ctx.fillText('Use ARROW KEYS to navigate, ENTER to select', this.canvasWidth / 2, this.canvasHeight - 50);
    ctx.fillText('ESC to exit', this.canvasWidth / 2, this.canvasHeight - 30);

    ctx.restore();
  }

  handleInput(inputState: InputState): void {
    // Handle keyboard input for menu navigation
    if (inputState.justPressedKeys) {
      // Navigate up
      if (inputState.justPressedKeys.has('arrowup') || inputState.justPressedKeys.has('keyw')) {
        this.selectedOption = (this.selectedOption - 1 + this.menuOptions.length) % this.menuOptions.length;
      }
      
      // Navigate down
      if (inputState.justPressedKeys.has('arrowdown') || inputState.justPressedKeys.has('keys')) {
        this.selectedOption = (this.selectedOption + 1) % this.menuOptions.length;
      }
      
      // Select option
      if (inputState.justPressedKeys.has('enter') || inputState.justPressedKeys.has('space')) {
        this.selectCurrentOption();
      }
      
      // Quick start with any other key
      if (inputState.justPressedKeys.has('keyg') || inputState.justPressedKeys.has('keyp')) {
        this.gameState.startNewGame();
      }
    }
  }

  private selectCurrentOption(): void {
    switch (this.selectedOption) {
      case 0: // Start Game
        this.gameState.startNewGame();
        break;
      case 1: // Instructions
        this.showInstructions();
        break;
      case 2: // Exit
        this.exitGame();
        break;
    }
  }

  private showInstructions(): void {
    // For now, just log instructions. Could create a separate instructions scene later
    console.log('Instructions:');
    console.log('- Use WASD or Arrow Keys to move');
    console.log('- Press SPACE to fire beam weapon');
    console.log('- Press X to fire missile weapon');
    console.log('- Press Z to use special weapon');
    console.log('- Press P to pause game');
    console.log('- Collect power-ups to upgrade weapons');
    console.log('- Avoid obstacles and enemies');
    console.log('- Survive as long as possible!');
  }

  private exitGame(): void {
    // In a real game, this might close the window or return to a launcher
    console.log('Thanks for playing Space Shooter!');
    if (confirm('Are you sure you want to exit?')) {
      window.close();
    }
  }

  destroy(): void {
    // Clean up any menu-specific resources
    this.entities = [];
    this.systems = [];
  }
}