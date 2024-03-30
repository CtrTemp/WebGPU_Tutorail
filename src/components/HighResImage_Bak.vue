<template>
    <div id="main"></div>
    <div id="minimap"></div>
</template>

<script>
import {mapState, mapActions} from 'vuex';
import * as d3 from "d3";
import { toRaw } from "vue";

export default {
    name: 'Image',
    props: [],
    data() {  
        return {  
            COLUMNBOUND: [105, 105],  
            ROWBOUND: [47, 48],  
            LOWESTLV: 7,  
            HIGHESTLV: 15,  
            curLv: 10,  
            // COLUMNBOUND: [0, 0],  
            // ROWBOUND: [0, 0],  
            // LOWESTLV: 0,  
            // HIGHESTLV: 5,  
            // curLv: 0,  
            lastLv: -1,             
            OFFSETXY: [],  
            camera: null,  
            controls: null,  
            scene: null,  
            renderer: null,  
            camera2: null,  
            controls2: null,  
            scene2: null,  
            renderer2: null,  
            camera_half_angle: Math.PI / 6,  
 
            isFirstFrame: false,  
            lastTime: null,  
            lastCameraPosition: null,  
            lastBoundColumn: null,  
            lastBoundRow: null,  
            curCameraBoundX: 0,  
            curCameraBoundY: 0,  
            curFetchBoundX: 0,  
            curFetchBoundY: 0,  
            curPositionRetPlane: null,  
            curPositionEdgeLine: null,  
            mousePositionOnMinimap: null,  
            mousePositionOnMain: null,  
            INITIALPOSITION: null,  
            planeList: [],  
            pointList: [],  
            pathList: [],  
            gridLineGroup: null,  
            POINTPOSITIONLIST: [],  
            fatLineMaterial: null,
        }
    },
    computed: {
        
    },
    mounted() {
        this.OFFSETXY = [this.COLUMNBOUND[0] * 256 * (1 << (this.HIGHESTLV - this.LOWESTLV)), this.ROWBOUND[0] * 256 * (1 << (this.HIGHESTLV - this.LOWESTLV))];
        this.mousePositionOnMinimap = new THREE.Vector2();
        this.mousePositionOnMain = new THREE.Vector2();
        this.INITIALPOSITION = new THREE.Vector3(30000, -75000, 95038);
        this.gridLineGroup = new THREE.Group();
        this.POINTPOSITIONLIST = [0, 1, 0, 0.3090169943749474, 0.9510565162951535, 0, 0.5877852522924731, 0.8090169943749475, 0, 0.8090169943749475, 0.5877852522924731, 0, 0.9510565162951535, 0.30901699437494745, 0, 1, 0, 0, 0.9510565162951536, -0.30901699437494734, 0, 0.8090169943749475, -0.587785252292473, 0, 0.5877852522924732, -0.8090169943749473, 0, 0.3090169943749475, -0.9510565162951535, 0, 0, -1, 0, -0.30901699437494773, -0.9510565162951535, 0, -0.587785252292473, -0.8090169943749475, 0, -0.8090169943749473, -0.5877852522924732, 0, -0.9510565162951535, -0.30901699437494756, 0, -1, 0, 0, -0.9510565162951536, 0.30901699437494723, 0, -0.8090169943749476, 0.5877852522924729, 0, -0.5877852522924734, 0.8090169943749473, 0, -0.3090169943749476, 0.9510565162951535, 0, 0, 1, 0];

        this.fatLineMaterial = new THREE.LineMaterial({
            color: 0xaa0000,
            linewidth: 3
        });

        this.init();
        this.animate();
    },
    watch: {
        
    },
    methods: {
        generateFilePath(level, columnIndex, rowIndex) {
            return 'data/Beijing_Ori/' + level.toString() + '/' + columnIndex.toString() + '/' + rowIndex.toString() + '.png';
            // return 'data/dunhuang_tiles/' + level.toString() + '/tile_' + columnIndex.toString() + '_' + rowIndex.toString() + '.png';   
        },

        calculateBound() {
            let camera = toRaw(this.camera);
            let curLv = this.curLv;
            let LOWESTLV = this.LOWESTLV;
            let HIGHESTLV = this.HIGHESTLV;
            let COLUMNBOUND = this.COLUMNBOUND;
            let ROWBOUND = this.ROWBOUND;

            var displayRadius = camera.position.z * Math.tan(Math.PI / 6);
            
            var displayRadiusX, displayRadiusY;
            if (window.innerHeight < window.innerWidth) {
                displayRadiusY = displayRadius;
                displayRadiusX = displayRadius * window.innerWidth / window.innerHeight;
            }
            else {
                displayRadiusX = displayRadius;
                displayRadiusY = displayRadius * window.innerHeight / window.innerWidth;
            }
            //按照屏幕本身实际的长宽比 确定 所要展示的部分的长宽

            this.curCameraBoundX = [camera.position.x - displayRadiusX, camera.position.x + displayRadiusX];
            this.curCameraBoundY = [camera.position.y + displayRadiusY, camera.position.y - displayRadiusY];
            //根据相机位置定义相机投影幕布的限制范围（所要展示的部分， 注意这个对应的是实际的像素坐标范围）

            var prefetchCnt = 1.5;//这里的意思是， 除了当前要显示的部分， 系统还会预先取出一部分瓦片进行渲染， 其范围是当前需要渲染范围的1.5倍！
            //注意是多出1.5倍的渲染距离，而非多出0.5倍！！
            var prefetchPixel = 256 * prefetchCnt * (1 << (HIGHESTLV - curLv));
            this.curFetchBoundX = [camera.position.x - displayRadiusX - prefetchPixel, camera.position.x + displayRadiusX + prefetchPixel];
            this.curFetchBoundY = [camera.position.y + displayRadiusY + prefetchPixel, camera.position.y - displayRadiusY - prefetchPixel];
            //这里比如原本需要渲染6*4的瓦片，那么需要预取并渲染的则是 6(1.5+1)*4(1.5+1)=15*10个瓦片（这里只是举例，实际上是用像素来代表的）
            //console.log("curFetchBoundX = ", curFetchBoundX[0], curFetchBoundX[1]);
            //这里是绝对坐标！！！

            var indexFactor = 1 << (curLv - LOWESTLV);
            var _fetchBoundColumn = [Math.floor(COLUMNBOUND[0] * indexFactor + (camera.position.x - displayRadiusX) / (256 * (1 << (HIGHESTLV - curLv)))), Math.ceil(COLUMNBOUND[0] * indexFactor + (camera.position.x + displayRadiusX) / (256 * (1 << (HIGHESTLV - curLv))))];
            var _fetchBoundRow = [Math.floor(ROWBOUND[0] * indexFactor - (camera.position.y + displayRadiusY) / (256 * (1 << (HIGHESTLV - curLv)))), Math.ceil(ROWBOUND[0] * indexFactor - (camera.position.y - displayRadiusY) / (256 * (1 << (HIGHESTLV - curLv))))];
            //返回的是 行要预取的起止点 以及 列要预取的起止点
            //分别对应 行：文件夹的名称范围 列：文件夹中的图片文件名称范围
            return [_fetchBoundColumn, _fetchBoundRow];
        },
        minimapMouseDown() {
            event.stopPropagation();

            if (event.button == 0) {
                let camera = toRaw(this.camera);
                let camera2 = toRaw(this.camera2);
                let controls = this.controls;
                let mousePositionOnMinimap = this.mousePositionOnMinimap;
                let scene2 = toRaw(this.scene2);

                mousePositionOnMinimap.x = (event.offsetX / document.getElementById("minimap").clientWidth) * 2 - 1;
                mousePositionOnMinimap.y = -(event.offsetY / document.getElementById("minimap").clientHeight) * 2 + 1;
                var vector = new THREE.Vector3(mousePositionOnMinimap.x, mousePositionOnMinimap.y, 0.5).unproject(camera2);
                var raycaster = new THREE.Raycaster(camera2.position, vector.sub(camera2.position).normalize());
                var intersects = raycaster.intersectObjects(scene2.children);
                // console.log(intersects[0].point);
                if (intersects.length > 0) {
                    camera.position.x = intersects[0].point.x;
                    camera.position.y = intersects[0].point.y;
                    controls.target.x = intersects[0].point.x;
                    controls.target.y = intersects[0].point.y;
                    document.getElementById("minimap").addEventListener("mousemove", this.minimapMouseDown, false);
                    document.getElementById("minimap").addEventListener("mouseup",this.minimapMouseUp, false);
                }

                this.mousePositionOnMinimap = mousePositionOnMinimap;
                this.camera = camera;
                this.controls = controls;
            }
        },
        minimapMouseUp() {
            event.stopPropagation();

            if (event.button == 0) {
                document.getElementById("minimap").removeEventListener("mousemove", this.minimapMouseDown, false);
                document.getElementById("minimap").removeEventListener("mouseup", this.minimapMouseUp, false);
            }
        },
        init() {
            let camera, camera2, scene, scene2, renderer, renderer2, controls, curPositionRetPlane, curPositionEdgeLine;
            let INITIALPOSITION = this.INITIALPOSITION;
            let planeList = this.planeList;
            let LOWESTLV = this.LOWESTLV;
            let HIGHESTLV = this.HIGHESTLV;
            let ROWBOUND = this.ROWBOUND;
            let COLUMNBOUND = this.COLUMNBOUND;

            //注意这里定义了相机的角度 视锥为60°， 故在之后的计算displayRadius的时候使用的是pi/6， 这里相互对应
            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 524288);
            // camera = new THREE.OrthographicCamera(-50000 * window.innerWidth / window.innerHeight, 50000 * window.innerWidth / window.innerHeight, -50000, 50000, 1, 524288);
            camera.position.set(INITIALPOSITION.x, INITIALPOSITION.y, INITIALPOSITION.z);
            camera2 = new THREE.PerspectiveCamera(60, 1, 1, 524288);//这个相机是做什么用的？  目前还没有搞清楚
            camera2.position.set(INITIALPOSITION.x, INITIALPOSITION.y, INITIALPOSITION.z);
            camera2.lookAt(INITIALPOSITION.x, INITIALPOSITION.y, 0);
            this.lastCameraPosition = camera.position.clone();
            this.camera = camera;
            this.camera2 = camera2;

            // world
            scene = new THREE.Scene();//主视图
            scene.add(camera);
            scene2 = new THREE.Scene();//小地图视图
            scene2.add(camera2);

            // add background image
            var textureLoader = new THREE.TextureLoader();
            var backgroundTexture0 = new THREE.MeshLambertMaterial({
                map: textureLoader.load(this.generateFilePath(LOWESTLV,COLUMNBOUND[0],ROWBOUND[0]))
            });
            var backgroundPlane0 = new THREE.Mesh(new THREE.PlaneGeometry(256 * (1 << (HIGHESTLV - LOWESTLV)), 256 * (1 << (HIGHESTLV - LOWESTLV))), backgroundTexture0);
            backgroundPlane0.position.x = 256 * 0.5 * (1 << (HIGHESTLV - LOWESTLV));
            backgroundPlane0.position.y = 256 * -0.5 * (1 << (HIGHESTLV - LOWESTLV));

            var backgroundTexture1 = new THREE.MeshLambertMaterial({
                map: textureLoader.load(this.generateFilePath(LOWESTLV,COLUMNBOUND[1],ROWBOUND[1]))
            });
            var backgroundPlane1 = new THREE.Mesh(new THREE.PlaneGeometry(256 * (1 << (HIGHESTLV - LOWESTLV)), 256 * (1 << (HIGHESTLV - LOWESTLV))), backgroundTexture1);
            backgroundPlane1.position.x = 256 * 0.5 * (1 << (HIGHESTLV - LOWESTLV));
            backgroundPlane1.position.y = 256 * -1.5 * (1 << (HIGHESTLV - LOWESTLV));
            scene.add(backgroundPlane0);
            scene.add(backgroundPlane1);
            scene2.add(backgroundPlane0);
            scene2.add(backgroundPlane1);

            for (var level = LOWESTLV; level <= HIGHESTLV; ++level) {
                planeList[level] = new Array();
            }//这里是planeList的初始化，这是一个二维数组，具体作用待定

            // add light
            var ambientLight = new THREE.AmbientLight(0xffffff);
            var ambientLight2 = new THREE.AmbientLight(0xffffff);
            scene.add(ambientLight);
            scene2.add(ambientLight2);

            // renderer
            renderer = new THREE.WebGLRenderer({antialias: true});
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            // d3.select("#main").appendChild(renderer.domElement);
            document.getElementById("main").appendChild(renderer.domElement);

            // controls
            controls = new THREE.TrackballControls(camera, renderer.domElement);
            controls.rotateSpeed = 1.0;
            controls.zoomSpeed = 1.2;
            controls.panSpeed = 0.8;
            controls.noRotate = false;
            controls.staticMoving = true;
            controls.dynamicDampingFactor = 0.2;
            controls.target.x = INITIALPOSITION.x;
            controls.target.y = INITIALPOSITION.y;
            controls.addEventListener('change', this.render);
        
            // minimap
            this.calculateBound();
            var curPositionRet = new THREE.PlaneGeometry(1, 1);
            var curPositionRetMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.1
            });
            curPositionRetPlane = new THREE.Mesh(curPositionRet, curPositionRetMaterial);
            var curPositionEdge = new THREE.EdgesGeometry(curPositionRet);
            var edgeMaterial = new THREE.LineBasicMaterial({
                color: 0xffffff
            });
            curPositionEdgeLine = new THREE.LineSegments(curPositionEdge, edgeMaterial);
            this.curPositionRetPlane = curPositionRetPlane;
            this.curPositionEdgeLine = curPositionEdgeLine;
            this.updateMinimapRectangle();
            scene2.add(curPositionRetPlane);
            scene2.add(curPositionEdgeLine);

            renderer2 = new THREE.WebGLRenderer({antialias: true});
            var minimapSize = Math.min(window.innerWidth, window.innerHeight) * 0.2;
            d3.select("#minimap").style("width", minimapSize + "px");
            d3.select("#minimap").style("height", minimapSize + "px");
            renderer2.setSize(minimapSize, minimapSize);
            document.getElementById("minimap").appendChild(renderer2.domElement);
            document.getElementById("minimap").addEventListener("mousedown", this.minimapMouseDown, false);

            // window.addEventListener("resize", onWindowResize, {passive: false});
            this.renderer = renderer;
            this.renderer2 = renderer2;            
            this.lastTime = Date.now();
            this.scene = scene;
            this.scene2 = scene2;
            this.controls = controls;
            this.planeList = planeList;

            this.render();            
        },
        onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            controls.handleResize();

            var minimapSize = Math.min(window.innerWidth, window.innerHeight) * 0.2;
            d3.select("#minimap").style("width", minimapSize + "px");
            d3.select("#minimap").style("height", minimapSize + "px");
            renderer2.setSize(minimapSize, minimapSize);

            resizeButtons();

            render();
        },
        render() {
            let camera = toRaw(this.camera);
            let camera2 = toRaw(this.camera2);
            let scene = toRaw(this.scene);
            let scene2 = toRaw(this.scene2);

            this.renderer.render(scene, camera);
            this.renderer2.render(scene2, camera2);
        },
        animate() {
            let camera = toRaw(this.camera);
            let curLv = this.curLv;
            let HIGHESTLV = this.HIGHESTLV;
            let LOWESTLV = this.LOWESTLV;
            let planeList = this.planeList;
            let lastLv = this.lastLv;
            let lastBoundColumn = this.lastBoundColumn;
            let lastBoundRow = this.lastBoundRow;
            let lastCameraPosition = this.lastCameraPosition;
            let scene = this.scene;

            requestAnimationFrame(this.animate);
            this.controls.update();//控制端更新一次
            
            
            this.updateCurLv();//得到当前的下钻level，深度等级
            // console.log("curLv = ", curLv);
            var bound = this.calculateBound();//得到应该预取的文件序列（文件夹以及文件）
            //bound[0]:对应文件夹range, bound[1]:对应图片名称range
            //console.log(bound);
            this.updateMinimapRectangle();//画小地图， 左上角的缩略图
            // updatePoints();//画图上的点， 通过你的交互添加到图上的点

            //camera.position.z -= 0;//通过直接修改相机位置达到交互效果
            if (this.needRefresh()) {//判断需要进行绘制更新则进行更新
                this.isFirstFrame = true;//第一次进入判定后，放置每次进入needRefresh()都返回true
                this.lastTime = Date.now();
                lastCameraPosition.x = camera.position.x;
                lastCameraPosition.y = camera.position.y;
                lastCameraPosition.z = camera.position.z;
                this.lastCameraPosition = lastCameraPosition;
                //更新“上次位置”坐标
                
                // console.log("current X :", camera.position.x);
                // console.log("current Y :",camera.position.y);
                // console.log("current Z :",camera.position.z);
                if (lastBoundColumn != bound[0] || lastBoundRow != bound[1]) {
                    
                    lastBoundColumn = bound[0];
                    lastBoundRow = bound[1];
                    this.lastBoundColumn = lastBoundColumn;
                    this.lastBoundRow = lastBoundRow;
                    //更新bound 就是预取文件的序列
                    
                    
                    this.renderImage(105, 47, LOWESTLV);//回来主要看懂这里即可
                    this.renderImage(105, 48, LOWESTLV);
                    // this.renderImage(0, 0, LOWESTLV);
                    

                    // remove images which level is higher than curLv
                    for (var level = curLv + 1; level <= HIGHESTLV; ++level) {
                        for (var column in planeList[level]) {
                            for (var row in planeList[level][column]) {
                                if (planeList[level][column][row].isRendered) {
                                    scene.remove(planeList[level][column][row].plane);
                                    planeList[level][column][row].isRendered = false;
                                    // console.log("remove higher ", level, column, row);
                                }
                            }
                        }
                    }
                    this.planeList = planeList;
                    this.scene = scene;
                    

                    // update grid lines on main view if the level changes
                    if (lastLv != curLv) {
                        this.updateGridLines();//对网格线进行更新
                        lastLv = curLv;
                        this.lastLv = lastLv;
                    }
                }
                
            }
            
            this.fatLineMaterial.resolution.set(window.innerWidth, window.innerHeight);
            
            this.render();//渲染第一帧
            //已经可以验证了，这里就是主循环！！！！
            
        },
        isExistFile(filespec) {
            var fso = new XMLHttpRequest();
            //console.log("print file path = ", filespec);
            fso.open('HEAD', filespec, false);
            fso.send();
            return fso.status != 404;
        },
        // add and delete images at different levels
        // 注意这里是一个递归的函数，函数内部会层层向下进行渲染
        renderImage(columnIndex, rowIndex, level) {
            let planeList = this.planeList;
            let curFetchBoundX = this.curFetchBoundX;
            let curFetchBoundY = this.curFetchBoundY;
            let COLUMNBOUND = this.COLUMNBOUND;
            let ROWBOUND = this.ROWBOUND;
            let HIGHESTLV = this.HIGHESTLV;
            let LOWESTLV = this.LOWESTLV;
            let camera = toRaw(this.camera);
            let scene = this.scene;
            
            
            //return new Promise(function(resolve, reject) {
                
            //这里为什么要return一个promise类型的对象？没有看明白
            

                // console.log("check ", level, columnIndex, rowIndex);
                
                var virtualPositionX = 256 * ((columnIndex + 0.5) * (1 << (HIGHESTLV - level)) - COLUMNBOUND[0] * (1 << (HIGHESTLV - LOWESTLV))),
                    virtualPositionY = 256 * (ROWBOUND[0] * (1 << (HIGHESTLV - LOWESTLV)) - (rowIndex + 0.5) * (1 << (HIGHESTLV - level))),
                    virtualSize = 256 * (1 << (HIGHESTLV - level));//当前等级每个瓦片对应大图中像素的长宽范围（因为是正方形瓦片，故长宽一致，用size来表示）
                //计算当前“瓦片中心位置”的坐标， 但是注意这并非是实际像素点坐标， 注意其用的是 256 作为相乘系数， 256是基本的瓦片分辨率
                //乘以 level 与 HIGHESTLV 的差值后才是
                //并且注意这里最后减去的那部分， 说明其起始位点被重新定义了， 其起始坐标位置是 Lv7 对应框选中的 105行的47~48列，以该位置作为起点进行坐标点的定位
                var virtualBoundX = [virtualPositionX - virtualSize / 2, virtualPositionX + virtualSize / 2],
                    virtualBoundY = [virtualPositionY + virtualSize / 2, virtualPositionY - virtualSize / 2];
                // 当前瓦片的 Range 定义
                // console.log(level, columnIndex, rowIndex, virtualPositionX, virtualPositionY, virtualBoundX, virtualBoundY);
                // console.log(level, virtualBoundX, curFetchBoundX, virtualBoundY, curFetchBoundY);
                
                //console.log("virtualBoundX[0] = ", virtualBoundX[0]);
                // file is not out of bound
                // 我怀疑这里的判断有问题， curFetchBoundX计算的是实际像素位置坐标， 相对的是原点， 没有坐标映射相对偏移； 而virtualPositionX显然加入了相对位置偏移
                // 但是按照自己的方式修改又发生了错误？！
                // 确实有错误， 经过查验， curFetchBoundX等计算的也是相对位置坐标！
                // console.log(level,"V0 = ", virtualBoundY[0], "C0 = ", curFetchBoundY[0]);
                // console.log(level,"V1 = ", virtualBoundY[1], "C1 = ", curFetchBoundY[1]);
                if (virtualBoundX[0] < curFetchBoundX[1] && virtualBoundX[1] > curFetchBoundX[0] && virtualBoundY[0] > curFetchBoundY[1] && virtualBoundY[1] < curFetchBoundY[0]) {
                    var tmpFilePath = this.generateFilePath(level, columnIndex, rowIndex);//根据下钻深度以及横纵坐标生成文件路径
                    //console.log(tmpFilePath);
                    if ((planeList[level][columnIndex] != null && planeList[level][columnIndex][rowIndex] != null && planeList[level][columnIndex][rowIndex].exist == true) || this.isExistFile(tmpFilePath)) {
                    //如果文件存在 或 当前索引对应的瓦片存在
                        if (planeList[level][columnIndex] == null || planeList[level][columnIndex][rowIndex] == null || planeList[level][columnIndex][rowIndex].plane == null) { // file not cached in planeList
                        //如果文件确实存在但没有被加载到内存中（没有为其创建图元）    （这条语句里面说明的是， 上面那个语句的最后一个条件满足，前几个至少有一个不满足）
                            if (planeList[level][columnIndex] == null)//如果图像序列不存在（说明当时没有访问到过这个文件夹）
                                planeList[level][columnIndex] = new Array();//则为其创建一个数组用于之后储存图像单元

                            var textureLoader = new THREE.TextureLoader();
                            var tmpTexture = new THREE.MeshLambertMaterial({
                                map: textureLoader.load(tmpFilePath)//将当前的图像瓦片作为表面纹理进行加载
                            });//使用图片代表瓦片的纹理
                            var tmpPlane = new THREE.Mesh(new THREE.PlaneGeometry(virtualSize, virtualSize), tmpTexture);//为其 创建一个mesh并使用刚刚的瓦片纹理
                            tmpPlane.renderOrder = level;
                            tmpPlane.material.depthTest = false;
                            tmpPlane.position.x = virtualPositionX;
                            tmpPlane.position.y = virtualPositionY;
                            // console.log("add ", level, columnIndex, rowIndex);
                            planeList[level][columnIndex][rowIndex] = {plane: tmpPlane, isRendered: false, exist: true, outOfBound: false};//并导入planeList列表
                        }

                        planeList[level][columnIndex][rowIndex].outOfBound = false;
                        //如果之前已经添加过了这个图元， 并且已经被导入到了内存中（之前可能超出了显示范围，但现在在显示范围中）
                        //那么我们只需要将其outOfBound属性设置为 false 即可

                        // check whether next-level images are needed
                        var displayRadius = camera.position.z * Math.tan(Math.PI / 6);
                        var windowSize = Math.min(window.innerHeight, window.innerWidth);
                        var needRendered = true;//注意， 这里的 needRendered 指的是当前的瓦片需要被渲染 
                        //这里先判断是否需要继续向下递归地进行渲染（或者至少为planeList添加元素）
                        if (displayRadius * 2 / (1 << (HIGHESTLV - level)) < windowSize && level < HIGHESTLV) {
                            //继续向下渲染的条件是？？能想得明白但是你要如何用简单的语言来描述？
                            // render next-level images progressively
                            // 递归的向下进行渲染， 每个tile将被均等地分成四份， 向下渲染
                            this.renderImage(columnIndex * 2, rowIndex * 2, level + 1);
                            this.renderImage(columnIndex * 2 + 1, rowIndex * 2, level + 1);
                            this.renderImage(columnIndex * 2, rowIndex * 2 + 1, level + 1);
                            this.renderImage(columnIndex * 2 + 1, rowIndex * 2 + 1, level + 1);
                            if (planeList[level + 1][columnIndex * 2] != null &&
                                planeList[level + 1][columnIndex * 2 + 1] != null &&
                                planeList[level + 1][columnIndex * 2][rowIndex * 2] != null &&
                                planeList[level + 1][columnIndex * 2 + 1][rowIndex * 2] != null &&
                                planeList[level + 1][columnIndex * 2][rowIndex * 2 + 1] != null &&
                                planeList[level + 1][columnIndex * 2 + 1][rowIndex * 2 + 1] != null &&//如果下钻一层的四个瓦片已经被访问渲染了
                                (planeList[level + 1][columnIndex * 2][rowIndex * 2].isRendered || planeList[level + 1][columnIndex * 2][rowIndex * 2].outOfBound == true) &&
                                (planeList[level + 1][columnIndex * 2 + 1][rowIndex * 2].isRendered || planeList[level + 1][columnIndex * 2 + 1][rowIndex * 2].outOfBound == true) &&
                                (planeList[level + 1][columnIndex * 2][rowIndex * 2 + 1].isRendered || planeList[level + 1][columnIndex * 2][rowIndex * 2 + 1].outOfBound == true) &&
                                (planeList[level + 1][columnIndex * 2 + 1][rowIndex * 2 + 1].isRendered || planeList[level + 1][columnIndex * 2 + 1][rowIndex * 2 + 1].outOfBound == true)) 
                            {//这里的策略是：如果我们之前没有下钻到过这里， 或者之前下钻到过但当前区域超出了屏幕范围（下属四个瓦片全部超出了范围）或？？？？？并且在下一个循环才进行渲染
                                needRendered = false;//意思就是， 向下一层需要渲染， 那么我们就不渲染当前这层（注意你这里是递归结束后，如果再渲染这层将会使得之前的细节层被覆盖！）
                                if (planeList[level][columnIndex][rowIndex].isRendered) {//并且如果当前层已经被渲染过了，你还需要把它移除
                                    planeList[level][columnIndex][rowIndex].isRendered = false;
                                    scene.remove(planeList[level][columnIndex][rowIndex].plane);
                                    // console.log("remove ", level, columnIndex, rowIndex);
                                }
                            }
                            if (needRendered) {//到这里说明 完全没有被渲染过， 并且在域内（没有 out of bound），那么在这里进行绘制
                                //并且下层的瓦片不需要被渲染或者说不需要访问下钻一层的瓦片（因为如果需要访问下钻层， 则此层面的needRendered必为false）
                                planeList[level][columnIndex][rowIndex].isRendered = true;
                                scene.add(planeList[level][columnIndex][rowIndex].plane);//终于，在这里，我们为场景中加入了这个瓦片
                                // console.log("add ", level, columnIndex, rowIndex);
                            }
                        }
                    }
                    else {//文件不存在 或者 没有索引到过当前瓦片
                        if (planeList[level][columnIndex] == null)//如果没有创建则创建
                            planeList[level][columnIndex] = new Array();
                        planeList[level][columnIndex][rowIndex] = {isRendered: false, exist: false};//告知当前文件是不存在的
                    }
                }



                //以下部分表示当前要被渲染的瓦片已经超出了屏幕框选的范围
                else {
                    if (planeList[level][columnIndex] == null)
                        planeList[level][columnIndex] = new Array();//同样为其创建数组
                    if (planeList[level][columnIndex][rowIndex] == null) 
                    {
                        planeList[level][columnIndex][rowIndex] = {isRendered: false, outOfBound: true};
                    }//如果这个瓦片部分还没有被建立， 那么我们建立这个区域的瓦片， 并且将isRendered置为false， 将outOfBound置为true
                    else {
                        planeList[level][columnIndex][rowIndex].outOfBound = true;
                    }//如果已经存在，那么直接将outOfBound置为true就可以了
                    // console.log("out of bound ", level, columnIndex, rowIndex)
                }
                //console.log(planeList);
            //});

            this.planeList = planeList;
            this.scene = scene;
        },
        //更新当前访问的层级，确定 CurrentLevel 的值
        updateCurLv() {
            let camera = toRaw(this.camera);
            let curLv = this.curLv;
            let HIGHESTLV = this.HIGHESTLV;
            let LOWESTLV = this.LOWESTLV;

            var displayRadius = camera.position.z * Math.tan(Math.PI / 6);
            //这里作者是想用圆锥投影的方式表达一个特定的显式范围
            /*
                相机悬浮在图像顶端，视角为以上选定的六分之一pi，向下投射一个圆锥，为当前的
            “可观测范围”，通过检查可观测范围与当前窗口设定的大小，决定是否向上或者向下访问
            一个层级。
            */
            var windowSize = Math.min(window.innerHeight, window.innerWidth);
            while (displayRadius * 2 / (1 << (HIGHESTLV - curLv)) < windowSize && curLv < HIGHESTLV) {
                ++curLv;
            }
            while (displayRadius * 1 / (1 << (HIGHESTLV - curLv)) > windowSize && curLv > LOWESTLV) {
                --curLv;
            }
            this.curLv = curLv;

            return;
        },
        //以下这部分函数是用来画缩略图地图的， 即左上角的小地图
        updateMinimapRectangle() {
            let camera = toRaw(this.camera);
            let curPositionRetPlane = toRaw(this.curPositionRetPlane);
            let curPositionEdgeLine = toRaw(this.curPositionEdgeLine);
            let curCameraBoundX = this.curCameraBoundX;
            let curCameraBoundY = this.curCameraBoundY;

            curPositionRetPlane.scale.set(curCameraBoundX[1] - curCameraBoundX[0], curCameraBoundY[0] - curCameraBoundY[1], 1);
            curPositionRetPlane.position.x = camera.position.x;
            curPositionRetPlane.position.y = camera.position.y;
            curPositionEdgeLine.scale.set(curCameraBoundX[1] - curCameraBoundX[0], curCameraBoundY[0] - curCameraBoundY[1], 1);
            curPositionEdgeLine.position.x = camera.position.x;
            curPositionEdgeLine.position.y = camera.position.y;
            this.curPositionRetPlane = curPositionRetPlane;
            this.curPositionEdgeLine = curPositionEdgeLine;
        },
        updateGridLines() {
            let scene = this.scene;
            let gridLineGroup = this.gridLineGroup;
            let curLv = this.curLv;
            let HIGHESTLV = this.HIGHESTLV;            

            const X_tile_Num = 1;
            const Y_tile_Num = 2;


            while (gridLineGroup.children.length > 0) {
                var obj = gridLineGroup.children.pop();
                obj.geometry.dispose();
                obj.material.dispose();
                obj = undefined;
            }
            scene.remove(gridLineGroup);

            var REGIONX = 1 << (HIGHESTLV + X_tile_Num);
            var REGIONY = 1 << (HIGHESTLV + Y_tile_Num)
            var STEP = 256 * (1 << (HIGHESTLV - curLv));
            //确定Region的范围以及每个格点瓦片的步长
            
            var gridlineX = new THREE.Geometry();
            gridlineX.vertices.push(new THREE.Vector3(0, 0, 0));
            gridlineX.vertices.push(new THREE.Vector3(REGIONX, 0, 0));
            for (var i = 0, len = REGIONY / STEP; i <= len; ++i) {
                var line = new THREE.Line(gridlineX, new THREE.LineBasicMaterial({
                    color: 0xcccccc
                }));
                line.renderOrder = HIGHESTLV + 1;
                line.material.depthTest = false;
                line.position.y =  -i * STEP;
                gridLineGroup.add(line);
            }
            var gridlineY = new THREE.Geometry();
            gridlineY.vertices.push(new THREE.Vector3(0, 0, 0));
            gridlineY.vertices.push(new THREE.Vector3(0, -REGIONY, 0));
            for (var i = 0, len = REGIONX / STEP; i <= len; ++i) {
                var line = new THREE.Line(gridlineY, new THREE.LineBasicMaterial({
                    color: 0xcccccc
                }));
                line.renderOrder = HIGHESTLV + 1;
                line.material.depthTest = false;
                line.position.x = i * STEP;
                gridLineGroup.add(line);
            }

            scene.add(gridLineGroup);
            this.gridLineGroup = gridLineGroup;
            this.scene = scene;
        },
        //应该是画地图上标签点的函数， 这个取决于你动态交互添加的标记点， 最开始是空的
        updatePoints() {
            for (var tmpPoint of pointList) {
                tmpPoint.point.scale.set(camera.position.z / 150, camera.position.z / 150, 1);
            }
        },
        needRefresh() {
            let camera = toRaw(this.camera);
            let curLv = this.curLv;
            let HIGHESTLV = this.HIGHESTLV;
            let lastCameraPosition = this.lastCameraPosition;
            let lastTime = this.lastTime;
            let isFirstFrame = this.isFirstFrame;

            if (!isFirstFrame)
                return true;
            if (Math.abs(lastCameraPosition.x - camera.position.x) > 500 * (1 << (HIGHESTLV - curLv)) || 
                Math.abs(lastCameraPosition.y - camera.position.y) > 500 * (1 << (HIGHESTLV - curLv)) || 
                Math.abs(lastCameraPosition.z - camera.position.z) > 500 * (1 << (HIGHESTLV - curLv)))
                return true;//xyz坐标移动距离大于阈值则进行更新
            if (Date.now() - lastTime < 1000)//两次访问函数时间距离太短，不更新
                return false;
            if (lastCameraPosition.x != camera.position.x || 
                lastCameraPosition.y != camera.position.y || 
                Math.abs(lastCameraPosition.z / camera.position.z - 1) > 0.05)
                return true;//前后位置距离不符则进行更新
            return false;
        }
    },
}

</script>

<style scoped>
canvas {
    display: block;
}

#main {
    position: absolute;
}

#minimap {
    background-color: #ffffff;
    border: 3px solid #555555;
    margin: 10px;
    position: absolute;
    top: 0%;
    z-index: 100;
}

</style>