export type Point = { x: number, y: number }
export type DirectedPoint = { point: Point, direction: Vector }
export type Vector = { dx: number, dy: number }
export type Rectangle = { center: Point, size: { width: number, height: number } }
export type Polygon4 = { a: Point, b: Point, c: Point, d: Point }
export type OrthogonalSplit = { projection: Vector, rejection: Vector }

const epsilon = 0.00001

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

  export function eq(v: Vector, w: Vector): boolean {
    return Math.abs(v.dx - w.dx) < epsilon && Math.abs(v.dy - w.dy) < epsilon
  }

  export function literallyEq(v: Vector, w: Vector): boolean {
    return v.dx === w.dx && v.dy === w.dy
  }

  export function sum(vs: Vector[]): Vector {
    return vs.reduce((prev, curr) => Vector.add(prev,curr))
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

  export function magnitude(v: Vector): number {
    return (v.dx**2 + v.dy**2)**0.5
  }

  export function isStrictlyBounded(v: Vector, b: number): boolean {
    return (v.dx**2 + v.dy**2) < b**2
  }

  export function similarity(v: Vector, w: Vector): number {
    return dot(v, w)/(magnitude(v)*magnitude(w))
  }

  export function angle(v: Vector, w: Vector): number {
    // TODO: Is this correct?
    return Math.acos(similarity(v, w))
  }

  export function normalize(v: Vector): Vector {
    return scale(1/magnitude(v), v)
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

  // Assumes e is unit vector.
  export function decompose(v: Vector, e: Vector): OrthogonalSplit {
    const projection = scale(dot(v, e), e)
    const rejection  = sub(v, projection)
    return { projection, rejection }
  }

  export function determinant(v: Vector, w: Vector): number {
    return v.dx * w.dy - v.dy * w.dx
  }

  export function isParallel(v: Vector, w: Vector): boolean {
    return Math.abs(determinant(v, w)) < epsilon
  }

  export function isOrthogonal(v: Vector, w: Vector): boolean {
    return Math.abs(dot(v, w)) < epsilon
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

export type Interval = { start: number, end: number }
export namespace Interval {
  export function create(start: number, end: number): Interval {
    if (start < end) {
      return { start, end }
    } else {
      return { start: end, end: start }
    } 
  }

  export function contains(p: number, i: Interval) {
    return i.start <= p && p <= i.end
  }

  export function intersect(i: Interval, j: Interval) {
    return contains(i.start, j) || contains(i.end, j)
  }
}

export type LineSegment = { start: Point, end: Point, unit_direction: Vector }
export namespace LineSegment {
  export function from(start: Point, end: Point): LineSegment {
    return { start, end, unit_direction: Vector.normalize(Point.sub(end, start)) }
  }

  export function normal(ls: LineSegment): Vector {
    return Vector.rot90(ls.unit_direction)
  }

  export function decompose(ls: LineSegment, v: Vector): OrthogonalSplit {
    return Vector.decompose(v, ls.unit_direction)
  }

  export function length(ls: LineSegment): number {
    return Vector.magnitude(Point.sub(ls.end, ls.start))
  }

  export function contains(ls: LineSegment, p: Point): boolean {
    const v = Point.sub(p, ls.start)
    if (Vector.isParallel(v, ls.unit_direction)) {
      const k = Vector.dot(v, ls.unit_direction)
      return 0 <= k && k <= length(ls)
    } else {
      return false
    }
  }

  export function intersects(ls0: LineSegment, ls1: LineSegment): boolean {
    const normal0 = LineSegment.normal(ls0)
    const direction1 = ls1.unit_direction
    const dot = Vector.dot(normal0, direction1)
    if (Math.abs(dot) < epsilon) {
      // The lines determined by the line-segments are parallel
      // If they intersect, then one of the endpoint of ls1 lies in ls0
      return contains(ls0, ls1.start) || contains(ls0, ls1.end)
    } else {
      // The lines determined by the line-segment do intersect.
      const k = -Vector.dot(normal0, Point.sub(ls1.start, ls0.start)) / dot
      const intersection = Point.add(ls1.start, Vector.scale(k, ls1.unit_direction))
      return contains(ls0, intersection)
    }
  }
}

export namespace Rectangle {
  export function createSquare(params: Point & { width: number }): Rectangle {
    return { center: { x: params.x, y: params.y }, size: { width: params.width, height: params.width } }
  }
}

export namespace Polygon4 {
  export function fromPoints(a: Point, b: Point, c: Point, d: Point): Polygon4 {
    return { a, b, c ,d }
  }

  export function fromRotatedRectangle(r: Rectangle, face: Vector): Polygon4 {
    const normalizedFace = Vector.normalize(face)
    const orthoFace = Vector.rotBy(normalizedFace, Math.PI / 2)

    const forward = Point.add(r.center, Vector.scale(r.size.height / 2, normalizedFace))
    const forwardLeft = Point.add(forward, Vector.scale(r.size.width / 2, orthoFace))
    const forwardRight = Point.add(forward, Vector.scale(r.size.width / 2, Vector.neg(orthoFace)))

    const backwards = Point.add(r.center, Vector.scale(r.size.height / 2, Vector.neg(normalizedFace)))
    const backwardsLeft = Point.add(backwards, Vector.scale(r.size.width / 2, orthoFace))
    const backwardsRight = Point.add(backwards, Vector.scale(r.size.width / 2, Vector.neg(orthoFace)))

    return { a: forwardLeft, b: forwardRight, c: backwardsRight, d: backwardsLeft }
  }

  export function intersectsLineSegment(p: Polygon4, ls: LineSegment): boolean {
    const faces: LineSegment[] = [
      LineSegment.from(p.a, p.b),
      LineSegment.from(p.b, p.c),
      LineSegment.from(p.c, p.d),
      LineSegment.from(p.d, p.a),
    ]

    return faces.some(face => LineSegment.intersects(face, ls))
  }
}
