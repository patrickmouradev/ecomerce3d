import React, { useState, useEffect } from 'react';
import { Star, Eye, EyeOff, MessageSquare, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { reviewService } from '../../services/reviewService';
import type { ProductReviewItem } from '../../services/reviewService';

export const Reviews: React.FC = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<ProductReviewItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await reviewService.getAllAdminReviews();
      setReviews(data);
    } catch (e) {
      console.error('Erro ao carregar avaliações no admin', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (id: string, currentVisible: boolean) => {
    try {
      await reviewService.toggleVisibilityAdmin(id, !currentVisible);
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, visible: !currentVisible } : r))
      );
    } catch (e) {
      console.error('Erro ao alternar visibilidade', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta avaliação e suas fotos?')) return;
    try {
      await reviewService.deleteReviewAdmin(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      console.error('Erro ao excluir avaliação', e);
    }
  };

  const handleSendReply = async (id: string) => {
    if (!replyText.trim()) return;
    setActionLoading(true);
    try {
      const updated = await reviewService.replyReviewAdmin(id, replyText.trim());
      setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setReplyingReviewId(null);
      setReplyText('');
    } catch (e) {
      console.error('Erro ao responder avaliação', e);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1100px' }}>
      <button
        onClick={() => navigate('/admin/dashboard')}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.9rem',
          marginBottom: '1rem'
        }}
      >
        <ArrowLeft size={16} />
        Voltar ao Dashboard
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontFamily: 'var(--font-display)', color: '#fff', margin: 0 }}>
            Moderação de Avaliações
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Gerencie, responda ou oculte os feedbacks e fotos enviadas pelos clientes
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Carregando avaliações...
        </div>
      ) : reviews.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', borderRadius: 'var(--radius-md)' }}>
          <Star size={42} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.4 }} />
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Nenhuma avaliação recebida ainda</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            As avaliações enviadas pelos compradores após a entrega dos pedidos aparecerão aqui.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="glass-panel"
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                border: rev.visible ? '1px solid var(--border-color)' : '1px solid rgba(255, 77, 79, 0.35)',
                opacity: rev.visible ? 1 : 0.75
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <strong style={{ color: '#fff', fontSize: '1rem' }}>{rev.authorName}</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>• {rev.createdAt}</span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.1rem 0.45rem',
                        borderRadius: '4px',
                        background: rev.visible ? 'rgba(0, 255, 136, 0.12)' : 'rgba(255, 77, 79, 0.12)',
                        color: rev.visible ? 'var(--success)' : 'var(--danger)',
                        fontWeight: 700
                      }}
                    >
                      {rev.visible ? 'Pública' : 'Oculta'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                    Produto: {rev.productName}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {/* Estrelas */}
                  <div style={{ display: 'flex', gap: '0.15rem', marginRight: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={15}
                        fill={rev.rating >= s ? '#ffc107' : 'none'}
                        color={rev.rating >= s ? '#ffc107' : 'rgba(255, 255, 255, 0.2)'}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleVisibility(rev.id, rev.visible)}
                    className="btn btn-secondary"
                    title={rev.visible ? 'Ocultar avaliação' : 'Tornar pública'}
                    style={{ padding: '0.4rem 0.65rem', fontSize: '0.78rem' }}
                  >
                    {rev.visible ? <EyeOff size={14} /> : <Eye size={14} />}
                    {rev.visible ? 'Ocultar' : 'Exibir'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReplyingReviewId(rev.id);
                      setReplyText(rev.adminReply || '');
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.65rem', fontSize: '0.78rem' }}
                  >
                    <MessageSquare size={14} /> Responder
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(rev.id)}
                    className="btn btn-danger"
                    title="Excluir avaliação"
                    style={{ padding: '0.4rem 0.65rem', fontSize: '0.78rem' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {rev.comment && (
                <p style={{ margin: '0 0 0.85rem', color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  "{rev.comment}"
                </p>
              )}

              {/* Fotos enviadas */}
              {rev.photosUrls && rev.photosUrls.length > 0 && (
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                  {rev.photosUrls.map((pUrl, pIdx) => (
                    <img
                      key={pIdx}
                      src={pUrl}
                      alt="Foto anexada"
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.open(pUrl, '_blank')}
                    />
                  ))}
                </div>
              )}

              {/* Resposta Atual */}
              {rev.adminReply && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    background: 'rgba(0, 240, 255, 0.05)',
                    borderLeft: '3px solid var(--primary)',
                    fontSize: '0.85rem'
                  }}
                >
                  <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.2rem' }}>
                    Sua Resposta ({rev.adminRepliedAt}):
                  </strong>
                  <span style={{ color: 'var(--text-secondary)' }}>{rev.adminReply}</span>
                </div>
              )}

              {/* Caixa para Responder */}
              {replyingReviewId === rev.id && (
                <div style={{ marginTop: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                  <textarea
                    rows={2}
                    className="form-input"
                    placeholder="Digite sua resposta oficial da loja..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    style={{ width: '100%', resize: 'none', marginBottom: '0.5rem' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setReplyingReviewId(null)}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading || !replyText.trim()}
                      onClick={() => handleSendReply(rev.id)}
                      className="btn btn-primary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      {actionLoading ? 'Salvando...' : 'Salvar Resposta'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;
