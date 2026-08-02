import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Search, Edit, Trash2, ArrowUpDown, X, Loader, Calendar } from 'lucide-react';

interface SystemParameter {
  id: string;
  description: string;
  paramValue: string;
  formattedValue: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string; // dd/MM/yyyy
  updatedAt: string; // dd/MM/yyyy
  active: boolean;
}

export const Params: React.FC = () => {
  const [parameters, setParameters] = useState<SystemParameter[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [filterDescription, setFilterDescription] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Ordenação
  const [sortBy, setSortBy] = useState('description');
  const [direction, setDirection] = useState('asc');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form fields
  const [description, setDescription] = useState('');
  const [paramValue, setParamValue] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchParameters();
  }, [filterDescription, filterDate, sortBy, direction]);

  const fetchParameters = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/parameters', {
        params: {
          description: filterDescription,
          createdDate: filterDate || null,
          sortBy: sortBy,
          direction: direction
        }
      });
      setParameters(response.data);
    } catch (e) {
      console.error("Erro ao buscar parâmetros de sistema", e);
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
    setDescription('');
    setParamValue('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (param: SystemParameter) => {
    setIsEditing(true);
    setSelectedId(param.id);
    setDescription(param.description);
    setParamValue(param.paramValue);
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!description.trim() || !paramValue.trim()) {
      setFormError('Todos os campos são obrigatórios');
      return;
    }

    const payload = {
      description: description.trim(),
      paramValue: paramValue.trim()
    };

    try {
      if (isEditing && selectedId) {
        await api.put(`/api/admin/parameters/${selectedId}`, payload);
      } else {
        await api.post('/api/admin/parameters', payload);
      }
      setModalOpen(false);
      fetchParameters();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Falha ao salvar parâmetro do sistema');
    }
  };

  const handleDelete = async (id: string, desc: string) => {
    if (window.confirm(`Tem certeza que deseja inativar o parâmetro "${desc}"?`)) {
      try {
        await api.delete(`/api/admin/parameters/${id}`);
        fetchParameters();
      } catch (err) {
        console.error("Erro ao inativar parâmetro", err);
      }
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Topo da Tela */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)' }}>Parâmetros do Sistema</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Configuração de variáveis globais (Custo hora energia, CORS, frete base)</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} />
          Adicionar Novo
        </button>
      </div>

      {/* Caixa de Filtros */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Buscar por Descrição</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Ex: Custo Hora Energia" 
              value={filterDescription}
              onChange={(e) => setFilterDescription(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.25rem' }}
            />
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>
        
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Data de Criação</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.25rem' }}
            />
            <Calendar size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>
      </div>

      {/* Tabela de Listagem */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader className="animate-spin" size={24} style={{ color: 'var(--primary)' }} />
        </div>
      ) : parameters.length > 0 ? (
        <div className="table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('description')}>
                  Descrição <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                </th>
                <th>Valor do Parâmetro</th>
                <th onClick={() => handleSort('createdAt')}>
                  Data de Criação <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                </th>
                <th>Criado Por</th>
                <th>Modificado Por</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {parameters.map((param) => (
                <tr key={param.id}>
                  <td style={{ fontWeight: 600 }}>{param.description}</td>
                  <td style={{ color: 'var(--primary)' }}>
                    {param.formattedValue}
                  </td>
                  <td>{param.createdAt}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{param.createdBy}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{param.updatedBy}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => openEditModal(param)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(param.id, param.description)}
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
          Nenhum parâmetro de sistema encontrado correspondente aos termos de busca.
        </div>
      )}

      {/* Modal de Cadastro / Edição */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>
                {isEditing ? 'Editar Parâmetro' : 'Cadastrar Parâmetro do Sistema'}
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
                <label className="form-label">Descrição (Identificador/Nome)</label>
                <input 
                  type="text" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="form-input" 
                  placeholder="Ex: Custo Hora Energia"
                  required 
                  disabled={isEditing} // Descrição/Chave única não deve ser alterada após criada
                />
              </div>

              <div className="form-group">
                <label className="form-label">Valor (ex: 1.25 para número, ou texto correspondente)</label>
                <input 
                  type="text" 
                  value={paramValue} 
                  onChange={(e) => setParamValue(e.target.value)} 
                  className="form-input" 
                  placeholder="Ex: 1.25"
                  required 
                />
              </div>

              {formError && (
                <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>{formError}</p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Salvar Alterações' : 'Adicionar Parâmetro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Params;
