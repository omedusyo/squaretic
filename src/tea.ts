export function runApp<State, Action>(
  initState: State,
  tick: (ms: number) => Action,
  update: (s: State, a: Action) => State,
  render: (s: State) => void): (a: Action) => void 
{
  let state = initState

  function dispatch(action: Action) {
    state = update(state, action)
  }

  render(state)

  let prevMsFromAppStart = 0
  function step(msFromAppStart: number) {
    const stepDurationMs = msFromAppStart - prevMsFromAppStart 

    dispatch(tick(stepDurationMs))

    prevMsFromAppStart = msFromAppStart
    render(state)

    window.requestAnimationFrame(step)
  }
  window.requestAnimationFrame(step)


  return dispatch
}

