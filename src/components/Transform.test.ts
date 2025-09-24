import { describe, it, expect, beforeEach } from 'vitest';
import { Transform } from './Transform.js';
import { ComponentTypes } from '../core/Component.js';

describe('Transform Component', () => {
  let transform: Transform;

  beforeEach(() => {
    transform = new Transform();
  });

  describe('Constructor', () => {
    it('should create with default values', () => {
      expect(transform.type).toBe(ComponentTypes.TRANSFORM);
      expect(transform.position).toEqual({ x: 0, y: 0 });
      expect(transform.velocity).toEqual({ x: 0, y: 0 });
      expect(transform.rotation).toBe(0);
      expect(transform.scale).toEqual({ x: 1, y: 1 });
    });

    it('should create with custom values', () => {
      const customTransform = new Transform(10, 20, 5, -3, Math.PI / 4, 2, 0.5);
      expect(customTransform.position).toEqual({ x: 10, y: 20 });
      expect(customTransform.velocity).toEqual({ x: 5, y: -3 });
      expect(customTransform.rotation).toBe(Math.PI / 4);
      expect(customTransform.scale).toEqual({ x: 2, y: 0.5 });
    });
  });

  describe('Update', () => {
    it('should update position based on velocity and delta time', () => {
      transform.setVelocity(100, -50); // 100 units/sec right, 50 units/sec up
      transform.update(1000); // 1 second
      
      expect(transform.position.x).toBe(100);
      expect(transform.position.y).toBe(-50);
    });

    it('should handle fractional delta time correctly', () => {
      transform.setVelocity(60, 120); // 60 units/sec right, 120 units/sec down
      transform.update(500); // 0.5 seconds
      
      expect(transform.position.x).toBe(30);
      expect(transform.position.y).toBe(60);
    });
  });

  describe('Position Methods', () => {
    it('should set position correctly', () => {
      transform.setPosition(15, 25);
      expect(transform.position).toEqual({ x: 15, y: 25 });
    });
  });

  describe('Velocity Methods', () => {
    it('should set velocity correctly', () => {
      transform.setVelocity(10, -5);
      expect(transform.velocity).toEqual({ x: 10, y: -5 });
    });

    it('should add to velocity correctly', () => {
      transform.setVelocity(5, 3);
      transform.addVelocity(2, -1);
      expect(transform.velocity).toEqual({ x: 7, y: 2 });
    });
  });

  describe('Rotation Methods', () => {
    it('should set rotation correctly', () => {
      transform.setRotation(Math.PI / 2);
      expect(transform.rotation).toBe(Math.PI / 2);
    });

    it('should add to rotation correctly', () => {
      transform.setRotation(Math.PI / 4);
      transform.addRotation(Math.PI / 4);
      expect(transform.rotation).toBe(Math.PI / 2);
    });
  });

  describe('Scale Methods', () => {
    it('should set uniform scale correctly', () => {
      transform.setScale(2);
      expect(transform.scale).toEqual({ x: 2, y: 2 });
    });

    it('should set non-uniform scale correctly', () => {
      transform.setScaleXY(1.5, 0.8);
      expect(transform.scale).toEqual({ x: 1.5, y: 0.8 });
    });
  });

  describe('Distance Calculations', () => {
    it('should calculate distance correctly', () => {
      const other = new Transform(3, 4);
      const distance = transform.distanceTo(other);
      expect(distance).toBe(5); // 3-4-5 triangle
    });

    it('should calculate squared distance correctly', () => {
      const other = new Transform(3, 4);
      const distanceSquared = transform.distanceSquaredTo(other);
      expect(distanceSquared).toBe(25); // 3² + 4² = 25
    });
  });

  describe('Clone', () => {
    it('should create an exact copy', () => {
      transform.setPosition(10, 20);
      transform.setVelocity(5, -3);
      transform.setRotation(Math.PI / 3);
      transform.setScaleXY(1.5, 2);

      const clone = transform.clone();
      
      expect(clone.position).toEqual(transform.position);
      expect(clone.velocity).toEqual(transform.velocity);
      expect(clone.rotation).toBe(transform.rotation);
      expect(clone.scale).toEqual(transform.scale);
      
      // Ensure it's a different object
      expect(clone).not.toBe(transform);
    });
  });
});