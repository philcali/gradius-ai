import { Component, ComponentTypes } from '../core/Component';
import { Rectangle } from '../core/interfaces';

/**
 * Sprite component handles texture rendering and animation for entities
 */
export class Sprite extends Component {
    public readonly type = ComponentTypes.SPRITE;

    // Image source (can be HTMLImageElement, HTMLCanvasElement, etc.)
    public image: HTMLImageElement | HTMLCanvasElement | null = null;

    // Source rectangle in the image (for sprite sheets)
    public sourceRect: Rectangle;

    // Destination size (if different from source size)
    public width: number;
    public height: number;

    // Rendering properties
    public visible: boolean = true;
    public alpha: number = 1.0; // 0.0 to 1.0
    public tint: string | null = null; // CSS color string for tinting

    // Render layer (higher numbers render on top)
    public layer: number = 0;

    // Anchor point (0,0 = top-left, 0.5,0.5 = center, 1,1 = bottom-right)
    public anchorX: number = 0.5;
    public anchorY: number = 0.5;

    // Animation properties
    public frameCount: number = 1;
    public currentFrame: number = 0;
    public frameTime: number = 100; // milliseconds per frame
    private frameTimer: number = 0;
    public loop: boolean = true;
    public playing: boolean = false;

    constructor(
        width: number = 32,
        height: number = 32,
        imageSrc?: string
    ) {
        super();

        this.width = width;
        this.height = height;
        this.sourceRect = { x: 0, y: 0, width, height };

        if (imageSrc) {
            this.loadImage(imageSrc);
        }
    }

    /**
     * Load an image from a URL
     */
    loadImage(src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.image = img;
                // If source rect wasn't set, use full image
                if (this.sourceRect.width === this.width && this.sourceRect.height === this.height) {
                    this.sourceRect.width = img.width;
                    this.sourceRect.height = img.height;
                }
                resolve();
            };
            img.onerror = () => {
                reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
        });
    }

    /**
     * Set the source rectangle for sprite sheet animation
     */
    setSourceRect(x: number, y: number, width: number, height: number): void {
        this.sourceRect.x = x;
        this.sourceRect.y = y;
        this.sourceRect.width = width;
        this.sourceRect.height = height;
    }

    /**
     * Set up sprite sheet animation
     */
    setupAnimation(frameCount: number, frameWidth: number, frameHeight: number, frameTime: number = 100): void {
        this.frameCount = frameCount;
        this.frameTime = frameTime;
        this.setSourceRect(0, 0, frameWidth, frameHeight);
        this.currentFrame = 0;
        this.frameTimer = 0;
    }

    /**
     * Start animation playback
     */
    play(): void {
        this.playing = true;
        this.frameTimer = 0;
    }

    /**
     * Stop animation playback
     */
    stop(): void {
        this.playing = false;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.updateFrame();
    }

    /**
     * Pause animation playback
     */
    pause(): void {
        this.playing = false;
    }

    /**
     * Set current animation frame
     */
    setFrame(frame: number): void {
        this.currentFrame = Math.max(0, Math.min(frame, this.frameCount - 1));
        this.updateFrame();
    }

    /**
     * Update animation frame based on source rectangle
     */
    private updateFrame(): void {
        if (this.frameCount > 1) {
            const frameWidth = this.sourceRect.width;
            this.sourceRect.x = this.currentFrame * frameWidth;
        }
    }

    /**
     * Update animation
     */
    update(deltaTime: number): void {
        if (!this.playing || this.frameCount <= 1) {
            return;
        }

        this.frameTimer += deltaTime;

        if (this.frameTimer >= this.frameTime) {
            this.frameTimer = 0;
            this.currentFrame++;

            if (this.currentFrame >= this.frameCount) {
                if (this.loop) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = this.frameCount - 1;
                    this.playing = false;
                }
            }

            this.updateFrame();
        }
    }

    /**
     * Set visibility
     */
    setVisible(visible: boolean): void {
        this.visible = visible;
    }

    /**
     * Set alpha transparency
     */
    setAlpha(alpha: number): void {
        this.alpha = Math.max(0, Math.min(1, alpha));
    }

    /**
     * Set tint color
     */
    setTint(color: string | null): void {
        this.tint = color;
    }

    /**
     * Set render layer
     */
    setLayer(layer: number): void {
        this.layer = layer;
    }

    /**
     * Set anchor point
     */
    setAnchor(x: number, y: number): void {
        this.anchorX = x;
        this.anchorY = y;
    }

    /**
     * Clone this sprite (without the image reference)
     */
    clone(): Sprite {
        const sprite = new Sprite(this.width, this.height);
        sprite.image = this.image;
        sprite.sourceRect = { ...this.sourceRect };
        sprite.visible = this.visible;
        sprite.alpha = this.alpha;
        sprite.tint = this.tint;
        sprite.layer = this.layer;
        sprite.anchorX = this.anchorX;
        sprite.anchorY = this.anchorY;
        sprite.frameCount = this.frameCount;
        sprite.currentFrame = this.currentFrame;
        sprite.frameTime = this.frameTime;
        sprite.loop = this.loop;
        sprite.playing = this.playing;
        return sprite;
    }
}