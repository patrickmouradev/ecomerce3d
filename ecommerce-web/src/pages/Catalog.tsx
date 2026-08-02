import React, { useState, useEffect } from 'react';

import api from '../services/api';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  salePriceParticular: number;
  filamentLabel: string;
  imagesVideosPaths: string[];
}

interface Banner {
  id: string;
  title: string;
  imagePath: string;
  productId: string;
}

export const Catalog: React.FC = () => {

  
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [direction, setDirection] = useState('asc');
  
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

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
      console.error("Erro ao carregar catálogo", e);
    }
  };

  const fetchBanners = async () => {
    try {
      const response = await api.get('/api/banners');
      setBanners(response.data);
    } catch (e) {
      console.error("Erro ao carregar banners", e);
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

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Banner de Destaque / Carrossel */}
      {banners.length > 0 && (
        <div style={{
          position: 'relative',
          height: '350px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          marginBottom: '3rem',
          border: '1px solid var(--border-glow)'
        }}>
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
                <span style={{
                  background: 'var(--primary-glow)',
                  border: '1px solid var(--primary)',
                  color: 'var(--primary)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  Destaque da Loja
                </span>
                <h1 style={{ fontSize: '2.5rem', color: '#fff', marginTop: '0.75rem', fontFamily: 'var(--font-display)' }}>
                  {banner.title}
                </h1>
                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: '1.25rem' }}
                  onClick={() => window.location.href = `/api/products/${banner.productId}`}
                >
                  Ver Detalhes do Modelo
                </button>
              </div>
            </div>
          ))}

          {/* Controles de Carrossel */}
          {banners.length > 1 && (
            <>
              <button 
                onClick={() => setActiveBannerIndex((activeBannerIndex - 1 + banners.length) % banners.length)}
                style={{
                  position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(16,18,22,0.6)', border: '1px solid var(--border-color)', color: '#fff',
                  width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setActiveBannerIndex((activeBannerIndex + 1) % banners.length)}
                style={{
                  position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(16,18,22,0.6)', border: '1px solid var(--border-color)', color: '#fff',
                  width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
      )}



      {/* Título e Seção de Filtros */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        marginBottom: '2rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1.5rem'
      }}>
        <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Catálogo de Peças 3D</span>
          <span style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 500 }}>({products.length} disponíveis)</span>
        </h2>

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
            <select 
              onChange={handleSortChange} 
              className="form-input"
              style={{ paddingRight: '2rem' }}
            >
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          {products.map((product) => {
            const hasMedia = product.imagesVideosPaths && product.imagesVideosPaths.length > 0;
            const mediaUrl = hasMedia ? product.imagesVideosPaths[0] : null;

            return (
              <div 
                key={product.id}
                className="glass-panel"
                style={{
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'var(--transition-normal)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 240, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.3)';
                }}
              >
                {/* Imagem do Produto */}
                <div style={{ height: '220px', overflow: 'hidden', background: '#0e1014', position: 'relative' }}>
                  {mediaUrl ? (
                    mediaUrl.toLowerCase().endsWith('.mp4') ? (
                      <video src={mediaUrl} autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src={mediaUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      Sem Imagem
                    </div>
                  )}
                  {/* Etiqueta de Material */}
                  <span style={{
                    position: 'absolute', top: '1rem', right: '1rem',
                    background: 'rgba(16, 18, 22, 0.8)', color: 'var(--text-primary)',
                    padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                    border: '1px solid var(--border-color)'
                  }}>
                    {product.filamentLabel.split(' - ')[0]}
                  </span>
                </div>

                {/* Conteúdo do Card */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '0.5rem' }}>{product.name}</h3>
                  <p style={{
                    fontSize: '0.85rem', color: 'var(--text-secondary)',
                    lineHeight: 1.5, marginBottom: '1.25rem',
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    flex: 1
                  }}>
                    {product.description || 'Nenhuma descrição provida.'}
                  </p>
                  
                  {/* Preço e Botão de Ação */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Preço final</span>
                      <span style={{ fontSize: '1.3rem', color: 'var(--success)', fontWeight: 800 }}>
                        {product.salePriceParticular.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                      onClick={() => alert(`Item "${product.name}" adicionado ao carrinho (Funcionalidade de Checkout Mercado Pago será integrada na Fase 6!)`)}
                    >
                      <ShoppingCart size={14} />
                      Comprar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          Nenhuma peça encontrada correspondente aos termos de busca.
        </div>
      )}
    </div>
  );
};
export default Catalog;
