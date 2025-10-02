import { VercelRequest, VercelResponse } from '@vercel/node';
import { Octokit } from 'octokit';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });
const octokit = new Octokit({ auth: process.env.GITHUB_PAT });

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    console.warn(`Invalid request method: ${req.method}`);
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    await runMiddleware(req, res, upload.fields([{ name: 'images' }, { name: 'songs' }]));
    console.log('Files parsed by multer:', {
      images: req.files?.images?.length || 0,
      songs: req.files?.songs?.length || 0,
    });

    const owner = '10Unknownboy';
    const repo = 'love-os-ogg';
    const branch = 'main';

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

    async function commitFile(path: string, content: Buffer | string, message: string) {
      try {
        const base64Content = typeof content === 'string'
          ? Buffer.from(content).toString('base64')
          : content.toString('base64');
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
        console.log(`Committed file ${path}`);
      } catch (error) {
        console.error(`Commit failed for file ${path}:`, error);
        throw error;
      }
    }

    const expectedImageNames = [
      "collage.jpg",
      "memory1.jpg",
      "memory2.jpg",
      "memory3.jpg",
      "memory4.jpg",
      "memory5.jpg",
      "memory6.jpg",
    ];

    const songTitles = req.body.songTitles ? JSON.parse(req.body.songTitles) : [];
    const songArtists = req.body.songArtists ? JSON.parse(req.body.songArtists) : [];
    console.log('Parsed song titles:', songTitles);
    console.log('Parsed song artists:', songArtists);

    // Save metadata.json to public/files/database folder for frontend access
    const songMetadata = expectedImageNames.map((_, idx) => ({
      title: songTitles[idx] || '',
      artist: songArtists[idx] || '',
      filename: `song${idx + 1}.mp3`,
    }));

    const metadataPath = 'public/files/database/metadata.json';
    console.log('Committing song metadata file to:', metadataPath);
    await commitFile(metadataPath, JSON.stringify(songMetadata, null, 2), 'Update song metadata');

    const images = (req.files as any).images || [];
    console.log(`Processing ${images.length} images`);
    for (let i = 0; i < images.length && i < expectedImageNames.length; i++) {
      const path = `public/files/database/images/${expectedImageNames[i]}`;
      console.log(`Uploading image file to path: ${path}`);
      await commitFile(path, images[i].buffer, `Add/update image ${expectedImageNames[i]}`);
    }

    const expectedSongNames = [
      "song1.mp3",
      "song2.mp3",
      "song3.mp3",
      "song4.mp3",
      "song5.mp3",
      "song6.mp3",
    ];

    const songs = (req.files as any).songs || [];
    console.log(`Processing ${songs.length} songs`);
    for (let i = 0; i < songs.length && i < expectedSongNames.length; i++) {
      const path = `public/files/database/songs/${expectedSongNames[i]}`;
      console.log(`Uploading song file to path: ${path}`);
      await commitFile(path, songs[i].buffer, `Add/update song ${expectedSongNames[i]}`);
    }

    console.log('All files and metadata uploaded successfully');
    res.status(200).json({ message: 'Files and metadata uploaded to GitHub successfully.' });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}
