const vertex_shader = /* wgsl */`
@vertex 
fn vertexMain(@location(0) pos: vec2f) -> @builtin(position) vec4f {
    return vec4f(pos, 0, 1); 
}
`

const fragment_shader = /* wgsl */`
@fragment
fn fragmentMain() -> @location(0) vec4f {
    return vec4f(1, 0, 0, 1); 
}
`

const global_shader = /* wgsl */`
// Your shader code will go here
@vertex // 表示将要编写的 vertex shader 代码
// 指定输入参数，在偏移量为0的位置取 pos 输入为 vec2f 类型
fn vertexMain(@location(0) pos: vec2f) -> @builtin(position) vec4f { // -> 后指明返回值类型，这里指定为内置的 vec4f 类型
    return vec4f(pos, 0, 1); // 与 OpenGL 的 GLSL 有着相同的写法 
}

// fragment shader 和 vertex shader 的函数可以写在一个里面，这很好
@fragment
fn fragmentMain() -> @location(0) vec4f {
    return vec4f(1, 0, 0, 1); // 统一返回红色
}
`

const abc = 20;


export{ vertex_shader, fragment_shader, global_shader, abc }
