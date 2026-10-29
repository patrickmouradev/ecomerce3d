import React, { useState } from 'react';
import { Star, Upload, X } from 'lucide-react';
import { reviewService } from '../services/reviewService';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  productId: string;
  productName: string;
  onReviewSubmitted: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  orderId,
  productId,
  productName,
  onReviewSubmitted
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);

    if (photos.length + newFiles.length > 3) {
      setError('Você pode anexar no máximo 3 fotos.');
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const f of newFiles) {
      if (f.size > 10 * 1024 * 1024) {
        setError(`A foto ${f.name} ultrapassa 10 MB.`);
        continue;
      }
      validFiles.push(f);
      newPreviews.push(URL.createObjectURL(f));
    }

    setPhotos((prev) => [...prev, ...validFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemovePhoto = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await reviewService.submitReview(productId, orderId, rating, comment, photos);
      onReviewSubmitted();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Falha ao enviar avaliação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '540px',
          width: '100%',
          padding: '1.75rem',
          borderRadius: 'var(--radius-md)',
          background: '#0d1117',
          border: '1px solid var(--border-glow)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.25rem' }}>Avaliar Produto</h3>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {productName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(255, 77, 79, 0.1)', border: '1px solid var(--danger)', padding: '0.6rem 0.85rem', borderRadius: '6px', color: 'var(--danger)', fontSize: '0.82rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Estrelas */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
              Sua Nota para a Peça:
            </label>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (hoverRating !== null ? hoverRating : rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.2rem',
                      color: filled ? '#ffc107' : 'rgba(255, 255, 255, 0.2)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <Star size={30} fill={filled ? '#ffc107' : 'none'} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comentário */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
              O que achou da qualidade, acabamento e resistência?
            </label>
            <textarea
              rows={3}
              className="form-input"
              placeholder="Conte o que achou da sua impressão 3D (opcional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ width: '100%', resize: 'none' }}
            />
          </div>

          {/* Upload de Fotos */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
              Anexe Fotos da Peça Pronta (Até 3 fotos):
            </label>

            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {previews.map((src, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'relative',
                    width: '74px',
                    height: '74px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid var(--primary)'
                  }}
                >
                  <img src={src} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: 'rgba(0,0,0,0.7)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {photos.length < 3 && (
                <label
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '8px',
                    border: '1px dashed var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.02)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.68rem',
                    gap: '0.25rem'
                  }}
                >
                  <Upload size={18} style={{ color: 'var(--primary)' }} />
                  <span>Foto</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handlePhotoSelect}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ fontWeight: 700 }}>
              {loading ? 'Enviando...' : 'Publicar Avaliação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
