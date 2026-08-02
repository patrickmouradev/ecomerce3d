import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Edit, Trash2, ArrowUpDown, X, Loader } from 'lucide-react';

interface Filament {
  id: string;
  material: string;
  brand: string;
  color: string;
  pricePerKg: number;
  quantityKg: number;
  active: boolean;
}

export const Filaments: React.FC = () => {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filtros
  const [filterMaterial, setFilterMaterial] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [filterPrice, setFilterPrice] = useState('');
  const [filterQuantity, setFilterQuantity] = useState('');
  
  // Ordenação
  const [sortBy, setSortBy] = useState('material');
  const [direction, setDirection] = useState('asc');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form fields
  const [material, setMaterial] = useState('');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [quantityKg, setQuantityKg] = useState('');
  
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchFilaments();
  }, [filterMaterial, filterBrand, filterColor, sortBy, direction]);

  const fetchFilaments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/filaments', {
        params: {
          material: filterMaterial,
          brand: filterBrand,
          color: filterColor,
          sortBy: sortBy,
          direction: direction
        }
      });
      setFilaments(response.data);
    } catch (e) {
      console.error("Erro ao buscar filamentos", e);
    } finally {
      setLoading(false);
    }
  };

  const displayedFilaments = filaments.filter(fil => {
    const priceStr = fil.pricePerKg != null ? fil.pricePerKg.toString() : '';
    const qtyStr = fil.quantityKg != null ? fil.quantityKg.toString() : '';
    const matchPrice = !filterPrice.trim() || priceStr.toLowerCase().includes(filterPrice.trim().toLowerCase());
    const matchQty = !filterQuantity.trim() || qtyStr.toLowerCase().includes(filterQuantity.trim().toLowerCase());
    return matchPrice && matchQty;
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setDirection(direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setDirection('asc');
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setMaterial('');
    setBrand('');
    setColor('');
    setPricePerKg('');
    setQuantityKg('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (fil: Filament) => {
    setIsEditing(true);
    setSelectedId(fil.id);
    setMaterial(fil.material);
    setBrand(fil.brand);
    setColor(fil.color);
    setPricePerKg(fil.pricePerKg.toString());
    setQuantityKg(fil.quantityKg.toString());
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!material.trim() || !brand.trim() || !color.trim() || !pricePerKg.trim() || !quantityKg.trim()) {
      setFormError('Todos os campos são obrigatórios');
      return;
    }

    const price = parseFloat(pricePerKg);
    const qty = parseFloat(quantityKg);

    if (isNaN(price) || price <= 0) {
      setFormError('Preço por quilo inválido');
      return;
    }
    if (isNaN(qty) || qty < 0) {
      setFormError('Quantidade inválida');
      return;
    }

    const payload = {
      material: material.trim(),
      brand: brand.trim(),
      color: color.trim(),
      pricePerKg: price,
      quantityKg: qty,
      active: true
    };

    try {
      if (isEditing && selectedId) {
        await api.put(`/api/admin/filaments/${selectedId}`, payload);
      } else {
        await api.post('/api/admin/filaments', payload);
      }
      setModalOpen(false);
      setFilterMaterial('');
      setFilterBrand('');
      setFilterColor('');
      setFilterPrice('');
      setFilterQuantity('');
      fetchFilaments();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Falha ao salvar dados do filamento');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja inativar o filamento "${name}"?`)) {
      try {
        await api.delete(`/api/admin/filaments/${id}`);
        fetchFilaments();
      } catch (err) {
        console.error("Erro ao inativar filamento", err);
      }
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Topo da Tela */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)' }}>Estoque de Filamentos</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Gerenciamento de materiais e custos de insumos para impressão 3D</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} />
          Adicionar Novo
        </button>
      </div>

      {/* Caixa de Filtros */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Material</label>
          <input 
            type="text" 
            placeholder="Ex: PLA, ABS" 
            value={filterMaterial}
            onChange={(e) => setFilterMaterial(e.target.value)}
            className="form-input"
            style={{ padding: '0.5rem 0.75rem' }}
          />
        </div>
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Marca</label>
          <input 
            type="text" 
            placeholder="Ex: 3D Lab" 
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="form-input"
            style={{ padding: '0.5rem 0.75rem' }}
          />
        </div>
        <div style={{ flex: 1, minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Cor</label>
          <input 
            type="text" 
            placeholder="Ex: Vermelho, Preto" 
            value={filterColor}
            onChange={(e) => setFilterColor(e.target.value)}
            className="form-input"
            style={{ padding: '0.5rem 0.75rem' }}
          />
        </div>
        <div style={{ flex: 1, minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Preço por Quilo</label>
          <input 
            type="text" 
            placeholder="Ex: 120.00" 
            value={filterPrice}
            onChange={(e) => setFilterPrice(e.target.value)}
            className="form-input"
            style={{ padding: '0.5rem 0.75rem' }}
          />
        </div>
        <div style={{ flex: 1, minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Quantidade</label>
          <input 
            type="text" 
            placeholder="Ex: 1.0" 
            value={filterQuantity}
            onChange={(e) => setFilterQuantity(e.target.value)}
            className="form-input"
            style={{ padding: '0.5rem 0.75rem' }}
          />
        </div>
      </div>

      {/* Tabela de Listagem */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader className="animate-spin" size={24} style={{ color: 'var(--primary)' }} />
        </div>
      ) : displayedFilaments.length > 0 ? (
        <div className="table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('material')}>
                  Material <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                </th>
                <th onClick={() => handleSort('brand')}>
                  Marca <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                </th>
                <th onClick={() => handleSort('color')}>
                  Cor <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                </th>
                <th onClick={() => handleSort('pricePerKg')}>
                  Preço por Quilo <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                </th>
                <th onClick={() => handleSort('quantityKg')}>
                  Quantidade <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                </th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {displayedFilaments.map((fil) => (
                <tr key={fil.id}>
                  <td style={{ fontWeight: 600 }}>{fil.material}</td>
                  <td>{fil.brand}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: fil.color ? fil.color.toLowerCase() : '#ccc', border: '1px solid var(--border-color)' }}></span>
                      {fil.color}
                    </span>
                  </td>
                  <td style={{ color: 'var(--success)' }}>
                    {fil.pricePerKg != null ? Number(fil.pricePerKg).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                  </td>
                  <td>{fil.quantityKg != null ? Number(fil.quantityKg).toFixed(3) : '0.000'} Kg</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => openEditModal(fil)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(fil.id, `${fil.material} - ${fil.color}`)}
                        className="btn btn-danger" 
                        style={{ padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          Nenhum filamento encontrado correspondente aos filtros ativos.
        </div>
      )}

      {/* Modal de Criação / Edição */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>
                {isEditing ? 'Editar Filamento' : 'Cadastrar Novo Filamento'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Material (ex: PLA, ABS, PETG)</label>
                <input 
                  type="text" 
                  value={material} 
                  onChange={(e) => setMaterial(e.target.value)} 
                  className="form-input" 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Marca (ex: 3D Lab, Esun)</label>
                <input 
                  type="text" 
                  value={brand} 
                  onChange={(e) => setBrand(e.target.value)} 
                  className="form-input" 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cor (ex: Preto, Vermelho Neon)</label>
                <input 
                  type="text" 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)} 
                  className="form-input" 
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Preço por Quilo (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={pricePerKg} 
                    onChange={(e) => setPricePerKg(e.target.value)} 
                    className="form-input" 
                    required 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{isEditing ? 'Quantidade (Kg)' : 'Quantidade Inicial (Kg)'}</label>
                  <input 
                    type="number" 
                    step="0.001" 
                    value={quantityKg} 
                    onChange={(e) => setQuantityKg(e.target.value)} 
                    className="form-input" 
                    required 
                  />
                </div>
              </div>

              {formError && (
                <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>{formError}</p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Salvar Alterações' : 'Adicionar Filamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Filaments;
