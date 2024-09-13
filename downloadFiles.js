import fs from "fs-extra";
import axios from "axios";
import path from "path";
import readline from "readline";
import pLimit from "p-limit";

const downloadDir = "./downloads";

// create download directory if it does not exist
fs.ensureDirSync(downloadDir);

// read URLs from urls.txt
const urls = fs.readFileSync("urls.txt", "utf-8").split("\n").filter(Boolean);
const totalFiles = urls.length;

// time benchmarking
const startTime = Date.now();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const updateProgress = (completed, total) => {
  const percent = ((completed / total) * 100).toFixed(2);
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(`Progress: ${completed}/${total} (${percent}%)`);
};

// the main function
const downloadFile = async (url) => {
  try {
    const fileName = path.basename(url);
    const filePath = path.join(downloadDir, fileName);

    const writer = fs.createWriteStream(filePath);
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (error) {
    console.error(`Error downloading ${url}: ${error.message}`);
  }
};

// concurrency limit
const limit = pLimit(100); // adjust this number to find a sweet spot

// function to handle multiple concurrent downloads
const downloadFiles = async (urls) => {
  let completedDownloads = 0;

  const tasks = urls.map((url) =>
    limit(async () => {
      await downloadFile(url);
      completedDownloads++;
      updateProgress(completedDownloads, totalFiles);
    })
  );

  await Promise.all(tasks);
};

downloadFiles(urls)
  .then(() => {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log("\nAll files have been downloaded.");
    console.log(`Time taken: ${duration} seconds`);
    rl.close();
  })
  .catch((error) => {
    console.error(`Error during download: ${error.message}`);
    rl.close();
  });
