import { runApp } from "./tea.js"
import { Vector, Point, DirectedPoint, Rectangle, Polygon4, LineSegment, Circle } from "./geometry.js"
import { debug } from "./utils.js"

// app config
const config = {
  canvas: { widthPx: 1000, heightPx: 800 },
  playerVelocity: 1/1000 * 300,
  playerAttackTime: 100, // ms
  debug: true,
  planckTime: 4, // ms
}

// keyboard events
type Key = "up" | "left" | "down" | "right"
 
function decodeKey(key: string): Key | null {
  switch (key) {
    case "w":
      return "up"
    case "a":
      return "left"
    case "s":
      return "down"
    case "d":
      return "right"
    case "W":
      return "up"
    case "A":
      return "left"
    case "S":
      return "down"
    case "D":
      return "right"
      
    default:
      return null
  }
}

// APP
// State
type State = {
  player: Player,
  obstacles: Obstacle[],
  enemies: Enemy[],
  keyboard: Keyboard,
  mouse: Point,
}

type Player =  {
  body: Rectangle,
  face: Vector,
  attacking: null | number,
}

type Enemy =  {
  body: Rectangle,
  face: Vector,
}

type Obstacle = LineSegment


type Keyboard = {
  up_pressed: boolean,
  down_pressed: boolean,
  left_pressed: boolean,
  right_pressed: boolean,
}

const initPlayerPosition: Point = { x:500, y:700 }
const initMousePosition: Point = Point.add(initPlayerPosition,Vector.fromCartesian(0,-1))

function basicEnemey (point: Point): Enemy {
  return {
    body: { center: point, size: { width: 50, height: 50} },
    face: Vector.fromCartesian(0,1)
  }
}

const initState: State = {
  player: {
    body: Rectangle.createSquare({...initPlayerPosition, width:50}),
    face: Point.sub(initMousePosition, initPlayerPosition),
    attacking: null,
  }, 
  enemies: [
    basicEnemey({ x: 500, y: 500}),
  ],
  obstacles: [ 
    LineSegment.from(
      { x: 0, y: config.canvas.heightPx },
      { x: config.canvas.widthPx, y: config.canvas.heightPx }
    ),
    LineSegment.from(
      { x: 100, y: 100 },
      { x: 200, y: 100 }
    )
  ],
  keyboard: {
    up_pressed: false,
    down_pressed: false,
    left_pressed: false,
    right_pressed: false,
  },
  mouse: initMousePosition
}

// Actions
type Action
  = { kind: "key_pressed", key: Key }
  | { kind: "key_released", key: Key }
  | { kind: "mouse_moved", point: Point }
  | { kind: "mouse_up" }
  | { kind: "tick", dt: number }

// Update
function update(state: State, action:Action): State {
  config.debug && action.kind !== "tick" && console.log(action)

  switch (action.kind) {
    case "key_released":
      switch (action.key) {
        case "up": return setKeyboard(state, {...state.keyboard, up_pressed: false})
        case "left": return setKeyboard(state, {...state.keyboard, left_pressed: false})
        case "right": return setKeyboard(state, {...state.keyboard, right_pressed: false})
        case "down": return setKeyboard(state, {...state.keyboard, down_pressed: false})
      }

    case "key_pressed":
      switch (action.key) {
        case "up": return setKeyboard(state, {...state.keyboard, up_pressed: true})
        case "left": return setKeyboard(state, {...state.keyboard, left_pressed: true})
        case "right": return setKeyboard(state, {...state.keyboard, right_pressed: true})
        case "down": return setKeyboard(state, {...state.keyboard, down_pressed: true})
      }

    case "mouse_moved":
      return {
        ...state,
        mouse: action.point,
      }

    case "mouse_up":
      return {
        ...state,
        player: {...state.player, attacking: 0 }
      }

    case "tick":
      const planckTimesPassed =  Math.floor(action.dt / config.planckTime)

      let newState = state
      for (let i = 0; i < planckTimesPassed; i++) {
        newState = step(newState, config.planckTime)
      }

      return newState
  }
}

function step(state:State, dt: number): State {
  const newDirectedPoint = moveDirectedPoint(
    Vector.scale(dt * config.playerVelocity, keyboardToVector(state.keyboard)),
    Point.sub(state.mouse, state.player.body.center),
    (directedPoint: DirectedPoint) => state.obstacles.filter(obstacle =>
      Polygon4.intersectsLineSegment(
        Polygon4.fromRotatedRectangle(
          { size: state.player.body.size,
            center: directedPoint.point,
          },
          directedPoint.direction,
        ),
        obstacle,
      )
    ).length >= 1,
    { point: state.player.body.center,
      direction: state.player.face,
    },
    true,
  )

  let newAttacking = null
  if (state.player.attacking !== null) {
    newAttacking = state.player.attacking + dt
    if (newAttacking > config.playerAttackTime) {
      newAttacking = null

    }
  }

  const newPlayer = {
      face: newDirectedPoint.direction,
      body: {
        size: state.player.body.size,
        center: newDirectedPoint.point,
      },
      attacking: newAttacking,
    }


  let newEnemies = state.enemies
  if (newAttacking !== null) {
    const playerPolygon = Polygon4.fromRotatedRectangle(newPlayer.body, newPlayer.face)
    const { center, startVector } = attackCircleParams(playerPolygon)
    const attackCircle = Circle.make(Vector.magnitude(startVector), center)

    newEnemies = state.enemies.filter(enemy => {
      const enemyLineSegments = Polygon4.toLineSegments(Polygon4.fromRotatedRectangle(enemy.body, enemy.face))

      return enemyLineSegments.every(ls => !Circle.intersectsLineSegment( attackCircle, ls )) 
    })
  }

  return {
    ...state,
    player: newPlayer,
    enemies: newEnemies
  }
}

const planckSpace = 0.1 // px
function moveDirectedPoint(
  translation: Vector,
  direction: Vector,
  doesCollide: (directedPoint: DirectedPoint) => boolean,
  directedPoint: DirectedPoint,
  isFirstCall?: boolean
): DirectedPoint 
{
  if (
    Vector.magnitude(translation) < planckSpace &&
    Vector.eq(direction, directedPoint.direction)
  ) {
    return directedPoint
  }

  const newDirectedPoint = {
    point: Point.add(directedPoint.point, translation),
    direction: direction, 
  }

  if (doesCollide(newDirectedPoint)) {
    return moveDirectedPoint(Vector.scale(0.5, translation), directedPoint.direction, doesCollide, directedPoint, false)
  } else {
    if (isFirstCall) {
      return newDirectedPoint
    } else {
      return moveDirectedPoint(Vector.scale(0.5, translation), direction, doesCollide, newDirectedPoint, false)
    }
  }
}

function keyboardToVector(keyboard: Keyboard): Vector {
  const sum = 
    Vector.sum([
      Vector.scale(booleanToNum(keyboard.up_pressed), Vector.fromCartesian(0,-1)),
      Vector.scale(booleanToNum(keyboard.down_pressed), Vector.fromCartesian(0,1)),
      Vector.scale(booleanToNum(keyboard.left_pressed), Vector.fromCartesian(-1,0)),
      Vector.scale(booleanToNum(keyboard.right_pressed), Vector.fromCartesian(1,0)),
    ])

  if (Vector.magnitude(sum) === 0) {
    return sum
  } else {
    return Vector.normalize(sum)
  }
}

function booleanToNum(b:boolean): number {
  return b ? 1 : 0
}

function setKeyboard(state: State, keyboard: Keyboard): State {
  return { ...state, keyboard }
}

// Render
// setup canvas
const canvas = document.createElement("canvas")
canvas.setAttribute("width", config.canvas.widthPx + "px")
canvas.setAttribute("height", config.canvas.heightPx + "px")
canvas.setAttribute("style", "border: 1px solid black")

let main = document.getElementById('main');

main?.appendChild(canvas)

let ctx = canvas.getContext("2d");

function render(state: State) {
  if (ctx) {
    ctx.clearRect(0, 0, config.canvas.widthPx, config.canvas.heightPx)

    renderPlayer(ctx, state.player)
    state.obstacles.forEach(o => renderObstacle(ctx, o))
    state.enemies.forEach(e => renderEnemies(ctx, e))

  } else {
    console.error("getContext returned null")
  }
}

const swordLength = 50
function renderPlayer(ctx: CanvasRenderingContext2D, player: Player) {
  const { body, face, attacking } = player
  const playerPolygon = Polygon4.fromRotatedRectangle(body, face) 

  // body
  renderPolygon4(ctx, playerPolygon, "green")

  // face
  renderPath(ctx, [playerPolygon.a, playerPolygon.b], 4, "red")

  const { center, startVector } = attackCircleParams(playerPolygon)
  // sword
  ctx.beginPath()
  const swordDirection = Point.add(
    center,
    Vector.rotBy(
      Vector.scale(
        swordLength,
        Vector.normalize(face)), -3*Math.PI/16)
  )
  renderPath(ctx, [center, swordDirection], 2, "gray")

  // sword hit box
  if (attacking !== null) {
    renderArc(ctx, center, startVector, Math.PI, { fill: "yellow", strokeColor: "orange" })
  }
}

function attackCircleParams(playerPolygon: Polygon4): { center: Point, startVector: Vector } {
  const center = playerPolygon.a
  const startVector = Point.sub(playerPolygon.b, playerPolygon.a)

  return { center, startVector }
}

function renderEnemies(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const { body, face } = enemy
  const enemyPolygon = Polygon4.fromRotatedRectangle(body, face) 

  renderPolygon4(ctx, enemyPolygon, "red")

  // face
  renderPath(ctx, [enemyPolygon.a, enemyPolygon.b], 4, "orange")
}

function renderPolygon4(ctx: CanvasRenderingContext2D, polygon: Polygon4, fillCollor?: string) {
  // body
  const rect = new Path2D();
  rect.lineTo(polygon.a.x, polygon.a.y);
  rect.lineTo(polygon.b.x, polygon.b.y);
  rect.lineTo(polygon.c.x, polygon.c.y);
  rect.lineTo(polygon.d.x, polygon.d.y);
  rect.closePath();
  if (fillCollor) {
    ctx.fillStyle = fillCollor;
    ctx.fill(rect);
  }

  // face
  renderPath(ctx, [polygon.a, polygon.b], 4, "red")
}

function renderObstacle(ctx: CanvasRenderingContext2D, obstacle: Obstacle) {
  renderPath(ctx, [obstacle.start, obstacle.end], 4, "black")
}

const defaultLineWidth = 2
const defaultLineColor = "black"
function renderPath(ctx: CanvasRenderingContext2D, points: Point[], lineWidth?: number, lineColor?: string) {
  for (const [i, point] of points.entries()) {
    if (i === 0) {
      ctx.lineWidth = lineWidth || defaultLineWidth
      ctx.strokeStyle = lineColor || defaultLineColor
      ctx.beginPath()
      ctx.moveTo(point.x, point.y)
    } else {
      ctx.lineTo(point.x, point.y)
    }
  }

  ctx.stroke()
}

interface ArcOptions {
  fill?: String,
  strokeWidth?: number,
  strokeColor?: string,
  counterclockwise?: boolean,
}

function renderArc(ctx: CanvasRenderingContext2D, center: Point, startVector: Vector, length: number, options: ArcOptions) {
  ctx.beginPath()
  const startAngle = Vector.toAngle(startVector)
  ctx.arc(
    center.x,
    center.y,
    Vector.magnitude(startVector),
    startAngle,
    startAngle + length,
    options.counterclockwise,
  )
  if (options.fill) {
    ctx.fillStyle = "yellow"
    ctx.fill()
  }
  if (options.strokeColor) {
    ctx.strokeStyle = options.strokeColor
  }

  ctx.stroke()
}


// App
function handleKeyboardPressedEvent(keyString: string) {
  const key = decodeKey(keyString)

  if (key !== null) {
    triggerAction({ kind: "key_pressed", key })
  } else {
    config.debug && console.warn("Unhandled key-down event", keyString)
  }
}

function handleKeyboardReleasedEvent(keyString: string) {
  const key = decodeKey(keyString)

  if (key !== null) {
    triggerAction({ kind: "key_released", key })
  } else {
    config.debug && console.warn("Unhandled key-up event", keyString)
  }
}

function handleMouseMove(point: Point) {
  triggerAction({ kind: "mouse_moved", point })
}

function handleMouseDown() {
  console.log("handleMouseUp")
  triggerAction({ kind: "mouse_up" })
}

const triggerAction = runApp(
  initState,
  dt => ({ kind: "tick", dt } as Action),
  update,
  render
)

document.onkeydown = function(e) {
  handleKeyboardPressedEvent(e.key)
}

document.onkeyup = function(e) {
  handleKeyboardReleasedEvent(e.key)
}

document.onmousemove =  function (e: MouseEvent) {
  let rect = canvas.getBoundingClientRect();
  
  handleMouseMove({
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  })
}

document.onmousedown = function() {
  handleMouseDown()
}
