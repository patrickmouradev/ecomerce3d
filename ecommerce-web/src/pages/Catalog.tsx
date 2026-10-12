import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  X,
  ZoomIn,
  Plus,
  Minus,
  Check,
  Image as ImageIcon,
  ShieldCheck,
  Truck,
  Package,
  Sparkles
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  salePriceParticular: number;
  weightG?: number;
  filaments?: {
    filamentId: string;
    filamentLabel: string;
    weightG: number;
    pricePerKg: number;
  }[];
  imagesVideosPaths: string[];
}

interface Banner {
  id: string;
  title: string;
  imagePath: string;
  productId: string;
}

/* =========================================================================
   COMPONENTE: CARD DO PRODUTO (COM CARROSSEL E DIMENSIONAMENTO PREMIUM)
   ========================================================================= */
const ProductCard: React.FC<{
  product: Product;
  onOpenDetails: (product: Product) => void;
}> = ({ product, onOpenDetails }) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const mediaList = product.imagesVideosPaths || [];
  const hasMultipleMedia = mediaList.length > 1;
  const currentMedia = mediaList.length > 0 ? mediaList[currentMediaIndex] : null;
  const isVideo = currentMedia?.toLowerCase().endsWith('.mp4');

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasMultipleMedia) return;
    setCurrentMediaIndex((prev) => (prev + 1) % mediaList.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasMultipleMedia) return;
    setCurrentMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  };

  // Formata materiais de forma limpa sem quebrar o layout
  const materials = Array.from(
    new Set(
      product.filaments
        ?.map((f) => (f.filamentLabel ? f.filamentLabel.split(' - ')[0].trim() : ''))
        .filter(Boolean) || []
    )
  );

  return (
    <div
      className="glass-panel"
      onClick={() => onOpenDetails(product)}
      style={{
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'var(--transition-normal)',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.borderColor = 'var(--primary)';
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 240, 255, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.3)';
      }}
    >
      {/* Contêiner da Imagem / Carrossel no Card */}
      <div
        style={{
          height: '240px',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #13161d 0%, #08090c 100%)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {currentMedia ? (
          isVideo ? (
            <video
              src={currentMedia}
              autoPlay
              loop
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <img
              src={currentMedia}
              alt={product.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.4s ease'
              }}
            />
          )
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: 'var(--text-muted)'
            }}
          >
            <ImageIcon size={38} opacity={0.35} />
            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Sem Imagem</span>
          </div>
        )}

        {/* Setas de Navegação no Card */}
        {hasMultipleMedia && (
          <>
            <button
              onClick={handlePrev}
              title="Foto anterior"
              style={{
                position: 'absolute',
                left: '0.6rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(8, 9, 12, 0.75)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3,
                transition: 'var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--primary)';
                e.currentTarget.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(8, 9, 12, 0.75)';
                e.currentTarget.style.color = '#fff';
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={handleNext}
              title="Próxima foto"
              style={{
                position: 'absolute',
                right: '0.6rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(8, 9, 12, 0.75)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3,
                transition: 'var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--primary)';
                e.currentTarget.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(8, 9, 12, 0.75)';
                e.currentTarget.style.color = '#fff';
              }}
            >
              <ChevronRight size={16} />
            </button>

            {/* Indicador de fotos (Dots) */}
            <div
              style={{
                position: 'absolute',
                bottom: '0.6rem',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '0.35rem',
                zIndex: 3,
                background: 'rgba(0, 0, 0, 0.5)',
                padding: '0.2rem 0.5rem',
                borderRadius: '12px',
                backdropFilter: 'blur(4px)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {mediaList.map((_, idx) => (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentMediaIndex(idx);
                  }}
                  style={{
                    width: idx === currentMediaIndex ? '16px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    background: idx === currentMediaIndex ? 'var(--primary)' : 'rgba(255, 255, 255, 0.4)',
                    transition: 'all 0.25s ease',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* Badge de Material Compacta */}
        {materials.length > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '0.75rem',
              right: '0.75rem',
              background: 'rgba(16, 18, 22, 0.85)',
              backdropFilter: 'blur(6px)',
              color: 'var(--text-primary)',
              padding: '0.25rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 600,
              border: '1px solid var(--border-color)',
              zIndex: 2,
              letterSpacing: '0.02em',
              maxWidth: '180px',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }}
          >
            {materials.slice(0, 2).join(', ')}
            {materials.length > 2 ? ` +${materials.length - 2}` : ''}
          </span>
        )}

        {/* Contador de Mídias */}
        {hasMultipleMedia && (
          <span
            style={{
              position: 'absolute',
              top: '0.75rem',
              left: '0.75rem',
              background: 'rgba(16, 18, 22, 0.75)',
              backdropFilter: 'blur(6px)',
              color: 'var(--text-secondary)',
              padding: '0.2rem 0.45rem',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 600,
              border: '1px solid var(--border-color)',
              zIndex: 2
            }}
          >
            {currentMediaIndex + 1}/{mediaList.length}
          </span>
        )}
      </div>

      {/* Conteúdo do Card */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3
          style={{
            fontSize: '1.15rem',
            color: '#fff',
            marginBottom: '0.5rem',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {product.name}
        </h3>
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            marginBottom: '1.25rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flex: 1
          }}
        >
          {product.description || 'Peça impressa sob medida com alta resolução e precisão técnica.'}
        </p>

        {/* Preço e Botão */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', gap: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
              Preço final
            </span>
            <span style={{ fontSize: '1.35rem', color: 'var(--success)', fontWeight: 800 }}>
              {product.salePriceParticular?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          <button
            className="btn btn-primary"
            style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(product);
            }}
          >
            <ShoppingCart size={15} />
            Ver Peça
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   COMPONENTE: MODAL DE DETALHES DO PRODUTO (UX & CONVERSÃO DE VENDAS)
   ========================================================================= */
const ProductDetailModal: React.FC<{
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenLightbox: (index: number) => void;
  onAddToCart: (product: Product, quantity: number) => void;
}> = ({ product, isOpen, onClose, onOpenLightbox, onAddToCart }) => {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  useEffect(() => {
    setSelectedMediaIndex(0);
    setQuantity(1);
    setAddedAnimation(false);
  }, [product]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const mediaList = product.imagesVideosPaths || [];
  const hasMedia = mediaList.length > 0;
  const currentMedia = hasMedia ? mediaList[selectedMediaIndex] : null;
  const isVideo = currentMedia?.toLowerCase().endsWith('.mp4');

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
    }, 2000);
  };

  const handleNextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mediaList.length <= 1) return;
    setSelectedMediaIndex((prev) => (prev + 1) % mediaList.length);
  };

  const handlePrevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mediaList.length <= 1) return;
    setSelectedMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  };

  const unitPrice = product.salePriceParticular || 0;
  const totalPrice = unitPrice * quantity;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="product-detail-modal" style={{ maxWidth: '960px', width: '100%', position: 'relative' }}>
        {/* Topo do Modal */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-surface-1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Detalhes da Peça 3D
            </span>
          </div>
          <button
            onClick={onClose}
            title="Fechar (ESC)"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo do Modal em 2 Colunas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '2rem',
            padding: '1.75rem',
            overflowY: 'auto'
          }}
        >
          {/* Coluna 1: Galeria de Imagens e Zoom */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              onClick={() => {
                if (hasMedia && !isVideo) {
                  onOpenLightbox(selectedMediaIndex);
                }
              }}
              style={{
                position: 'relative',
                height: '380px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: '#090a0d',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: hasMedia && !isVideo ? 'zoom-in' : 'default',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
              }}
            >
              {currentMedia ? (
                isVideo ? (
                  <video
                    src={currentMedia}
                    autoPlay
                    loop
                    controls
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <>
                    <img
                      src={currentMedia}
                      alt={product.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        transition: 'transform 0.3s ease'
                      }}
                    />
                    {/* Botão Flutuante de Zoom */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0.85rem',
                        right: '0.85rem',
                        background: 'rgba(8, 9, 12, 0.85)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid var(--primary-glow-strong)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.35rem 0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        color: 'var(--primary)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                      }}
                    >
                      <ZoomIn size={14} />
                      Clique para tamanho real
                    </div>
                  </>
                )
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <ImageIcon size={48} opacity={0.3} />
                  <span>Nenhuma foto cadastrada</span>
                </div>
              )}

              {/* Setas de navegação no modal de detalhe */}
              {mediaList.length > 1 && (
                <>
                  <button
                    onClick={handlePrevMedia}
                    title="Foto anterior"
                    style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(8, 9, 12, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 4
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={handleNextMedia}
                    title="Próxima foto"
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(8, 9, 12, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 4
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Carrossel de Miniaturas (Thumbnails) */}
            {mediaList.length > 1 && (
              <div
                style={{
                  display: 'flex',
                  gap: '0.6rem',
                  overflowX: 'auto',
                  paddingBottom: '0.35rem'
                }}
              >
                {mediaList.map((mediaUrl, idx) => {
                  const isThumbVideo = mediaUrl.toLowerCase().endsWith('.mp4');
                  const isSelected = idx === selectedMediaIndex;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedMediaIndex(idx)}
                      style={{
                        width: '68px',
                        height: '68px',
                        flexShrink: 0,
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        boxShadow: isSelected ? '0 0 12px var(--primary-glow)' : 'none',
                        background: '#0a0c10',
                        padding: 0,
                        cursor: 'pointer',
                        opacity: isSelected ? 1 : 0.65,
                        transition: 'var(--transition-fast)'
                      }}
                    >
                      {isThumbVideo ? (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
                          <span style={{ fontSize: '0.65rem', color: '#fff', fontWeight: 700 }}>VÍDEO</span>
                        </div>
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={`Thumbnail ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Coluna 2: Informações de Venda, Especificações & Conversão */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h2
                style={{
                  fontSize: '1.65rem',
                  fontFamily: 'var(--font-display)',
                  color: '#fff',
                  lineHeight: 1.25,
                  marginBottom: '0.75rem'
                }}
              >
                {product.name}
              </h2>

              {/* Box de Preço Unitário */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.75rem',
                  background: 'rgba(0, 255, 136, 0.05)',
                  border: '1px solid rgba(0, 255, 136, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                    Preço Unitário
                  </span>
                  <span style={{ fontSize: '1.8rem', color: 'var(--success)', fontWeight: 800 }}>
                    {unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                  À vista ou parcelado
                </span>
              </div>
            </div>

            {/* Descrição do Produto */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                Descrição da Peça
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {product.description || 'Peça impressa em tecnologia 3D com precisão, resistência estrutural e acabamento minucioso.'}
              </p>
            </div>

            {/* Materiais e Especificações */}
            {product.filaments && product.filaments.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                  Materiais e Filamentos Utilizados
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {product.filaments.map((f, i) => (
                    <span
                      key={i}
                      style={{
                        background: 'rgba(0, 240, 255, 0.06)',
                        border: '1px solid rgba(0, 240, 255, 0.25)',
                        color: 'var(--primary)',
                        padding: '0.35rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                    >
                      {f.filamentLabel} {f.weightG ? `(${f.weightG}g)` : ''}
                    </span>
                  ))}
                  {product.weightG && (
                    <span
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        padding: '0.35rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem'
                      }}
                    >
                      Peso Total Aprox: <strong>{product.weightG}g</strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Seletor de Quantidade e Subtotal */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-3)',
                border: '1px solid var(--border-color)'
              }}
            >
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                  Selecione a Quantidade
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface-1)',
                      border: '1px solid var(--border-color)',
                      color: quantity <= 1 ? 'var(--text-muted)' : '#fff',
                      cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      fontWeight: 700
                    }}
                  >
                    <Minus size={14} />
                  </button>

                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setQuantity(isNaN(val) || val < 1 ? 1 : val);
                    }}
                    style={{
                      width: '54px',
                      height: '34px',
                      textAlign: 'center',
                      background: 'var(--bg-surface-1)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '1rem',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface-1)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      fontWeight: 700
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Subtotal da Quantidade */}
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Subtotal ({quantity}x)
                </span>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddToCart}
                style={{
                  width: '100%',
                  padding: '0.9rem 1.5rem',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  background: addedAnimation ? 'var(--success)' : undefined,
                  borderColor: addedAnimation ? 'var(--success)' : undefined
                }}
              >
                {addedAnimation ? (
                  <>
                    <Check size={20} />
                    Adicionado ao Carrinho!
                  </>
                ) : (
                  <>
                    <ShoppingCart size={20} />
                    Adicionar ao Carrinho • {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              >
                Fechar e Continuar Comprando
              </button>
            </div>

            {/* Selos de Confiança (Gatilhos de Vendas) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '0.75rem',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '1rem',
                marginTop: 'auto'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                <ShieldCheck size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span>Impressão de Alta Precisão</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                <Package size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span>Embalagem Anti-Impacto</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                <Truck size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span>Envio para Todo o Brasil</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   COMPONENTE: LIGHTBOX EM TAMANHO REAL SALVO
   ========================================================================= */
const LightboxModal: React.FC<{
  isOpen: boolean;
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}> = ({ isOpen, images, currentIndex, onClose, onNavigate }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && images.length > 1) {
        onNavigate((currentIndex + 1) % images.length);
      }
      if (e.key === 'ArrowLeft' && images.length > 1) {
        onNavigate((currentIndex - 1 + images.length) % images.length);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images, onClose, onNavigate]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const isVideo = currentImage?.toLowerCase().endsWith('.mp4');

  return (
    <div
      className="lightbox-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Topo do Lightbox */}
      <div
        style={{
          position: 'absolute',
          top: '1.25rem',
          left: '1.5rem',
          right: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 2010
        }}
      >
        <span
          style={{
            background: 'rgba(0, 240, 255, 0.15)',
            border: '1px solid var(--primary)',
            color: 'var(--primary)',
            padding: '0.35rem 0.85rem',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 700
          }}
        >
          Foto {currentIndex + 1} de {images.length} • Tamanho Real Salvo
        </span>

        <button
          onClick={onClose}
          title="Fechar (ESC)"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--danger)';
            e.currentTarget.style.borderColor = 'var(--danger)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          <X size={22} />
        </button>
      </div>

      {/* Conteúdo Central em Tamanho Real */}
      <div
        style={{
          maxWidth: '95vw',
          maxHeight: '85vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            src={currentImage}
            controls
            autoPlay
            style={{
              maxWidth: '95vw',
              maxHeight: '85vh',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 0 50px rgba(0,0,0,0.8)'
            }}
          />
        ) : (
          <img
            src={currentImage}
            alt={`Foto em tamanho real ${currentIndex + 1}`}
            style={{
              maxWidth: '95vw',
              maxHeight: '85vh',
              objectFit: 'contain',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 0 50px rgba(0,0,0,0.8)'
            }}
          />
        )}
      </div>

      {/* Setas de Navegação */}
      {images.length > 1 && (
        <>
          <button
            onClick={() => onNavigate((currentIndex - 1 + images.length) % images.length)}
            title="Foto anterior (Seta esquerda)"
            style={{
              position: 'absolute',
              left: '1.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(16, 18, 22, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2010
            }}
          >
            <ChevronLeft size={28} />
          </button>

          <button
            onClick={() => onNavigate((currentIndex + 1) % images.length)}
            title="Próxima foto (Seta direita)"
            style={{
              position: 'absolute',
              right: '1.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(16, 18, 22, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2010
            }}
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}
    </div>
  );
};

/* =========================================================================
   PÁGINA PRINCIPAL: CATÁLOGO DE PRODUTOS
   ========================================================================= */
export const Catalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [direction, setDirection] = useState('asc');

  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  // Estados dos Modais
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Feedback do Carrinho
  const [cartCount, setCartCount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inicializa contador do carrinho
  useEffect(() => {
    updateCartBadge();
    const handleCartUpdate = () => updateCartBadge();
    window.addEventListener('cart_updated', handleCartUpdate);
    return () => window.removeEventListener('cart_updated', handleCartUpdate);
  }, []);

  const updateCartBadge = () => {
    try {
      const items = JSON.parse(localStorage.getItem('3dprintpng_cart') || '[]');
      const count = items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  };

  // Carrega produtos e banners
  useEffect(() => {
    fetchCatalog();
    fetchBanners();
  }, [searchQuery, sortBy, direction]);

  // Carrossel automático de Banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  const fetchCatalog = async () => {
    try {
      const response = await api.get('/api/products', {
        params: {
          query: searchQuery,
          sortBy: sortBy,
          direction: direction
        }
      });
      setProducts(response.data);
    } catch (e) {
      console.error('Erro ao carregar catálogo', e);
    }
  };

  const fetchBanners = async () => {
    try {
      const response = await api.get('/api/banners');
      setBanners(response.data);
    } catch (e) {
      console.error('Erro ao carregar banners', e);
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'price_asc') {
      setSortBy('price');
      setDirection('asc');
    } else if (val === 'price_desc') {
      setSortBy('price');
      setDirection('desc');
    } else if (val === 'date_desc') {
      setSortBy('date');
      setDirection('desc');
    } else if (val === 'date_asc') {
      setSortBy('date');
      setDirection('asc');
    }
  };

  const handleOpenDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailModalOpen(false);
  };

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const handleCloseLightbox = () => {
    setLightboxIndex(null);
  };

  const handleAddToCart = (product: Product, quantity: number) => {
    try {
      const existingCart = JSON.parse(localStorage.getItem('3dprintpng_cart') || '[]');
      const existingIndex = existingCart.findIndex((item: any) => item.id === product.id);

      if (existingIndex >= 0) {
        existingCart[existingIndex].quantity = (existingCart[existingIndex].quantity || 1) + quantity;
      } else {
        existingCart.push({
          id: product.id,
          name: product.name,
          price: product.salePriceParticular,
          quantity: quantity,
          image: product.imagesVideosPaths && product.imagesVideosPaths.length > 0 ? product.imagesVideosPaths[0] : null,
          filaments: product.filaments
        });
      }

      localStorage.setItem('3dprintpng_cart', JSON.stringify(existingCart));
      window.dispatchEvent(new Event('cart_updated'));

      setToastMessage(`${quantity}x "${product.name}" adicionado ao carrinho!`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (e) {
      console.error('Erro ao salvar no carrinho', e);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      {/* Toast de Notificação de Adição ao Carrinho */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            background: 'rgba(16, 18, 22, 0.95)',
            border: '1px solid var(--success)',
            color: '#fff',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 30px rgba(0, 255, 136, 0.25)',
            backdropFilter: 'blur(10px)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--success-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--success)'
            }}
          >
            <Check size={16} />
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              marginLeft: '0.5rem'
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Banner de Destaque / Carrossel */}
      {banners.length > 0 && (
        <div
          style={{
            position: 'relative',
            height: '350px',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            marginBottom: '3rem',
            border: '1px solid var(--border-glow)'
          }}
        >
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: index === activeBannerIndex ? 1 : 0,
                transition: 'opacity 0.8s ease',
                backgroundImage: `linear-gradient(to top, rgba(8,9,12,0.9), rgba(0,0,0,0.2)), url(${banner.imagePath})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '3rem'
              }}
            >
              <div>
                <span
                  style={{
                    background: 'var(--primary-glow)',
                    border: '1px solid var(--primary)',
                    color: 'var(--primary)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}
                >
                  Destaque da Loja
                </span>
                <h1 style={{ fontSize: '2.5rem', color: '#fff', marginTop: '0.75rem', fontFamily: 'var(--font-display)' }}>
                  {banner.title}
                </h1>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: '1.25rem' }}
                  onClick={() => {
                    const found = products.find((p) => p.id === banner.productId);
                    if (found) handleOpenDetails(found);
                  }}
                >
                  Ver Detalhes do Modelo
                </button>
              </div>
            </div>
          ))}

          {/* Controles de Carrossel de Banner */}
          {banners.length > 1 && (
            <>
              <button
                onClick={() => setActiveBannerIndex((activeBannerIndex - 1 + banners.length) % banners.length)}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(16,18,22,0.6)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setActiveBannerIndex((activeBannerIndex + 1) % banners.length)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(16,18,22,0.6)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
      )}

      {/* Título e Seção de Filtros */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '2rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Catálogo de Peças 3D</span>
            <span style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 500 }}>({products.length} disponíveis)</span>
          </h2>

          {cartCount > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(0, 255, 136, 0.12)',
                border: '1px solid var(--success)',
                color: 'var(--success)',
                padding: '0.3rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
            >
              <ShoppingCart size={13} />
              {cartCount} no carrinho
            </span>
          )}
        </div>

        {/* Controles de Busca e Filtro */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', width: '100%', maxWidth: '600px' }}>
          {/* Busca por texto */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Buscar peça por nome ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          {/* Ordenação */}
          <div style={{ position: 'relative', minWidth: '200px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowUpDown size={16} style={{ color: 'var(--primary)' }} />
            <select onChange={handleSortChange} className="form-input" style={{ paddingRight: '2rem' }}>
              <option value="name_asc">Descrição (A-Z)</option>
              <option value="price_desc">Maior Valor</option>
              <option value="price_asc">Menor Valor</option>
              <option value="date_desc">Mais Recentes</option>
              <option value="date_asc">Mais Antigas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid do Catálogo de Produtos */}
      {products.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '2rem'
          }}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onOpenDetails={handleOpenDetails} />
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem',
            color: 'var(--text-secondary)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          Nenhuma peça encontrada correspondente aos termos de busca.
        </div>
      )}

      {/* Modal de Detalhes do Produto */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetails}
        onOpenLightbox={handleOpenLightbox}
        onAddToCart={handleAddToCart}
      />

      {/* Lightbox em Tela Cheia (Tamanho Real Salvo) */}
      {selectedProduct && (
        <LightboxModal
          isOpen={lightboxIndex !== null}
          images={selectedProduct.imagesVideosPaths || []}
          currentIndex={lightboxIndex ?? 0}
          onClose={handleCloseLightbox}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
        />
      )}
    </div>
  );
};

export default Catalog;
