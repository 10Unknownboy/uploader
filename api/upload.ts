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
    console.log('Files parsed:', {
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
    // New stats values sent as JSON string in request body
    const statsValues = req.body.statsValues ? JSON.parse(req.body.statsValues) : [];

    console.log('Parsed song titles:', songTitles);
    console.log('Parsed song artists:', songArtists);
    console.log('Parsed stats values:', statsValues);

    // Build song metadata array
    const songMetadata = expectedImageNames.map((_, idx) => ({
      title: songTitles[idx] || '',
      artist: songArtists[idx] || '',
      filename: `song${idx + 1}.mp3`,
    }));

    // Fixed stats tiles data except value, which is replaced by uploader inputs
    const statsTiles = [
      { title: "Days Together", subtitle: "and counting... 💕", icon: "📅", type: "counter" },
      { title: "Relationship Started", subtitle: "best decision ever", icon: "🌟", type: "date" },
      { title: "First Date", subtitle: "Christmas magic ✨", icon: "🎄", type: "date" },
      { title: "First Kiss", subtitle: "butterflies everywhere", icon: "💋", type: "location" },
      { title: "First Hug", subtitle: "home in your arms", icon: "🤗", type: "location" },
      { title: "Best Day", subtitle: "guess what happened... 😉", icon: "🎉", type: "date" },
      { title: "Most Used Word", subtitle: "so stubborn! 😂", icon: "💬", type: "text" },
      { title: "Total Messages", subtitle: "never running out of words", icon: "📱", type: "progress", max: 700000 },
      { title: "Her Words", subtitle: "always has more to say 💖", icon: "👩‍💋‍👨", type: "progress", max: 40000 },
      { title: "His Words", subtitle: "quality over quantity 😎", icon: "👨‍💋‍👩", type: "progress", max: 40000 },
      { title: "Reels Shared", subtitle: "sharing laughs daily", icon: "🎬", type: "progress", max: 20000 },
      { title: "Love Count", subtitle: "never enough I love yous", icon: "❤️", type: "progress", max: 15000 },
    ];

    // Merge stats tiles with uploaded values from uploader
    const statsMetadata = statsTiles.map((tile, i) => ({
      ...tile,
      value: statsValues[i] || "xyz"
    }));

    // Combine all metadata into one array or object as needed for your frontend
    const combinedMetadata = {
      songs: songMetadata,
      stats: statsMetadata,
    };

    const metadataPath = 'public/files/database/metadata.json';
    await commitFile(metadataPath, JSON.stringify(combinedMetadata, null, 2), 'Update combined metadata');

    // Commit images
    const images = (req.files as any).images || [];
    for (let i = 0; i < images.length && i < expectedImageNames.length; i++) {
      const path = `public/files/database/images/${expectedImageNames[i]}`;
      await commitFile(path, images[i].buffer, `Add/update image ${expectedImageNames[i]}`);
    }

    // Commit songs
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

    res.status(200).json({ message: 'Files and metadata uploaded to GitHub successfully.' });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}