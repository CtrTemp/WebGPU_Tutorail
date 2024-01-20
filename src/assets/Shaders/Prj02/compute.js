
/**
 *  用於在每一幀更新粒子的位置坐標
 * */

/**
 *  Flow 運動更新策略：
 * 
 *  1、在每個可能的位置上每次向下一個位置步進一段距離，需要兩個坐標之間的插值獲取更新後的位置
 *  2、在每個可能的位置上隨機撒種子，設定一個 life time，讓粒子在設定的坐標數組中向後移動，
 * 直到其生命終止（但這樣看起來粒子流是不連續的，你是否要考慮設置一個拖尾的效果呢？？？）。不過
 * 目前看來這種效果應該是最佳的√
 * 
 */

// Vertex Shader
const compute_move_path = /* wgsl */`


struct SimulationParams {
  cur_layout  : f32,  // 当前布局
  last_layout : f32,  // 上次布局
  simu_speed  : f32,  // 基本移动速度
  pause_flag  : f32,  // 是否暂停移动标志位
}

// 要注意这里后面两项不能加入，instance要的只有particle的信息，quad信息不要
struct Instance {
  position        : vec4<f32>,
  pos_offset      : vec4<f32>,
  layout1_pos     : vec4<f32>,
  layout2_pos     : vec4<f32>,
  layout3_pos     : vec4<f32>,
  layout_flag     : f32,       
  idx             : f32,          // 弃用保留
  
  uv_offset       : vec2<f32>,
  tex_aspect      : vec2<f32>,
  uv_size         : vec2<f32>,
  uv_offset_d     : vec2<f32>,    // default_uv_offset
  tex_aspect_d    : vec2<f32>,    // default_uv_scale
  uv_size_d       : vec2<f32>,    // default_quad_scale
  // quad_pos     : vec2<f32>,    // -1..+1
  // quad_uv      : vec2<f32>,    // 0..+1
}


@binding(0) @group(0) var<storage, read_write> sim_params : SimulationParams;
@binding(1) @group(0) var<storage, read_write> data : array<Instance>;


/**
 *  2024/01/18
 *  晚饭回来继续更新这里，先添加一个GPU pass，
 * 之后在渲染循环中重复调勇这个pass，先让instance定向移动起来
 * */ 

@compute @workgroup_size(64)
fn simulate(@builtin(global_invocation_id) global_invocation_id : vec3<u32>) {

  if(sim_params.pause_flag != 0.0){
    return;
  }

  let idx = global_invocation_id.x;
  var instance = data[idx];

  if(sim_params.cur_layout==1.0 && distance(instance.layout1_pos, instance.position)<0.01){
    /**
     *  Uniform Buffer 是只读的，，，
     *  要想修改应将其改为Storage Buffer，饭后回来搞定这个
     * */ 
    instance.layout_flag = 1.0;
    data[idx] = instance;
    return;
  }
  if(sim_params.cur_layout==2.0 && distance(instance.layout2_pos, instance.position)<0.01){
    instance.layout_flag = 2.0;
    data[idx] = instance;
    return;
  }
  if(sim_params.cur_layout==3.0 && distance(instance.layout3_pos, instance.position)<0.01){
    instance.layout_flag = 3.0;
    data[idx] = instance;
    return;
  }


  let step = 100.0; // 运动步长
  var pos1_to_pos2_vec3f = (instance.layout2_pos.xyz-instance.layout1_pos.xyz) / step;
  var pos2_to_pos3_vec3f = (instance.layout3_pos.xyz-instance.layout2_pos.xyz) / step;
  var pos3_to_pos1_vec3f = (instance.layout1_pos.xyz-instance.layout3_pos.xyz) / step;

  
  var void_color_1 = vec4(1.0, 1.0, 0.0, 0.2);  // layout1 color
  var void_color_2 = vec4(0.0, 1.0, 0.0, 0.2);  // layout2 color
  var void_color_3 = vec4(0.0, 0.0, 1.0, 0.2);  // layout3 color

  var c1_to_c2 = (void_color_2.xyz - void_color_1.xyz) * distance(instance.position, instance.layout1_pos) / distance(instance.layout1_pos, instance.layout2_pos);
  var c2_to_c1 = (void_color_1.xyz - void_color_2.xyz) * distance(instance.position, instance.layout2_pos) / distance(instance.layout1_pos, instance.layout2_pos);
  var c2_to_c3 = (void_color_3.xyz - void_color_2.xyz) * distance(instance.position, instance.layout2_pos) / distance(instance.layout2_pos, instance.layout3_pos);
  var c3_to_c2 = (void_color_2.xyz - void_color_3.xyz) * distance(instance.position, instance.layout3_pos) / distance(instance.layout2_pos, instance.layout3_pos);
  var c3_to_c1 = (void_color_1.xyz - void_color_3.xyz) * distance(instance.position, instance.layout3_pos) / distance(instance.layout3_pos, instance.layout1_pos);
  var c1_to_c3 = (void_color_3.xyz - void_color_1.xyz) * distance(instance.position, instance.layout1_pos) / distance(instance.layout3_pos, instance.layout1_pos);

  

  if(sim_params.cur_layout==1.0) 
  {
    if(instance.layout_flag==2.0){ // 现在正在从布局2到布局1运动
      instance.position.x = instance.position.x - pos1_to_pos2_vec3f.x;
      instance.position.y = instance.position.y - pos1_to_pos2_vec3f.y;
      instance.position.z = instance.position.z - pos1_to_pos2_vec3f.z;
      // 颜色插值
      instance.pos_offset.x = void_color_2.x + c2_to_c1.x;
      instance.pos_offset.y = void_color_2.y + c2_to_c1.y;
      instance.pos_offset.z = void_color_2.z + c2_to_c1.z;
    }
    else if(instance.layout_flag==3.0){ // 现在正在从布局3到布局1运动
      instance.position.x = instance.position.x + pos3_to_pos1_vec3f.x;
      instance.position.y = instance.position.y + pos3_to_pos1_vec3f.y;
      instance.position.z = instance.position.z + pos3_to_pos1_vec3f.z;
      
      instance.pos_offset.x = void_color_3.x + c3_to_c1.x;
      instance.pos_offset.y = void_color_3.y + c3_to_c1.y;
      instance.pos_offset.z = void_color_3.z + c3_to_c1.z;
    }
  }

  else if(sim_params.cur_layout==2.0) 
  {
    if(instance.layout_flag==1.0){  // 现在正在从布局1到布局2运动
      instance.position.x = instance.position.x + pos1_to_pos2_vec3f.x;
      instance.position.y = instance.position.y + pos1_to_pos2_vec3f.y;
      instance.position.z = instance.position.z + pos1_to_pos2_vec3f.z;

      instance.pos_offset.x = void_color_1.x + c1_to_c2.x;
      instance.pos_offset.y = void_color_1.y + c1_to_c2.y;
      instance.pos_offset.z = void_color_1.z + c1_to_c2.z;
    }
    else if(instance.layout_flag==3.0){ // 现在正在从布局3到布局2运动
      instance.position.x = instance.position.x - pos2_to_pos3_vec3f.x;
      instance.position.y = instance.position.y - pos2_to_pos3_vec3f.y;
      instance.position.z = instance.position.z - pos2_to_pos3_vec3f.z;
      
      instance.pos_offset.x = void_color_3.x + c3_to_c2.x;
      instance.pos_offset.y = void_color_3.y + c3_to_c2.y;
      instance.pos_offset.z = void_color_3.z + c3_to_c2.z;
    }
  }

  
  else if(sim_params.cur_layout==3.0) 
  {
    if(instance.layout_flag==1.0){  // 现在正在从布局1到布局3运动
      instance.position.x = instance.position.x - pos3_to_pos1_vec3f.x;
      instance.position.y = instance.position.y - pos3_to_pos1_vec3f.y;
      instance.position.z = instance.position.z - pos3_to_pos1_vec3f.z;
      
      instance.pos_offset.x = void_color_1.x + c1_to_c3.x;
      instance.pos_offset.y = void_color_1.y + c1_to_c3.y;
      instance.pos_offset.z = void_color_1.z + c1_to_c3.z;
    }
    else if(instance.layout_flag==2.0){ // 现在正在从布局2到布局3运动
      instance.position.x = instance.position.x + pos2_to_pos3_vec3f.x;
      instance.position.y = instance.position.y + pos2_to_pos3_vec3f.y;
      instance.position.z = instance.position.z + pos2_to_pos3_vec3f.z;
      
      instance.pos_offset.x = void_color_2.x + c2_to_c3.x;
      instance.pos_offset.y = void_color_2.y + c2_to_c3.y;
      instance.pos_offset.z = void_color_2.z + c2_to_c3.z;
    }
  }

  instance.pos_offset.w = 0.2;

  data[idx] = instance;
}


`

export { compute_move_path }
