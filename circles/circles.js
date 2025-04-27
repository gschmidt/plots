import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.20/+esm';

// 001: seed 2, noise .4, count 11, exp 3.5, expOffset 0.5
// 002: seed 2, noise .3, count 11, exp 5.7, expOffset 1

let gui = null;
const params = {
  seed: 2,
  noise: .4,
  count: 11,
  exp: 3.5,
  expOffset: 0.5,
  "Save SVG": () => { exportSvg = true; redraw(); },
}

let exportSvg = false; 
const dpi = 96;
const sizeInCm = 20;
const marginInCm = 1;
const cmInOneInch = 2.54
const dimensions = sizeInCm / cmInOneInch * dpi;

window.setup = function() {
  gui = new GUI();
  gui.title("Parameters");
  gui.add(params, "seed").min(1).max(10).step(1);
  gui.add(params, "noise").min(0).max(1).step(.1);
  gui.add(params, "count").min(1).max(17).step(1);
  gui.add(params, "exp").min(0).max(10);
  gui.add(params, "expOffset").min(0).max(1);
  gui.add(params, "Save SVG");
  gui.onChange(event => { redraw(); });

  setSvgResolutionDPI(dpi);
  createCanvas(dimensions, dimensions);
  background(255);
  stroke(0);
  noFill();
  noLoop();
}

window.draw = function() {
  randomSeed(params.seed);
  background(255); 
  stroke(0);
  noFill();
  if (exportSvg)
    beginRecordSVG(this, "circles.svg");

  strokeWeight(5/dimensions);
  drawGrid();
  if (exportSvg) {
    endRecordSVG();
    exportSvg = false;
  }
} 

function drawGrid() {
  const nx = params.count;
  const ny = params.count;
  const noise = params.noise;
  
  translate(marginInCm / cmInOneInch * dpi, marginInCm / cmInOneInch * dpi);
  scale((sizeInCm - 2 * marginInCm) / cmInOneInch * dpi);
//  square(0, 0, 1);
    
  for (let x = 0; x < nx; x ++) {
    for (let y = 0; y < ny; y ++) {
      push();
      translate(x * 1/nx + 1/nx/2, y * 1/ny + 1/ny/2);
      scale(1/nx, 1/ny);
//      drawCell(abs((x+.5)/nx-.5) * noise, abs((y+.5)/ny-.5) * noise);
      
      let xx = abs((x+.5)/nx-.5);
      let yy = abs((y+.5)/ny-.5);
      let edist = sqrt(xx*xx+yy*yy)
      let p = (.642824-edist) * noise;
//      drawCell(p, p);
  
      let cdist = abs((x+.5)-nx/2) + abs((y+.5)-ny/2);
      let mdist = max(abs((x+.5)-nx/2), abs((y+.5)-ny/2));
//    drawCell(cdist*noise/10, cdist*noise/10);

//      let fact = (exp(cdist/4)-.5) * noise /6;
      let fact = (exp(edist*params.exp) - params.expOffset) * noise /6;
      drawCell(fact, fact);
          
      pop();
    }
  }
}

function drawCell(rx, ry) {
  for (let i = 0; i < 10; i ++) {
    circle(random(-rx/2, rx/2), random(-ry/2, ry/2), 1 - i*.1);
  }
}
