import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Player } from './Player.js';
import { BaseProjectile } from './ProjectileTypes.js';
import { InputManager } from '../core/InputManager.js';
import { ComponentTypes } from '../core/Component.js';

// Mock canvas element
const createMockCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  
  canvas.getBoundingClientRect = vi.fn(() => ({
    left: 0,
    top: 0,
    right: 800,
    bottom: 600,
    width: 800,
    height: 600,
    x: 0,
    y: 0,
    toJSON: () => {}
  }));
  
  return canvas;
};

describe('Player Entity', () => {
  let player: Player;
  let inputManager: InputManager;
  let mockCanvas: HTMLCanvasElement;
  const canvasWidth = 800;
  const canvasHeight = 600;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01'));
    
    mockCanvas = createMockCanvas();
    document.body.appendChild(mockCanvas);
    inputManager = new InputManager(mockCanvas);
    player = new Player(100, 100, canvasWidth, canvasHeight, inputManager);
  });

  afterEach(() => {
    vi.useRealTimers();
    inputManager.destroy();
    document.body.removeChild(mockCanvas);
  });

  describe('Constructor', () => {
    it('should create player with correct initial position', () => {
      expect(player.getPosition()).toEqual({ x: 100, y: 100 });
    });

    it('should have Transform and Sprite components', () => {
      expect(player.hasComponent(ComponentTypes.TRANSFORM)).toBe(true);
      expect(player.hasComponent(ComponentTypes.SPRITE)).toBe(true);
    });

    it('should be active by default', () => {
      expect(player.active).toBe(true);
    });

    it('should have correct dimensions', () => {
      const dimensions = player.getDimensions();
      expect(dimensions.width).toBe(32);
      expect(dimensions.height).toBe(32);
    });

    it('should start with zero velocity', () => {
      expect(player.getVelocity()).toEqual({ x: 0, y: 0 });
      expect(player.isMoving()).toBe(false);
    });
  });

  describe('Movement Input', () => {
    it('should move right when D key is pressed', () => {
      const event = new KeyboardEvent('keydown', { code: 'KeyD' });
      document.dispatchEvent(event);
      
      player.update(16); // ~60fps
      
      const velocity = player.getVelocity();
      expect(velocity.x).toBe(300); // moveSpeed
      expect(velocity.y).toBe(0);
      expect(player.isMoving()).toBe(true);
    });

    it('should move left when A key is pressed', () => {
      const event = new KeyboardEvent('keydown', { code: 'KeyA' });
      document.dispatchEvent(event);
      
      player.update(16);
      
      const velocity = player.getVelocity();
      expect(velocity.x).toBe(-300);
      expect(velocity.y).toBe(0);
    });

    it('should move up when W key is pressed', () => {
      const event = new KeyboardEvent('keydown', { code: 'KeyW' });
      document.dispatchEvent(event);
      
      player.update(16);
      
      const velocity = player.getVelocity();
      expect(velocity.x).toBe(0);
      expect(velocity.y).toBe(-300);
    });

    it('should move down when S key is pressed', () => {
      const event = new KeyboardEvent('keydown', { code: 'KeyS' });
      document.dispatchEvent(event);
      
      player.update(16);
      
      const velocity = player.getVelocity();
      expect(velocity.x).toBe(0);
      expect(velocity.y).toBe(300);
    });

    it('should handle arrow keys', () => {
      const event = new KeyboardEvent('keydown', { code: 'ArrowRight' });
      document.dispatchEvent(event);
      
      player.update(16);
      
      const velocity = player.getVelocity();
      expect(velocity.x).toBe(300);
      expect(velocity.y).toBe(0);
    });

    it('should normalize diagonal movement', () => {
      const eventW = new KeyboardEvent('keydown', { code: 'KeyW' });
      const eventD = new KeyboardEvent('keydown', { code: 'KeyD' });
      
      document.dispatchEvent(eventW);
      document.dispatchEvent(eventD);
      
      player.update(16);
      
      const velocity = player.getVelocity();
      const normalizer = Math.sqrt(2) / 2;
      expect(velocity.x).toBeCloseTo(300 * normalizer);
      expect(velocity.y).toBeCloseTo(-300 * normalizer);
    });

    it('should stop moving when keys are released', () => {
      // Press key
      const downEvent = new KeyboardEvent('keydown', { code: 'KeyD' });
      document.dispatchEvent(downEvent);
      player.update(16);
      expect(player.isMoving()).toBe(true);
      
      // Release key
      const upEvent = new KeyboardEvent('keyup', { code: 'KeyD' });
      document.dispatchEvent(upEvent);
      player.update(16);
      expect(player.isMoving()).toBe(false);
    });
  });

  describe('Boundary Constraints', () => {
    it('should constrain to left boundary', () => {
      player.setPosition(0, 100);
      
      const event = new KeyboardEvent('keydown', { code: 'KeyA' });
      document.dispatchEvent(event);
      
      player.update(100); // Large delta to ensure movement
      
      const position = player.getPosition();
      expect(position.x).toBe(16); // Half of ship width (32/2)
      expect(position.y).toBe(100);
    });

    it('should constrain to right boundary', () => {
      player.setPosition(canvasWidth, 100);
      
      const event = new KeyboardEvent('keydown', { code: 'KeyD' });
      document.dispatchEvent(event);
      
      player.update(100);
      
      const position = player.getPosition();
      expect(position.x).toBe(canvasWidth - 16); // Canvas width - half ship width
      expect(position.y).toBe(100);
    });

    it('should constrain to top boundary', () => {
      player.setPosition(100, 0);
      
      const event = new KeyboardEvent('keydown', { code: 'KeyW' });
      document.dispatchEvent(event);
      
      player.update(100);
      
      const position = player.getPosition();
      expect(position.x).toBe(100);
      expect(position.y).toBe(16); // Half of ship height
    });

    it('should constrain to bottom boundary', () => {
      player.setPosition(100, canvasHeight);
      
      const event = new KeyboardEvent('keydown', { code: 'KeyS' });
      document.dispatchEvent(event);
      
      player.update(100);
      
      const position = player.getPosition();
      expect(position.x).toBe(100);
      expect(position.y).toBe(canvasHeight - 16); // Canvas height - half ship height
    });

    it('should stop velocity when hitting boundary', () => {
      player.setPosition(0, 100);
      
      const event = new KeyboardEvent('keydown', { code: 'KeyA' });
      document.dispatchEvent(event);
      
      player.update(100);
      
      const velocity = player.getVelocity();
      expect(velocity.x).toBe(0); // Velocity should be stopped at boundary
    });
  });

  describe('Position and Movement Methods', () => {
    it('should set position correctly', () => {
      player.setPosition(200, 300);
      expect(player.getPosition()).toEqual({ x: 200, y: 300 });
    });

    it('should return correct move speed', () => {
      expect(player.getMoveSpeed()).toBe(300);
    });

    it('should update position based on velocity', () => {
      const initialPosition = player.getPosition();
      
      const event = new KeyboardEvent('keydown', { code: 'KeyD' });
      document.dispatchEvent(event);
      
      player.update(1000); // 1 second
      
      const newPosition = player.getPosition();
      expect(newPosition.x).toBeCloseTo(initialPosition.x + 300); // 300 pixels/second * 1 second
      expect(newPosition.y).toBe(initialPosition.y);
    });
  });

  describe('Entity Lifecycle', () => {
    it('should not update when inactive', () => {
      const initialPosition = player.getPosition();
      
      player.active = false;
      
      const event = new KeyboardEvent('keydown', { code: 'KeyD' });
      document.dispatchEvent(event);
      
      player.update(16);
      
      expect(player.getPosition()).toEqual(initialPosition);
      expect(player.getVelocity()).toEqual({ x: 0, y: 0 });
    });

    it('should have a unique ID', () => {
      const player2 = new Player(0, 0, canvasWidth, canvasHeight, inputManager);
      expect(player.id).not.toBe(player2.id);
    });
  });

  describe('Weapon System', () => {
    let createdProjectiles: BaseProjectile[] = [];

    beforeEach(() => {
      createdProjectiles = [];
      player.setProjectileCreationCallback((projectile: BaseProjectile) => {
        createdProjectiles.push(projectile);
      });
    });

    it('should fire projectile when space key is pressed', () => {
      const event = new KeyboardEvent('keydown', { code: 'Space' });
      document.dispatchEvent(event);
      
      player.update(16);
      
      expect(createdProjectiles).toHaveLength(1);
      
      const projectile = createdProjectiles[0];
      expect(projectile).toBeInstanceOf(BaseProjectile);
      
      // Projectile should spawn at front of ship
      const playerPos = player.getPosition();
      const projectilePos = projectile.getPosition();
      expect(projectilePos.x).toBe(playerPos.x + 16); // Half ship width
      expect(projectilePos.y).toBe(playerPos.y);
      
      // Projectile should move to the right
      const velocity = projectile.getVelocity();
      expect(velocity.x).toBe(600);
      expect(velocity.y).toBe(0);
    });

    it('should respect fire rate cooldown', () => {
      const event = new KeyboardEvent('keydown', { code: 'Space' });
      document.dispatchEvent(event);
      
      // First shot
      player.update(16);
      expect(createdProjectiles).toHaveLength(1);
      
      // Immediate second shot should not fire (within cooldown)
      player.update(16);
      expect(createdProjectiles).toHaveLength(1);
      
      // Advance time beyond fire rate (200ms)
      vi.advanceTimersByTime(250);
      player.update(16);
      expect(createdProjectiles).toHaveLength(2);
    });

    it('should not fire when space key is not pressed', () => {
      player.update(16);
      expect(createdProjectiles).toHaveLength(0);
    });

    it('should not fire when player is inactive', () => {
      player.active = false;
      
      const event = new KeyboardEvent('keydown', { code: 'Space' });
      document.dispatchEvent(event);
      
      player.update(16);
      expect(createdProjectiles).toHaveLength(0);
    });

    it('should return correct fire rate', () => {
      expect(player.getFireRate()).toBe(200);
    });

    it('should track time since last shot', () => {
      const event = new KeyboardEvent('keydown', { code: 'Space' });
      document.dispatchEvent(event);
      
      player.update(16);
      expect(player.getTimeSinceLastShot()).toBeLessThan(50); // Should be very recent
      
      vi.advanceTimersByTime(100);
      expect(player.getTimeSinceLastShot()).toBeGreaterThanOrEqual(100);
    });

    it('should correctly report if player can fire', () => {
      expect(player.canFire()).toBe(true); // Initially can fire
      
      const event = new KeyboardEvent('keydown', { code: 'Space' });
      document.dispatchEvent(event);
      
      player.update(16);
      expect(player.canFire()).toBe(false); // Just fired, in cooldown
      
      vi.advanceTimersByTime(250);
      expect(player.canFire()).toBe(true); // Cooldown expired
    });

    it('should handle missing projectile creation callback gracefully', () => {
      player.setProjectileCreationCallback(undefined as any);
      
      const event = new KeyboardEvent('keydown', { code: 'Space' });
      document.dispatchEvent(event);
      
      expect(() => player.update(16)).not.toThrow();
    });

    it('should fire continuous projectiles when space is held down', () => {
      const event = new KeyboardEvent('keydown', { code: 'Space' });
      document.dispatchEvent(event);
      
      // Fire multiple times with proper intervals
      for (let i = 0; i < 5; i++) {
        player.update(16);
        vi.advanceTimersByTime(250); // Advance beyond fire rate
      }
      
      expect(createdProjectiles.length).toBeGreaterThan(1);
    });
  });
});