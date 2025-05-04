import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.20/+esm';

// test-2: seed 2, xscale 6.99, yscale 7.48, stepSize 0.00565,
//         rotation 2.38132, lineSpacing 0.01539

let gui = null;
const params = {
  seed: 2,
  xscale: 8.5,
  yscale: 5,
  stepSize: .01,
  rotation: 0,
  drawField: false,
  drawTangentField: false,
  spacing: .05,
  lineSpacing: .2,
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
  gui.add(params, "drawTangentField");
  gui.add(params, "spacing").min(.01).max(.5);
  gui.add(params, "lineSpacing").min(.01).max(.5);
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
    beginRecordSVG(this, "flow.svg");

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

  rect(0,0,1,1);

  if (params.drawField)
    drawField(testField, .05);
  if (params.drawTangentField)
    drawTangentField(testField, .05);
  for (let x = 0; x <= 1; x += .1) {
    for (let y = 0; y <= 1; y += .1) {
      //    point(.5, x);
//    drawFlowLine(testField, x, y);
    }
  }

//  const sample = createPoissonDiskSample(params.spacing, [0,0], [1,1]);
//  for (const p of sample) {
//    point(...p);
//    drawFlowLine(testField, ...p);
//  }

  drawEvenlySpacedFlowLines(testField, params.lineSpacing, [0,0], [1,1]);
}

// field: vector field
// (sx, sy): start position
function drawFlowLine(field, sx, sy) {
  let points = traceFlowLine(field, sx, sy);
  for (let i = 1; i < points.length; i++)
    line(points[i-1][0], points[i-1][1],
      points[i][0], points[i][1]);
}

// Jobard-Lefer
// https://web.cs.ucdavis.edu/~ma/SIGGRAPH02/course23/notes/papers/Jobard.pdf
function drawEvenlySpacedFlowLines(field, d, min, max) {
  // Divide by two per paper (termination distance is half the line spacing distance)
  const index = new MinimumDistancePointSet(d / 2, [0,0], [1,1]);
  const lines = [];
  let nextLine = 0;

  function addLine(x, y) {
    if (x < min[0] || x > max[0] ||
        y < min[1] || y > max[1] ||
        index.hasPointNear(x, y))
      return;

    // Trace a flow line from this point in both directions until it hits other
    // flow lines or goes out of bounds
    let thisLine = traceFlowLine(field, x, y, index);
    if (thisLine.length < 10)
      return;
    lines.push(thisLine);

    // Draw it
    for (let i = 1; i < thisLine.length; i++)
      line(thisLine[i-1][0], thisLine[i-1][1], thisLine[i][0], thisLine[i][1]);

    // Add this flow line to the index so that it will terminate other future lines
    // that get close to it
    for (const p of thisLine)
      index.lossyAddPoint(...p);
  }

  // First line from a random point
  addLine(
    random(min[0], max[0]),
    random(min[1], max[1])
  );

  while (nextLine < lines.length) {
    let thisLine = lines[nextLine];
    nextLine ++;

    // Try to draw more lines offset from this line
    for (const p of thisLine) {
      const vec = field(...p);
      // XXX assuming the tangent vector has magnitude 1
      addLine(p[0] + vec[2] * d, p[1] + vec[3] * d);
      addLine(p[0] - vec[2] * d, p[1] - vec[3] * d);
    }
  }

  return lines;
}

// field: vector field
// (sx, sy): start position
// terminateIfNear: optional; if provided, a MinimumDistancePointSet; the flow line will be
//   terminated if it comes too close to a point in the set (and the set will be
//   updated as the flow line is drawn)
// Returns a list of points (each a 2-element list)
function traceFlowLine(field, sx, sy, terminateIfNear) {
  function trace(stepSize) {
    let points = [];
    let x = sx;
    let y = sy;
  
    while (true) {
      // Midpoint method for numerical integration
      let vec = field(x, y);
      let vec2 = field(x + vec[0] * stepSize / 2, y + vec[1] * stepSize / 2);
      let nx = x + vec2[0] * stepSize;
      let ny = y + vec2[1] * stepSize;

      if ( !(nx >= 0 && nx <= 1 && ny >=0 && ny <= 1) )
        break;

      if (terminateIfNear && terminateIfNear.hasPointNear(nx, ny))
        break; // XXX may want to use a different distance - paper suggests d/2

      points.push([nx, ny]);
      x = nx;
      y = ny;
    }

    return points;
  }

  let ret = trace(-params.stepSize);
  ret.reverse();
  ret.push([sx, sy]);
  ret.push(...trace(params.stepSize));
  return ret;
}

// field: vector field
// (sx, sy): start position
// spacing: spacing between lines
function drawSpacedFlowLine(field, sx, sy, spacing) {
  let points = traceFlowLine(field, sx, sy);
  for (let i = 1; i < points.length; i++)
    line(points[i-1][0], points[i-1][1],
      points[i][0], points[i][1]);
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

function drawTangentField(field, step) {
  for (let x = 0; x <= 1; x += step) {
    for (let y = 0; y <= 1; y += step) {
      let vec = field(x + step/2, y + step/2);
      line(x + step/2, y + step/2,
        x + step / 2 + vec[2]*step/4, 
        y + step / 2 + vec[3]*step/4, 
      );
    }
  }
}

function testField(x, y) {
  let theta = params.rotation;
  theta += sin(x * params.xscale);
  theta += cos(y * params.yscale);
  return [
    cos(theta), sin(theta), // vector
    cos(theta + PI/2), sin(theta + PI/2), // tangent
  ];
}

// This represents a set of 2D points with the constraint that no two points in the set
// are within a pre-determined D (Euclidean distance) of each other.
//
// See _Fast Poisson Disk Sampling in Arbitrary Dimensions_ by Robert Bridson.
  // https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf
class MinimumDistancePointSet {
  // d: the minimum distance D between points in the set (D)
  // min, max: two points giving the a bounding rectangle for the points (2-element arrays)
  constructor(d, min, max) {
    this.d = d;
    this.min = min;
    this.max = max;
    this.cellSize = d/sqrt(2); // each cell contains at most one point
    this.cellCount = [
      ceil((max[0] - min[0]) / this.cellSize),
      ceil((max[1] - min[1]) / this.cellSize)
    ];
    this.cells = new Array(this.cellCount[0] * this.cellCount[1]);
  }

  _cellContainingPoint(x, y) {
    let ix = floor((x - this.min[0]) / this.cellSize);
    let iy = floor((y - this.min[1]) / this.cellSize);

    if (ix < 0 || ix >= this.cellCount[0] ||
        iy < 0 || iy >= this.cellCount[1])
      throw new Error("out of bounds");

    return [ix, iy];
  }

  addPoint(x, y) {
    if (this.hasPointNear(x, y))
      throw new Error("violates distance invariant");

    this.fastAddPoint(x, y);
  }

  // You can use this instead of addPoint if you already know for sure that the point you are
  // adding is not within D of any existing point.
  fastAddPoint(x, y) {
    const cell = this._cellContainingPoint(x, y);
    const index = cell[1] * this.cellCount[0] + cell[0];
    if (this.cells[index])
      throw new Error("cell already occupied?"); // you broke it
    this.cells[index] = [x, y];
  }

  // XXX just jam the point in there
  lossyAddPoint(x, y) {
    const cell = this._cellContainingPoint(x, y);
    const index = cell[1] * this.cellCount[0] + cell[0];
    if (! this.cells[index])
      this.cells[index] = [x, y];
  }

  hasPointNear(x, y) {
    let d2 = this.d * this.d;

    // In 2D searching a 5x5 region of cells is sufficient to find any point that could be within
    // D (given that the cell size is D/sqrt(2)). It is possible to search a smaller number
    // but that would only be a constant factor speedup.
    //
    // 5 is a bound because at worst we need to search ceil(1/cellSize) in each direction,
    // and cellSize is 1/sqrt(2). 2 cells in each direction beyond the point's cell is 5.
    let cell = this._cellContainingPoint(x, y);
    for (let ix = max(cell[0] - 2, 0); ix <= min(cell[0] + 2, this.cellCount[0] - 1); ix ++) {
      for (let iy = max(cell[1] - 2, 0); iy <= min(cell[1] + 2, this.cellCount[1] - 1); iy ++) {
        let point = this.cells[iy * this.cellCount[0] + ix];
        if (point) {
          let dist2 = (point[0] - x) * (point[0] - x) + (point[1] - y) * (point[1] - y);
          if (dist2 < d2)
            return true;
        }
      }
    }

    return false;
  }
}

function createPoissonDiskSample(d, min, max) {
  const k = 30; // tries before we conclude that the neighborhood of a point is full
  const active = [];
  const points = [];
  const index = new MinimumDistancePointSet(d, min, max);

  function selectPoint(x, y) {
    active.push([x, y]);
    points.push([x, y]);
    index.fastAddPoint(x, y); // fastAddPoint should be safe here
 }

  // Seed point
  const sx = random(min[0], max[0]);
  const sy = random(min[1], max[1]);
  selectPoint(sx, sy);

  while (active.length > 0) {
    const pick = floor(random(active.length));
    const oldPoint = active[pick];
    let newPoint;

    for (let tries = 0; tries < k; tries ++) {
      // Select a point uniformly from those that are within d and 2d of oldPoint
      // https://stackoverflow.com/questions/5837572/generate-a-random-point-within-a-circle-uniformly
      const theta = random(0, 2*PI);
      const r = sqrt(random(d * d, 2 * d * 2 * d));
      const x = oldPoint[0] + r * cos(theta);
      const y = oldPoint[1] + r * sin(theta);

      // Reject points that are out of bounds
      if (x < min[0] || x > max[1] ||
          y < min[0] || y > max[1]) {
        tries++;
        continue;
      }
  
      if (! index.hasPointNear(x, y)) {
        newPoint = [x, y];
        break;
      }
    }

    if (! newPoint) {
      // Can't find a valid newPoint near oldPoint after k tries. Remove from active list
      active[pick] = active[active.length - 1];
      active.pop();
      continue;
    }

    selectPoint(...newPoint);
  }

  return points;
}

// window.MinimumDistancePointSet = MinimumDistancePointSet;
// window.createPoissonDiskSample = createPoissonDiskSample;