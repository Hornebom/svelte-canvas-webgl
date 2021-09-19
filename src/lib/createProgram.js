function createProgram(gl, vertexShaderSource, fragmentShaderSource ) {
    
  function compileShader(shaderSource, shaderType) {
    const shader = gl.createShader(shaderType)
    gl.shaderSource(shader, shaderSource)
    gl.compileShader(shader)
    return shader
  }

  const program = gl.createProgram()
  
  gl.attachShader(
    program,
    compileShader(vertexShaderSource, gl.VERTEX_SHADER)
  )
  gl.attachShader(
    program,
    compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER)
  )

  gl.linkProgram(program)
  gl.useProgram(program)

  return program
}

export { createProgram }
