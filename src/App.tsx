import React, { useState } from 'react';

export default function Uploader() {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [songFiles, setSongFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'song') => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    if (type === 'image') setImageFiles(filesArray);
    else setSongFiles(filesArray);
  };

  const handleUpload = async () => {
    setUploadStatus('Uploading...');
    const formData = new FormData();
    imageFiles.forEach(f => formData.append('images', f));
    songFiles.forEach(f => formData.append('songs', f));

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (res.ok) setUploadStatus('Upload successful');
    else setUploadStatus('Upload failed');
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4">Uploader</h2>
      <label>Images (multiple)</label><br />
      <input type="file" multiple accept="image/*" onChange={e => handleFileChange(e, 'image')} /> <br /><br />
      <label>Songs (multiple)</label><br />
      <input type="file" multiple accept="audio/*" onChange={e => handleFileChange(e, 'song')} /> <br /><br />
      <button onClick={handleUpload} className="mt-4 p-2 bg-blue-600 text-white rounded">Upload</button>
      <p className="mt-2">{uploadStatus}</p>
    </div>
  );
}
