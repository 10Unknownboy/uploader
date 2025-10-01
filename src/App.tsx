import React, { useState } from 'react';

export default function Uploader() {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [songFiles, setSongFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'song') => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    if (type === 'image') setImageFiles(filesArray);
    else setSongFiles(filesArray);
  };

  const handleUpload = async () => {
    setUploading(true);
    setUploadStatus('Uploading...');
    const formData = new FormData();
    imageFiles.forEach(f => formData.append('images', f));
    songFiles.forEach(f => formData.append('songs', f));

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        setUploadStatus('Upload successful');
        setImageFiles([]);
        setSongFiles([]);
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
            {imageFiles.map(file => (
              <li key={file.name}>{file.name}</li>
            ))}
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
            {songFiles.map(file => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ul>
        )}
      </div>

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
