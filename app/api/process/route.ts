import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path"; // ✅ Import path module

export async function POST(req: Request) {
  try {
    const { link } = await req.json();
    console.log("Processing YouTube Link:", link);

    // ✅ Get absolute paths of Python scripts
    const mainPyPath = path.resolve(process.cwd(), "backend", "main.py");
    const analysisPyPath = path.resolve(process.cwd(), "backend", "analysis.py");

    console.log("Running main.py from:", mainPyPath);
    console.log("Running analysis.py from:", analysisPyPath);

    // ✅ Run `main.py` with YouTube link
    await new Promise((resolve, reject) => {
      exec(`python "${mainPyPath}" "${link}"`, (error, stdout, stderr) => {
        if (error) {
          console.error("❌ Error running main.py:", stderr);
          reject(stderr);
        } else {
          console.log("✅ main.py Output:", stdout);
          resolve(stdout);
        }
      });
    });

    // ✅ Run `analysis.py` after `main.py` completes
    await new Promise((resolve, reject) => {
      exec(`python "${analysisPyPath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error("❌ Error running analysis.py:", stderr);
          reject(stderr);
        } else {
          console.log("✅ analysis.py Output:", stdout);
          resolve(stdout);
        }
      });
    });

    return NextResponse.json({ message: "Processing complete!" });
  } catch (error) {
    console.error("❌ Internal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
