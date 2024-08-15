export type Point = { x: number, y: number }
export type Vector = { dx: number, dy: number }

export namespace Vector {
  export function fromCartesian(dx: number, dy: number): Vector {
    return { dx, dy }
  }
  
  export function fromPolar(r: number, angle: number): Vector {
    return { dx: r*Math.cos(angle), dy: r*Math.sin(angle) }
  }

  export const zero: Vector = fromCartesian(0, 0)

  export function add(v: Vector, w: Vector): Vector {
    return { dx: v.dx + w.dx, dy: v.dy + w.dy }
  }

  export function sub(v: Vector, w: Vector): Vector {
    return { dx: v.dx - w.dx, dy: v.dy - w.dy }
  }

  export function neg(v: Vector): Vector {
    return { dx: -v.dx, dy: -v.dy }
  }

  export function scale(k: number, v: Vector): Vector {
    return { dx: k*v.dx, dy: k*v.dy }
  }

  export function dot(v: Vector, w: Vector): number {
    return v.dx*w.dx + v.dy*w.dy
  }

  export function magnitudeSquared(v: Vector): number {
    return dot(v, v)
  }

  export function magnitude(v: Vector): number {
    return magnitudeSquared(v)**0.5
  }

  export function similarity(v: Vector, w: Vector): number {
    return dot(v, w)/(magnitude(v)*magnitude(w))
  }

  export function angle(v: Vector, w: Vector): number {
    // TODO: Is this correct?
    return Math.acos(similarity(v, w))
  }

  export function normalize(v: Vector): Vector {
    return scale(magnitude(v), v)
  }

  export function rot90(v: Vector): Vector {
    return { dx: -v.dy, dy: v.dx }
  }

  // |x'|    |cos(a)  -sin(a)| |x|
  //      ==
  // |y'|    |sin(a)   cos(a)| |y|
  export function rotBy(v: Vector, angle: number): Vector {
    return { dx: Math.cos(angle)*v.dx - Math.sin(angle)*v.dy, dy: Math.sin(angle)*v.dx + Math.cos(angle)*v.dy }
  }
}

export namespace Point {
  export function fromCartesian(x: number, y: number): Point {
    return { x, y }
  }

  export function add(p: Point, v: Vector): Point {
    return { x: p.x + v.dx, y: p.y + v.dy }
  }

  export function sub(p: Point, q: Point): Vector {
    return { dx: p.x - q.x, dy: p.y - q.y }
  }
}
