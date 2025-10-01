import { VercelRequest, VercelResponse } from '@vercel/node'; // Types for Vercel functions
import { Octokit } from 'octokit'; // GitHub REST API client
import multer from 'multer'; // To parse multipart form-data (file uploads)

// Multer memory storage allows uploading files into memory buffers instead of disk
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Instantiates GitHub API client with a PAT from environment variables
const octokit = new Octokit({ auth: process.env.GITHUB_PAT });

// Helper function to wrap multer middleware (upload handler) in a Promise
function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        console.error('Multer middleware error:', result);
        reject(result);
      } else {
        console.log('Multer middleware completed');
        resolve(result);
      }
    });
  });
}

// Main API handler (serverless function)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST requests to upload files
  if (req.method !== 'POST') {
    console.warn(`Invalid request method: ${req.method}`);
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    // Use multer to parse 'images' and 'songs' fields
    await runMiddleware(req, res, upload.fields([{ name: 'images' }, { name: 'songs' }]));
    console.log('Files parsed by multer:', {
      images: req.files?.images?.length || 0,
      songs: req.files?.songs?.length || 0,
    });

    // GitHub repo and branch config
    const owner = '10Unknownboy'; // Your GitHub username/org
    const repo = 'love-os-ogg';   // Repo where media lives
    const branch = 'main';        // Branch to commit to

    // Helper: checks if a file exists on GitHub and returns its SHA (required to update existing files)
    async function getFileSha(path: string) {
      try {
        const { data } = await octokit.rest.repos.getContent({ owner, repo, path, ref: branch });
        console.log(`SHA found for ${path}`);
        return (data as any).sha;
      } catch (error) {
        console.warn(`SHA not found for ${path}, treating as new file`);
        return null;
      }
    }

    // Helper: commits a file to GitHub repo at 'path' with base64 content and commit message
    async function commitFile(path: string, content: Buffer, message: string) {
      try {
        const base64Content = content.toString('base64');
        const sha = await getFileSha(path);
        await octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path,
          message,
          content: base64Content,
          sha: sha || undefined, // undefined means create new file
          branch,
        });
        console.log(`Committed file ${path}`);
      } catch (error) {
        console.error(`Commit failed for file ${path}:`, error);
        throw error;
      }
    }

    // Expected filenames for images
    const expectedImageNames = [
      "collage.jpg",
      "memory1.jpg",
      "memory2.jpg",
      "memory3.jpg",
      "memory4.jpg",
      "memory5.jpg",
      "memory6.jpg",
    ];

    // Process image files
    const images = (req.files as any).images || [];
    console.log(`Processing ${images.length} images`);
    for (let i = 0; i < images.length && i < expectedImageNames.length; i++) {
      const path = `public/files/database/images/${expectedImageNames[i]}`;
      console.log(`Uploading image file to path: ${path}`);
      await commitFile(path, images[i].buffer, `Add/update image ${expectedImageNames[i]}`);
    }

    // Expected filenames for songs
    const expectedSongNames = [
      "song1.mp3",
      "song2.mp3",
      "song3.mp3",
      "song4.mp3",
      "song5.mp3",
      "song6.mp3",
    ];

    // Process song files
    const songs = (req.files as any).songs || [];
    console.log(`Processing ${songs.length} songs`);
    for (let i = 0; i < songs.length && i < expectedSongNames.length; i++) {
      const path = `public/files/database/songs/${expectedSongNames[i]}`;
      console.log(`Uploading song file to path: ${path}`);
      await commitFile(path, songs[i].buffer, `Add/update song ${expectedSongNames[i]}`);
    }

    // Successful upload response
    console.log('All files uploaded successfully');
    res.status(200).json({ message: 'Files uploaded to GitHub successfully.' });

  } catch (error) {
    // Log error and respond with helpful error message
    console.error('Upload error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}