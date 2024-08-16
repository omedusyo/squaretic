import { runApp } from "./tea.js"
import { Vector, Point, Rectangle } from "./geometry.js"

// app config
const config = {
  canvas: { widthPx: 1000, heightPx: 800 },
  playerVelocity: 1/1000 * 200,
  debug: true,
}

// keyboard events
type Key = "w" | "a" | "s" | "d"
 
function decodeKey(key: string): Key | null {
  switch (key) {
    case "w":
      return "w"
    case "a":
      return "a"
    case "s":
      return "s"
    case "d":
      return "d"
      
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
  player: Rectangle.createSquare({x:500, y:700, width:50}),
  obstacles: [ { x: 0, y: config.canvas.heightPx - 10, width: config.canvas.widthPx, height: 10 }],
  keyboard: {
    up_pressed: false,
    down_pressed: false,
    left_pressed: false,
    right_pressed: false,
  }
}

type Player = Rectangle

type Obstacle = Rectangle

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
  | { kind: "tick", ms: number }

// Update
function update(state: State, action:Action): State {
  config.debug && action.kind !== "tick" && console.log(action)

  switch (action.kind) {
    case "key_released":
      switch (action.key) {
        case "w": return setKeyboard(state, {...state.keyboard, up_pressed: false})
        case "a": return setKeyboard(state, {...state.keyboard, left_pressed: false})
        case "d": return setKeyboard(state, {...state.keyboard, right_pressed: false})
        case "s": return setKeyboard(state, {...state.keyboard, down_pressed: false})
      }

    case "key_pressed":
      switch (action.key) {
        case "w": return setKeyboard(state, {...state.keyboard, up_pressed: true})
        case "a": return setKeyboard(state, {...state.keyboard, left_pressed: true})
        case "d": return setKeyboard(state, {...state.keyboard, right_pressed: true})
        case "s": return setKeyboard(state, {...state.keyboard, down_pressed: true})
      }

    case "tick":
      return { ...state,
        player: updatePlayer(state, action.ms)
      }
  }
}

function updatePlayer(state: State, dt: number): Player  {
  return {
    width: state.player.width,
    height: state.player.height,
    ...helpGetCloser(
      Vector.scale(dt * config.playerVelocity, keyboardToVector(state.keyboard)),
      (point) => state.obstacles.filter(obstacle => Rectangle.intersect({ ...state.player, ...point}, obstacle)).length >= 1,
      state.player,
    ),
  }

}

const planckSpace = 0.1
function helpGetCloser(direction: Vector, doesCollide: (point: Point) => boolean, point: Point): Point {
  if (Vector.magnitude(direction) < planckSpace) { return point }

  const newPoint = Point.add(point, direction)

  if (doesCollide(newPoint)) {
    return moveInHalfSteps(direction, doesCollide, point)
  } else {
    return newPoint
  }
}

function moveInHalfSteps(direction: Vector, doesCollide: (point: Point) => boolean, point: Point): Point {
  direction = Vector.scale(0.5, direction)
  if (Vector.magnitude(direction) < planckSpace) { return point }

  const newPoint = Point.add(point, direction)

  if (doesCollide(newPoint)) {
    return moveInHalfSteps(direction, doesCollide, point)
  } else {
    return moveInHalfSteps(direction, doesCollide, newPoint)
  }
}

function keyboardToVector(keyboard: Keyboard): Vector {
  return Vector.normalize(
    Vector.sum([
      Vector.scale(booleanToNum(keyboard.up_pressed), Vector.fromCartesian(0,-1)),
      Vector.scale(booleanToNum(keyboard.down_pressed), Vector.fromCartesian(0,1)),
      Vector.scale(booleanToNum(keyboard.left_pressed), Vector.fromCartesian(-1,0)),
      Vector.scale(booleanToNum(keyboard.right_pressed), Vector.fromCartesian(1,0)),
    ])
  )
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

function renderPlayer(ctx: CanvasRenderingContext2D ,player: Player) {
  ctx.fillRect(player.x, player.y, player.width, player.height)
}

function renderObstacle(ctx: CanvasRenderingContext2D, obstacle: Obstacle) {
  ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
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

const triggerAction = runApp(
  initState,
  ms => ({ kind: "tick", ms } as Action),
  update,
  render
)

document.onkeydown = function(e) {
  handleKeyboardPressedEvent(e.key)
}

document.onkeyup = function(e) {
  handleKeyboardReleasedEvent(e.key)
}
console.log(Vector.zero);
