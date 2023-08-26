const { exec } = require('child_process');
const { mkdirSync, rmSync, existsSync } = require('fs');
const { Path, genFont } = require('./font');

function generateFonts() {
  console.log('Building fonts...');
  genFont({
    name: 'Fallback Outline',
    version: '1.0',
    path: new Path()
      .move(175, 700)
      .horizontalLine(475, -725, -475)
      .move(-75, 800)
      .verticalLine(-875, 625, 875),
    width: 825,
  });
  genFont({
    name: 'Fallback Outline X',
    version: '1.0',
    path: new Path()
      .move(175, 775)
      .verticalLine(-875, 625, 875)
      .move(-550, -153)
      .line(193, -284, -193, -285)
      .move(439, -78)
      .line(-403, 0, 201, 297)
      .move(238, -219)
      .line(-193, 285, 193, 284)
      .move(-439, 78)
      .line(403, 0, -202, -297),
    width: 825,
  });
  genFont({
    name: 'Fallback Space',
    version: '1.0',
    path: new Path().move(0, 0),
    width: 825,
  });
  genFont({
    name: 'Fallback Blank',
    version: '1.0',
    path: new Path().move(0, 0),
    width: 0,
  });
}

rmSync('./dist', { recursive: true, force: true });
mkdirSync('./dist');

if (existsSync('./woff2/woff2_compress')) {
  generateFonts();
} else {
  console.log('Compiling woff2...');
  exec('cd woff2 && make clean all', generateFonts);
}
