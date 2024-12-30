const fs = require('fs-extra');
const sharp = require('sharp');
const path = require('path');

async function convertSvgToPng() {
  const sizes = [16, 48, 128];
  const inputDir = path.join(__dirname, '../public/icons');
  const outputDir = path.join(__dirname, '../dist/icons');

  // 确保输出目录存在
  await fs.ensureDir(outputDir);

  for (const size of sizes) {
    const inputFile = path.join(inputDir, `icon${size}.svg`);
    const outputFile = path.join(outputDir, `icon${size}.png`);

    try {
      const svgBuffer = await fs.readFile(inputFile);
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputFile);
      
      console.log(`Converted ${inputFile} to ${outputFile}`);
    } catch (error) {
      console.error(`Error converting ${inputFile}:`, error);
    }
  }
}

convertSvgToPng().catch(console.error); 