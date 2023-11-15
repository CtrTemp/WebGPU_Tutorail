import { createStore, useStore, mapState } from "vuex";

// Tutorial 05
import basicTestModel from "./Tuto05/triangle.js"

// Tutorial 08
import rotatingCubes from "./Tuto08/rotatingCubes.js";

// Tutorial 15 延迟渲染
import deferredShadingModel from "./Tuto15/deferred_shading.js"

// Tutorial 16 阴影
import shadowMapModel from "./Tuto16/shadowMap.js"

// Forward Shading
import ForwardShading from "./ForwardShading/ForwardShading.js";

// Particles Simulation
import Particles from "./Particles/Particles.js";

// Flow Rendering
import Flow from "./Flow/Flow.js";

// Textured Instance Simulation
import InstanceSimu from "./Prj01/instanceSimu.js";

const store = createStore({
  state: {
    // ws: new WebSocket(`ws://${window.location.hostname}:3008`),
    device: null,
  },
  mutations: {

    GLOBAL_INITIALIZATION(state, data) {
      console.log("Commit global initialization", data);
    }

  },
  actions: {},
  modules: {
    Tuto05: basicTestModel,
    Tuto08: rotatingCubes,
    Tuto15: deferredShadingModel,
    Tuto16: shadowMapModel,
    ForwardShading: ForwardShading,
    Particles: Particles,
    Flow: Flow,
    InstanceSimu: InstanceSimu
  }
})



export { store }



