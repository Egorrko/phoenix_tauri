import "../vendor/cobe"

const Globe = {
  mounted() {
    let phi = 0
    let width = 0

    const onResize = () => {
      if (this.el) {
        width = this.el.offsetWidth
      }
    }
    window.addEventListener("resize", onResize)
    onResize()

    this.globe = createGlobe(this.el, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.4, 0.3, 1],
      glowColor: [0.1, 0.1, 0.2],
      markers: [
        { location: [37.7749, -122.4194], size: 0.03 },
        { location: [40.7128, -74.006], size: 0.03 },
        { location: [51.5074, -0.1278], size: 0.03 },
        { location: [48.8566, 2.3522], size: 0.03 },
        { location: [35.6762, 139.6503], size: 0.03 },
        { location: [-33.8688, 151.2093], size: 0.03 },
        { location: [55.7558, 37.6173], size: 0.03 },
        { location: [1.3521, 103.8198], size: 0.03 },
      ],
      onRender: (state) => {
        state.phi = phi
        phi += 0.003
        state.width = width * 2
        state.height = width * 2
      },
    })

    this._onResize = onResize
  },

  destroyed() {
    if (this.globe) {
      this.globe.destroy()
    }
    if (this._onResize) {
      window.removeEventListener("resize", this._onResize)
    }
  },
}

export default Globe
