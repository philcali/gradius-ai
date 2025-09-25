/**
 * UISystem handles rendering of user interface elements
 * Displays game information like score, health, ammunition, etc.
 */

import { System, Entity } from '../core/interfaces';
import { Player } from '../entities/Player';
import { Weapon, WeaponType } from '../components/Weapon';

export interface UIConfig {
  showFPS?: boolean;
  showAmmo?: boolean;
  showScore?: boolean;
  showHealth?: boolean;
  showWeaponInfo?: boolean;
}

export class UISystem implements System {
  public readonly name = 'UISystem';
  
  private ctx: CanvasRenderingContext2D;
  private canvasWidth: number;
  private canvasHeight: number;
  private config: UIConfig;

  constructor(
    ctx: CanvasRenderingContext2D, 
    canvasWidth: number, 
    canvasHeight: number,
    config: UIConfig = {}
  ) {
    this.ctx = ctx;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.config = {
      showFPS: false,
      showAmmo: true,
      showScore: true,
      showHealth: true,
      showWeaponInfo: true,
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
}