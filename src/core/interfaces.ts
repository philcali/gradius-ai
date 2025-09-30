/**
 * Core interfaces for the Entity Component System architecture
 */

/**
 * Base component interface that all components must implement
 */
export interface Component {
  /** Unique identifier for the component type */
  readonly type: string;
  
  /** Optional update method called each frame */
  update?(deltaTime: number): void;
  
  /** Optional cleanup method called when component is removed */
  destroy?(): void;
}

/**
 * Entity represents a game object that can have multiple components
 */
export interface Entity {
  /** Unique identifier for this entity */
  readonly id: string;
  
  /** Whether this entity is active and should be processed */
  active: boolean;
  
  /** Map of component type to component instance */
  readonly components: Map<string, Component>;
  
  /** Add a component to this entity */
  addComponent<T extends Component>(component: T): void;
  
  /** Get a component by type */
  getComponent<T extends Component>(type: string): T | undefined;
  
  /** Check if entity has a component of the given type */
  hasComponent(type: string): boolean;
  
  /** Remove a component by type */
  removeComponent(type: string): boolean;
  
  /** Mark entity for removal */
  destroy(): void;
  
  /** Optional update method called each frame */
  update?(deltaTime: number): void;
}

/**
 * System processes entities with specific component combinations
 */
export interface System {
  /** Unique identifier for this system */
  readonly name: string;
  
  /** Update method called each frame with matching entities */
  update(entities: Entity[], deltaTime: number): void;
  
  /** Optional method to filter which entities this system processes */
  filter?(entity: Entity): boolean;
  
  /** Optional initialization method */
  init?(): void;
  
  /** Optional cleanup method */
  destroy?(): void;
}

/**
 * Vector2D represents a 2D coordinate or velocity
 */
export interface Vector2D {
  x: number;
  y: number;
}

/**
 * Rectangle represents a rectangular area
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Game state interface for managing overall game data
 */
export interface GameState {
  score: number;
  lives: number;
  level: number;
  difficulty: number;
  paused: boolean;
  gameOver: boolean;
}

/**
 * Input state interface for tracking user input
 */
export interface InputState {
  keys: Set<string>;
  justPressedKeys: Set<string>;
  justReleasedKeys: Set<string>;
  mousePosition: Vector2D;
  mouseButtons: Set<number>;
}