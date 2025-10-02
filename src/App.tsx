import React, { useState } from 'react';

// Stats tiles titles - max 12
const statsTileTitles = [
  "Days Together",
  "Relationship Started",
  "First Date",
  "First Kiss",
  "First Hug",
  "Best Day",
  "Most Used Word",
  "Total Messages",
  "Her Words",
  "His Words",
  "Reels Shared",
  "Love Count"
];

export default function Uploader() {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [songFiles, setSongFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploading, setUploading] = useState(false);

  // Existing state for song titles/artists
  const [songTitles, setSongTitles] = useState<string[]>(Array(6).fill(''));
  const [songArtists, setSongArtists] = useState<string[]>(Array(6).fill(''));

  // New state for stats tiles values (12)
  const [statsValues, setStatsValues] = useState<string[]>(Array(12).fill(''));

  // Existing handlers for files and song text fields...
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'song') => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    if (type === 'image') setImageFiles(filesArray);
    else setSongFiles(filesArray);
  };

  const handleTitleChange = (index: number, value: string) => {
    setSongTitles(prev => {
      const newTitles = [...prev];
      newTitles[index] = value;
      return newTitles;
    });
  };

  const handleArtistChange = (index: number, value: string) => {
    setSongArtists(prev => {
      const newArtists = [...prev];
      newArtists[index] = value;
      return newArtists;
    });
  };

  // New handler for stats values changes
  const handleStatValueChange = (index: number, value: string) => {
    setStatsValues(prev => {
      const newValues = [...prev];
      newValues[index] = value;
      return newValues;
    });
  };

  const handleUpload = async () => {
    setUploading(true);
    setUploadStatus('Uploading...');
    const formData = new FormData();

    imageFiles.forEach(f => formData.append('images', f));
    songFiles.forEach(f => formData.append('songs', f));

    formData.append('songTitles', JSON.stringify(songTitles));
    formData.append('songArtists', JSON.stringify(songArtists));
    formData.append('statsValues', JSON.stringify(statsValues));

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        setUploadStatus('Upload successful');
        setImageFiles([]);
        setSongFiles([]);
        setSongTitles(Array(6).fill(''));
        setSongArtists(Array(6).fill(''));
        setStatsValues(Array(12).fill(''));
      } else {
        const error = await res.json();
        setUploadStatus(`Upload failed: ${error?.error || 'Unknown error'}`);
      }
    } catch (err) {
      setUploadStatus(`Upload failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4">Uploader</h2>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Images (multiple):</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={e => handleFileChange(e, 'image')}
          disabled={uploading}
        />
        {imageFiles.length > 0 && (
          <ul className="mt-2 list-disc list-inside text-sm">
            {imageFiles.map(file => <li key={file.name}>{file.name}</li>)}
          </ul>
        )}
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Songs (multiple):</label>
        <input
          type="file"
          multiple
          accept="audio/*"
          onChange={e => handleFileChange(e, 'song')}
          disabled={uploading}
        />
        {songFiles.length > 0 && (
          <ul className="mt-2 list-disc list-inside text-sm">
            {songFiles.map(file => <li key={file.name}>{file.name}</li>)}
          </ul>
        )}
      </div>

      <h3 className="font-bold mb-2">Song Details</h3>
      {Array(6).fill(0).map((_, idx) => (
        <div key={idx} className="mb-3 grid grid-cols-2 gap-2">
          <input
            className="border p-2 rounded"
            type="text"
            placeholder={`Song ${idx + 1} Title`}
            value={songTitles[idx]}
            onChange={e => handleTitleChange(idx, e.target.value)}
            disabled={uploading}
          />
          <input
            className="border p-2 rounded"
            type="text"
            placeholder={`Song ${idx + 1} Artist`}
            value={songArtists[idx]}
            onChange={e => handleArtistChange(idx, e.target.value)}
            disabled={uploading}
          />
        </div>
      ))}

      <h3 className="font-bold mb-2 mt-6">Stats Tiles Values</h3>
      {statsTileTitles.map((title, idx) => (
        <div key={idx} className="mb-3">
          <label className="block mb-1 font-semibold">{title}</label>
          <input
            className="border p-2 rounded w-full"
            type="text"
            placeholder={`Enter value for ${title}`}
            value={statsValues[idx]}
            onChange={e => handleStatValueChange(idx, e.target.value)}
            disabled={uploading}
          />
        </div>
      ))}

      <button
        onClick={handleUpload}
        disabled={uploading || (imageFiles.length === 0 && songFiles.length === 0)}
        className="mt-4 p-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>

      {uploadStatus && <p className="mt-2 text-center">{uploadStatus}</p>}
    </div>
  );
}
