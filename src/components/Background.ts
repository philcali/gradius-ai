import { Component, ComponentTypes } from '../core/Component';

/**
 * Background component for scrolling background layers with parallax support
 */
export class Background extends Component {
  public readonly type = ComponentTypes.BACKGROUND;

  // Background layer properties
  public width: number;
  public height: number;
  public scrollSpeed: number; // Units per second
  public parallaxFactor: number; // Multiplier for parallax effect (0.0 to 1.0)
  public layer: number; // Render layer (lower numbers render first)
  
  // Tiling properties
  public tileWidth: number;
  public tileHeight: number;
  public seamlessTiling: boolean = true;
  
  // Visual properties
  public color: string | null = null; // Solid color background
  public pattern: string | null = null; // Pattern type for procedural backgrounds
  public alpha: number = 1.0;
  public visible: boolean = true;
  
  // Current scroll offset for seamless tiling
  public scrollOffset: number = 0;

  constructor(
    width: number,
    height: number,
    scrollSpeed: number = 100,
    parallaxFactor: number = 1.0,
    layer: number = 0
  ) {
    super();
    
    this.width = width;
    this.height = height;
    this.scrollSpeed = scrollSpeed;
    this.parallaxFactor = parallaxFactor;
    this.layer = layer;
    
    // Default tile size to full background size
    this.tileWidth = width;
    this.tileHeight = height;
  }

  /**
   * Set the tile size for seamless tiling
   */
  setTileSize(width: number, height: number): void {
    this.tileWidth = width;
    this.tileHeight = height;
  }

  /**
   * Set solid color background
   */
  setColor(color: string): void {
    this.color = color;
    this.pattern = null; // Clear pattern when setting color
  }

  /**
   * Set procedural pattern background
   */
  setPattern(pattern: string): void {
    this.pattern = pattern;
    this.color = null; // Clear color when setting pattern
  }

  /**
   * Set alpha transparency
   */
  setAlpha(alpha: number): void {
    this.alpha = Math.max(0, Math.min(1, alpha));
  }

  /**
   * Set visibility
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
  }

  /**
   * Update scroll offset based on scroll speed and delta time
   */
  update(deltaTime: number): void {
    if (!this.visible) return;
    
    // Convert delta time from milliseconds to seconds
    const deltaSeconds = deltaTime / 1000;
    
    // Update scroll offset based on speed and parallax factor
    this.scrollOffset += this.scrollSpeed * this.parallaxFactor * deltaSeconds;
    
    // Keep scroll offset within tile bounds for seamless tiling
    if (this.seamlessTiling && this.tileWidth > 0) {
      this.scrollOffset = this.scrollOffset % this.tileWidth;
    }
  }

  /**
   * Get the current scroll position for rendering
   */
  getScrollPosition(): number {
    return this.scrollOffset;
  }

  /**
   * Reset scroll offset
   */
  resetScroll(): void {
    this.scrollOffset = 0;
  }

  /**
   * Clone this background component
   */
  clone(): Background {
    const background = new Background(
      this.width,
      this.height,
      this.scrollSpeed,
      this.parallaxFactor,
      this.layer
    );
    
    background.tileWidth = this.tileWidth;
    background.tileHeight = this.tileHeight;
    background.seamlessTiling = this.seamlessTiling;
    background.color = this.color;
    background.pattern = this.pattern;
    background.alpha = this.alpha;
    background.visible = this.visible;
    background.scrollOffset = this.scrollOffset;
    
    return background;
  }
}