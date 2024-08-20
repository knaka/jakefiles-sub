const fs = require("fs");
const path = require("path");
const jakelibDir = path.join(__dirname, "..");

require(path.join(jakelibDir, "..", "jakefile.cjs`"));

const files = fs.readdirSync(jakelibDir).filter(file => file.endsWith(".cjs"));
files.push(path.join(__dirname, "default.cjs"))
files.forEach(file => {
  const filePath = path.join(jakelibDir, file);
  require(filePath);
});
