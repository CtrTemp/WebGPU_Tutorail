import { createStore, useStore, mapState } from "vuex";

// Tutorial 05
import basicTestModel from "./Tuto05/triangle.js"

// Tutorial 08
import rotatingCubes from "./Tuto08/rotatingCubes.js";

// Tutorial 15
import deferredShadingModel from "./Tuto15/deferred_shading.js"

// Forward Shading
import ForwardShading from "./ForwardShading/ForwardShading.js";
import Particles from "./Particles/Particles.js";

const store = createStore({
  state: {
    // ws: new WebSocket(`ws://${window.location.hostname}:3008`),
    device: null,
  },
  mutations: {

    GLOBAL_INITIALIZATION(state, data){
        console.log("Commit global initialization", data);
    }

  },
  actions: {},
  modules: {
    Tuto05: basicTestModel,
    Tuto08: rotatingCubes,
    Tuto15: deferredShadingModel,
    ForwardShading: ForwardShading,
    Particles: Particles
  }
})



export { store }



