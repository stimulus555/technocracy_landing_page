const enterButton = document.querySelector("#enterButton");
const introScreen = document.querySelector("#introScreen");
const loader = document.querySelector("#loader");
const loaderText = document.querySelector("#loaderText");
const loaderVideo = document.querySelector("#loaderVideo");
const mainSite = document.querySelector("#mainSite");
const hero = document.querySelector(".hero");
const engineScene = document.querySelector(".engine-scene");
const engineVideo = document.querySelector("#engineVideo");
const bikeSection = document.querySelector("#aavartan");
const bikeSticky = document.querySelector(".bike-sticky");
const bikeVideo = document.querySelector("#bikeVideo");
const missionSection = document.querySelector("#mission");
const missionVideo = document.querySelector("#missionVideo");
const systemsSection = document.querySelector("#systems");
const systemsVideo = document.querySelector("#systemsVideo");
const participateSection = document.querySelector("#participate");
const participateVideo = document.querySelector("#participateVideo");
let engineExplode = 0;
let carProgress = 0;
let loadingComplete = false;

// Mechanical HUD cursor for mouse-based devices.
const customCursor = document.querySelector(".custom-cursor");
if (customCursor && window.matchMedia("(pointer:fine)").matches) {
  document.addEventListener("pointermove", (event) => {
    customCursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
    customCursor.classList.add("visible");
  });
  document.querySelectorAll("a, button").forEach((element) => {
    element.addEventListener("pointerenter", () => customCursor.classList.add("hover"));
    element.addEventListener("pointerleave", () => customCursor.classList.remove("hover"));
  });
}

// The loading animation plays to the end before the main experience appears.
enterButton.addEventListener("click", () => {
  loader.classList.add("active");
  enterButton.disabled = true;
  loadingComplete = false;
  loaderVideo.currentTime = 0;
  loaderVideo.play().catch(runLoadingFallback);
});

loaderVideo.addEventListener("timeupdate", () => {
  if (Number.isFinite(loaderVideo.duration) && loaderVideo.duration > 0) {
    loaderText.textContent = `INITIALISING ${Math.round(loaderVideo.currentTime / loaderVideo.duration * 100)}%`;
  }
});
loaderVideo.addEventListener("ended", () => { loaderText.textContent = "INITIALISING 100%"; completeLoading(); });

function runLoadingFallback() {
  const started = performance.now();
  function tick(now) {
    const progress = Math.min((now - started) / 2500, 1);
    loaderText.textContent = `INITIALISING ${Math.round(progress * 100)}%`;
    if (progress < 1) requestAnimationFrame(tick); else completeLoading();
  }
  requestAnimationFrame(tick);
}

function completeLoading() {
  if (loadingComplete) return;
  loadingComplete = true;
  setTimeout(() => {
    introScreen.style.transition = "opacity 700ms ease";
    introScreen.style.opacity = "0";
    setTimeout(() => { introScreen.remove(); mainSite.hidden = false; resizeEngine(); resizeCar(); updateScrollMotion(); }, 700);
  }, 220);
}

// Scroll position drives the code-built engine and kinetic assembly apart.
function updateScrollMotion() {
  const heroProgress = Math.min(Math.max(window.scrollY / (hero.offsetHeight * .9), 0), 1);
  engineScene.style.setProperty("--hero-progress", heroProgress.toFixed(3));
  engineExplode = heroProgress;
  const travel = bikeSection.offsetHeight - window.innerHeight;
  const bikeProgress = Math.min(Math.max((window.scrollY - bikeSection.offsetTop) / travel, 0), 1);
  carProgress = bikeProgress;

  if (Number.isFinite(missionVideo.duration)) {
    // Begin the video as soon as this section enters the viewport, not only once it reaches the top.
    const missionTravel = Math.max(window.innerHeight + missionSection.offsetHeight, 1);
    const missionProgress = Math.min(Math.max((window.scrollY + window.innerHeight - missionSection.offsetTop) / missionTravel, 0), 1);
    const targetTime = missionProgress * Math.max(missionVideo.duration - .04, 0);
    if (Math.abs(missionVideo.currentTime - targetTime) > .02) missionVideo.currentTime = targetTime;
  }
}

window.addEventListener("scroll", updateScrollMotion, { passive:true });
window.addEventListener("resize", updateScrollMotion);
missionVideo.addEventListener("loadedmetadata", () => { missionVideo.pause(); missionVideo.currentTime = .01; updateScrollMotion(); });

// ---------- Real WebGL mechanical engine ----------
// The model is assembled from actual 3D geometry and lit like a machined metal object.
const engineCanvas = document.querySelector("#engineCanvas");
let engineRenderer, engineCamera, crankshaft, flywheel;
const explodeParts = [];

function addExplodable(object, direction) {
  object.userData.home = object.position.clone();
  object.userData.direction = direction;
  explodeParts.push(object);
}

function buildEngine() {
  if (!window.THREE || !engineCanvas) return;
  const scene = new THREE.Scene();
  engineCamera = new THREE.PerspectiveCamera(35, 1, .1, 100);
  engineCamera.position.set(9, 6.5, 12);
  engineCamera.lookAt(0, 0, 0);
  engineRenderer = new THREE.WebGLRenderer({ canvas: engineCanvas, antialias: true, alpha: true });
  engineRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  engineRenderer.shadowMap.enabled = true;

  scene.add(new THREE.HemisphereLight(0xdfeee8, 0x081416, 2.4));
  const key = new THREE.DirectionalLight(0xfff2c4, 4.2); key.position.set(5, 8, 6); key.castShadow = true; scene.add(key);
  const rim = new THREE.DirectionalLight(0x62cfdf, 2.6); rim.position.set(-7, 2, -5); scene.add(rim);

  const steel = new THREE.MeshStandardMaterial({ color: 0x5e7a7b, metalness: .88, roughness: .24 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xc3d0c8, metalness: .92, roughness: .17 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x183236, metalness: .8, roughness: .32 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xcfa835, metalness: .72, roughness: .25 });
  const engine = new THREE.Group(); engine.rotation.set(-.25, -.65, .08); scene.add(engine);
  const box = (x,y,z,mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x,y,z,2,2,2),mat); m.castShadow=m.receiveShadow=true; return m; };
  const cylinder = (r,h,mat,segments=32) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),mat); m.castShadow=m.receiveShadow=true; return m; };

  // Crankcase and cooling ribs
  const block = box(6.8, 2.7, 3.2, dark); block.position.y = -.4; engine.add(block);
  for (let x=-2.5; x<=2.5; x+=1.67) { const rib=box(.16,3.0,3.45,steel); rib.position.set(x,-.4,0); engine.add(rib); }

  // Two angled cylinder banks give the object a recognisable V-engine silhouette.
  for (const side of [-1,1]) {
    const bank = new THREE.Group(); bank.position.set(0,1.25,side*.62); bank.rotation.z=side*.34; engine.add(bank); addExplodable(bank,new THREE.Vector3(0,side*1.35,side*1.15));
    const head=box(6.45,.62,1.18,steel); head.position.set(0,.08,side*.26); bank.add(head);
    const cover=box(6.18,.3,1.16,silver); cover.position.set(0,.7,side*.31); bank.add(cover);
    for(let x=-2.28;x<=2.28;x+=1.52){
      const bore=cylinder(.58,1.28,dark); bore.rotation.x=Math.PI/2; bore.position.set(x,-.42,0); bank.add(bore);
      const piston=cylinder(.49,.52,silver); piston.rotation.x=Math.PI/2; piston.position.set(x,-.52,0); bank.add(piston);
      const rod=cylinder(.11,1.02,steel); rod.rotation.x=Math.PI/2; rod.position.set(x,-1.2,0); bank.add(rod);
      for(const z of [-.38,.38]){ const bolt=cylinder(.085,.16,brass,12); bolt.rotation.x=Math.PI/2; bolt.position.set(x,.95,z); bank.add(bolt); }
    }
  }

  // Crankshaft, journal weights, flywheel, and intake plenum.
  crankshaft=new THREE.Group(); crankshaft.position.y=-1.65; engine.add(crankshaft); addExplodable(crankshaft,new THREE.Vector3(0,-1.15,.52));
  const shaft=cylinder(.25,7.5,silver); shaft.rotation.z=Math.PI/2; crankshaft.add(shaft);
  for(let x=-2.5;x<=2.5;x+=1.67){ const journal=cylinder(.46,.38,steel);journal.rotation.z=Math.PI/2;journal.position.x=x;crankshaft.add(journal); const weight=cylinder(.7,.17,dark);weight.rotation.z=Math.PI/2;weight.position.set(x,x%3?.46:-.46,0);crankshaft.add(weight); }
  flywheel=new THREE.Group(); flywheel.position.set(3.85,-.65,0); engine.add(flywheel); addExplodable(flywheel,new THREE.Vector3(2.2,.15,.75));
  const wheel=cylinder(1.55,.38,steel,48);wheel.rotation.z=Math.PI/2;flywheel.add(wheel);const inset=cylinder(.62,.42,dark);inset.rotation.z=Math.PI/2;flywheel.add(inset);
  for(let a=0;a<9;a++){ const tooth=box(.27,.14,.19,silver);tooth.position.set(0,1.55*Math.cos(a*Math.PI*2/9),1.55*Math.sin(a*Math.PI*2/9));flywheel.add(tooth); }
  const intake=new THREE.Group(); intake.position.set(0,2.1,1.8); engine.add(intake); addExplodable(intake,new THREE.Vector3(0,1.8,2.5));
  for(let x=-2.28;x<=2.28;x+=1.52){const pipe=cylinder(.22,1.85,steel);pipe.rotation.x=Math.PI/2;pipe.position.set(x,0,-.6);intake.add(pipe);} const plenum=box(6.55,.65,.82,steel);plenum.position.set(0,.08,-1.02);intake.add(plenum);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(7,64),new THREE.MeshStandardMaterial({color:0x173438,metalness:.45,roughness:.7,transparent:true,opacity:.45})); floor.rotation.x=-Math.PI/2; floor.position.y=-3.1; scene.add(floor);
  resizeEngine();

  function animate() {
    explodeParts.forEach(p => p.position.lerpVectors(p.userData.home, p.userData.home.clone().add(p.userData.direction), engineExplode));
    crankshaft.rotation.x += .017 * (1-engineExplode*.45); flywheel.rotation.x += .011;
    engine.rotation.y = -.65 + Math.sin(performance.now()*.00025)*.09;
    engineRenderer.render(scene, engineCamera); requestAnimationFrame(animate);
  }
  animate();
}

function resizeEngine() {
  if (!engineRenderer || !engineCamera) return;
  const rect = engineCanvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  engineRenderer.setSize(rect.width, rect.height, false);
  engineCamera.aspect = rect.width / rect.height;
  engineCamera.updateProjectionMatrix();
}

window.addEventListener("resize", resizeEngine);
buildEngine();

// ---------- Real WebGL sports car for the Aavartan page ----------
const carCanvas = document.querySelector("#carCanvas");
let carRenderer, carCamera, carGroup, carWheels = [];

function buildCar() {
  if (!window.THREE || !carCanvas) return;
  const scene = new THREE.Scene();
  carCamera = new THREE.PerspectiveCamera(36, 1, .1, 100);
  carCamera.position.set(8, 4.8, 9); carCamera.lookAt(0, .3, 0);
  carRenderer = new THREE.WebGLRenderer({ canvas: carCanvas, antialias:true, alpha:true });
  carRenderer.setPixelRatio(Math.min(devicePixelRatio, 2)); carRenderer.shadowMap.enabled = true;
  scene.add(new THREE.HemisphereLight(0xd5f4ff, 0x071417, 2.8));
  const key = new THREE.DirectionalLight(0xffe8a3, 4.5); key.position.set(6,8,5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x62d0df, 3); rim.position.set(-6,3,-5); scene.add(rim);

  const paint = new THREE.MeshStandardMaterial({ color:0xd19c26, metalness:.82, roughness:.19 });
  const paintDark = new THREE.MeshStandardMaterial({ color:0x6f4d10, metalness:.8, roughness:.23 });
  const glass = new THREE.MeshStandardMaterial({ color:0x0a2830, metalness:.75, roughness:.1, transparent:true, opacity:.78 });
  const tire = new THREE.MeshStandardMaterial({ color:0x06090a, roughness:.68 });
  const rimMat = new THREE.MeshStandardMaterial({ color:0xc1d1ca, metalness:.95, roughness:.15 });
  const lightMat = new THREE.MeshStandardMaterial({ color:0xe9faff, emissive:0x92e8ff, emissiveIntensity:1.2, metalness:.4, roughness:.18 });
  carGroup = new THREE.Group(); carGroup.rotation.set(-.12,-.54,.04); scene.add(carGroup);
  const box = (w,h,d,mat) => { const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d,3,2,3),mat);m.castShadow=m.receiveShadow=true;return m; };

  // Low, layered chassis with a cabin, glass, lights, bumpers, and four 3D wheels.
  const lower = box(6.5,.82,2.85,paintDark); lower.position.y=-.45; carGroup.add(lower);
  const body = box(6.15,.66,2.64,paint); body.position.y=.05; carGroup.add(body);
  const hood = box(2.05,.34,2.52,paint); hood.position.set(2.03,.52,0); carGroup.add(hood);
  const trunk = box(1.23,.3,2.48,paint); trunk.position.set(-2.42,.46,0); carGroup.add(trunk);
  const cabin = box(2.62,.92,2.27,glass); cabin.position.set(-.38,1.03,0); cabin.rotation.z=-.04; carGroup.add(cabin);
  const roof = box(2.44,.12,2.34,paint); roof.position.set(-.4,1.57,0); carGroup.add(roof);
  const frontBumper=box(.28,.32,2.56,paintDark);frontBumper.position.set(3.33,-.16,0);carGroup.add(frontBumper);
  for(const side of [-1,1]){
    const lamp=box(.23,.2,.52,lightMat);lamp.position.set(3.2,.28,side* .83);carGroup.add(lamp);
    const mirror=box(.33,.15,.2,paint);mirror.position.set(.35,.9,side*1.42);carGroup.add(mirror);
  }
  for(const x of [-2.05,2.05]) for(const z of [-1.45,1.45]){
    const wheelGroup=new THREE.Group(); wheelGroup.position.set(x,-.57,z);carGroup.add(wheelGroup);carWheels.push(wheelGroup);
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.72,.72,.42,32),tire);wheel.rotation.x=Math.PI/2;wheelGroup.add(wheel);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.39,.39,.44,20),rimMat);hub.rotation.x=Math.PI/2;wheelGroup.add(hub);
    for(let a=0;a<5;a++){const spoke=box(.09,.48,.08,rimMat);spoke.position.set(.25*Math.cos(a*1.256),.25*Math.sin(a*1.256),0);spoke.rotation.z=a*1.256;wheelGroup.add(spoke);}
  }
  const ground=new THREE.Mesh(new THREE.CircleGeometry(6.5,64),new THREE.MeshStandardMaterial({color:0x173538,roughness:.72,metalness:.32,transparent:true,opacity:.48}));ground.rotation.x=-Math.PI/2;ground.position.y=-1.32;scene.add(ground);
  resizeCar();
  function renderCar(){
    const movement=(carProgress-.5)*1.25; carGroup.position.x=movement;
    carGroup.rotation.y=-.54+carProgress*.32+Math.sin(performance.now()*.0004)*.035;
    carWheels.forEach(w=>w.rotation.z-=.025+carProgress*.06);
    carRenderer.render(scene,carCamera); requestAnimationFrame(renderCar);
  }
  renderCar();
}

function resizeCar(){
  if(!carRenderer || !carCamera) return;
  const rect=carCanvas.getBoundingClientRect(); if(!rect.width || !rect.height) return;
  carRenderer.setSize(rect.width,rect.height,false);carCamera.aspect=rect.width/rect.height;carCamera.updateProjectionMatrix();
}
window.addEventListener("resize",resizeCar);
buildCar();
