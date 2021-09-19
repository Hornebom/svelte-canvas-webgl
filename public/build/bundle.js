
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.42.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function initBuffer({ gl, program, data, size, name, mode }) {
      const length = data.length / size;
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

      const location = gl.getAttribLocation(program, name);

      function draw() {
        gl.enableVertexAttribArray(location);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl[mode], 0, length);
      }

      return { draw }
    }

    function createProgram(gl, vertexShaderSource, fragmentShaderSource ) {
        
      function compileShader(shaderSource, shaderType) {
        const shader = gl.createShader(shaderType);
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);
        return shader
      }

      const program = gl.createProgram();
      
      gl.attachShader(
        program,
        compileShader(vertexShaderSource, gl.VERTEX_SHADER)
      );
      gl.attachShader(
        program,
        compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER)
      );

      gl.linkProgram(program);
      gl.useProgram(program);

      return program
    }

    const snoise = `
  //
  // Description : Array and textureless GLSL 2D/3D/4D simplex
  //               noise functions.
  //      Author : Ian McEwan, Ashima Arts.
  //  Maintainer : ijm
  //     Lastmod : 20110822 (ijm)
  //     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
  //               Distributed under the MIT License. See LICENSE file.
  //               https://github.com/ashima/webgl-noise
  //
  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  vec4 permute(vec4 x) {
    return mod289(((x*34.0)+1.0)*x);
  }
  vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
  }
  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
    vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

    i = mod289(i);
    vec4 p = permute( permute( permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    float n_ = 0.142857142857; // 1.0/7.0
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  vec3 hsv2rgb(vec3 c){
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }
`;

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
`;
    const fragmentShaderSource = `
  precision mediump float;

  varying vec4 v_color;

  void main() {
    gl_FragColor = v_color;
  }
`;

    function planeMesh(gl, colors) {

      const size = 1;
      const segments = 30;
      const padding = 0.1;
      const unit = (size * 2 - padding * 2) / segments;
      const vertices = [];
      let x_start, x_end, y_start, y_end;

      for(let i = 0; i < segments; i++) {
        x_start = -size + padding + unit * i;
        x_end = x_start + unit;
        
        for(let j = 0; j < segments; j++) {
          y_start = size - padding - unit * j;
          y_end = y_start - unit;

          vertices.push(
            // Triangle 1
            x_start, y_start, 
            x_end, y_start, 
            x_end, y_end,

            // Triangle 2
            x_start, y_start, 
            x_end, y_end, 
            x_start, y_end, 
          );
        }
        
      }

      const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

      const vertexBuffer = initBuffer({
        gl, 
        program,
        data: vertices, 
        size: 2, 
        name: 'a_vertex', 
        mode: 'TRIANGLES' 
      });

      const colorPrimaryLocation = gl.getUniformLocation(program, "u_color_primary");
      const colorSecondaryLocation = gl.getUniformLocation(program, "u_color_secondary");
      const colorTertiaryLocation = gl.getUniformLocation(program, "u_color_tertiary");
      const deltaLocation = gl.getUniformLocation(program, "u_delta");
      const timeLocation = gl.getUniformLocation(program, "u_time");
      let delta = 0;
      let direction = 1;

      function render() {
        if(delta > 1) {
          direction = -1;
        } else if(delta < 0) {
          direction = 1;
        }
        delta += direction * .001;

        gl.useProgram(program);

        gl.uniform4fv(colorPrimaryLocation, colors.primary);
        gl.uniform4fv(colorSecondaryLocation, colors.secondary);
        gl.uniform4fv(colorTertiaryLocation, colors.tertiary);

        gl.uniform1f(deltaLocation, delta);
        gl.uniform1f(timeLocation, Date.now());

        vertexBuffer.draw();
      }

      function updateUniformColors(newColors) {
        colors = newColors; 
      }

      return { render, updateUniformColors }
    }

    /* src/Stage.svelte generated by Svelte v3.42.4 */

    const { Object: Object_1 } = globals;
    const file = "src/Stage.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i][0];
    	child_ctx[17] = list[i][1];
    	return child_ctx;
    }

    // (11:2) {#each Object.entries(colors) as [ key, value ]}
    function create_each_block(ctx) {
    	let div;
    	let input;
    	let input_id_value;
    	let input_name_value;
    	let input_value_value;
    	let t0;
    	let label;
    	let t1_value = /*key*/ ctx[16] + "";
    	let t1;
    	let label_for_value;
    	let t2;
    	let mounted;
    	let dispose;

    	function input_handler(...args) {
    		return /*input_handler*/ ctx[9](/*key*/ ctx[16], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "color");
    			attr_dev(input, "id", input_id_value = /*key*/ ctx[16]);
    			attr_dev(input, "name", input_name_value = /*key*/ ctx[16]);
    			input.value = input_value_value = /*colorToHex*/ ctx[6](/*key*/ ctx[16]);
    			add_location(input, file, 12, 6, 240);
    			attr_dev(label, "for", label_for_value = /*key*/ ctx[16]);
    			add_location(label, file, 19, 6, 410);
    			add_location(div, file, 11, 2, 228);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			append_dev(div, t0);
    			append_dev(div, label);
    			append_dev(label, t1);
    			append_dev(div, t2);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", input_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*colors*/ 16 && input_id_value !== (input_id_value = /*key*/ ctx[16])) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty & /*colors*/ 16 && input_name_value !== (input_name_value = /*key*/ ctx[16])) {
    				attr_dev(input, "name", input_name_value);
    			}

    			if (dirty & /*colors*/ 16 && input_value_value !== (input_value_value = /*colorToHex*/ ctx[6](/*key*/ ctx[16]))) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (dirty & /*colors*/ 16 && t1_value !== (t1_value = /*key*/ ctx[16] + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*colors*/ 16 && label_for_value !== (label_for_value = /*key*/ ctx[16])) {
    				attr_dev(label, "for", label_for_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(11:2) {#each Object.entries(colors) as [ key, value ]}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div0;
    	let canvas_1;
    	let t;
    	let div1;
    	let each_value = Object.entries(/*colors*/ ctx[4]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			canvas_1 = element("canvas");
    			t = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(canvas_1, "width", /*width*/ ctx[2]);
    			attr_dev(canvas_1, "height", /*height*/ ctx[3]);
    			attr_dev(canvas_1, "class", "canvas svelte-1w365sy");
    			add_location(canvas_1, file, 1, 2, 43);
    			attr_dev(div0, "class", "root svelte-1w365sy");
    			add_location(div0, file, 0, 0, 0);
    			attr_dev(div1, "class", "controls");
    			add_location(div1, file, 9, 0, 152);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, canvas_1);
    			/*canvas_1_binding*/ ctx[7](canvas_1);
    			/*div0_binding*/ ctx[8](div0);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*width*/ 4) {
    				attr_dev(canvas_1, "width", /*width*/ ctx[2]);
    			}

    			if (dirty & /*height*/ 8) {
    				attr_dev(canvas_1, "height", /*height*/ ctx[3]);
    			}

    			if (dirty & /*Object, colors, colorToHex, colorHandler*/ 112) {
    				each_value = Object.entries(/*colors*/ ctx[4]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			/*canvas_1_binding*/ ctx[7](null);
    			/*div0_binding*/ ctx[8](null);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Stage', slots, []);
    	let container;
    	let canvas;
    	let width = 30;
    	let height = 30;
    	let resizeTimeout;

    	const colors = {
    		primary: [.25, .34, .81, 1],
    		secondary: [.78, .31, .75, 1],
    		tertiary: [1, .8, .43, 1]
    	};

    	let gl, plane;

    	onMount(() => {
    		gl = canvas.getContext('webgl', { alpha: false });

    		if (gl === null) {
    			alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    			return;
    		}

    		setSize(0);
    		setViewport();
    		let frame = requestAnimationFrame(loop);
    		plane = planeMesh(gl, colors);

    		function loop(t) {
    			frame = requestAnimationFrame(loop);

    			if (width !== container.clientWidth || height !== container.clientHeight) {
    				setSize();
    			}

    			setViewport();
    			gl.clearColor(colors.primary[0], colors.primary[1], colors.primary[2], colors.primary[3]);
    			gl.disable(gl.DEPTH_TEST);
    			gl.clear(gl.COLOR_BUFFER_BIT);

    			if (plane) {
    				plane.render(gl);
    			}
    		}

    		return () => {
    			cancelAnimationFrame(frame);
    		};
    	});

    	function updateUniformColors() {
    		if (plane) {
    			plane.updateUniformColors(colors);
    		}
    	}

    	function setSize(delay = 500) {
    		if (resizeTimeout === undefined) {
    			resizeTimeout = setTimeout(
    				() => {
    					$$invalidate(2, width = container.clientWidth);
    					$$invalidate(3, height = container.clientHeight);
    					resizeTimeout = undefined;
    				},
    				delay
    			);
    		}
    	}

    	function setViewport() {
    		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    	}

    	function colorHandler({ target }, color) {
    		if (target && target.value) {
    			$$invalidate(4, colors[color][0] = parseInt(target.value.substr(1, 2), 16) / 255, colors);
    			$$invalidate(4, colors[color][1] = parseInt(target.value.substr(3, 2), 16) / 255, colors);
    			$$invalidate(4, colors[color][2] = parseInt(target.value.substr(5, 2), 16) / 255, colors);
    			updateUniformColors();
    		}
    	}

    	function colorToHex(key) {
    		const channels = [colors[key][0] * 255, colors[key][1] * 255, colors[key][2] * 255].map(x => parseInt(x)).map(x => {
    			const hex = x.toString(16);
    			return hex.length === 1 ? '0' + hex : hex;
    		}).join('');

    		return `#${channels}`;
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Stage> was created with unknown prop '${key}'`);
    	});

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvas = $$value;
    			$$invalidate(1, canvas);
    		});
    	}

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			container = $$value;
    			$$invalidate(0, container);
    		});
    	}

    	const input_handler = (key, event) => colorHandler(event, key);

    	$$self.$capture_state = () => ({
    		onMount,
    		planeMesh,
    		container,
    		canvas,
    		width,
    		height,
    		resizeTimeout,
    		colors,
    		gl,
    		plane,
    		updateUniformColors,
    		setSize,
    		setViewport,
    		colorHandler,
    		colorToHex
    	});

    	$$self.$inject_state = $$props => {
    		if ('container' in $$props) $$invalidate(0, container = $$props.container);
    		if ('canvas' in $$props) $$invalidate(1, canvas = $$props.canvas);
    		if ('width' in $$props) $$invalidate(2, width = $$props.width);
    		if ('height' in $$props) $$invalidate(3, height = $$props.height);
    		if ('resizeTimeout' in $$props) resizeTimeout = $$props.resizeTimeout;
    		if ('gl' in $$props) gl = $$props.gl;
    		if ('plane' in $$props) plane = $$props.plane;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		container,
    		canvas,
    		width,
    		height,
    		colors,
    		colorHandler,
    		colorToHex,
    		canvas_1_binding,
    		div0_binding,
    		input_handler
    	];
    }

    class Stage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Stage",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.42.4 */

    function create_fragment(ctx) {
    	let stage;
    	let current;
    	stage = new Stage({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(stage.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(stage, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(stage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(stage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(stage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let name = 'world';
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Stage, name });

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) name = $$props.name;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
