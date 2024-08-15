import { runApp } from "./tea.js"
// app config
const config = {
  canvas: { widthPx: 1000, heightPx: 800 },
  playerVelocityPxPerMs: 1/1000 * 100,
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
  keyboard: Keyboard,
}

const initState: State = {
  player: { position: { x: 10, y: 10 } },
  keyboard: {
    up_pressed: false,
    down_pressed: false,
    left_pressed: false,
    right_pressed: false,
  }
}

type Player = { position: Point }

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
    // case "key_pressed":
    //   return updatePlayerPosition(state, computePlayerPostion(state, action.key))

    case "key_released":
      switch (action.key) {
        case "w": return setKeyboard(state, {...state.keyboard, up_pressed: false})
        case "a": return setKeyboard(state, {...state.keyboard, left_pressed: false})
        case "d": return setKeyboard(state, {...state.keyboard, right_pressed: false})
        case "s": return setKeyboard(state, {...state.keyboard, down_pressed: false})
      }
      // return updatePlayerPosition(state, computePlayerPostion(state, action.key))
      // return updateKeyboard
    case "key_pressed":
      switch (action.key) {
        case "w": return setKeyboard(state, {...state.keyboard, up_pressed: true})
        case "a": return setKeyboard(state, {...state.keyboard, left_pressed: true})
        case "d": return setKeyboard(state, {...state.keyboard, right_pressed: true})
        case "s": return setKeyboard(state, {...state.keyboard, down_pressed: true})
      }

    case "tick":
      state.keyboard.left_pressed
      // Number(state.keyboard.up_pressed)
      return setPlayerPosition(state, {
        x: state.player.position.x +
          action.ms *
          config.playerVelocityPxPerMs *
          pressesToDirection(state.keyboard.right_pressed, state.keyboard.left_pressed)
        ,
        y: state.player.position.y +
          action.ms *
          config.playerVelocityPxPerMs *
          pressesToDirection(state.keyboard.down_pressed, state.keyboard.up_pressed)
        ,
      })
      // return state
  }
}

function pressesToDirection(plus: boolean, minus: boolean): number {
  if (plus === minus) {
    return 0
  } else if (plus) {
    return + 1
  } else {
    return -1
  } 
}

function setPlayerPosition(state: State, position: Point): State {
  return { ...state, player: {...state.player, position } }
}


function setKeyboard(state: State, keyboard: Keyboard): State {
  return { ...state, keyboard }
}

type Point = { x: number, y: number }
function computePlayerPostion(state: State, key: Key): Point {
  // TODO: collision etc. based on sate
  const position = state.player.position

  switch (key) {
    case "w":
      return { x: position.x, y: position.y - 5 }

    case "a":
      return { x: position.x - 5, y: position.y }

    case "s":
      return { x: position.x, y: position.y + 5 }

    case "d":
      return { x: position.x + 5, y: position.y }
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

    renderPlayer(ctx, state.player)

  } else {
    console.error("getContext returned null")
  }
}

function renderPlayer(ctx: CanvasRenderingContext2D ,player: Player) {
  ctx.fillRect(player.position.x, player.position.y, 50, 50)
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
