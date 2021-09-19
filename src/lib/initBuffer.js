function initBuffer({ gl, program, data, size, name, mode }) {
  const length = data.length / size
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)

  const location = gl.getAttribLocation(program, name)

  function draw() {
    gl.enableVertexAttribArray(location)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0)
    gl.drawArrays(gl[mode], 0, length)
  }

  return { draw }
}

export { initBuffer }
