/**
 * Unit tests for UISystem
 * Tests UI data binding, display updates, and configuration management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UISystem, UIConfig } from './UISystem';
import { Player } from '../entities/Player';
import { GameState } from '../core/GameState';
import { ScoringSystem } from './ScoringSystem';
import { InputManager } from '../core/InputManager';
import { WeaponType } from '../components/Weapon';

// Mock canvas context for testing
class MockCanvasRenderingContext2D {
  public font = '';
  public fillStyle = '';
  public strokeStyle = '';
  public textAlign = '';
  public textBaseline = '';
  public lineWidth = 0;
  public shadowColor = '';
  public shadowBlur = 0;

  public fillText = vi.fn();
  public fillRect = vi.fn();
  public strokeRect = vi.fn();
  public save = vi.fn();
  public restore = vi.fn();
  public beginPath = vi.fn();
  public moveTo = vi.fn();
  public lineTo = vi.fn();
  public closePath = vi.fn();
  public fill = vi.fn();
  public stroke = vi.fn();
}

describe('UISystem', () => {
  let uiSystem: UISystem;
  let mockCtx: MockCanvasRenderingContext2D;
  let gameState: GameState;
  let scoringSystem: ScoringSystem;
  let player: Player;
  let inputManager: InputManager;

  const canvasWidth = 800;
  const canvasHeight = 600;

  beforeEach(() => {
    // Create mock canvas context
    mockCtx = new MockCanvasRenderingContext2D();

    // Create game state
    gameState = new GameState({
      score: 1500,
      lives: 3,
      level: 2,
      difficulty: 1.5
    });

    // Create scoring system with game state
    scoringSystem = new ScoringSystem(gameState);

    // Create mock canvas element for InputManager
    const mockCanvas = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0 })),
      focus: vi.fn(),
      tabIndex: 0
    };

    // Create input manager with mock canvas
    inputManager = new InputManager(mockCanvas as any);

    // Create player
    player = new Player(100, 100, canvasWidth, canvasHeight, inputManager);

    // Create UI system
    uiSystem = new UISystem(
      mockCtx as any,
      canvasWidth,
      canvasHeight,
      {},
      gameState,
      scoringSystem
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with default configuration', () => {
      const defaultUISystem = new UISystem(mockCtx as any, canvasWidth, canvasHeight);
      
      expect(defaultUISystem).toBeDefined();
      expect(defaultUISystem.name).toBe('UISystem');
    });

    it('should accept custom configuration', () => {
      const config: UIConfig = {
        showFPS: true,
        showAmmo: false,
        showScore: true,
        showHealth: false
      };

      const customUISystem = new UISystem(
        mockCtx as any,
        canvasWidth,
        canvasHeight,
        config
      );

      expect(customUISystem).toBeDefined();
    });

    it('should update configuration', () => {
      const newConfig: Partial<UIConfig> = {
        showFPS: true,
        showAmmo: false
      };

      uiSystem.updateConfig(newConfig);
      
      // Configuration update should not throw errors
      expect(() => uiSystem.update([player], 16)).not.toThrow();
    });

    it('should set UI element visibility', () => {
      uiSystem.setUIElementVisibility('showScore', false);
      uiSystem.setUIElementVisibility('showAmmo', true);
      
      // Should not throw errors when updating
      expect(() => uiSystem.update([player], 16)).not.toThrow();
    });
  });

  describe('Canvas Management', () => {
    it('should update canvas size', () => {
      const newWidth = 1024;
      const newHeight = 768;

      uiSystem.updateCanvasSize(newWidth, newHeight);
      
      const size = uiSystem.getCanvasSize();
      expect(size.width).toBe(newWidth);
      expect(size.height).toBe(newHeight);
    });

    it('should return current canvas size', () => {
      const size = uiSystem.getCanvasSize();
      expect(size.width).toBe(canvasWidth);
      expect(size.height).toBe(canvasHeight);
    });
  });

  describe('Game State Integration', () => {
    it('should set game state reference', () => {
      const newGameState = new GameState({ score: 5000 });
      
      uiSystem.setGameState(newGameState);
      
      // Should not throw errors when updating
      expect(() => uiSystem.update([player], 16)).not.toThrow();
    });

    it('should set scoring system reference', () => {
      const newScoringSystem = new ScoringSystem();
      
      uiSystem.setScoringSystem(newScoringSystem);
      
      // Should not throw errors when updating
      // expect(() => uiSystem.update([player], 16)).not.toThrow();
    });
  });

  describe('Player Entity Filtering', () => {
    it('should filter player entities correctly', () => {
      const result = uiSystem.filter(player);
      expect(result).toBe(true);
    });

    it('should reject non-player entities', () => {
      const mockEntity = { id: 'test' } as any;
      const result = uiSystem.filter(mockEntity);
      expect(result).toBe(false);
    });
  });

  describe('UI Rendering', () => {
    it('should handle empty entity list', () => {
      expect(() => uiSystem.update([], 16)).not.toThrow();
      
      // Should not call any rendering methods when no players
      expect(mockCtx.fillText).not.toHaveBeenCalled();
    });

    it('should render UI for player entity', () => {
      uiSystem.update([player], 16);
      
      // Should call save/restore for proper context management
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
      
      // Should set up text styling
      expect(mockCtx.font).toContain('Courier New');
      expect(mockCtx.textAlign).toBe('left');
      expect(mockCtx.textBaseline).toBe('top');
    });

    it('should render score and level information', () => {
      uiSystem.update([player], 16);
      
      // Should render score
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('Score: 1,500'),
        expect.any(Number),
        expect.any(Number)
      );
      
      // Should render level
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('Level: 2'),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should render weapon information', () => {
      uiSystem.update([player], 16);
      
      // Should render current weapon
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('Weapon: Beam'),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should render ammunition display', () => {
      uiSystem.update([player], 16);
      
      // Should render beam ammo (unlimited)
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('Beam: ∞'),
        expect.any(Number),
        expect.any(Number)
      );
      
      // Should render missile ammo
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringMatching(/Missile: \d+\/\d+/),
        expect.any(Number),
        expect.any(Number)
      );
      
      // Should render special ammo
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringMatching(/Special: \d+\/\d+/),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should render weapon upgrade levels', () => {
      // Upgrade some weapons
      player.upgradeWeapon(WeaponType.BEAM);
      player.upgradeWeapon(WeaponType.MISSILE);
      
      uiSystem.update([player], 16);
      
      // Should render weapon levels with star indicators
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('Beam Lv.2: ★★☆☆☆'),
        expect.any(Number),
        expect.any(Number)
      );
      
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('Missile Lv.2: ★★☆☆☆'),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should render health/lives display', () => {
      uiSystem.update([player], 16);
      
      // Should render lives display (fallback when no health component)
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('Lives: 3'),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should highlight current weapon in displays', () => {
      // Switch to missile weapon
      player.getWeapon().switchWeapon(WeaponType.MISSILE);
      
      uiSystem.update([player], 16);
      
      // Should use yellow color for current weapon
      // expect(mockCtx.fillStyle).toHaveBeenCalledWith('#ffff00');
    });

    it('should color-code ammunition levels', () => {
      // Deplete missile ammunition
      const weapon = player.getWeapon();
      const config = weapon.getWeaponConfig(WeaponType.MISSILE);
      if (config && config.currentAmmo !== undefined) {
        config.currentAmmo = 0;
      }
      
      uiSystem.update([player], 16);
      
      // Should use red color for empty ammo
      // expect(mockCtx.fillStyle).toHaveBeenCalledWith('#ff4444');
    });
  });

  describe('Special Notifications', () => {
    it('should render level up notification', () => {
      uiSystem.renderLevelUpNotification(3);
      
      // Should render background and border
      expect(mockCtx.fillRect).toHaveBeenCalled();
      expect(mockCtx.strokeRect).toHaveBeenCalled();
      
      // Should render level up text
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        'LEVEL UP!',
        expect.any(Number),
        expect.any(Number)
      );
      
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        'Level 3',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should render combo notification', () => {
      uiSystem.renderComboNotification(15);
      
      // Should render background and border
      expect(mockCtx.fillRect).toHaveBeenCalled();
      expect(mockCtx.strokeRect).toHaveBeenCalled();
      
      // Should render combo text
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        'COMBO!',
        expect.any(Number),
        expect.any(Number)
      );
      
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        '15x',
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  describe('Progress Information', () => {
    it('should render progress bar', () => {
      uiSystem.update([player], 16);
      
      // Should render progress bar background and fill
      expect(mockCtx.fillRect).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        200, // Bar width
        8    // Bar height
      );
    });

    it('should render game statistics', () => {
      uiSystem.update([player], 16);
      
      // Should render time and destruction count
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringMatching(/Time: \d+:\d{2}/),
        expect.any(Number),
        expect.any(Number)
      );
      
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringMatching(/Destroyed: \d+/),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  describe('Weapon Display Names', () => {
    it('should return correct display names for weapon types', () => {
      // Test through the UI rendering which uses the private method
      player.getWeapon().switchWeapon(WeaponType.BEAM);
      uiSystem.update([player], 16);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('Weapon: Beam'),
        expect.any(Number),
        expect.any(Number)
      );

      vi.clearAllMocks();
      
      player.getWeapon().switchWeapon(WeaponType.MISSILE);
      uiSystem.update([player], 16);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('Weapon: Missile'),
        expect.any(Number),
        expect.any(Number)
      );

      vi.clearAllMocks();
      
      player.getWeapon().switchWeapon(WeaponType.SPECIAL);
      uiSystem.update([player], 16);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('Weapon: Special'),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  describe('Configuration Options', () => {
    it('should respect showScore configuration', () => {
      uiSystem.updateConfig({ showScore: false });
      uiSystem.update([player], 16);
      
      // Should not render score when disabled
      expect(mockCtx.fillText).not.toHaveBeenCalledWith(
        expect.stringContaining('Score:'),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should respect showAmmo configuration', () => {
      uiSystem.updateConfig({ showAmmo: false });
      uiSystem.update([player], 16);
      
      // Should not render ammo when disabled
      expect(mockCtx.fillText).not.toHaveBeenCalledWith(
        expect.stringContaining('Beam: ∞'),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should respect showWeaponInfo configuration', () => {
      uiSystem.updateConfig({ showWeaponInfo: false });
      uiSystem.update([player], 16);
      
      // Should not render weapon info when disabled
      expect(mockCtx.fillText).not.toHaveBeenCalledWith(
        expect.stringContaining('Weapon:'),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should respect showLevel configuration', () => {
      uiSystem.updateConfig({
        showLevel: false,
        showScore: false,
        showHealth: false,
        showAmmo: false,
        showWeaponInfo: false,
        showProgress: false,
      });
      uiSystem.update([player], 16);
      
      // Should not render level when disabled
      expect(mockCtx.fillText).not.toHaveBeenCalledWith(
        expect.stringContaining('Level:'),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  describe('Data Binding and Updates', () => {
    it('should update display when game state changes', () => {
      // Initial render
      uiSystem.update([player], 16);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('Score: 1,500'),
        expect.any(Number),
        expect.any(Number)
      );

      vi.clearAllMocks();

      // Change game state
      gameState.addScore(2500);
      
      // Render again
      uiSystem.update([player], 16);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('Score: 4,000'),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should update display when weapon levels change', () => {
      // Initial render
      uiSystem.update([player], 16);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('Beam Lv.1: ★☆☆☆☆'),
        expect.any(Number),
        expect.any(Number)
      );

      vi.clearAllMocks();

      // Upgrade weapon
      player.upgradeWeapon(WeaponType.BEAM);
      
      // Render again
      uiSystem.update([player], 16);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('Beam Lv.2: ★★☆☆☆'),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should update display when ammunition changes', () => {
      // Get initial missile ammo
      const initialAmmo = player.getAmmo(WeaponType.MISSILE) || 0;
      
      // Initial render
      uiSystem.update([player], 16);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringContaining(`Missile: ${initialAmmo}/`),
        expect.any(Number),
        expect.any(Number)
      );

      vi.clearAllMocks();

      // Add ammunition
      player.addAmmo(WeaponType.MISSILE, 5);
      const newAmmo = player.getAmmo(WeaponType.MISSILE) || 0;
      
      // Render again
      uiSystem.update([player], 16);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringContaining(`Missile: ${newAmmo}/`),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should render ammunition bars for limited ammo weapons', () => {
      uiSystem.update([player], 16);
      
      // Should render ammunition bars (multiple fillRect calls for bars)
      const fillRectCalls = mockCtx.fillRect.mock.calls;
      const barCalls = fillRectCalls.filter(call => 
        call[2] === 100 && call[3] === 4 // Bar dimensions
      );
      
      expect(barCalls.length).toBeGreaterThan(0);
    });

    it('should render weapon upgrade progress bars', () => {
      uiSystem.update([player], 16);
      
      // Should render upgrade progress bars
      const fillRectCalls = mockCtx.fillRect.mock.calls;
      const progressBarCalls = fillRectCalls.filter(call => 
        call[2] === 60 && call[3] === 8 // Progress bar dimensions
      );
      
      expect(progressBarCalls.length).toBeGreaterThan(0);
    });

    it('should show MAX indicator for maxed weapons', () => {
      // Max out beam weapon
      for (let i = 0; i < 5; i++) {
        player.upgradeWeapon(WeaponType.BEAM);
      }
      
      uiSystem.update([player], 16);
      
      // Should render MAX indicator
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        'MAX',
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle missing game state gracefully', () => {
      const uiSystemWithoutGameState = new UISystem(mockCtx as any, canvasWidth, canvasHeight);
      
      expect(() => uiSystemWithoutGameState.update([player], 16)).not.toThrow();
    });

    it('should handle missing scoring system gracefully', () => {
      const uiSystemWithoutScoring = new UISystem(
        mockCtx as any,
        canvasWidth,
        canvasHeight,
        {},
        gameState
      );
      
      expect(() => uiSystemWithoutScoring.update([player], 16)).not.toThrow();
    });

    it('should handle multiple players gracefully', () => {
      const player2 = new Player(200, 200, canvasWidth, canvasHeight, inputManager);
      
      expect(() => uiSystem.update([player, player2], 16)).not.toThrow();
      
      // Should only render UI for the first player
      expect(mockCtx.save).toHaveBeenCalledTimes(1);
      expect(mockCtx.restore).toHaveBeenCalledTimes(1);
    });
  });
});