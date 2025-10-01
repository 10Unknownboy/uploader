import { VercelRequest, VercelResponse } from '@vercel/node';
import { Octokit } from 'octokit';
import multer from 'multer';

// Multer memory storage to read files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Instantiate Octokit with auth from environment variables
const octokit = new Octokit({ auth: process.env.GITHUB_PAT });

// Helper to promisify multer middleware
function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) reject(result);
      else resolve(result);
    });
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  await runMiddleware(req, res, upload.fields([{ name: 'images' }, { name: 'songs' }]));

  try {
    const owner = '10Unknownboy'; // your GitHub username
    const repo = 'love-os-ogg';   // your main website repo
    const branch = 'main';        // your default branch

    // Helper: get file SHA if exists (needed to update)
    async function getFileSha(path: string) {
      try {
        const { data } = await octokit.rest.repos.getContent({ owner, repo, path, ref: branch });
        return (data as any).sha;
      } catch {
        return null;
      }
    }

    // Commit/upload file contents
    async function commitFile(path: string, content: Buffer, message: string) {
      const base64Content = content.toString('base64');
      const sha = await getFileSha(path);
      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: base64Content,
        sha: sha || undefined,
        branch,
      });
    }

    // Expected image filenames
    const expectedImageNames = [
      "collage.jpg",
      "memory1.jpg",
      "memory2.jpg",
      "memory3.jpg",
      "memory4.jpg",
      "memory5.jpg",
      "memory6.jpg",
    ];

    const images = (req.files as any).images || [];
    for (let i = 0; i < images.length && i < expectedImageNames.length; i++) {
      const path = `public/files/database/images/${expectedImageNames[i]}`;
      await commitFile(path, images[i].buffer, `Add/update image ${expectedImageNames[i]}`);
    }

    // Expected song filenames
    const expectedSongNames = [
      "song1.mp3",
      "song2.mp3",
      "song3.mp3",
      "song4.mp3",
      "song5.mp3",
      "song6.mp3",
    ];

    const songs = (req.files as any).songs || [];
    for (let i = 0; i < songs.length && i < expectedSongNames.length; i++) {
      const path = `public/files/database/songs/${expectedSongNames[i]}`;
      await commitFile(path, songs[i].buffer, `Add/update song ${expectedSongNames[i]}`);
    }

    res.status(200).json({ message: 'Files uploaded to GitHub successfully.' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}
