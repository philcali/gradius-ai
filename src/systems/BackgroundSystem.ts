import { Entity, System } from '../core/interfaces';
import { Background } from '../components/Background';
import { Transform } from '../components/Transform';

/**
 * BackgroundSystem manages scrolling background layers with parallax effects
 */
export class BackgroundSystem implements System {
  public readonly name = 'BackgroundSystem';
  
  private ctx: CanvasRenderingContext2D;
  private canvasWidth: number;
  private canvasHeight: number;
  
  // Global scroll speed multiplier
  private globalScrollSpeed: number = 1.0;
  
  // Debug rendering
  private debugRender: boolean = false;

  constructor(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number
  ) {
    this.ctx = ctx;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  /**
   * Filter entities that have Background components
   */
  filter = (entity: Entity): boolean => {
    return entity.hasComponent('background');
  };

  /**
   * Update all background entities
   */
  update(entities: Entity[], deltaTime: number): void {
    // Clear the canvas first (since this is the first rendering system)
    this.clearCanvas();
    
    // Sort entities by layer (lower layers render first)
    const backgroundEntities = entities
      .filter(entity => entity.hasComponent('background'))
      .sort((a, b) => {
        const bgA = a.getComponent<Background>('background');
        const bgB = b.getComponent<Background>('background');
        if (!bgA || !bgB) return 0;
        return bgA.layer - bgB.layer;
      });

    // Update and render each background layer
    for (const entity of backgroundEntities) {
      const background = entity.getComponent<Background>('background');
      const transform = entity.getComponent<Transform>('transform');
      
      if (!background || !background.visible) continue;

      // Update background scroll offset
      this.updateBackground(background, deltaTime);
      
      // Render background
      this.renderBackground(background, transform);
    }
  }

  /**
   * Update background scroll position
   */
  private updateBackground(background: Background, deltaTime: number): void {
    // Apply global scroll speed multiplier
    const effectiveSpeed = background.scrollSpeed * this.globalScrollSpeed;
    
    // Convert delta time from milliseconds to seconds
    const deltaSeconds = deltaTime / 1000;
    
    // Update scroll offset with parallax factor
    background.scrollOffset += effectiveSpeed * background.parallaxFactor * deltaSeconds;
    
    // Handle seamless tiling
    if (background.seamlessTiling && background.tileWidth > 0) {
      background.scrollOffset = background.scrollOffset % background.tileWidth;
    }
  }

  /**
   * Render background layer with seamless tiling
   */
  private renderBackground(background: Background, transform?: Transform): void {
    this.ctx.save();
    
    // Apply alpha
    this.ctx.globalAlpha = background.alpha;
    
    // Get base position from transform or use (0, 0)
    const baseX = transform?.position.x || 0;
    const baseY = transform?.position.y || 0;
    
    if (background.color) {
      // Render solid color background
      this.renderColorBackground(background, baseX, baseY);
    } else if (background.pattern) {
      // Render procedural pattern background
      this.renderPatternBackground(background, baseX, baseY);
    } else {
      // Render default starfield pattern
      this.renderStarfieldBackground(background, baseX, baseY);
    }
    
    // Debug rendering
    if (this.debugRender) {
      this.renderDebugInfo(background, baseX, baseY);
    }
    
    this.ctx.restore();
  }

  /**
   * Render solid color background with tiling
   */
  private renderColorBackground(background: Background, baseX: number, baseY: number): void {
    this.ctx.fillStyle = background.color!;
    
    if (background.seamlessTiling) {
      // Calculate how many tiles we need to cover the screen
      const tilesX = Math.ceil(this.canvasWidth / background.tileWidth) + 1;
      const tilesY = Math.ceil(this.canvasHeight / background.tileHeight) + 1;
      
      // Calculate starting position based on scroll offset
      const startX = baseX - (background.scrollOffset % background.tileWidth);
      const startY = baseY;
      
      // Render tiles
      for (let x = 0; x < tilesX; x++) {
        for (let y = 0; y < tilesY; y++) {
          const tileX = startX + (x * background.tileWidth);
          const tileY = startY + (y * background.tileHeight);
          
          this.ctx.fillRect(tileX, tileY, background.tileWidth, background.tileHeight);
        }
      }
    } else {
      // Simple full-screen fill
      this.ctx.fillRect(baseX, baseY, background.width, background.height);
    }
  }

  /**
   * Render procedural pattern background
   */
  private renderPatternBackground(background: Background, baseX: number, baseY: number): void {
    switch (background.pattern) {
      case 'stars':
        this.renderStarfieldBackground(background, baseX, baseY);
        break;
      case 'grid':
        this.renderGridBackground(background, baseX, baseY);
        break;
      case 'nebula':
        this.renderNebulaBackground(background, baseX, baseY);
        break;
      default:
        this.renderStarfieldBackground(background, baseX, baseY);
    }
  }

  /**
   * Render starfield background pattern
   */
  private renderStarfieldBackground(background: Background, baseX: number, baseY: number): void {
    // Create a deterministic starfield based on scroll position
    const seed = Math.floor(background.scrollOffset / 100);
    const random = this.seededRandom(seed);
    
    this.ctx.fillStyle = '#ffffff';
    
    if (background.seamlessTiling) {
      const tilesX = Math.ceil(this.canvasWidth / background.tileWidth) + 1;
      const startX = baseX - (background.scrollOffset % background.tileWidth);
      
      for (let tileX = 0; tileX < tilesX; tileX++) {
        const tileStartX = startX + (tileX * background.tileWidth);
        
        // Generate stars for this tile
        for (let i = 0; i < 50; i++) {
          const starX = tileStartX + (random() * background.tileWidth);
          const starY = baseY + (random() * background.tileHeight);
          const starSize = random() * 2 + 0.5;
          
          this.ctx.fillRect(starX, starY, starSize, starSize);
        }
      }
    } else {
      // Simple starfield without tiling
      for (let i = 0; i < 100; i++) {
        const starX = baseX + (random() * background.width);
        const starY = baseY + (random() * background.height);
        const starSize = random() * 2 + 0.5;
        
        this.ctx.fillRect(starX, starY, starSize, starSize);
      }
    }
  }

  /**
   * Render grid background pattern
   */
  private renderGridBackground(background: Background, baseX: number, baseY: number): void {
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 1;
    
    const gridSize = 50;
    const offsetX = (background.scrollOffset % gridSize);
    
    // Vertical lines
    for (let x = -offsetX; x < this.canvasWidth + gridSize; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(baseX + x, baseY);
      this.ctx.lineTo(baseX + x, baseY + this.canvasHeight);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y < this.canvasHeight + gridSize; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(baseX, baseY + y);
      this.ctx.lineTo(baseX + this.canvasWidth, baseY + y);
      this.ctx.stroke();
    }
  }

  /**
   * Render nebula background pattern
   */
  private renderNebulaBackground(_background: Background, baseX: number, baseY: number): void {
    // Create a simple nebula effect with gradients
    const gradient = this.ctx.createRadialGradient(
      baseX + this.canvasWidth / 2, baseY + this.canvasHeight / 2, 0,
      baseX + this.canvasWidth / 2, baseY + this.canvasHeight / 2, this.canvasWidth / 2
    );
    
    gradient.addColorStop(0, '#4a0e4e');
    gradient.addColorStop(0.5, '#2a0845');
    gradient.addColorStop(1, '#0a0a2e');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(baseX, baseY, this.canvasWidth, this.canvasHeight);
  }

  /**
   * Render debug information
   */
  private renderDebugInfo(background: Background, baseX: number, baseY: number): void {
    this.ctx.save();
    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = '12px Courier New';
    this.ctx.textAlign = 'left';
    
    const debugY = baseY + 20 + (background.layer * 60);
    this.ctx.fillText(`Layer ${background.layer}: Offset ${background.scrollOffset.toFixed(1)}`, baseX + 10, debugY);
    this.ctx.fillText(`Speed: ${background.scrollSpeed}, Parallax: ${background.parallaxFactor}`, baseX + 10, debugY + 15);
    
    this.ctx.restore();
  }

  /**
   * Simple seeded random number generator for consistent patterns
   */
  private seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }

  /**
   * Set global scroll speed multiplier
   */
  setGlobalScrollSpeed(speed: number): void {
    this.globalScrollSpeed = speed;
  }

  /**
   * Get global scroll speed multiplier
   */
  getGlobalScrollSpeed(): number {
    return this.globalScrollSpeed;
  }

  /**
   * Enable or disable debug rendering
   */
  setDebugRender(enabled: boolean): void {
    this.debugRender = enabled;
  }

  /**
   * Clear the canvas with a dark space color
   */
  private clearCanvas(): void {
    this.ctx.fillStyle = '#000011'; // Dark space blue
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  /**
   * Initialize the system
   */
  init(): void {
    console.log('BackgroundSystem initialized');
  }

  /**
   * Clean up the system
   */
  destroy(): void {
    console.log('BackgroundSystem destroyed');
  }
}