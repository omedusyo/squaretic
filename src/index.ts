const message: string = 'Hello world by Ahsan!'
console.log(message)



const canvas = document.createElement("canvas")
canvas.setAttribute("width", "500px")
canvas.setAttribute("height", "500px")

let main = document.getElementById('main');

main?.appendChild(canvas)

let ctx = canvas.getContext("2d");

if (ctx) {
  ctx.rect(10,10,10,10)
  ctx.fillRect(20,20,10,10)

  ctx.stroke()
} else {
  console.error("getContext returned null")
}
