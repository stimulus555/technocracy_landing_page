import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.181.0/build/three.module.js";

const enterButton = document.querySelector("#enterButton");
const introScreen = document.querySelector("#introScreen");
const loader = document.querySelector("#loader");
const loaderText = document.querySelector("#loaderText");
const mainSite = document.querySelector("#mainSite");

enterButton.addEventListener("click", () => {
  loader.classList.add("active"); enterButton.disabled = true;
  let progress = 0;
  const timer = setInterval(() => {
    progress = Math.min(progress + Math.ceil(Math.random() * 11), 100);
    loaderText.textContent = `CALIBRATING ${progress}%`;
    if (progress === 100) { clearInterval(timer); setTimeout(() => {
      introScreen.style.transition = "opacity 700ms ease"; introScreen.style.opacity = "0";
      setTimeout(() => { introScreen.remove(); mainSite.hidden = false; resize(); }, 700);
    }, 250); }
  }, 105);
});

// ---------- A real WebGL V4 engine: meshes, materials, lights, and camera ----------
const canvas = document.querySelector("#engineCanvas");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100); camera.position.set(8, 6, 11); camera.lookAt(0, 0, 0);
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
scene.add(new THREE.HemisphereLight(0xddefff, 0x11191c, 2.6));
const keyLight = new THREE.DirectionalLight(0xfff3c4, 5); keyLight.position.set(5, 9, 6); keyLight.castShadow = true; scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x58d3e6, 3); rimLight.position.set(-7, 3, -6); scene.add(rimLight);

const steel = new THREE.MeshStandardMaterial({ color:0x536d70, metalness:.83, roughness:.28 });
const darkSteel = new THREE.MeshStandardMaterial({ color:0x1a3033, metalness:.9, roughness:.3 });
const silver = new THREE.MeshStandardMaterial({ color:0xc1cbc4, metalness:.92, roughness:.18 });
const rubber = new THREE.MeshStandardMaterial({ color:0x0c1112, metalness:.18, roughness:.6 });
const brass = new THREE.MeshStandardMaterial({ color:0xd5a631, metalness:.7, roughness:.25 });
const explodedParts = [];
const engine = new THREE.Group(); engine.rotation.set(-.23, -.65, .08); scene.add(engine);
function box(w,h,d,mat) { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d,2,2,2),mat); m.castShadow=m.receiveShadow=true; return m; }
function cyl(r1,r2,h,mat,segments=32) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),mat); m.castShadow=m.receiveShadow=true; return m; }
function register(object, target) { object.userData.home = object.position.clone(); object.userData.target = target; explodedParts.push(object); }

// Crankcase and structural ribs
const block = box(6.8, 2.8, 3.4, darkSteel); block.position.y=-.35; engine.add(block);
for (let x=-2.55; x<=2.55; x+=1.7) { const rib=box(.16,3.05,3.65,steel); rib.position.set(x,-.35,0); engine.add(rib); }

// V4 cylinder banks with bores, pistons, rods, heads, valve covers, and bolts
for (const side of [-1,1]) {
  const bank = new THREE.Group(); bank.rotation.z=side*.34; bank.position.set(0,1.55,side*.55); engine.add(bank); register(bank, new THREE.Vector3(0, side*1.2, side*1.05));
  const head = box(6.55,.65,1.2,steel); head.position.set(0,.18,side*.28); bank.add(head);
  const cover = box(6.25,.32,1.18,silver); cover.position.set(0,.78,side*.35); bank.add(cover);
  for (let x=-2.3; x<=2.3; x+=1.52) {
    const bore = cyl(.61,.61,1.35,rubber); bore.rotation.x=Math.PI/2; bore.position.set(x,-.42,0); bank.add(bore);
    const piston = cyl(.52,.52,.56,silver); piston.rotation.x=Math.PI/2; piston.position.set(x,-.55,0); bank.add(piston);
    const rod = cyl(.12,.12,1.08,steel); rod.rotation.x=Math.PI/2; rod.position.set(x,-1.28,0); bank.add(rod);
    for (const z of [-.4,.4]) { const bolt=cyl(.09,.09,.18,brass,12); bolt.rotation.x=Math.PI/2; bolt.position.set(x,.98,z); bank.add(bolt); }
  }
}

// Crankshaft, journals, counterweights, and flywheel
const crank = new THREE.Group(); crank.position.y=-1.72; engine.add(crank); register(crank,new THREE.Vector3(0,-1.05,.4));
const crankMain=cyl(.26,.26,7.6,silver); crankMain.rotation.z=Math.PI/2; crank.add(crankMain);
for (let x=-2.55; x<=2.55; x+=1.7) { const journal=cyl(.48,.48,.42,steel); journal.rotation.z=Math.PI/2; journal.position.x=x; crank.add(journal); const weight=cyl(.72,.72,.18,darkSteel); weight.rotation.z=Math.PI/2; weight.position.set(x, x%3 ? .48 : -.48,0); crank.add(weight); }
const flywheel = new THREE.Group(); flywheel.position.set(3.85,-.7,0); engine.add(flywheel); register(flywheel,new THREE.Vector3(2.25,0,.7));
const fly=cyl(1.58,1.58,.42,steel,48); fly.rotation.z=Math.PI/2; flywheel.add(fly); const flyInset=cyl(.66,.66,.46,darkSteel,32); flyInset.rotation.z=Math.PI/2; flywheel.add(flyInset);
for(let a=0;a<8;a++){const tooth=box(.26,.12,.2,silver);tooth.position.set(0,1.55*Math.cos(a*Math.PI/4),1.55*Math.sin(a*Math.PI/4));flywheel.add(tooth)}
const pulley=cyl(.85,.85,.56,rubber,32); pulley.rotation.z=Math.PI/2; pulley.position.set(-3.85,-.65,0); engine.add(pulley); register(pulley,new THREE.Vector3(-1.7,-.1,-.45));

// Intake runners and exhaust collector
const intake = new THREE.Group(); intake.position.set(0,2.12,1.75); engine.add(intake); register(intake,new THREE.Vector3(0,1.8,2.65));
for(let x=-2.3;x<=2.3;x+=1.52){const tube=cyl(.24,.24,2.0,steel);tube.rotation.x=Math.PI/2;tube.position.set(x,0,-.65);intake.add(tube)} const plenum=box(6.6,.68,.85,steel);plenum.position.set(0,.1,-1.05);intake.add(plenum);
const exhaust = new THREE.Group(); exhaust.position.set(0,.45,-1.95); engine.add(exhaust); register(exhaust,new THREE.Vector3(0,-1.6,-2.9));
for(let x=-2.3;x<=2.3;x+=1.52){const pipe=cyl(.2,.2,1.7,brass);pipe.rotation.x=Math.PI/2;pipe.position.set(x,0,.5);exhaust.add(pipe)} const collector=box(6.6,.45,.58,brass);collector.position.set(0,-.1,.95);exhaust.add(collector);

const floor = new THREE.Mesh(new THREE.CircleGeometry(7,64),new THREE.MeshStandardMaterial({color:0x12262a,metalness:.35,roughness:.7,transparent:true,opacity:.46})); floor.rotation.x=-Math.PI/2; floor.position.y=-3.25; floor.receiveShadow=true; scene.add(floor);
function resize() { const r=canvas.getBoundingClientRect(); renderer.setSize(r.width,r.height,false); camera.aspect=r.width/r.height; camera.updateProjectionMatrix(); }
addEventListener("resize",resize); resize();
function updateExplosion() { const amount=Math.min(scrollY/(innerHeight*.78),1); explodedParts.forEach(p=>p.position.lerpVectors(p.userData.home,p.userData.home.clone().add(p.userData.target),amount)); return amount; }
function render() { const explode=updateExplosion(); crank.rotation.x+=.016*(1-explode*.45); flywheel.rotation.x+=.011; engine.rotation.y=-.65+Math.sin(performance.now()*.00025)*.11; renderer.render(scene,camera); requestAnimationFrame(render); }
render();
