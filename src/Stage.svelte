<div class="root" bind:this={container}>
  <canvas 
    bind:this={canvas}
    width={width}
	  height={height}
    class="canvas"
  ></canvas>
</div>

<div class="controls">
  {#each Object.entries(colors) as [ key, value ]}
		<div>
      <input 
        type="color" 
        id={key} 
        name={key} 
        value={colorToHex(key)} 
        on:input={(event) => colorHandler(event, key)}
      >
      <label for={key}>{key}</label>
    </div>
	{/each}
</div>

<script>
  import { onMount } from 'svelte'
  import { planeMesh } from './planeMesh'

	let container
	let canvas
  let width = 30
  let height = 30
  let resizeTimeout
  const colors = {
    primary: [ .25, .34, .81, 1 ], 
    secondary: [ .78, .31, .75, 1 ], 
    tertiary: [ 1, .8, .43, 1 ]
  }
  
  let gl, plane

  onMount(() => {
		gl = canvas.getContext('webgl', {
      alpha: false
    })

    if (gl === null) {
      alert("Unable to initialize WebGL. Your browser or machine may not support it.")
      return
    }

    setSize(0)
    setViewport()
    let frame = requestAnimationFrame(loop)
    
    plane = planeMesh(gl, colors)

		function loop(t) {
			frame = requestAnimationFrame(loop)
      
      if(width !== container.clientWidth || height !== container.clientHeight) {
        setSize()
      }
      setViewport()

      gl.clearColor(colors.primary[0], colors.primary[1], colors.primary[2], colors.primary[3])
      gl.disable(gl.DEPTH_TEST)
      gl.clear(gl.COLOR_BUFFER_BIT)

      if(plane) {
        plane.render(gl)
      }
		}

		return () => {
			cancelAnimationFrame(frame)
		}
	})

  function updateUniformColors() {
    if(plane) {
      plane.updateUniformColors(colors)
    }
  }

  function setSize(delay = 500) {
    if(resizeTimeout === undefined) {
      resizeTimeout = setTimeout(() => {
        width = container.clientWidth
        height = container.clientHeight
        resizeTimeout = undefined
      }, delay)
    }
  }

  function setViewport() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
  }

  function colorHandler({ target }, color) {
    if(target && target.value) {
      colors[color][0] = parseInt(target.value.substr(1,2), 16) / 255
      colors[color][1] = parseInt(target.value.substr(3,2), 16) / 255
      colors[color][2] = parseInt(target.value.substr(5,2), 16) / 255

      updateUniformColors()
    }
  }

  function colorToHex(key) {
    const channels = [
      colors[key][0] * 255, 
      colors[key][1] * 255, 
      colors[key][2] * 255
    ]
      .map(x => parseInt(x))
      .map(x => {
        const hex = x.toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
    .join('')
    
    return `#${channels}`
  }
</script>

<style>
  .root {
    position: relative;
    width: calc(100vmin - 20px);
    height: calc(100vmin - 20px);
    max-width: 400px;
    max-height: 400px;
    box-shadow: 0 0 30px rgba(0, 0, 0, .2);
  }

  .canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
  }
</style>