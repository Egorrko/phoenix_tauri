// Phenomenon + Cobe bundled - https://github.com/shuding/cobe
// MIT License
(function(global) {
  "use strict";

  // Phenomenon library
  var t = ["x", "y", "z"];
  var Phenomenon = function(config) {
    var e = config || {};
    var canvas = e.canvas;
    if (canvas === void 0) canvas = document.querySelector("canvas");
    var context = e.context;
    if (context === void 0) context = {};
    var contextType = e.contextType;
    if (contextType === void 0) contextType = "experimental-webgl";
    var settings = e.settings;
    if (settings === void 0) settings = {};
    var gl = canvas.getContext(contextType, Object.assign({ alpha: false, antialias: false }, context));

    Object.assign(this, {
      gl: gl,
      canvas: canvas,
      uniforms: {},
      instances: new Map(),
      shouldRender: true
    });
    Object.assign(this, {
      devicePixelRatio: 1,
      clearColor: [1, 1, 1, 1],
      position: { x: 0, y: 0, z: 2 },
      clip: [0.001, 100]
    });
    Object.assign(this, settings);

    this.uniformMap = {
      float: function(loc, val) { return gl.uniform1f(loc, val); },
      vec2: function(loc, val) { return gl.uniform2fv(loc, val); },
      vec3: function(loc, val) { return gl.uniform3fv(loc, val); },
      vec4: function(loc, val) { return gl.uniform4fv(loc, val); },
      mat2: function(loc, val) { return gl.uniformMatrix2fv(loc, false, val); },
      mat3: function(loc, val) { return gl.uniformMatrix3fv(loc, false, val); },
      mat4: function(loc, val) { return gl.uniformMatrix4fv(loc, false, val); }
    };

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    if (gl.getContextAttributes().alpha === false) {
      gl.clearColor.apply(gl, this.clearColor);
      gl.clearDepth(1);
    }
    this.onSetup && this.onSetup(gl);
    var self = this;
    window.addEventListener("resize", function() { return self.resize(); });
    this.resize();
    this.render();
  };

  Phenomenon.prototype.resize = function() {
    var gl = this.gl;
    var canvas = this.canvas;
    var dpr = this.devicePixelRatio;
    var pos = this.position;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    var w = gl.drawingBufferWidth;
    var h = gl.drawingBufferHeight;
    var aspect = w / h;
    gl.viewport(0, 0, w, h);
    var fov = Math.tan(Math.PI / 180 * 22.5);
    this.uniforms.uProjectionMatrix = {
      type: "mat4",
      value: [0.5 / fov, 0, 0, 0, 0, aspect / fov * 0.5, 0, 0, 0, 0, -(this.clip[1] + this.clip[0]) / (this.clip[1] - this.clip[0]), -1, 0, 0, -2 * this.clip[1] * (this.clip[0] / (this.clip[1] - this.clip[0])), 0]
    };
    this.uniforms.uViewMatrix = { type: "mat4", value: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] };
    this.uniforms.uModelMatrix = { type: "mat4", value: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, pos.x, pos.y, (aspect < 1 ? 1 : aspect) * -pos.z, 1] };
  };

  Phenomenon.prototype.toggle = function(val) {
    if (val !== this.shouldRender) {
      this.shouldRender = val !== void 0 ? val : !this.shouldRender;
      this.shouldRender && this.render();
    }
  };

  Phenomenon.prototype.render = function() {
    var self = this;
    this.gl.clear(16640);
    this.instances.forEach(function(inst) { inst.render(self.uniforms); });
    this.onRender && this.onRender(this);
    this.shouldRender && requestAnimationFrame(function() { return self.render(); });
  };

  var Instance = function(config) {
    Object.assign(this, {
      uniforms: {},
      geometry: { vertices: [{ x: 0, y: 0, z: 0 }] },
      mode: 0,
      modifiers: {},
      attributes: [],
      multiplier: 1,
      buffers: []
    });
    Object.assign(this, config);
    this.prepareProgram();
    this.prepareUniforms();
    this.prepareAttributes();
  };

  Instance.prototype.compileShader = function(type, source) {
    var shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    return shader;
  };

  Instance.prototype.prepareProgram = function() {
    var gl = this.gl;
    var program = gl.createProgram();
    gl.attachShader(program, this.compileShader(35633, this.vertex));
    gl.attachShader(program, this.compileShader(35632, this.fragment));
    gl.linkProgram(program);
    gl.useProgram(program);
    this.program = program;
  };

  Instance.prototype.prepareUniforms = function() {
    var keys = Object.keys(this.uniforms);
    for (var i = 0; i < keys.length; i++) {
      var loc = this.gl.getUniformLocation(this.program, keys[i]);
      this.uniforms[keys[i]].location = loc;
    }
  };

  Instance.prototype.prepareAttributes = function() {
    if (this.geometry.vertices !== void 0) this.attributes.push({ name: "aPosition", size: 3 });
    if (this.geometry.normal !== void 0) this.attributes.push({ name: "aNormal", size: 3 });
    this.attributeKeys = [];
    for (var i = 0; i < this.attributes.length; i++) {
      this.attributeKeys.push(this.attributes[i].name);
      this.prepareAttribute(this.attributes[i]);
    }
  };

  Instance.prototype.prepareAttribute = function(attr) {
    var geom = this.geometry;
    var mult = this.multiplier;
    var verts = geom.vertices;
    var data = new Float32Array(mult * verts.length * attr.size);
    for (var a = 0; a < mult; a++) {
      var d = attr.data && attr.data(a, mult);
      var idx = a * verts.length * attr.size;
      for (var f = 0; f < verts.length; f++) {
        for (var c = 0; c < attr.size; c++) {
          var mod = this.modifiers[attr.name];
          data[idx] = mod !== void 0 ? mod(d, f, c, this) : attr.name === "aPosition" ? verts[f][t[c]] : d[c];
          idx++;
        }
      }
    }
    this.attributes[this.attributeKeys.indexOf(attr.name)].data = data;
    this.prepareBuffer(this.attributes[this.attributeKeys.indexOf(attr.name)]);
  };

  Instance.prototype.prepareBuffer = function(attr) {
    var gl = this.gl;
    var buffer = gl.createBuffer();
    gl.bindBuffer(34962, buffer);
    gl.bufferData(34962, attr.data, 35044);
    var loc = gl.getAttribLocation(this.program, attr.name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, attr.size, 5126, false, 0, 0);
    this.buffers[this.attributeKeys.indexOf(attr)] = { buffer: buffer, location: loc, size: attr.size };
  };

  Instance.prototype.render = function(uniforms) {
    var self = this;
    var gl = this.gl;
    gl.useProgram(this.program);
    for (var i = 0; i < this.buffers.length; i++) {
      var b = this.buffers[i];
      if (b) {
        gl.enableVertexAttribArray(b.location);
        gl.bindBuffer(34962, b.buffer);
        gl.vertexAttribPointer(b.location, b.size, 5126, false, 0, 0);
      }
    }
    Object.keys(uniforms).forEach(function(k) {
      if (self.uniforms[k]) self.uniforms[k].value = uniforms[k].value;
    });
    Object.keys(this.uniforms).forEach(function(k) {
      var u = self.uniforms[k];
      if (u.location !== null) self.uniformMap[u.type](u.location, u.value);
    });
    gl.drawArrays(this.mode, 0, this.multiplier * this.geometry.vertices.length);
    this.onRender && this.onRender(this);
  };

  Instance.prototype.destroy = function() {
    for (var i = 0; i < this.buffers.length; i++) {
      if (this.buffers[i]) this.gl.deleteBuffer(this.buffers[i].buffer);
    }
    this.gl.deleteProgram(this.program);
    this.gl = null;
  };

  Phenomenon.prototype.add = function(name, config) {
    if (config === void 0) config = { uniforms: {} };
    if (config.uniforms === void 0) config.uniforms = {};
    Object.assign(config.uniforms, JSON.parse(JSON.stringify(this.uniforms)));
    Object.assign(config, { gl: this.gl, uniformMap: this.uniformMap });
    var inst = new Instance(config);
    this.instances.set(name, inst);
    return inst;
  };

  Phenomenon.prototype.remove = function(name) {
    var inst = this.instances.get(name);
    if (inst !== void 0) {
      inst.destroy();
      this.instances.delete(name);
    }
  };

  Phenomenon.prototype.destroy = function() {
    var self = this;
    this.instances.forEach(function(inst, name) {
      inst.destroy();
      self.instances.delete(name);
    });
    this.toggle(false);
  };

  // Cobe library
  var PI = Math.PI;
  var sin = Math.sin;
  var cos = Math.cos;

  var MARKER_KEYS = {
    phi: "A",
    theta: "B",
    mapSamples: "l",
    mapBrightness: "E",
    baseColor: "R",
    markerColor: "S",
    glowColor: "y",
    diffuse: "F",
    dark: "G",
    offset: "x",
    scale: "C",
    opacity: "H",
    mapBaseBrightness: "I"
  };

  function processMarkers(markers) {
    return [].concat.apply([], markers.map(function(m) {
      var lat = m.location[0];
      var lng = m.location[1];
      lat = lat * PI / 180;
      lng = lng * PI / 180 - PI;
      var c = cos(lat);
      return [-c * cos(lng), sin(lat), c * sin(lng), m.size];
    })).concat([0, 0, 0, 0]);
  }

  function createGlobe(canvas, config) {
    var makeUniform = function(type, key, defaultVal) {
      return {
        type: type,
        value: config[key] === void 0 ? defaultVal : config[key]
      };
    };

    var contextType = canvas.getContext("webgl") ? "webgl" : "experimental-webgl";

    var phenomenon = new Phenomenon({
      canvas: canvas,
      contextType: contextType,
      context: {
        alpha: true,
        stencil: false,
        antialias: true,
        depth: false,
        preserveDrawingBuffer: false,
        ...config.context
      },
      settings: {
        devicePixelRatio: config.devicePixelRatio || 1,
        onSetup: function(gl) {
          var RGB = gl.RGB;
          var UNSIGNED_BYTE = gl.UNSIGNED_BYTE;
          var TEXTURE_2D = gl.TEXTURE_2D;
          var texture = gl.createTexture();
          gl.bindTexture(TEXTURE_2D, texture);
          gl.texImage2D(TEXTURE_2D, 0, RGB, 1, 1, 0, RGB, UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));

          var img = new Image();
          img.onload = function() {
            gl.bindTexture(TEXTURE_2D, texture);
            gl.texImage2D(TEXTURE_2D, 0, RGB, RGB, UNSIGNED_BYTE, img);
            gl.generateMipmap(TEXTURE_2D);
            var program = gl.getParameter(gl.CURRENT_PROGRAM);
            var loc = gl.getUniformLocation(program, "J");
            gl.texParameteri(TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.uniform1i(loc, 0);
          };
          img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAACAAQAAAADMzoqnAAAAAXNSR0IArs4c6QAABA5JREFUeNrV179uHEUAx/Hf3JpbF+E2VASBsmVKTBcpKJs3SMEDcDwBiVJAAewYEBUivIHT0uUBIt0YCovKD0CRjUC4QfHYh8hYXu+P25vZ2Zm9c66gMd/GJ/tz82d3bk8GN4SrByYF2366FNTACIAkivVAAazQdnf3MvAlbNUQfOPAdQDvSAimMWhwy4I2g4SU+Kp04ISLpPBAKLxPyic3O/CCi+Y7rUJbiodcpDOFY7CgxCEXmdYD2EYK2s5lApOx5pEDDYCUwM1XdJUwBV11QQMg59kePSCaPAASQMEL2hwo6TJFgxpg+TgC2ymXPbuvc40awr3D1QCFfbH9kcoqAOkZozpQo0aqAGQRKCog/+tjkgbNFEtg2FffBvBGlSxHoAaAa1u6X4PBAwDiR8FFsrQgeUhfJTSALaB9jy5NCybJPn1SVFiWk7ywN+KzhH1aKAuydhGkbEF4lWohLXDXavlyFgHY7LBnLRdlAP6BS5Cc8RfVDXbkwN/oIvmY+6obbNeBP0JwTuMGu9gTzy1Q4RS/cWpfzszeYwd+CAFrtBW/Hur0gLbJGlD+/OjVwe/drfBxkbbg63dndEDfiEBlAd7ac0BPe1D6Jd8dfbLH+RI0OzseFB5s01/M+gMdAeluLOCAuaUA9Lezo/vSgXoCX9rtEiXnp7Q1W/CNyWcd8DXoS6jH/YZ5vAJEWY2dXFQe2TUgaFaNejCzJ98g6HnlVrsE58sDcYqg+9XY75fPqdoh/kRQWiXKg8MWlJQxUFMPjqnyujhFBE7UxIMjyszk0QwQlFsezImsyvUYYYVED2pk6m0Tg8T04Fwjk2kdAwSACqlM6gRRt3vQYAFGX0Ah7Ebx1H+MDRI5ui0QldH4j7FGcm90XdxD2Jg1AOEAVAKhEFXSn4cKUELurIAKwJ3MArypPscQaLhJFICJ0ohjDySAdH8AhDtCiTuMycH8CXzhH9jUACAO5uMhoAwA5i+T6WAKmmAqnLy80wxHqIPFYpqCwxGaYLt4Dyievg5kEoVEUAhs6pqKgFtDQYOuaXypaWKQfIuwwoGSZgfLsu/XAtI8cGN+h7Cc1A5oLOMhwlIPXuhu48AIvsSBkvtV9wsJRKCyYLfq5lTrQMFd1a262oqBck9K1V0YjQg0iEYYgpS1A9GlXQV5cykwm4A7BzVsxQqo7E+zCegO7Ma7yKgsuOcfKbMBwLC8wvVNYDsANYalEpOAa6zpWjTeMKGwEwC1CiQewJc5EKfgy7GmRAZA4vUVGwE2dPM/g0xuAInE/yG5aZ8ISxWGfYigUVbdyBElTHh2uCwGdfCkOLGgQVBh3Ewp+/QK4CDlR5Ws/Zf7yhCf8pH7vinWAvoVCQ6zz0NX5V/6GkAVV+2/5qsJ/gU8bsxpM8IeAQAAAABJRU5ErkJggg==";
        }
      }
    });

    phenomenon.add("", {
      vertex: "attribute vec3 aPosition;uniform mat4 uProjectionMatrix;uniform mat4 uModelMatrix;uniform mat4 uViewMatrix;void main(){gl_Position=uProjectionMatrix*uModelMatrix*uViewMatrix*vec4(aPosition,1.);}",
      fragment: "precision highp float;uniform vec2 t,x;uniform vec3 R,S,y;uniform vec4 z[64];uniform float A,B,l,C,D,E,F,G,H,I;uniform sampler2D J;float K=1./l;mat3 L(float a,float b){float c=cos(a),d=cos(b),e=sin(a),f=sin(b);return mat3(d,f*e,-f*c,0.,c,e,f,d*-e,d*c);}vec3 w(vec3 c,out float v){c=c.xzy;float p=max(2.,floor(log2(2.236068*l*3.141593*(1.-c.z*c.z))*.72021));vec2 g=floor(pow(1.618034,p)/2.236068*vec2(1.,1.618034)+.5),d=fract((g+1.)*.618034)*6.283185-3.883222,e=-2.*g,f=vec2(atan(c.y,c.x),c.z-1.),q=floor(vec2(e.y*f.x-d.y*(f.y*l+1.),-e.x*f.x+d.x*(f.y*l+1.))/(d.x*e.y-e.x*d.y));float n=3.141593;vec3 r;for(float h=0.;h<4.;h+=1.){vec2 s=vec2(mod(h,2.),floor(h*.5));float j=dot(g,q+s);if(j>l)continue;float a=j,b=0.;if(a>=524288.)a-=524288.,b+=.803894;if(a>=262144.)a-=262144.,b+=.901947;if(a>=131072.)a-=131072.,b+=.950973;if(a>=65536.)a-=65536.,b+=.475487;if(a>=32768.)a-=32768.,b+=.737743;if(a>=16384.)a-=16384.,b+=.868872;if(a>=8192.)a-=8192.,b+=.934436;if(a>=4096.)a-=4096.,b+=.467218;if(a>=2048.)a-=2048.,b+=.733609;if(a>=1024.)a-=1024.,b+=.866804;if(a>=512.)a-=512.,b+=.433402;if(a>=256.)a-=256.,b+=.216701;if(a>=128.)a-=128.,b+=.108351;if(a>=64.)a-=64.,b+=.554175;if(a>=32.)a-=32.,b+=.777088;if(a>=16.)a-=16.,b+=.888544;if(a>=8.)a-=8.,b+=.944272;if(a>=4.)a-=4.,b+=.472136;if(a>=2.)a-=2.,b+=.236068;if(a>=1.)a-=1.,b+=.618034;float k=fract(b)*6.283185,i=1.-2.*j*K,m=sqrt(1.-i*i);vec3 o=vec3(cos(k)*m,sin(k)*m,i);float u=length(c-o);if(u<n)n=u,r=o;}v=n;return r.xzy;}void main(){vec2 b=(gl_FragCoord.xy/t*2.-1.)/C-x*vec2(1.,-1.)/t;b.x*=t.x/t.y;float c=dot(b,b);vec4 M=vec4(0.);float m=0.;if(c<=.64){for(int d=0;d<2;d++){vec4 e=vec4(0.);float a;vec3 u=vec3(0.,0.,1.),f=normalize(vec3(b,sqrt(.64-c)));f.z*=d>0?-1.:1.,u.z*=d>0?-1.:1.;vec3 g=f*L(B,A),h=w(g,a);float n=asin(h.y),i=acos(-h.x/cos(n));i=h.z<0.?-i:i;float N=max(texture2D(J,vec2(i*.5/3.141593,-(n/3.141593+.5))).x,I),O=smoothstep(8e-3,0.,a),j=dot(f,u),v=pow(j,F)*E,o=N*O*v,T=mix((1.-o)*pow(j,.4),o,G)+.1;e+=vec4(R*T,1.);int U=int(D);float p=0.;for(int k=0;k<64;k++){if(k>=U)break;vec4 q=z[k];vec3 r=q.xyz,P=r-g;float s=q.w;if(dot(P,P)>s*s*4.)continue;vec3 V=w(r,a);a=length(V-g),a<s?p+=smoothstep(s*.5,0.,a):0.;}p=min(1.,p*v),e.xyz=mix(e.xyz,S,p),e.xyz+=pow(1.-j,4.)*y,M+=e*(1.+(d>0?-H:H))/2.;}m=pow(dot(normalize(vec3(-b,sqrt(1.-c))),vec3(0.,0.,1.)),4.)*smoothstep(0.,1.,.2/(c-.64));}else{float Q=sqrt(.2/(c-.64));m=smoothstep(.5,1.,Q/(Q+1.));}gl_FragColor=M+vec4(m*y,m);}",
      uniforms: {
        t: { type: "vec2", value: [config.width, config.height] },
        A: makeUniform("float", "phi"),
        B: makeUniform("float", "theta"),
        l: makeUniform("float", "mapSamples"),
        E: makeUniform("float", "mapBrightness"),
        I: makeUniform("float", "mapBaseBrightness"),
        R: makeUniform("vec3", "baseColor"),
        S: makeUniform("vec3", "markerColor"),
        F: makeUniform("float", "diffuse"),
        y: makeUniform("vec3", "glowColor"),
        G: makeUniform("float", "dark"),
        z: { type: "vec4", value: processMarkers(config.markers) },
        D: { type: "float", value: config.markers.length },
        x: makeUniform("vec2", "offset", [0, 0]),
        C: makeUniform("float", "scale", 1),
        H: makeUniform("float", "opacity", 1)
      },
      mode: 4,
      geometry: {
        vertices: [
          { x: -100, y: 100, z: 0 },
          { x: -100, y: -100, z: 0 },
          { x: 100, y: 100, z: 0 },
          { x: 100, y: -100, z: 0 },
          { x: -100, y: -100, z: 0 },
          { x: 100, y: 100, z: 0 }
        ]
      },
      onRender: function(ref) {
        var uniforms = ref.uniforms;
        var state = {};
        if (config.onRender) {
          state = config.onRender(state) || state;
          for (var key in MARKER_KEYS) {
            if (state[key] !== void 0) {
              uniforms[MARKER_KEYS[key]].value = state[key];
            }
          }
          if (state.markers !== void 0) {
            uniforms["z"].value = processMarkers(state.markers);
            uniforms["D"].value = state.markers.length;
          }
          if (state.width && state.height) {
            uniforms["t"].value = [state.width, state.height];
          }
        }
      }
    });

    return phenomenon;
  }

  // Export
  global.createGlobe = createGlobe;

})(typeof window !== "undefined" ? window : this);
