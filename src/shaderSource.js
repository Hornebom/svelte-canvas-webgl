import { snoise } from './lib/snoise.js'

const vertexShaderSource = `
  ${snoise}
  attribute vec4 a_vertex;
  
  uniform vec4 u_color_primary;
  uniform vec4 u_color_secondary;
  uniform vec4 u_color_tertiary;

  uniform float u_delta;
  uniform float u_time;

  varying vec4 v_color;

  vec4 noiseColor(vec4 color_1, vec4 color_2) {
    vec4 seed = vec4(-.5) + color_1 * vec4(2.);
    seed = mix(seed, a_vertex, .5);
    float noise = snoise( vec3(seed.xyz) + vec3(0.0, 0.0, u_delta + abs(cos(u_time))));
    
    return mix(color_1, color_2, noise);
  }

  void main() {
    vec4 noise_color_1 = noiseColor(u_color_primary, u_color_secondary);
    vec4 noise_color_2 = noiseColor(u_color_secondary, u_color_tertiary);
    v_color = mix(noise_color_1, noise_color_2, .5);

    gl_Position = a_vertex;
  }
`
const fragmentShaderSource = `
  precision mediump float;

  varying vec4 v_color;

  void main() {
    gl_FragColor = v_color;
  }
`

export { vertexShaderSource, fragmentShaderSource }
