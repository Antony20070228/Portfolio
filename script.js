/* ===== Theme Toggle ===== */
const themeToggle = document.getElementById("themeToggle");
const prefersLight = matchMedia("(prefers-color-scheme: light)");
function setTheme(mode){
  document.documentElement.classList.remove("light");
  if (mode === "light" || (mode === "auto" && prefersLight.matches)) {
    document.documentElement.classList.add("light");
  }
  localStorage.setItem("theme", mode);
}
let theme = localStorage.getItem("theme") || "auto";
setTheme(theme);
themeToggle.addEventListener("click", ()=>{
  theme = theme==="dark" ? "light" : theme==="light" ? "auto" : "dark";
  setTheme(theme);
});
prefersLight.addEventListener("change", ()=> theme==="auto" && setTheme("auto"));

/* ===== Mobile Menu ===== */
const menu = document.getElementById("menu");
const menuToggle = document.getElementById("menuToggle");
menuToggle.addEventListener("click", ()=>{
  const open = menu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
});

/* ===== Projects (sample data) ===== */
const grid = document.getElementById("grid");
const tagBar = document.getElementById("tagBar");
const search = document.getElementById("search");
const projects = [
  {
    id:"chatbot",
    title:"Chatbot with Transformers",
    desc:"Conversational AI app with caching and safety filters.",
    tags:["Python","Streamlit","AI"],
    image:"https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1200&q=80&auto=format",
    demo:"#", code:"#"
  },
  {
    id:"iot",
    title:"IoT Health Dashboard",
    desc:"Real-time MQTT dashboard with Node.js and WebSockets.",
    tags:["Node","MQTT","Dashboard"],
    image:"https://images.unsplash.com/photo-1556157382-97eda2d62296?w=1200&q=80&auto=format",
    demo:"#", code:"#"
  },
  {
    id:"portfolio",
    title:"Portfolio v3",
    desc:"Minimal, responsive, accessible portfolio with dark mode.",
    tags:["HTML","CSS","JS"],
    image:"https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=1200&q=80&auto=format",
    demo:"#", code:"#"
  }
];
let activeTag = "All";
function drawTags(){
  const tags = ["All", ...new Set(projects.flatMap(p=>p.tags))];
  tagBar.innerHTML = "";
  tags.forEach(t=>{
    const b = document.createElement("button");
    b.textContent = t;
    b.className = "tag" + (t===activeTag ? " active" : "");
    b.onclick = ()=> { activeTag = t; drawTags(); drawGrid(); };
    tagBar.appendChild(b);
  });
}
function drawGrid(){
  const q = (search?.value||"").toLowerCase();
  grid.innerHTML = "";
  projects
    .filter(p => (activeTag==="All" || p.tags.includes(activeTag)))
    .filter(p => (p.title + p.desc + p.tags.join(" ")).toLowerCase().includes(q))
    .forEach(p=>{
      const el = document.createElement("article");
      el.className = "work";
      el.innerHTML = `
        <img src="${p.image}" alt="${p.title}">
        <div class="body">
          <h3>${p.title}</h3>
          <p class="meta">${p.desc}</p>
          <div class="tags">${p.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
          <div class="actions">
            <a class="btn ghost" href="${p.demo}" target="_blank" rel="noreferrer">Live</a>
            <a class="btn primary" href="${p.code}" target="_blank" rel="noreferrer">Code</a>
          </div>
        </div>`;
      grid.appendChild(el);
    });
}
search?.addEventListener("input", drawGrid);
drawTags(); drawGrid();

/* ===== Skills ===== */
const skillBars = document.getElementById("skillBars");
[
  ["JavaScript",90],["Python",85],["React",80],["Node.js",80],["SQL",75],["Docker",70]
].forEach(([name,pct])=>{
  const li = document.createElement("li");
  li.innerHTML = `<span>${name}</span><span class="bar" style="--pct:${pct}%"></span>`;
  skillBars.appendChild(li);
});

/* ===== Reveal on Scroll ===== */
const io = new IntersectionObserver(es=> es.forEach(e=> e.isIntersecting && e.target.classList.add("in")), {threshold:.12});
document.querySelectorAll(".reveal").forEach(el=> io.observe(el));

/* ===== Footer Year ===== */
document.getElementById("year").textContent = new Date().getFullYear();

/* =========================================================
   ROBOT RUNNER BACKGROUND
   - A computer-robot rolls across the ground line
   - Eyes blink, wheels spin, antenna pulses
   - Theme-aware colors, respects reduced motion
========================================================= */
(function robotRunner(){
  const c = document.getElementById("bg-robot");
  if(!c) return;
  const ctx = c.getContext("2d", { alpha: true });
  const RM  = matchMedia("(prefers-reduced-motion: reduce)");
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  let W=0, H=0, raf=0, t=0, hidden=false;
  let speed = 1; // 1 = normal, 2 = fast

  // toggle speed
  const speedBtn = document.getElementById("speedToggle");
  speedBtn?.addEventListener("click", ()=> { speed = speed === 1 ? 2 : 1; });

  function getVar(name, fallback){
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }
  function hexToRGB(hex){ const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if(!m) return [255,255,255]; return [parseInt(m[1],16),parseInt(m[2],16),parseInt(m[3],16)];
  }
  function rgba(hex, a){ const [r,g,b] = hexToRGB(hex); return `rgba(${r},${g},${b},${a})`; }

  const palette = () => ({
    bg: getVar("--bg","#0b1220"),
    text: getVar("--text","#e2e8f0"),
    accent: getVar("--accent","#38bdf8"),
    accent2: getVar("--accent2","#a78bfa"),
    border: getVar("--border","#1f2937")
  });

  const robot = {
    x: -150, y: 0, vx: 140, wheelR: 16, bobAmp: 6, eyeBlink: 0,
    reset(){ this.x = -180; }
  };

  function resize(){
    W = c.width  = Math.floor(innerWidth  * DPR);
    H = c.height = Math.floor(innerHeight * DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);
    robot.y = H / DPR - 120; // ground clearance
  }

  function drawGround(colors){
    // subtle gradient ground line near bottom
    const gy = H/DPR - 80;
    const g = ctx.createLinearGradient(0, gy, 0, gy+80);
    g.addColorStop(0, rgba(colors.border, 0.45));
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, gy, W/DPR, 90);

    // dotted guide line
    ctx.strokeStyle = rgba(colors.text, 0.12);
    ctx.setLineDash([6,6]);
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(W/DPR, gy);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawRobot(colors){
    const x = robot.x;
    const y = robot.y + Math.sin(t*6) * robot.bobAmp; // bobbing
    const k = 1.0; // scale

    // shadow
    ctx.fillStyle = "rgba(0,0,0,.18)";
    ctx.beginPath();
    ctx.ellipse(x+70, y+65, 52, 12, 0, 0, Math.PI*2);
    ctx.fill();

    // wheels
    const wr = robot.wheelR, wAng = t * 10 * speed; // spin
    const wheels = [[x+40,y+50],[x+100,y+50]];
    wheels.forEach(([wx,wy])=>{
      ctx.fillStyle = rgba(colors.border, .9);
      ctx.beginPath(); ctx.arc(wx,wy,wr+2,0,Math.PI*2); ctx.fill();

      ctx.fillStyle = rgba(colors.text, .95);
      ctx.beginPath(); ctx.arc(wx,wy,wr,0,Math.PI*2); ctx.fill();

      // spokes
      ctx.strokeStyle = rgba(colors.accent, .9);
      ctx.lineWidth = 2;
      for(let i=0;i<6;i++){
        const a = wAng + i*Math.PI/3;
        ctx.beginPath();
        ctx.moveTo(wx,wy);
        ctx.lineTo(wx + Math.cos(a)*wr, wy + Math.sin(a)*wr);
        ctx.stroke();
      }
      // hub
      ctx.fillStyle = rgba(colors.accent2, .95);
      ctx.beginPath(); ctx.arc(wx,wy,3.5,0,Math.PI*2); ctx.fill();
    });

    // body (monitor)
    ctx.fillStyle = rgba(colors.card || colors.surface || "#0f172a", 0.95);
    ctx.strokeStyle = rgba(colors.border, 1);
    roundRect(ctx, x+20, y-10, 140, 80, 12, true, true);

    // screen glow
    const sg = ctx.createLinearGradient(x+20,y-10, x+160,y+70);
    sg.addColorStop(0, rgba(colors.accent, .14));
    sg.addColorStop(1, rgba(colors.accent2, .14));
    ctx.fillStyle = sg;
    roundRect(ctx, x+28, y-2, 124, 52, 8, true, false);

    // antenna
    ctx.strokeStyle = rgba(colors.accent, .9);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x+90, y-10);
    ctx.lineTo(x+110, y-36 - Math.sin(t*3)*4);
    ctx.stroke();
    ctx.fillStyle = rgba(colors.accent2, .9);
    ctx.beginPath();
    ctx.arc(x+110, y-40 - Math.sin(t*3)*4, 5 + Math.sin(t*2)*0.6, 0, Math.PI*2);
    ctx.fill();

    // face (eyes + mouth) — blink every ~3s
    const blink = (Math.sin(t*2.2) > 0.98) ? 0.15 : 1; // quick close
    ctx.fillStyle = rgba(colors.text, .95);
    // eyes
    ctx.beginPath(); ctx.roundRect(x+55, y+8, 10, 10*blink, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(x+105, y+8, 10, 10*blink, 3); ctx.fill();
    // mouth
    ctx.strokeStyle = rgba(colors.text, .8);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x+85, y+24, 10, Math.PI*0.05, Math.PI-0.05);
    ctx.stroke();

    // bottom base (roller bar)
    ctx.fillStyle = rgba(colors.border, .9);
    roundRect(ctx, x+26, y+42, 128, 12, 6, true, false);

    // little side arm
    ctx.strokeStyle = rgba(colors.accent2, .9);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x+160, y+10);
    ctx.quadraticCurveTo(x+178, y+18, x+174, y+32);
    ctx.stroke();

    // label
    ctx.fillStyle = rgba(colors.text, .5);
    ctx.font = "10px Inter, sans-serif";
    ctx.fillText("</>", x+82, y+18);
  }

  function roundRect(ctx,x,y,w,h,r,fill,stroke){
    if(w<2*r) r=w/2; if(h<2*r) r=h/2;
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    if(fill) ctx.fill();
    if(stroke) ctx.stroke();
  }

  function frame(now){
    if(hidden) return;
    const colors = palette();
    t = now * 0.001;

    // clear + subtle vertical wash
    ctx.clearRect(0,0,innerWidth,innerHeight);
    const wash = ctx.createLinearGradient(0,0,0,H);
    wash.addColorStop(0, rgba(colors.accent, 0.035));
    wash.addColorStop(1, rgba(colors.accent2,0.035));
    ctx.fillStyle = wash; ctx.fillRect(0,0,W,H);

    // ground
    drawGround(colors);

    // move robot
    const dt = Math.min(0.032, 1/60); // clamp
    robot.x += robot.vx * dt * speed;
    if (robot.x > W/DPR + 60) robot.reset();

    // draw robot
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = rgba(colors.border, 1);
    drawRobot(colors);

    raf = requestAnimationFrame(frame);
  }

  function start(){ stop(); if(RM.matches) { drawStatic(); return; } hidden=false; raf=requestAnimationFrame(frame); }
  function stop(){ hidden=true; if(raf) cancelAnimationFrame(raf); raf=0; }

  function drawStatic(){
    // single static scene for reduced motion users
    const colors = palette();
    ctx.clearRect(0,0,W,H);
    drawGround(colors);
    robot.x = W/DPR - 220;
    ctx.lineWidth = 1.5;
    drawRobot(colors);
  }

  resize(); robot.reset(); start();
  addEventListener("resize", resize);
  document.addEventListener("visibilitychange", ()=> document.hidden ? stop() : start());
  RM.addEventListener("change", ()=> RM.matches ? start() : start());
})();

/* Polyfill for Canvas roundRect in some browsers */
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r){
    if (w < 2*r) r = w/2; if (h < 2*r) r = h/2;
    this.beginPath();
    this.moveTo(x+r,y);
    this.arcTo(x+w,y,x+w,y+h,r);
    this.arcTo(x+w,y+h,x,y+h,r);
    this.arcTo(x,y+h,x,y,r);
    this.arcTo(x,y,x+w,y,r);
    return this;
  };
}
