/*global THREE*/
/**
 * MACROs
 */

var GAME_HEIGHT = 640;
var GAME_WIDTH = 640;

var PLANE_SEGMENT = 25;
var LEVEL_HEIGHT = 4;

var PLANETYPE_DAMAGE = 502;
var PLANETYPE_BLOCK = 501;
var PLANETYPE_EMPTY = 500;

var debugMode = true;

/**
 * liner lerp
 * @param {number} start 
 * @param {number} end 
 * @param {number} persent - [0,1]
 */
var lerpself = (start,end,persent) => start+(end-start)*persent;//I love Lambda!
var $ = (_) => document.getElementById(_);
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
var ltarget = new THREE.Object3D();
var initLight = function(){
    scene.add(new THREE.AmbientLight(0x444444));  

    directionalLight = new THREE.DirectionalLight( 0xffffff,1,0);
    directionalLight.position.set(1,1,1);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.height = 512;
    scene.add(directionalLight);
    scene.add(ltarget);
    
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
var planeGenerator = function(start,length,type){// [0,PLANE_SEGMENT)
    var plane_g = new THREE.CylinderGeometry(
        2,//radiusTop
        2,//radiusButtom
        0.5,//height
        
        length,//PLANE_SEGMENT,//radial segments
        1,//height segments
        false,//open ended
        2*Math.PI/PLANE_SEGMENT*start,//theta start
        2*Math.PI/PLANE_SEGMENT*length//theta length
    );
    //var clr = 0x666666;
    
    var plane_m;
    switch (type){
        case PLANETYPE_BLOCK:
            plane_m = new THREE.MeshLambertMaterial({color:new THREE.Color(0x666666),side: THREE.DoubleSide});
            break;
        case PLANETYPE_DAMAGE:
            plane_m = new THREE.MeshPhongMaterial({color:new THREE.Color(0xff7635),side:THREE.DoubleSide});
            
            //clr = 0xff7a45;
            break;
        default:
            break;
    }
                                                //todo
                                                // -  build switch-case for diffrent type blocks
                                                // -  create emit object aside
                                                // -  change alpha to 0.5 or lower for seeking next-level objects
    //var plane_m = new THREE.MeshLambertMaterial({color:new THREE.Color(clr),side: THREE.DoubleSide});
    var plane = new THREE.Mesh(plane_g,plane_m);
    plane.receiveShadow = true;
    plane.rotation.y = 2*Math.PI/PLANE_SEGMENT*start;
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
var gaming = true;
 
 
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
    if(mouseDown&&gaming){
        angelar = angelar_t - (e.clientX - mouseXp)/64;
        if(angelar>Math.PI*2)
            angelar-=Math.PI*2;
        if(angelar<0)
            angelar+=Math.PI*2;
    }
});
renderer.domElement.addEventListener("mouseup",function(e){
    mouseDown = false;
});

/**
 * setting
 */
var levels = [];

var userScore = 0;

var level_Current = 0;
var ballSpeed = 0;//ingame
var ballMaxSpeed = 12;//ingame
var ballMaxFallSpeed = 20;//ingame
var ballAccurate = 30;//ingame
var ballDeepestY = 0;//ingame
var ballConstantPass = 0;
var Level = function(diff){

    //build level list                                                                      //create DAMEGE block by diff here
    var li = new Array(PLANE_SEGMENT);
    for(var fill = 0;fill<PLANE_SEGMENT;fill++){
        li [fill] = PLANETYPE_BLOCK;
    }
    for (var count = 0;count<2;count++)
        li[Math.floor(Math.random()*PLANE_SEGMENT)] = PLANETYPE_DAMAGE;
    var empty = Math.floor(Math.random()*PLANE_SEGMENT);
    var emptyL = 5;
    for(var i = empty;i<empty+emptyL;i++)
        li[i<PLANE_SEGMENT?i:i-PLANE_SEGMENT] = PLANETYPE_EMPTY;
    this.li = li;

    //build
    this.planeBuffer = [];
    var cur = 0;
    var cur_start = 0;
    var cur_end = 0;
    //var generateType = PLANETYPE_EMPTY;
    while( cur<PLANE_SEGMENT){
        if(this.li[cur]!=this.li[cur+1]){
            cur_end = cur;
            //generate
            if(this.li[cur]!= PLANETYPE_EMPTY){
                var im = this.planeBuffer.push( planeGenerator(cur_start,cur_end-cur_start+1,this.li[cur]));
                scene.add(this.planeBuffer[im-1]);
                this.planeBuffer[im-1].position.set(0,-LEVEL_HEIGHT*diff,0);
            }
            //push cur
            cur_start = cur+1;
        }
        cur++;
    }
};
var ballCollider = function(){
    var position = Math.floor(angelar/(Math.PI *2 /PLANE_SEGMENT));
    switch(levels[level_Current].li[position]){
    case PLANETYPE_BLOCK:
        ballSpeed = -ballMaxSpeed;
        ballConstantPass = 0;
        break;
    case PLANETYPE_DAMAGE:
                                                                                        //game end function
        gaming = false;
        ballSpeed = 0;
        break;
    case PLANETYPE_EMPTY:
        level_Current++;
        levelEmit();
        ballConstantPass++;
        userScore+=ballConstantPass;
        $("score").innerHTML = userScore;
        break;
    }
    
    //light follow
    directionalLight.position.set(3,-(level_Current-1)*LEVEL_HEIGHT +3,3);
    ltarget.position.set(0,-(level_Current-1)*LEVEL_HEIGHT,0);
    directionalLight.target = ltarget;
}
var levelEmit = function(){
    //remove level
    for (var passed_level = 0; passed_level<level_Current-1;passed_level++){
        //
        if(levels[passed_level]){
            for ( var passed_part in levels[passed_level].planeBuffer){
                //animate?
                scene.remove(levels[passed_level].planeBuffer[passed_part]);
            }
            delete levels[passed_level];
        }
    }

    var Forword_Num = 10;
    if(!(levels[level_Current]&&levels[level_Current+10])){
        for (var inx = 0;inx<Forword_Num;inx++){
            if(!levels[level_Current+inx]){
                //level generate
                levels[level_Current+inx] = new Level(level_Current+inx);
                // {li:new Array(PLANE_SEGMENT),
                //                             planeBuffer:new Array()};
                // var blocknum = Math.floor(Math.random()*PLANE_SEGMENT);
                // for (var i = 0;i<PLANE_SEGMENT;i++){
                //     if(i<blocknum)levels[level_Current+inx].li[i] = PLANETYPE_BLOCK;
                //     else levels[level_Current+inx].li[i] = PLANETYPE_EMPTY;
                // }
                // module generate
            }
        }
    }
}
/**
 * game updates
 */
var tgt_y=camera.position.y-3;
var ba;
var update = function(deltaTime){
    /**
     * plane rotation
     */
    //plane.rotation.y=angelar;
    for (var index in levels){
        for (var pl in levels[index].planeBuffer){
            levels[index].planeBuffer[pl].rotation.y = -angelar;
        }
    }
    /**
     * camera lerp
     */
    var cmr_y = lerpself(camera.position.y-3,ballDeepestY,0.06);
    tgt_y = lerpself(tgt_y,ballDeepestY,0.08);
    cylinder.position.set(0,cmr_y,0);
    camera.position.set(0,cmr_y+3,5);
    camera.lookAt(new THREE.Vector3(0,tgt_y,0));
    
   
    
    /**
     * ball jumping
     */
    if (playBall.position.y<0.25-level_Current*LEVEL_HEIGHT&&ballSpeed>=0){
        //collider
        ballCollider();
    }
    //fall
    ballSpeed = Math.min(ballSpeed + ballAccurate*deltaTime, ballMaxFallSpeed);
    playBall.position.y-=ballSpeed*deltaTime;
    ballDeepestY = Math.min(ballDeepestY,playBall.position.y);
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
