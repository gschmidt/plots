import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.20/+esm';

let gui = null;
const params = {
  seed: 2,
  xscale: 8.5,
  yscale: 5,
  stepSize: .01,
  rotation: 0,
  drawField: false,
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
  gui.add(params, "xscale").min(0).max(10);
  gui.add(params, "yscale").min(0).max(10);
  gui.add(params, "stepSize").min(.001).max(.1);
  gui.add(params, "rotation").min(0).max(2*PI);
  gui.add(params, "drawField");
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
  drawFlow();
  if (exportSvg) {
    endRecordSVG();
    exportSvg = false;
  }
} 

function drawFlow() {
  const nx = params.count;
  const ny = params.count;
  const noise = params.noise;
  
  translate(marginInCm / cmInOneInch * dpi, marginInCm / cmInOneInch * dpi);
  scale((sizeInCm - 2 * marginInCm) / cmInOneInch * dpi);
  scale(1, -1);
  translate(0, -1);

  if (params.drawField)
    drawField(testField, .05);
  for (let x = 0; x <= 1; x += .1) {
//    point(.5, x);
    drawFlowLine(testField, .5, x);
  }
}

// field: vector field
// (sx, sy): start position
function drawFlowLine(field, sx, sy) {
  function trace(stepSize) {
    let x = sx;
    let y = sy;
  
    while (x >= 0 && x <= 1 && y >=0 && y <= 1) {
      // Midpoint method for numerical integration
      let vec = field(x, y);
      let vec2 = field(x + vec[0] * stepSize / 2, y + vec[1] * stepSize / 2);
      let nx = x + vec2[0] * stepSize;
      let ny = y + vec2[1] * stepSize;
      line(x, y, nx, ny);
      x = nx;
      y = ny;
    }
  }

  trace(params.stepSize);
  trace(-params.stepSize);
}

function drawField(field, step) {
  for (let x = 0; x <= 1; x += step) {
    for (let y = 0; y <= 1; y += step) {
      let vec = field(x + step/2, y + step/2);
      line(x + step/2, y + step/2,
        x + step / 2 + vec[0]*step/4, 
        y + step / 2 + vec[1]*step/4, 
      );
    }
  }
}

function testField(x, y) {
  let theta = params.rotation;
  theta += sin(x * params.xscale);
  theta += cos(y * params.yscale);
  return [cos(theta), sin(theta)];
}