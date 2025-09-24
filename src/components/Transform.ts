import { Component, ComponentTypes } from '../core/Component';
import { Vector2D } from '../core/interfaces';

/**
 * Transform component handles position, velocity, and rotation for entities
 * This is a fundamental component used by most game objects
 */
export class Transform extends Component {
  public readonly type = ComponentTypes.TRANSFORM;

  // Position in world coordinates
  public position: Vector2D;
  
  // Velocity in units per second
  public velocity: Vector2D;
  
  // Rotation in radians
  public rotation: number;
  
  // Scale factor (1.0 = normal size)
  public scale: Vector2D;

  constructor(
    x: number = 0,
    y: number = 0,
    vx: number = 0,
    vy: number = 0,
    rotation: number = 0,
    scaleX: number = 1,
    scaleY: number = 1
  ) {
    super();
    
    this.position = { x, y };
    this.velocity = { x: vx, y: vy };
    this.rotation = rotation;
    this.scale = { x: scaleX, y: scaleY };
  }

  /**
   * Update position based on velocity and delta time
   */
  update(deltaTime: number): void {
    // Convert delta time from milliseconds to seconds
    const deltaSeconds = deltaTime / 1000;
    
    // Update position based on velocity
    this.position.x += this.velocity.x * deltaSeconds;
    this.position.y += this.velocity.y * deltaSeconds;
  }

  /**
   * Set position directly
   */
  setPosition(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
  }

  /**
   * Set velocity directly
   */
  setVelocity(vx: number, vy: number): void {
    this.velocity.x = vx;
    this.velocity.y = vy;
  }

  /**
   * Add to current velocity (useful for acceleration)
   */
  addVelocity(vx: number, vy: number): void {
    this.velocity.x += vx;
    this.velocity.y += vy;
  }

  /**
   * Set rotation in radians
   */
  setRotation(rotation: number): void {
    this.rotation = rotation;
  }

  /**
   * Add to current rotation
   */
  addRotation(rotation: number): void {
    this.rotation += rotation;
  }

  /**
   * Set scale uniformly
   */
  setScale(scale: number): void {
    this.scale.x = scale;
    this.scale.y = scale;
  }

  /**
   * Set scale with different x and y values
   */
  setScaleXY(scaleX: number, scaleY: number): void {
    this.scale.x = scaleX;
    this.scale.y = scaleY;
  }

  /**
   * Get distance to another transform
   */
  distanceTo(other: Transform): number {
    const dx = this.position.x - other.position.x;
    const dy = this.position.y - other.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get squared distance to another transform (faster than distanceTo)
   */
  distanceSquaredTo(other: Transform): number {
    const dx = this.position.x - other.position.x;
    const dy = this.position.y - other.position.y;
    return dx * dx + dy * dy;
  }

  /**
   * Clone this transform
   */
  clone(): Transform {
    return new Transform(
      this.position.x,
      this.position.y,
      this.velocity.x,
      this.velocity.y,
      this.rotation,
      this.scale.x,
      this.scale.y
    );
  }
}