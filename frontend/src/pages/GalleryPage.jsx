import { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import './GalleryPage.css';
import { EmptyState } from '../components/EmptyState.jsx';
import { config } from '../config.js';

const today = () => new Date().toISOString().slice(0, 10);

function displayPhotoDate(photo) {
  return photo.date || (photo.activityDate ? photo.activityDate.slice(0, 10) : today());
}

export function GalleryPage({ photos, setPhotos }) {
  const [draft, setDraft] = useState({
    caption: '',
    center: '',
    activity: '',
    date: today(),
    file: null
  });
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!draft.file) {
      setPreviewUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(draft.file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [draft.file]);

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Unable to read the selected file.'));
      reader.readAsDataURL(file);
    });

  const addPhoto = async (event) => {
    event.preventDefault();
    if (!draft.file || !draft.caption.trim()) return;
    const imageUrl = await readFileAsDataUrl(draft.file);
    setPhotos((items) => [
      {
        id: crypto.randomUUID(),
        imageUrl,
        caption: draft.caption,
        center: draft.center || 'Unassigned center',
        activity: draft.activity || 'Activity proof',
        activityDate: new Date(`${draft.date}T12:00:00`).toISOString(),
        date: draft.date
      },
      ...items
    ]);
    setDraft({ caption: '', center: '', activity: '', date: today(), file: null });
  };

  return (
    <section className="section">
      <div className="container page-hero">
        <span className="eyebrow">Media Files</span>
        <h2>Visual verification logs and on-site session documentation.</h2>
      </div>
      <div className="container gallery-layout">
        <form className="soft-card form-card" onSubmit={addPhoto}>
          <h3>Upload proof</h3>
          <label>
            <span>Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setDraft((current) => ({ ...current, file: event.target.files?.[0] || null }))}
            />
          </label>
          <label>
            <span>Caption</span>
            <input value={draft.caption} onChange={(event) => setDraft((current) => ({ ...current, caption: event.target.value }))} />
          </label>
          <label>
            <span>Center</span>
            <input value={draft.center} onChange={(event) => setDraft((current) => ({ ...current, center: event.target.value }))} />
          </label>
          <label>
            <span>Activity</span>
            <input value={draft.activity} onChange={(event) => setDraft((current) => ({ ...current, activity: event.target.value }))} />
          </label>
          <label>
            <span>Activity date</span>
            <input type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} />
          </label>
          <small>
            Cloudinary readiness: {config.cloudName && config.uploadPreset ? 'configured' : 'missing public upload values'}
          </small>
          {previewUrl && (
            <div className="soft-card" style={{ padding: '0.75rem', marginTop: '0.85rem' }}>
              <img src={previewUrl} alt="Selected upload preview" />
            </div>
          )}
          <button className="primary-button">
            <Upload size={18} /> Add photo
          </button>
        </form>
        <div className="gallery-grid">
          {photos.length ? photos.map((photo) => (
            <figure className="photo-card" key={photo.id || photo._id}>
              <img src={photo.imageUrl} alt={photo.caption} />
              <figcaption>
                <strong>{photo.caption}</strong>
                <span>{photo.center || photo.centerId || 'Unassigned center'} / {photo.activity || 'Activity proof'} / {displayPhotoDate(photo)}</span>
              </figcaption>
            </figure>
          )) : <EmptyState title="No uploaded activity photos yet" text="Add one photo proof to see the gallery hierarchy and report linkage work." />}
        </div>
      </div>
    </section>
  );
}
