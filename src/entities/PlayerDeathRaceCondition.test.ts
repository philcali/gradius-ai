/**
 * Test to verify the player death race condition fix
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Player } from './Player';
import { InputManager } from '../core/InputManager';

// Mock InputManager
class MockInputManager extends InputManager {
  constructor() {
    super(document.createElement('canvas'));
  }

  isKeyPressed(): boolean { return false; }
  isKeyJustPressed(): boolean { return false; }
  isKeyJustReleased(): boolean { return false; }
  isAnyKeyJustPressed(): boolean { return false; }
  clearFrameInput(): void {}
}

describe('Player Death Race Condition Fix', () => {
  let player: Player;
  let mockInputManager: MockInputManager;
  let deathCallbackCalled: boolean;

  beforeEach(() => {
    mockInputManager = new MockInputManager();
    player = new Player(100, 200, 800, 600, mockInputManager as any);
    deathCallbackCalled = false;

    // Set up death callback
    player.setDeathCallback(() => {
      deathCallbackCalled = true;
    });
  });

  it('should handle death state properly without race condition', () => {
    // Player should start alive and active
    expect(player.active).toBe(true);
    expect(player.isDyingState()).toBe(false);
    expect(player.isDeathHandled()).toBe(false);
    expect(player.isAlive()).toBe(true);

    // Simulate taking fatal damage
    const died = player.takeDamage(10); // More than max health
    expect(died).toBe(true);

    // Player should now be in dying state but still active
    expect(player.active).toBe(true); // Still active for game over handling
    expect(player.isDyingState()).toBe(true); // Marked as dying
    expect(player.isDeathHandled()).toBe(false); // Death not yet handled
    expect(player.isAlive()).toBe(false); // Health is 0
    expect(deathCallbackCalled).toBe(true); // Death callback was triggered

    // Game over logic can now safely access the player entity
    // and check its dying state without race condition

    // After game over handling, mark death as handled
    player.markDeathHandled();
    expect(player.active).toBe(false); // Now safe to deactivate
    expect(player.isDeathHandled()).toBe(true);
  });

  it('should prevent input processing when dying', () => {
    // Take fatal damage
    player.takeDamage(10);
    expect(player.isDyingState()).toBe(true);

    // Get initial position
    const initialPosition = player.getPosition();

    // Update player (should not process input when dying)
    player.update(16.67);

    // Position should not change due to input processing being disabled
    const finalPosition = player.getPosition();
    expect(finalPosition.x).toBe(initialPosition.x);
    expect(finalPosition.y).toBe(initialPosition.y);
  });

  it('should reset death state properly on respawn', () => {
    // Take fatal damage
    player.takeDamage(10);
    expect(player.isDyingState()).toBe(true);
    expect(player.isAlive()).toBe(false);

    // Reset health (simulating respawn)
    player.resetHealth();

    // Player should be fully restored
    expect(player.active).toBe(true);
    expect(player.isDyingState()).toBe(false);
    expect(player.isDeathHandled()).toBe(false);
    expect(player.isAlive()).toBe(true);
    expect(player.getCurrentHealth()).toBe(player.getMaxHealth());
  });

  it('should handle multiple death callbacks safely', () => {
    let callbackCount = 0;
    
    // Set up multiple death callbacks (simulating different systems)
    player.setDeathCallback(() => {
      callbackCount++;
    });

    // Take fatal damage
    player.takeDamage(10);

    // Only one callback should be triggered
    expect(callbackCount).toBe(1);
    expect(player.isDyingState()).toBe(true);
    expect(player.active).toBe(true); // Still active for handling
  });
});