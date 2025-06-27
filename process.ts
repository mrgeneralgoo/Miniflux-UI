import * as fs from 'fs/promises';
import * as path from 'path';
import * as cheerio from 'cheerio';
const { exec } = require('child_process');

const SOURCE_DIRECTORY = path.resolve(__dirname, 'upstream');
const EXCLUDED_DIRECTORIES = new Set(['node_modules', '.git', 'dist']);
const ORIGINAL_CDN = 'cdn.jsdelivr.net';
const REPLACEMENT_CDN = 'cdn.jsdmirror.com';

const GOOGLE_ANALYTICS_ID = 'G-ZH6Q0QQ786';
const GOOGLE_ANALYTICS_SNIPPET = `
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GOOGLE_ANALYTICS_ID}');
</script>
<!-- End Google Analytics -->
`.trim();

const TARGET_FILE_EXTENSIONS = new Set(['.html', '.vue', '.js', '.ts', '.jsx', '.tsx']);

/**
 * Determines whether a file should be processed based on its extension.
 */
const isProcessableFile = (filePath: string): boolean => TARGET_FILE_EXTENSIONS.has(path.extname(filePath));

/**
 * Replaces the CDN links from the original CDN to the replacement CDN.
 */
const replaceCdnLinksInContent = (content: string): string => 
  content.replace(new RegExp(`https://${ORIGINAL_CDN}`, 'g'), `https://${REPLACEMENT_CDN}`);

/**
 * Injects Google Analytics script into the HTML content of index.html.
 * Only modifies the file if it's index.html and Google Analytics script is not already present.
 */
const insertGoogleAnalyticsSnippet = (filePath: string, htmlContent: string): string => {
  const fileName = path.basename(filePath);

  // Only process the index.html file
  if (fileName !== 'index.html') return htmlContent;

  const $ = cheerio.load(htmlContent);
  const lastScriptElement = $('script').last();

  // Prevent adding the Google Analytics script if it's already present
  if (htmlContent.includes(`gtag/js?id=${GOOGLE_ANALYTICS_ID}`)) return htmlContent;

  lastScriptElement.after('\n' + GOOGLE_ANALYTICS_SNIPPET + '\n');
  return $.html();
}

/**
 * Processes a single file by replacing CDN links and adding Google Analytics if applicable.
 */
const processFile = async (filePath: string): Promise<void> => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileExtension = path.extname(filePath);
    const containsCdnLink = content.includes(ORIGINAL_CDN);
    const isHtmlFile = fileExtension === '.html';

    if (!containsCdnLink && !isHtmlFile) return;

    // Replace CDN links if needed
    let updatedContent = containsCdnLink ? replaceCdnLinksInContent(content) : content;

    // Insert Google Analytics snippet for HTML files
    if (isHtmlFile) {
      updatedContent = insertGoogleAnalyticsSnippet(filePath, updatedContent);
    }

    await fs.writeFile(filePath, updatedContent, 'utf-8');
    console.log(`✅ Processed: ${path.relative(SOURCE_DIRECTORY, filePath)}`);
  } catch (error) {
    console.error(`❌ Failed to process: ${filePath}`, error);
  }
}

/**
 * Recursively processes all files in a directory, excluding specific directories like node_modules.
 */
const processDirectoryRecursively = async (directory: string): Promise<void> => {
  const directoryEntries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of directoryEntries) {
    const fullPath = path.join(directory, entry.name);

    // Skip excluded directories
    if (entry.isDirectory() && EXCLUDED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      await processDirectoryRecursively(fullPath); // Recursively process subdirectories
    } else if (entry.isFile() && isProcessableFile(fullPath)) {
      await processFile(fullPath);
    }
  }
}

/**
 * Removes the .git directory inside the upstream folder if it exists.
 */
const removeGitDirectory = async (): Promise<void> => {
  const gitDir = path.join(SOURCE_DIRECTORY, '.git');
  try {
    await fs.rm(gitDir, { recursive: true, force: true });
    console.log('🗑️  Removed .git directory in upstream');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('❌ Failed to remove .git directory:', error);
    }
  }
};

/**
 * Updates dependencies in the upstream directory using ncu, npm, and pnpm.
 */
const updateDependencies = async (): Promise<void> => {
  const updateCmd = 'rm -rf package-lock.json pnpm-lock.yaml && ncu --target semver --install always -p npm -u && npm install --package-lock-only && pnpm import package-lock.json';
  return new Promise((resolve, reject) => {
    exec(updateCmd, { cwd: SOURCE_DIRECTORY }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Dependency update failed:', stderr || error);
        reject(error);
      } else {
        console.log('⬆️  Dependencies updated successfully');
        resolve();
      }
    });
  });
};

/**
 * Main function to initiate the processing task. Checks if the source directory exists
 * and starts processing files in it.
 */
const main = async (): Promise<void> => {
  try {
    // Check if the source directory exists
    const sourceDirExists = await fs.stat(SOURCE_DIRECTORY).catch(() => false);
    if (!sourceDirExists) {
      console.error(`❌ Directory does not exist: ${SOURCE_DIRECTORY}`);
      process.exit(1);
    }

    await removeGitDirectory();

    await updateDependencies();

    await processDirectoryRecursively(SOURCE_DIRECTORY);

    console.log('🎉 All files have been processed successfully');
  } catch (error) {
    console.error('❌ Main function execution failed', error);
    process.exit(1);
  }
}

main();
