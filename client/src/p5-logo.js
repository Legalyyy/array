// P5.js Generative Art Animation for Logo
export function initP5Logo(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('Container not found:', containerId);
    return;
  }

  // Create a new p5 instance scoped to the container
  new p5((p) => {
    p.setup = function() {
      const canvas = p.createCanvas(30, 30);
      canvas.parent(containerId);
      p.background(0);
    }

    p.draw = function() {
      p.background(0, 25);
      p.translate(p.width / 2, p.height / 2);
      
      p.noFill();
      p.stroke(255, 10);
      p.strokeWeight(1);

      const time = p.frameCount * 0.008;
      const numLines = 25; 
      const numPoints = 60; 

      for (let i = 0; i < numLines; i++) {
        const linePhase = (i / numLines) * p.TWO_PI; 

        p.beginShape();
        for (let j = 0; j <= numPoints; j++) {
          const pointPhase = j / numPoints;
          
          const y = p.map(pointPhase, 0, 1, -p.height / 2.5, p.height / 2.5);

          const envelope = p.sin(pointPhase * p.PI);
          const wave1 = p.sin(time + linePhase) * 6;
          const wave2 = p.sin(pointPhase * 8 + time * 2) * 4;
          const centerComplexity = p.pow(p.cos(pointPhase * p.PI - p.HALF_PI), 2) * 10;
          const wave3 = p.cos(linePhase * 4 - time) * centerComplexity;
          const x = envelope * (wave1 + wave2 + wave3 + 6);

          p.vertex(-x, y); 
        }
        p.endShape();

        p.beginShape();
        for (let j = 0; j <= numPoints; j++) {
          const pointPhase = j / numPoints;
          const y = p.map(pointPhase, 0, 1, -p.height / 2.5, p.height / 2.5);
          
          const envelope = p.sin(pointPhase * p.PI);
          const wave1 = p.sin(time + linePhase) * 6;
          const wave2 = p.sin(pointPhase * 8 + time * 2) * 4;
          const centerComplexity = p.pow(p.cos(pointPhase * p.PI - p.HALF_PI), 2) * 10;
          const wave3 = p.cos(linePhase * 4 - time) * centerComplexity;
          const x = envelope * (wave1 + wave2 + wave3 + 6);

          p.vertex(x, y); 
        }
        p.endShape();
      }
    }

    p.windowResized = function() {
      // Keep canvas size fixed at 30x30
      p.resizeCanvas(30, 30);
    }
  });
}
