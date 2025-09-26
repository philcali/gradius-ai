/**
 * UISystem handles rendering of user interface elements
 * Displays game information like score, health, ammunition, etc.
 */

import { System, Entity } from '../core/interfaces';
import { Player } from '../entities/Player';
import { Weapon, WeaponType } from '../components/Weapon';
import { GameState } from '../core/GameState';
import { ScoringSystem } from './ScoringSystem';

export interface UIConfig {
  showFPS?: boolean;
  showAmmo?: boolean;
  showScore?: boolean;
  showHealth?: boolean;
  showWeaponInfo?: boolean;
  showLevel?: boolean;
  showCombo?: boolean;
  showProgress?: boolean;
}

export class UISystem implements System {
  public readonly name = 'UISystem';
  
  private ctx: CanvasRenderingContext2D;
  private canvasWidth: number;
  private canvasHeight: number;
  private config: UIConfig;
  private gameState?: GameState | undefined;
  private scoringSystem?: ScoringSystem | undefined;

  constructor(
    ctx: CanvasRenderingContext2D, 
    canvasWidth: number, 
    canvasHeight: number,
    config: UIConfig = {},
    gameState?: GameState,
    scoringSystem?: ScoringSystem
  ) {
    this.ctx = ctx;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.gameState = gameState;
    this.scoringSystem = scoringSystem;
    this.config = {
      showFPS: false,
      showAmmo: true,
      showScore: true,
      showHealth: true,
      showWeaponInfo: true,
      showLevel: true,
      showCombo: true,
      showProgress: true,
      ...config
    };
  }

  /**
   * Filter for player entities
   */
  filter(entity: Entity): boolean {
    return entity instanceof Player;
  }

  /**
   * Update and render UI elements
   */
  update(entities: Entity[], _deltaTime: number): void {
    const players = entities.filter(this.filter) as Player[];
    
    if (players.length === 0) {
      return; // No player to display UI for
    }

    const player = players[0]; // Assume single player for now
    this.renderPlayerUI(player);
  }

  /**
   * Render UI elements for the player
   */
  private renderPlayerUI(player: Player): void {
    this.ctx.save();
    
    // Set up UI text styling
    this.ctx.font = '16px Courier New, monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    
    let yOffset = 10;
    const lineHeight = 20;
    const leftMargin = 10;

    // Show score and level information
    if (this.config.showScore || this.config.showLevel) {
      this.renderScoreAndLevel(leftMargin, yOffset);
      yOffset += lineHeight * 2;
    }

    // Show combo information
    if (this.config.showCombo && this.scoringSystem) {
      this.renderComboInfo(leftMargin, yOffset);
      yOffset += lineHeight;
    }

    // Show current weapon info
    if (this.config.showWeaponInfo) {
      const currentWeapon = player.getCurrentWeaponType();
      const weaponName = this.getWeaponDisplayName(currentWeapon);
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText(`Weapon: ${weaponName}`, leftMargin, yOffset);
      yOffset += lineHeight;
    }

    // Show ammunition counts
    if (this.config.showAmmo) {
      this.renderAmmoDisplay(player, leftMargin, yOffset);
      yOffset += lineHeight * 3; // Space for all weapon ammo displays
    }

    // Show weapon upgrade levels
    this.renderWeaponLevels(player, leftMargin, yOffset);
    yOffset += lineHeight * 3;

    // Show progress information
    if (this.config.showProgress) {
      this.renderProgressInfo(leftMargin, yOffset);
    }
    
    this.ctx.restore();
  }

  /**
   * Render ammunition display for all weapons
   */
  private renderAmmoDisplay(player: Player, x: number, y: number): void {
    const weapons = [WeaponType.BEAM, WeaponType.MISSILE, WeaponType.SPECIAL];
    
    weapons.forEach((weaponType, index) => {
      const ammo = player.getAmmo(weaponType);
      const maxAmmo = player.getMaxAmmo(weaponType);
      const weaponName = this.getWeaponDisplayName(weaponType);
      const currentWeapon = player.getCurrentWeaponType();
      
      // Highlight current weapon
      if (weaponType === currentWeapon) {
        this.ctx.fillStyle = '#ffff00'; // Yellow for current weapon
      } else {
        this.ctx.fillStyle = '#cccccc'; // Gray for other weapons
      }

      let ammoText: string;
      if (ammo === undefined) {
        ammoText = '∞'; // Unlimited ammo (beam weapon)
      } else {
        ammoText = `${ammo}/${maxAmmo}`;
        
        // Color code based on ammo level
        if (ammo === 0) {
          this.ctx.fillStyle = '#ff4444'; // Red for empty
        } else if (ammo < (maxAmmo || 0) * 0.3) {
          this.ctx.fillStyle = '#ffaa44'; // Orange for low
        }
      }

      this.ctx.fillText(`${weaponName}: ${ammoText}`, x, y + (index * 20));
    });
  }

  /**
   * Render weapon upgrade levels with detailed information
   */
  private renderWeaponLevels(player: Player, x: number, y: number): void {
    const weapon = player.getWeapon();
    const weapons = [WeaponType.BEAM, WeaponType.MISSILE, WeaponType.SPECIAL];
    
    this.ctx.font = '14px Courier New, monospace';
    
    weapons.forEach((weaponType, index) => {
      const level = weapon.getWeaponLevel(weaponType);
      const maxLevel = weapon.getMaxWeaponLevel(weaponType);
      const weaponName = this.getWeaponDisplayName(weaponType);
      const canUpgrade = weapon.canUpgrade(weaponType);
      const currentWeapon = player.getCurrentWeaponType();
      
      // Color based on weapon status
      if (weaponType === currentWeapon) {
        this.ctx.fillStyle = '#ffff00'; // Yellow for current weapon
      } else if (canUpgrade) {
        this.ctx.fillStyle = '#aaaaaa'; // Gray for upgradeable
      } else {
        this.ctx.fillStyle = '#00ff00'; // Green for maxed out
      }
      
      // Create level indicator (e.g., "★★★☆☆" for level 3/5)
      const levelIndicator = '★'.repeat(level) + '☆'.repeat(maxLevel - level);
      
      const yPos = y + (index * 18);
      this.ctx.fillText(`${weaponName} Lv.${level}: ${levelIndicator}`, x, yPos);
      
      // Show upgrade effects for current level
      if (this.config.showWeaponInfo) {
        this.renderWeaponUpgradeEffects(weapon, weaponType, level, x + 200, yPos);
      }
    });
  }

  /**
   * Render weapon upgrade effects information
   */
  private renderWeaponUpgradeEffects(weapon: Weapon, weaponType: WeaponType, level: number, x: number, y: number): void {
    const effects = weapon.getUpgradeEffects(weaponType, level);
    
    this.ctx.font = '12px Courier New, monospace';
    this.ctx.fillStyle = '#cccccc';
    
    let effectText = '';
    
    // Show damage multiplier if significant
    if (effects.damageMultiplier !== 1) {
      const damagePercent = Math.round((effects.damageMultiplier - 1) * 100);
      effectText += `DMG:${damagePercent > 0 ? '+' : ''}${damagePercent}% `;
    }
    
    // Show fire rate improvement if significant
    if (effects.fireRateMultiplier !== 1) {
      const fireRatePercent = Math.round((1 - effects.fireRateMultiplier) * 100);
      effectText += `SPD:${fireRatePercent > 0 ? '+' : ''}${fireRatePercent}% `;
    }
    
    // Show special effects
    if (effects.specialEffects) {
      const specialEffects = [];
      if (effects.specialEffects.piercing) specialEffects.push('Pierce');
      if (effects.specialEffects.explosive) specialEffects.push('Explode');
      if (effects.specialEffects.homing) specialEffects.push('Homing');
      if (effects.specialEffects.spread) specialEffects.push(`Spread:${effects.specialEffects.spread}`);
      
      if (specialEffects.length > 0) {
        effectText += `[${specialEffects.join(',')}]`;
      }
    }
    
    if (effectText) {
      this.ctx.fillText(effectText.trim(), x, y);
    }
  }

  /**
   * Get display name for weapon type
   */
  private getWeaponDisplayName(weaponType: WeaponType): string {
    switch (weaponType) {
      case WeaponType.BEAM:
        return 'Beam';
      case WeaponType.MISSILE:
        return 'Missile';
      case WeaponType.SPECIAL:
        return 'Special';
      default:
        return 'Unknown';
    }
  }

  /**
   * Update canvas size
   */
  updateCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  /**
   * Get canvas dimensions
   */
  getCanvasSize(): { width: number; height: number } {
    return { width: this.canvasWidth, height: this.canvasHeight };
  }

  /**
   * Update UI configuration
   */
  updateConfig(config: Partial<UIConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Show/hide specific UI elements
   */
  setUIElementVisibility(element: keyof UIConfig, visible: boolean): void {
    this.config[element] = visible;
  }

  /**
   * Set game state reference
   */
  setGameState(gameState: GameState): void {
    this.gameState = gameState;
  }

  /**
   * Set scoring system reference
   */
  setScoringSystem(scoringSystem: ScoringSystem): void {
    this.scoringSystem = scoringSystem;
  }

  /**
   * Render score and level information
   */
  private renderScoreAndLevel(x: number, y: number): void {
    if (!this.gameState) return;

    const gameData = this.gameState.getData();
    
    // Render score
    if (this.config.showScore) {
      this.ctx.fillStyle = '#ffff00'; // Yellow for score
      this.ctx.font = '18px Courier New, monospace';
      this.ctx.fillText(`Score: ${gameData.score.toLocaleString()}`, x, y);
    }

    // Render level and difficulty
    if (this.config.showLevel) {
      this.ctx.fillStyle = '#00ff00'; // Green for level
      this.ctx.font = '16px Courier New, monospace';
      this.ctx.fillText(`Level: ${gameData.level} (Difficulty: ${gameData.difficulty.toFixed(1)})`, x, y + 20);
    }
  }

  /**
   * Render combo information
   */
  private renderComboInfo(x: number, y: number): void {
    if (!this.scoringSystem) return;

    const stats = this.scoringSystem.getGameStats();
    
    if (stats.currentCombo > 0) {
      // Color based on combo level
      if (stats.currentCombo >= 20) {
        this.ctx.fillStyle = '#ff00ff'; // Magenta for high combo
      } else if (stats.currentCombo >= 10) {
        this.ctx.fillStyle = '#ff6600'; // Orange for medium combo
      } else {
        this.ctx.fillStyle = '#ffff00'; // Yellow for low combo
      }
      
      this.ctx.font = '14px Courier New, monospace';
      this.ctx.fillText(`Combo: ${stats.currentCombo}x (Max: ${stats.maxCombo})`, x, y);
    }
  }

  /**
   * Render progress information
   */
  private renderProgressInfo(x: number, y: number): void {
    if (!this.gameState || !this.scoringSystem) return;

    const gameData = this.gameState.getData();
    const stats = this.scoringSystem.getGameStats();
    const progressConfig = this.scoringSystem.getProgressionConfig();
    
    this.ctx.font = '12px Courier New, monospace';
    this.ctx.fillStyle = '#cccccc';
    
    // Calculate progress to next level
    const currentLevelThreshold = progressConfig.levelScoreThreshold * gameData.level;
    const nextLevelThreshold = progressConfig.levelScoreThreshold * (gameData.level + 1);
    const progressToNext = Math.max(0, gameData.score - currentLevelThreshold);
    const neededForNext = nextLevelThreshold - currentLevelThreshold;
    const progressPercent = Math.min(100, (progressToNext / neededForNext) * 100);
    
    // Render progress bar
    const barWidth = 200;
    const barHeight = 8;
    const barX = x;
    const barY = y;
    
    // Background
    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Progress fill
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(barX, barY, (barWidth * progressPercent) / 100, barHeight);
    
    // Progress text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(`Next Level: ${progressPercent.toFixed(0)}%`, barX, barY + barHeight + 2);
    
    // Game statistics
    const gameTimeSeconds = Math.floor(stats.gameTime / 1000);
    const minutes = Math.floor(gameTimeSeconds / 60);
    const seconds = gameTimeSeconds % 60;
    
    this.ctx.fillText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, barX, barY + barHeight + 16);
    this.ctx.fillText(`Destroyed: ${stats.enemiesDestroyed + stats.obstaclesDestroyed}`, barX, barY + barHeight + 30);
  }

  /**
   * Render level up notification
   */
  renderLevelUpNotification(level: number): void {
    this.ctx.save();
    
    // Center of screen
    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;
    
    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(centerX - 150, centerY - 50, 300, 100);
    
    // Border
    this.ctx.strokeStyle = '#ffff00';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(centerX - 150, centerY - 50, 300, 100);
    
    // Text
    this.ctx.fillStyle = '#ffff00';
    this.ctx.font = 'bold 24px Courier New, monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('LEVEL UP!', centerX, centerY - 10);
    
    this.ctx.font = '18px Courier New, monospace';
    this.ctx.fillText(`Level ${level}`, centerX, centerY + 15);
    
    this.ctx.restore();
  }

  /**
   * Render combo achievement notification
   */
  renderComboNotification(combo: number): void {
    this.ctx.save();
    
    // Top right area
    const x = this.canvasWidth - 200;
    const y = 50;
    
    // Background
    this.ctx.fillStyle = 'rgba(255, 102, 0, 0.8)';
    this.ctx.fillRect(x, y, 180, 60);
    
    // Border
    this.ctx.strokeStyle = '#ff6600';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, 180, 60);
    
    // Text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 16px Courier New, monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('COMBO!', x + 90, y + 20);
    this.ctx.fillText(`${combo}x`, x + 90, y + 40);
    
    this.ctx.restore();
  }
}