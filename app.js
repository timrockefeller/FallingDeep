/**
 * MACROs
 */

var GAME_HEIGHT = 640;
var GAME_WIDTH = 640;

var PLANE_SEGMENT = 25;

var PLANETYPE_BLOCK = 501;
var PLANETYPE_EMPTY = 500;

var debugMode = true;
/**
 * initialize
 */

var renderer = new THREE.WebGLRenderer();
renderer.setSize(GAME_WIDTH, GAME_HEIGHT);
renderer.shadowMap.enabled=true;
renderer.setClearColor(0xAAAAAA, 1.0);
document.body.appendChild(renderer.domElement);

var clock = new THREE.Clock();

var camera = new THREE.PerspectiveCamera(75, GAME_WIDTH/GAME_HEIGHT, 0.1, 1000);
camera.position.x = 0;
camera.position.y = 3;
camera.position.z = 5;
camera.lookAt(new THREE.Vector3(0, 0, 0));
/**
 * objects perfab
 */
var scene = new THREE.Scene();

//light
var directionalLight;
var initLight = function(){
    scene.add(new THREE.AmbientLight(0x444444));  

    directionalLight = new THREE.DirectionalLight( 0xffffff,1,0);
    directionalLight.position.set(1,1,1);
    directionalLight.castShadow = true;
    
    scene.add(directionalLight);
    
    
    if(debugMode) {
        var helper = new THREE.CameraHelper(directionalLight.shadow.camera );
        scene.add(helper);
    }

    
};

//Cylinder
var cylinder;
var initCylinder = function(){
    var geometry = new THREE.CylinderGeometry( 0.5, 0.5, 20, 32 );
    var material = new THREE.MeshLambertMaterial( {color: 0xffffff} );
    cylinder = new THREE.Mesh( geometry, material );
    cylinder.position.set(0,0,0);
    scene.add( cylinder );
};

//red base line
var debug_initBaseLine = function(){
    var helper = new THREE.AxesHelper(10);  
    scene.add(helper);  
};

//game Objects
var planeGenerator = function(start,end){// [0,PLANE_SEGMENT)
    
    var plane_g = new THREE.CylinderGeometry(2,2,0.5,PLANE_SEGMENT,1,false,2*Math.PI/PLANE_SEGMENT*start,2*Math.PI/PLANE_SEGMENT*end);
    var plane_m = new THREE.MeshLambertMaterial({color:new THREE.Color(0x666666),side: THREE.DoubleSide});
    var plane = new THREE.Mesh(plane_g,plane_m);
    plane.receiveShadow = true;
    return plane;
};


var playBall;
var initPlayBall = function(){
    var playBall_g = new THREE.SphereGeometry(0.3, 32, 32);
    var playBall_m = new THREE.MeshLambertMaterial({color:0xffff00});
    playBall = new THREE.Mesh(playBall_g,playBall_m);
    playBall.position.set(0,2,1.5);
    scene.add(playBall);
    playBall.castShadow = true;
};

/**
 * world control
 */
var angelar = 0;
var angelar_t = 0;
var mouseXp = 0;
var mouseDown = false;
renderer.domElement.addEventListener("mousedown",function(e){
    mouseXp = e.clientX;
    mouseDown = true;
    angelar_t = angelar;//optimize the angel in [0,2PI)
});
renderer.domElement.addEventListener("mousemove",function(e){
    if(mouseDown){
        angelar = angelar_t + (e.clientX - mouseXp)/64;
    }
});
renderer.domElement.addEventListener("mouseup",function(e){
    mouseDown = false;
});

/**
 * setting
 */
var levels = [];
var planeBuffer = [];

var level_Current = 0;
var level_Passed = -1;
var ballSpeed = 0;//ingame
var ballMaxSpeed = 10;//ingame
var ballAccurate = 20;//ingame

var planeManager = {

};
var ballCollider = function(){
    var position =angelar/(Math.PI *2 /PLANE_SEGMENT);
    
    if(levels[level_Current].li[position] == PLANETYPE_BLOCK){
        ballSpeed = -ballMaxSpeed;
    }else{
        level_Current++;
        levelEmit();
    }
}
var levelEmit = function(){
    var Forword_Num = 10;
    if(!(levels[level_Current]&&levels[level_Current+10])){
        for (var inx = 0;inx<Forword_Num;inx++){
            if(!levels[level_Current+inx]){
                //level generate
                levels[level_Current+inx] = {li:new Array(PLANE_SEGMENT),
                                             planeBuffer:new Array()};
                var blocknum = Math.floor(Math.random()*PLANE_SEGMENT);
                for (var i = 0;i<PLANE_SEGMENT;i++){
                    if(i<blocknum)levels[level_Current+inx].li[i] = PLANETYPE_BLOCK;
                    else levels[level_Current+inx].li[i] = PLANETYPE_EMPTY;
                }
                var cur = 0;
                var cur_start = 0;
                var cur_end = 0;
                var generateType = PLANETYPE_EMPTY;
                while( cur<PLANE_SEGMENT){
                    if(levels[level_Current+inx].li[cur]!=levels[level_Current+inx].li[cur+1]){
                        cur_end = cur;
                        //generate
                        switch(levels[level_Current+inx].li[cur]){
                            case PLANETYPE_BLOCK:
                                var im = levels[level_Current+inx].planeBuffer.push( planeGenerator(cur_start,cur_end));
                                scene.add(levels[level_Current+inx].planeBuffer[im]);
                        }
                        //push cur
                        cur_start = cur+1;
                    }
                    cur++;
                }
            }
        }
    }
}
/**
 * game updates
 */
var update = function(deltaTime){
    /**
     * plane rotation
     */
    //plane.rotation.y=angelar;
    for (var index in levels){
        for (var pl in levels[index].planeBuffer){
            levels[index].planeBuffer[pl].rotation.y = angelar;
        }
    }
    /**
     * ball jumping
     */
    if (playBall.position.y<0.25&&ballSpeed>=0){
        //collider
        ballCollider();
        
    }
    //fall
    ballSpeed = Math.min(ballSpeed + ballAccurate*deltaTime, ballMaxSpeed);
    playBall.position.y-=ballSpeed*deltaTime;
};
var render = function() {
    requestAnimationFrame(render);
    clock.stop();
    update(clock.getElapsedTime());
    clock.start();
    renderer.render(scene, camera);
};
var init = function () {
    initLight();
    initCylinder();
    levelEmit();
    initPlayBall();
    if(debugMode){
        debug_initBaseLine();
    }
    render();
};

/**
 * logic
 */
init();
