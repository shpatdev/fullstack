import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src'); // Path to your src directory
const outputFile = path.join(__dirname, 'all_src_content.txt'); // Name of the output file
const excludedExtensions = ['.DS_Store', '.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg']; // Add extensions to exclude
const excludedFolders = ['node_modules', '.git', 'dist']; // Add folders to exclude (ensure these are relative to the script or use absolute paths if needed)

// Delete the output file if it already exists to start fresh
if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile);
}

function getFilesRecursively(dir) {
    let files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            // Check against excluded folder names relative to the current directory being scanned
            if (!excludedFolders.includes(path.basename(fullPath))) {
                files = files.concat(getFilesRecursively(fullPath));
            }
        } else {
            const ext = path.extname(entry.name).toLowerCase();
            if (!excludedExtensions.includes(ext)) {
                files.push(fullPath);
            }
        }
    }
    return files;
}

try {
    const allFiles = getFilesRecursively(srcDir);
    let outputContent = '';

    allFiles.forEach(filePath => {
        const relativePath = path.relative(__dirname, filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        outputContent += `// File: ${relativePath}\n\n`;
        outputContent += `${content}\n\n`;
        outputContent += `// End of File: ${relativePath}\n`;
        outputContent += `//--------------------------------------------------\n\n`;
    });

    fs.writeFileSync(outputFile, outputContent);
    console.log(`Successfully combined all files into ${outputFile}`);
    console.log(`Total files processed: ${allFiles.length}`);
} catch (err) {
    console.error('Error processing files:', err);
}