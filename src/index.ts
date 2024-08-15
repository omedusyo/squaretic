import { runApp } from "./tea.js"
// app config
const config = {
  canvas: { widthPx: 1000, heightPx: 800 },
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
  player: Player
}

const initState: State = {
  player: { position: { x: 10, y: 10 } }
}

type Player = { position: Point }

// Actions
type Action
  = { kind: "key_pressed", key: Key }
  | { kind: "tick", ms: number }

// Update
function update(state: State, action:Action): State {
  config.debug && console.log(action)

  switch (action.kind) {
    case "key_pressed":
      const newPlayerPosition = updatePlayerPostion(state, action.key)

      return { ...state, player: {...state.player, position: newPlayerPosition } }

    case "tick":
      // TODO
      return state
  }
}


type Point = { x: number, y: number }
function updatePlayerPostion(state: State, key: Key): Point {
  // TODO: collision etc. based on sate
  const position = state.player.position

  switch (key) {
    case "w":
      return { x: position.x + 1, y: position.y }
    case "a":
      return { x: position.x, y: position.y - 1 }
    case "s":
      return { x: position.x - 1, y: position.y }
    case "d":
      return { x: position.x, y: position.y + 1 }
  }
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

    ctx.rect(10,10,10,10)
    ctx.rect(30,10,10,10)
    ctx.stroke()

    ctx.fillRect(20,20,10,10)

  } else {
    console.error("getContext returned null")
  }
}

// App
function handleKeyboardEvent(keyString: string) {
  const key = decodeKey(keyString)

  if (key !== null) {
    triggerAction({ kind: "key_pressed", key })
  } else {
    config.debug && console.warn("Unhandled key press", keyString)
  }
}

const triggerAction = runApp(
  initState,
  ms => ({ kind: "tick", ms } as Action),
  update,
  render
)

document.onkeydown = function(e) {
  handleKeyboardEvent(e.key)
}
