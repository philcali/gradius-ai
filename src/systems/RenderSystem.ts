import { System, Entity } from '../core/interfaces';
import { ComponentTypes } from '../core/Component';
import { Transform } from '../components/Transform';
import { Sprite } from '../components/Sprite';

/**
 * RenderSystem handles drawing all entities with Transform and Sprite components
 */
export class RenderSystem implements System {
  public readonly name = 'RenderSystem';
  
  private ctx: CanvasRenderingContext2D;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
    this.ctx = ctx;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  /**
   * Filter entities that have both Transform and Sprite components
   */
  filter(entity: Entity): boolean {
    return entity.hasComponent(ComponentTypes.TRANSFORM) && 
           entity.hasComponent(ComponentTypes.SPRITE);
  }

  /**
   * Update method called each frame to render all entities
   */
  update(entities: Entity[], _deltaTime: number): void {
    // Sort entities by render layer (lower layers render first)
    const renderableEntities = entities.filter(this.filter).sort((a, b) => {
      const spriteA = a.getComponent<Sprite>(ComponentTypes.SPRITE)!;
      const spriteB = b.getComponent<Sprite>(ComponentTypes.SPRITE)!;
      return spriteA.layer - spriteB.layer;
    });

    // Debug: Log once every 60 frames (approximately once per second at 60fps)
    if (Math.random() < 0.016) {
      console.log(`RenderSystem: ${entities.length} total entities, ${renderableEntities.length} renderable`);
    }

    // Render each entity
    for (const entity of renderableEntities) {
      this.renderEntity(entity);
    }
  }

  /**
   * Render a single entity
   */
  private renderEntity(entity: Entity): void {
    const transform = entity.getComponent<Transform>(ComponentTypes.TRANSFORM)!;
    const sprite = entity.getComponent<Sprite>(ComponentTypes.SPRITE)!;

    // Skip if not visible
    if (!sprite.visible || sprite.alpha <= 0) {
      return;
    }

    // Save canvas state
    this.ctx.save();

    // Apply global alpha
    this.ctx.globalAlpha = sprite.alpha;

    // Calculate render position based on anchor
    const renderX = transform.position.x - (sprite.width * sprite.anchorX * transform.scale.x);
    const renderY = transform.position.y - (sprite.height * sprite.anchorY * transform.scale.y);

    // Apply transformations
    if (transform.rotation !== 0 || transform.scale.x !== 1 || transform.scale.y !== 1) {
      // Move to entity position for rotation/scale
      this.ctx.translate(transform.position.x, transform.position.y);
      
      // Apply rotation
      if (transform.rotation !== 0) {
        this.ctx.rotate(transform.rotation);
      }
      
      // Apply scale
      if (transform.scale.x !== 1 || transform.scale.y !== 1) {
        this.ctx.scale(transform.scale.x, transform.scale.y);
      }
      
      // Adjust render position for transformed context
      const adjustedX = -(sprite.width * sprite.anchorX);
      const adjustedY = -(sprite.height * sprite.anchorY);
      
      this.renderSprite(sprite, adjustedX, adjustedY);
    } else {
      // Simple rendering without transformations
      this.renderSprite(sprite, renderX, renderY);
    }

    // Restore canvas state
    this.ctx.restore();
  }

  /**
   * Render the sprite at the given position
   */
  private renderSprite(sprite: Sprite, x: number, y: number): void {
    if (sprite.image && (sprite.image instanceof HTMLImageElement ? sprite.image.complete : true)) {
      // Render with image
      this.ctx.drawImage(
        sprite.image,
        sprite.sourceRect.x,
        sprite.sourceRect.y,
        sprite.sourceRect.width,
        sprite.sourceRect.height,
        x,
        y,
        sprite.width,
        sprite.height
      );
      
      // Apply tint if specified
      if (sprite.tint) {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'multiply';
        this.ctx.fillStyle = sprite.tint;
        this.ctx.fillRect(x, y, sprite.width, sprite.height);
        this.ctx.restore();
      }
    } else {
      // Fallback: render as colored rectangle
      this.renderRectangle(x, y, sprite.width, sprite.height, sprite.tint || '#ffffff');
    }
  }

  /**
   * Render a simple colored rectangle (fallback or for testing)
   */
  private renderRectangle(x: number, y: number, width: number, height: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
    
    // Add a border for better visibility
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);
  }

  /**
   * Render debug information for an entity
   */
  renderDebug(entity: Entity): void {
    const transform = entity.getComponent<Transform>(ComponentTypes.TRANSFORM);
    const sprite = entity.getComponent<Sprite>(ComponentTypes.SPRITE);
    
    if (!transform || !sprite) return;

    this.ctx.save();
    
    // Draw position dot
    this.ctx.fillStyle = '#ff0000';
    this.ctx.beginPath();
    this.ctx.arc(transform.position.x, transform.position.y, 3, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw bounding box
    const renderX = transform.position.x - (sprite.width * sprite.anchorX * transform.scale.x);
    const renderY = transform.position.y - (sprite.height * sprite.anchorY * transform.scale.y);
    
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(
      renderX, 
      renderY, 
      sprite.width * transform.scale.x, 
      sprite.height * transform.scale.y
    );
    
    // Draw velocity vector
    if (transform.velocity.x !== 0 || transform.velocity.y !== 0) {
      this.ctx.strokeStyle = '#0000ff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(transform.position.x, transform.position.y);
      this.ctx.lineTo(
        transform.position.x + transform.velocity.x * 0.1,
        transform.position.y + transform.velocity.y * 0.1
      );
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }

  /**
   * Clear the canvas
   */
  clear(color: string = '#000011'): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  /**
   * Update canvas size (call when canvas is resized)
   */
  updateCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }
}