import React, { useState, useEffect } from 'react';
import { getAccessories, createAccessory, updateAccessory, deleteAccessory, type Accessory } from '../../services/accessoryService';
import { Plus, Search, Edit, Trash2, ArrowUpDown, X, Loader, Paperclip } from 'lucide-react';

export const Accessories: React.FC = () => {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtro e Ordenação
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('description');
  const [direction, setDirection] = useState('asc');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form fields
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [searchQuery, sortBy, direction]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAccessories(searchQuery, sortBy, direction);
      setAccessories(data);
    } catch (e) {
      console.error("Erro ao buscar acessórios", e);
    } finally {
      setLoading(false);
    }
  };

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
    setSelectedId(null);
    setDescription('');
    setPrice('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (acc: Accessory) => {
    setIsEditing(true);
    setSelectedId(acc.id);
    setDescription(acc.description);
    setPrice(acc.price.toString());
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!description.trim() || !price.trim()) {
      setFormError('Preencha a descrição e o valor do acessório');
      return;
    }

    const priceVal = parseFloat(price.replace(',', '.'));
    if (isNaN(priceVal) || priceVal <= 0) {
      setFormError('O valor unitário deve ser maior que zero');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && selectedId) {
        await updateAccessory(selectedId, {
          description: description.trim(),
          price: priceVal
        });
      } else {
        await createAccessory({
          description: description.trim(),
          price: priceVal
        });
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Falha ao salvar acessório');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, desc: string) => {
    if (!window.confirm(`Deseja realmente excluir o acessório "${desc}"?`)) return;
    try {
      await deleteAccessory(id);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Falha ao excluir acessório');
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header da Tela */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Paperclip style={{ color: 'var(--primary)' }} size={28} />
            Cadastro de Acessórios
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Gerenciamento global de componentes, parafusos, ímãs e argolas vinculáveis aos produtos
          </p>
        </div>
        <button 
          onClick={openCreateModal}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}
        >
          <Plus size={16} />
          Novo Acessório
        </button>
      </div>

      {/* Barra de Filtro */}
      <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por descrição..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* Tabela de Acessórios */}
      <div className="table-container glass-panel" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table className="premium-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('description')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  Descrição <ArrowUpDown size={14} />
                </div>
              </th>
              <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  Valor Unitário (R$) <ArrowUpDown size={14} />
                </div>
              </th>
              <th style={{ width: '120px', textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '3rem' }}>
                  <Loader className="animate-spin" size={24} style={{ margin: '0 auto', color: 'var(--primary)' }} />
                </td>
              </tr>
            ) : accessories.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Nenhum acessório encontrado. Clique em "Novo Acessório" para cadastrar.
                </td>
              </tr>
            ) : (
              accessories.map((acc) => (
                <tr key={acc.id}>
                  <td style={{ fontWeight: 600 }}>{acc.description}</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>
                    {acc.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                      <button 
                        onClick={() => openEditModal(acc)}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem', border: 'none' }}
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(acc.id, acc.description)}
                        className="btn btn-danger"
                        style={{ padding: '0.4rem' }}
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Criação / Edição */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            background: '#0d1117',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-glow)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 700 }}>
                {isEditing ? 'Editar Acessório' : 'Novo Acessório'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {formError && (
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(255, 77, 77, 0.1)',
                    border: '1px solid var(--danger)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--danger)',
                    fontSize: '0.85rem'
                  }}>
                    {formError}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Descrição do Acessório</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Argola Chaveiro 25mm, Parafuso M3x10..."
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    className="form-input" 
                    required 
                    autoFocus
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Valor Unitário em Reais (R$)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 0.50"
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    className="form-input" 
                    required 
                  />
                </div>
              </div>

              <div style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                background: 'rgba(0, 0, 0, 0.2)'
              }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Cadastrar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accessories;
