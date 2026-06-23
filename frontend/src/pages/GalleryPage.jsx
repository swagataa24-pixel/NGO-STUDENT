import { useEffect, useMemo, useState, useRef } from 'react';
import { Plus, X, Upload, Search, Calendar, Filter, Info } from 'lucide-react';
import './GalleryPage.css';
import { EmptyState } from '../components/EmptyState.jsx';
import { config } from '../config.js';
import { mongoId } from '../utils/api.js';

const today = () => new Date().toISOString().slice(0, 10);

function displayPhotoDate(photo) {
  return photo.date || (photo.activityDate ? photo.activityDate.slice(0, 10) : today());
}

export function GalleryPage({ photos, setPhotos, classes = [] }) {
  const fileInputRef = useRef(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [filters, setFilters] = useState({
    className: 'all',
    activity: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [draft, setDraft] = useState({
    caption: '',
    center: '',
    activity: '',
    date: today(),
    file: null
  });
  const [previewUrl, setPreviewUrl] = useState('');

  // Extract unique classes and activities for filter dropdowns
  const uniqueClasses = useMemo(() => classes.map(c => ({ id: mongoId(c), name: c.name })), [classes]);
  const uniqueActivities = useMemo(() => {
    const activities = new Set(photos.map(p => p.activity || 'Activity proof').filter(Boolean));
    return Array.from(activities);
  }, [photos]);

  // Filtered photos based on filters
  const filteredPhotos = useMemo(() => {
    return photos.filter(photo => {
      // Class filter: If selected class, check if className matches or is 'all'
      if (filters.className !== 'all') {
        const selectedClass = uniqueClasses.find(c => c.name === filters.className);
        if (selectedClass) {
          const photoClassMatch = photo.className === selectedClass.name;
          if (!photoClassMatch) return false;
        }
      }

      // Activity filter
      if (filters.activity !== 'all') {
        const photoActivity = photo.activity || 'Activity proof';
        if (photoActivity !== filters.activity) return false;
      }

      // Date range filters
      if (filters.dateFrom) {
        const photoDate = new Date(displayPhotoDate(photo));
        const fromDate = new Date(filters.dateFrom);
        if (photoDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const photoDate = new Date(displayPhotoDate(photo));
        const toDate = new Date(filters.dateTo);
        if (photoDate > toDate) return false;
      }
      return true;
    });
  }, [photos, filters, uniqueClasses]);

  useEffect(() => {
    if (!draft.file) {
      setPreviewUrl('');
      return () => {};
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
    const newPhoto = {
      id: crypto.randomUUID(),
      imageUrl,
      caption: draft.caption,
      center: draft.center || 'Unassigned center',
      activity: draft.activity || 'Activity proof',
      activityDate: new Date(`${draft.date}T12:00:00`).toISOString(),
      date: draft.date
    };
    setPhotos((items) => [newPhoto, ...items]);
    setDraft({ caption: '', center: '', activity: '', date: today(), file: null });
    setIsFormOpen(false);
  };

  return (
    <section className="section">
      <div className="container page-hero gallery-hero">
        <div>
          <span className="eyebrow">Media Archive</span>
          <h2>Curated Visual Records of On-Ground Impact</h2>
          <p>Document, organize, and explore photo documentation of every transformative moment from your programs.</p>
        </div>
        <div className="hero-actions">
          <button
            className="primary-button"
            onClick={() => setIsFormOpen(prev => !prev)}
          >
            {isFormOpen ? (
              <>
                <X size={18} /> Close
              </>
            ) : (
              <>
                <Plus size={18} /> Upload New Proof
              </>
            )}
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="container gallery-form-section">
          <form className="soft-card form-card" onSubmit={addPhoto}>
            <div className="form-header">
              <div>
                <h3>Add New Activity Proof</h3>
                <p>Upload and preserve visual evidence of your program delivery</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setIsFormOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="form-grid">
              <label className="file-upload-label">
                <span>Upload Photo Proof</span>
                <div className="file-upload-zone" onClick={() => fileInputRef.current?.click()}>
                  {previewUrl ? (
                    <div className="preview-container">
                      <img src={previewUrl} alt="Preview of selected photo" />
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <Upload size={32} />
                      <span>Click or drag & drop a photo here</span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(event) => setDraft((current) => ({ ...current, file: event.target.files?.[0] || null }))}
                    className="file-input-hidden"
                  />
                </div>
              </label>
              <label>
                <span>Photo Caption</span>
                <input
                  type="text"
                  value={draft.caption}
                  onChange={(event) => setDraft((current) => ({ ...current, caption: event.target.value }))}
                  placeholder="Describe this visual moment"
                />
              </label>
              <label>
                <span>Center Location</span>
                <input
                  type="text"
                  value={draft.center}
                  onChange={(event) => setDraft((current) => ({ ...current, center: event.target.value }))}
                  placeholder="Center name"
                />
              </label>
              <label>
                <span>Activity Type</span>
                <select
                  value={draft.activity}
                  onChange={(event) => setDraft((current) => ({ ...current, activity: event.target.value }))}
                >
                  <option value="">Select or type</option>
                  <option>Class session</option>
                  <option>Teacher training</option>
                  <option>Community outreach</option>
                  <option>Volunteer meetup</option>
                  <option>Special event</option>
                </select>
              </label>
              <label>
                <span>Activity Date</span>
                <input
                  type="date"
                  value={draft.date}
                  onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
                />
              </label>
            </div>
            <div className="form-actions">
              <button className="primary-button" type="submit">
                <Upload size={18} /> Save Proof
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="container filters-section">
        <div className="filters-header">
          <div className="filter-icon">
            <Filter size={20} />
            <span>Refine your view</span>
          </div>
          <div className="filters-grid">
            <label className="filter-label">
              <span>
                <Search size={16} />
                Class
              </span>
              <select
                value={filters.className}
                onChange={(e) => setFilters((prev) => ({ ...prev, className: e.target.value }))}
              >
                <option value="all">All classes</option>
                {uniqueClasses.map((cls) => <option key={cls.id} value={cls.name}>{cls.name}</option>)}
              </select>
            </label>

            <label className="filter-label">
              <span>Activity</span>
              <select
                value={filters.activity}
                onChange={(e) => setFilters((prev) => ({ ...prev, activity: e.target.value }))}
              >
                <option value="all">All activities</option>
                {uniqueActivities.map((activity) => <option key={activity} value={activity}>{activity}</option>)}
              </select>
            </label>

            <label className="filter-label">
              <span>
                <Calendar size={16} />
                From
              </span>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                placeholder="From date"
              />
            </label>

            <label className="filter-label">
              <span>To</span>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                placeholder="To date"
              />
            </label>

            <button
              className="secondary-button"
              onClick={() => setFilters({
                className: 'all',
                activity: 'all',
                dateFrom: '',
                dateTo: ''
              })}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      <div className="container gallery-grid-container">
        <div className="gallery-grid">
          {filteredPhotos.length ? filteredPhotos.map((photo) => (
            <figure className="photo-card" key={photo.id || photo._id}>
              <div className="photo-overlay">
                <img src={photo.imageUrl} alt={photo.caption} />
                <div className="photo-actions">
                  <button
                    className="info-button"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <Info size={18} />
                  </button>
                </div>
              </div>
              <figcaption className="photo-details">
                <strong className="photo-caption">{photo.caption}</strong>
                <div className="photo-meta">
                  <span className="meta-item">
                    <span className="meta-label">Activity:</span> {photo.activity}
                  </span>
                  <span className="meta-item">
                    <span className="meta-label">Center:</span> {photo.center || photo.centerId}
                  </span>
                  <span className="meta-item">
                    <span className="meta-label">Date:</span> {displayPhotoDate(photo)}
                  </span>
                </div>
              </figcaption>
            </figure>
          )) : (
            <div className="empty-state-container">
              <EmptyState
                title="No photos found"
                text={photos.length > 0
                  ? "Try adjusting your filters to find what you're looking for."
                  : "Upload your first photo to start documenting your impact!"}
              />
            </div>
          )}
        </div>
      </div>

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div className="photo-modal-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="photo-modal-close"
              onClick={() => setSelectedPhoto(null)}
            >
              <X size={24} />
            </button>
            <div className="photo-modal-image">
              <img src={selectedPhoto.imageUrl} alt={selectedPhoto.caption} />
            </div>
            <div className="photo-modal-info">
              <h3 className="photo-modal-caption">{selectedPhoto.caption}</h3>
              <div className="photo-modal-meta">
                <div className="meta-row">
                  <span className="meta-row-label">Activity</span>
                  <span className="meta-row-value">{selectedPhoto.activity}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-row-label">Center</span>
                  <span className="meta-row-value">{selectedPhoto.center || selectedPhoto.centerId}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-row-label">Date</span>
                  <span className="meta-row-value">{displayPhotoDate(selectedPhoto)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
