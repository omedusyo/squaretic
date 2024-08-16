import { runApp } from "./tea.js"
import { Vector, Point, Rectangle, Polygon4, LineSegment } from "./geometry.js"

// app config
const config = {
  canvas: { widthPx: 1000, heightPx: 800 },
  playerVelocity: 1/1000 * 400,
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
  keyboard: Keyboard,
}

const initState: State = {
  player: {
    body: Rectangle.createSquare({x:500, y:700, width:50}),
    face: Vector.fromCartesian(0,-1),
  }, 
  obstacles: [ 
    LineSegment.from(
      { x: 0, y: config.canvas.heightPx },
      { x: config.canvas.widthPx, y: config.canvas.heightPx }
    )
  ],
  keyboard: {
    up_pressed: false,
    down_pressed: false,
    left_pressed: false,
    right_pressed: false,
  }
}

type Player =  {
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

// Actions
type Action
  = { kind: "key_pressed", key: Key }
  | { kind: "key_released", key: Key }
  | { kind: "mouse_moved", point: Point }
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
      return {...state,
        player: {...state.player,
          face: Point.sub(action.point, state.player.body.center)
        }
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
  return {
    ...state,
    player: {
      face: state.player.face,
      body: {
        size: {
          width: state.player.body.size.width,
          height: state.player.body.size.height,
        },
        center: 
          movePlayer(
            Vector.scale(dt * config.playerVelocity, keyboardToVector(state.keyboard)),
            (point) => state.obstacles.filter(obstacle =>
              Polygon4.intersectsLineSegment(
                Polygon4.fromRotatedRectangle(
                  { size: state.player.body.size,
                    center: point,
                  },
                  state.player.face,
                ),
                obstacle,
              )
            ).length >= 1,
            state.player.body.center,
            true,
          )
      }
    }
  }
}

const planckSpace = 0.1 // px
function movePlayer(direction: Vector, doesCollide: (point: Point) => boolean, point: Point, isFirstCall?: boolean): Point {
  if (Vector.magnitude(direction) < planckSpace) { return point }

  const newPoint = Point.add(point, direction)

  if (doesCollide(newPoint)) {
    return movePlayer(Vector.scale(0.5, direction), doesCollide, point, false)
  } else {
    if (isFirstCall) {
      return newPoint
    } else {
      return movePlayer(Vector.scale(0.5, direction), doesCollide, newPoint, false)
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

  } else {
    console.error("getContext returned null")
  }
}

function renderPlayer(ctx: CanvasRenderingContext2D, { body, face }: Player) {
  const playerPolygon = Polygon4.fromRotatedRectangle(body, face) 

  const rect = new Path2D();
  rect.lineTo(playerPolygon.a.x, playerPolygon.a.y);
  rect.lineTo(playerPolygon.b.x, playerPolygon.b.y);
  rect.lineTo(playerPolygon.c.x, playerPolygon.c.y);
  rect.lineTo(playerPolygon.d.x, playerPolygon.d.y);
  rect.closePath();
  ctx.fillStyle = "green";
  ctx.fill(rect);

  // ctx.fillRect(body.position.x, body.position.y, body.width, body.height)
}

function renderObstacle(ctx: CanvasRenderingContext2D, obstacle: Obstacle) {
  // Start a new Path
  ctx.beginPath()
  ctx.moveTo(obstacle.start.x, obstacle.start.y)
  ctx.lineTo(obstacle.end.x, obstacle.end.y)

  // Draw the Path
  ctx.strokeStyle = "red"
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

canvas.onmousemove =  function (e: MouseEvent) {
  let rect = canvas.getBoundingClientRect();
  
  handleMouseMove({
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  })
}
