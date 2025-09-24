import { Component as IComponent } from './interfaces';

/**
 * Abstract base class for all components
 * Provides common functionality and enforces the component interface
 */
export abstract class Component implements IComponent {
  public abstract readonly type: string;

  /**
   * Optional update method called each frame
   * Override in derived classes to implement component-specific logic
   */
  update?(deltaTime: number): void;

  /**
   * Optional cleanup method called when component is removed
   * Override in derived classes to implement cleanup logic
   */
  destroy?(): void;
}

/**
 * Base component types as constants to avoid typos
 */
export const ComponentTypes = {
  TRANSFORM: 'transform',
  SPRITE: 'sprite',
  COLLIDER: 'collider',
  HEALTH: 'health',
  WEAPON: 'weapon',
  VELOCITY: 'velocity',
  INPUT: 'input',
  BACKGROUND: 'background'
} as const;

export type ComponentType = typeof ComponentTypes[keyof typeof ComponentTypes];