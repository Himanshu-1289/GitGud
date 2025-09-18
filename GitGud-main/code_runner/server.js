const express = require("express");
const { exec } = require("child_process");
const morgan =require("morgan")
const fs = require("fs");
const path = require("path");
const app = express();
app.use(express.json());
app.use(morgan("combined"))
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

app.post("/execute", (req, res) => {
  let { language, code } = req.body;
  let command;
  language = language.toLowerCase();
  let filename, executable;
  console.log(code)
  switch (language) {
    case "python":
      filename = path.join(tempDir, "temp.py");
      fs.writeFileSync(filename, code);
      command = `python ${filename}`;
      break;
    case "c":
    case "c++":
      const extension = language === "c" ? "c" : "cpp";
      filename = path.join(tempDir, `temp.${extension}`);
      executable = path.join(tempDir, "temp_executable");
      fs.writeFileSync(filename, code);
      command = `g++ ${filename} -o ${executable} && ${executable}`;
      break;
    case "java":
        filename = path.join(tempDir, "Temp.java"); // Java class name must match filename
        fs.writeFileSync(filename, code);
        command = `javac ${filename} && java -cp ${tempDir} Temp`;
        break;
    
    default:
      return res.status(400).json({
        error: "Unsupported language",
      });
  }

  exec(command, (error, stdout, stderr) => {
    fs.unlinkSync(filename);
    if (executable && fs.existsSync(executable)) fs.unlinkSync(executable);

    if (error) {
      return res.status(500).json(stderr);
    }
    const output = stdout.trim();
    res.status(200).json({
        "output" : output
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
