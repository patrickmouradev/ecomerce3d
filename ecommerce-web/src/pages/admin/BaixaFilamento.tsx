import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import {
  Loader,
  CheckCircle2,
  AlertTriangle,
  ArrowDownCircle,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Layers,
  Boxes,
  X
} from 'lucide-react';

interface Filament {
  id: string;
  material: string;
  brand: string;
  color: string;
  pricePerKg: number;
  quantityKg: number;
  active: boolean;
}

interface FilamentBaixa {
  id: string;
  filamentId: string;
  filamentMaterial: string;
  filamentBrand: string;
  filamentColor: string;
  quantityG: number;
  reason?: string;
  createdAt: string;
  updatedAt?: string;
}

export const BaixaFilamento: React.FC = () => {
  // Controle de Abas: 'BAIXA' = Baixa de Filamento | 'SALDO' = Saldo Filamento em Estoque
  const [activeTab, setActiveTab] = useState<'BAIXA' | 'SALDO'>('BAIXA');

  // Listagens de dados
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [baixas, setBaixas] = useState<FilamentBaixa[]>([]);
  const [loadingFilaments, setLoadingFilaments] = useState(false);
  const [loadingBaixas, setLoadingBaixas] = useState(false);

  // Filtros das telas principais
  const [baixaFilter, setBaixaFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');

  // Mensagens
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estado do Modal de Baixa (Criação ou Edição)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBaixa, setEditingBaixa] = useState<FilamentBaixa | null>(null);
  const [selectedFilamentId, setSelectedFilamentId] = useState('');
  const [quantityGInput, setQuantityGInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Filtros internos do Modal (Marca / Material / Cor)
  const [modalFilterMaterial, setModalFilterMaterial] = useState('');
  const [modalFilterBrand, setModalFilterBrand] = useState('');
  const [modalFilterColor, setModalFilterColor] = useState('');

  useEffect(() => {
    fetchFilaments();
    fetchBaixas();
  }, []);

  const fetchFilaments = async () => {
    setLoadingFilaments(true);
    try {
      const response = await api.get('/api/admin/filaments', {
        params: {
          sortBy: 'material',
          direction: 'asc'
        }
      });
      setFilaments(response.data);
    } catch (e) {
      console.error('Erro ao buscar filamentos', e);
      setErrorMsg('Falha ao carregar estoque de filamentos.');
    } finally {
      setLoadingFilaments(false);
    }
  };

  const fetchBaixas = async () => {
    setLoadingBaixas(true);
    try {
      const response = await api.get('/api/admin/filaments/baixas');
      setBaixas(response.data);
    } catch (e) {
      console.error('Erro ao buscar histórico de baixas', e);
    } finally {
      setLoadingBaixas(false);
    }
  };

  // Opções únicas de Material para o filtro do Modal
  const uniqueMaterials = useMemo(() => {
    return Array.from(new Set(filaments.map((f) => f.material).filter(Boolean))).sort();
  }, [filaments]);

  // Opções únicas de Marca filtradas por Material (se selecionado)
  const uniqueBrands = useMemo(() => {
    const list = modalFilterMaterial
      ? filaments.filter((f) => f.material.toLowerCase() === modalFilterMaterial.toLowerCase())
      : filaments;
    return Array.from(new Set(list.map((f) => f.brand).filter(Boolean))).sort();
  }, [filaments, modalFilterMaterial]);

  // Opções únicas de Cor filtradas por Material e Marca (se selecionados)
  const uniqueColors = useMemo(() => {
    let list = filaments;
    if (modalFilterMaterial) {
      list = list.filter((f) => f.material.toLowerCase() === modalFilterMaterial.toLowerCase());
    }
    if (modalFilterBrand) {
      list = list.filter((f) => f.brand.toLowerCase() === modalFilterBrand.toLowerCase());
    }
    return Array.from(new Set(list.map((f) => f.color).filter(Boolean))).sort();
  }, [filaments, modalFilterMaterial, modalFilterBrand]);

  // Filamentos resultantes do filtro do Modal
  const modalFilteredFilaments = useMemo(() => {
    const termColor = modalFilterColor.trim().toLowerCase();
    return filaments.filter((f) => {
      const matchMat = !modalFilterMaterial || f.material.toLowerCase() === modalFilterMaterial.toLowerCase();
      const matchBrand = !modalFilterBrand || f.brand.toLowerCase() === modalFilterBrand.toLowerCase();
      const matchColor = !termColor || f.color.toLowerCase().includes(termColor);
      return matchMat && matchBrand && matchColor;
    });
  }, [filaments, modalFilterMaterial, modalFilterBrand, modalFilterColor]);

  // Auto-seleciona quando o filtro resulta em apenas 1 filamento
  useEffect(() => {
    if (modalOpen && !selectedFilamentId && modalFilteredFilaments.length === 1) {
      setSelectedFilamentId(modalFilteredFilaments[0].id);
    }
  }, [modalOpen, selectedFilamentId, modalFilteredFilaments]);

  // Filamento selecionado no Modal
  const modalSelectedFilament = useMemo(() => {
    return filaments.find((f) => f.id === selectedFilamentId) || null;
  }, [filaments, selectedFilamentId]);

  // Cálculos de saldo no Modal
  const currentKg = modalSelectedFilament?.quantityKg ?? 0;
  const currentG = currentKg * 1000;
  const typedG = parseFloat(quantityGInput) || 0;

  // Se estiver editando:
  const isEditing = Boolean(editingBaixa);
  const isSameFilamentAsOriginal = isEditing && editingBaixa?.filamentId === selectedFilamentId;
  const originalBaixaG = isEditing ? (editingBaixa?.quantityG ?? 0) : 0;
  const diffG = isSameFilamentAsOriginal ? typedG - originalBaixaG : typedG;
  const projectedBalanceG = isSameFilamentAsOriginal
    ? currentG - diffG
    : currentG - typedG;
  const projectedBalanceKg = projectedBalanceG / 1000;
  const isOverLimit = typedG > 0 && projectedBalanceG < 0;

  // Abrir Modal para Nova Baixa
  const handleOpenNewBaixa = (presetFilamentId?: string) => {
    setEditingBaixa(null);
    if (presetFilamentId) {
      const fil = filaments.find((f) => f.id === presetFilamentId);
      if (fil) {
        setModalFilterMaterial(fil.material);
        setModalFilterBrand(fil.brand);
        setModalFilterColor(fil.color);
      }
      setSelectedFilamentId(presetFilamentId);
    } else {
      setModalFilterMaterial('');
      setModalFilterBrand('');
      setModalFilterColor('');
      setSelectedFilamentId('');
    }
    setQuantityGInput('');
    setReasonInput('');
    setModalError('');
    setErrorMsg('');
    setSuccessMsg('');
    setModalOpen(true);
  };

  // Abrir Modal para Editar Baixa
  const handleOpenEditBaixa = (baixa: FilamentBaixa) => {
    setEditingBaixa(baixa);
    const fil = filaments.find((f) => f.id === baixa.filamentId);
    if (fil) {
      setModalFilterMaterial(fil.material);
      setModalFilterBrand(fil.brand);
      setModalFilterColor(fil.color);
    } else {
      setModalFilterMaterial(baixa.filamentMaterial || '');
      setModalFilterBrand(baixa.filamentBrand || '');
      setModalFilterColor(baixa.filamentColor || '');
    }
    setSelectedFilamentId(baixa.filamentId);
    setQuantityGInput(baixa.quantityG != null ? String(baixa.quantityG) : '');
    setReasonInput(baixa.reason || '');
    setModalError('');
    setErrorMsg('');
    setSuccessMsg('');
    setModalOpen(true);
  };

  // Salvar (Criar ou Atualizar) Baixa
  const handleSaveBaixaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!selectedFilamentId) {
      setModalError('Selecione um filamento para realizar a baixa.');
      return;
    }

    if (isNaN(typedG) || typedG <= 0) {
      setModalError('Digite uma quantidade válida em gramas (maior que zero).');
      return;
    }

    if (isOverLimit) {
      setModalError(`A quantidade solicitada excede o saldo disponível (${currentG.toFixed(1)}g).`);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        filamentId: selectedFilamentId,
        quantityG: typedG,
        reason: reasonInput.trim() || undefined
      };

      if (isEditing && editingBaixa) {
        await api.put(`/api/admin/filaments/baixas/${editingBaixa.id}`, payload);
        setSuccessMsg(`Baixa de filamento atualizada com sucesso (${typedG}g).`);
      } else {
        await api.post('/api/admin/filaments/baixas', payload);
        setSuccessMsg(`Baixa de ${typedG}g registrada com sucesso no estoque.`);
      }

      setModalOpen(false);
      // Recarrega dados atualizados de ambas as listagens
      await Promise.all([fetchFilaments(), fetchBaixas()]);
    } catch (err: any) {
      setModalError(err.response?.data?.message || err.message || 'Falha ao salvar baixa de filamento.');
    } finally {
      setSubmitting(false);
    }
  };

  // Excluir Baixa (com retorno do saldo ao estoque)
  const handleDeleteBaixa = async (baixa: FilamentBaixa) => {
    const confirmDelete = window.confirm(
      `Deseja realmente cancelar/excluir a baixa de ${baixa.quantityG}g do filamento ${baixa.filamentMaterial} ${baixa.filamentColor}?\n\nO saldo será estornado e devolvido ao estoque.`
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/api/admin/filaments/baixas/${baixa.id}`);
      setSuccessMsg(`Baixa cancelada com sucesso. ${baixa.quantityG}g devolvidos ao estoque.`);
      await Promise.all([fetchFilaments(), fetchBaixas()]);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Falha ao cancelar baixa.');
    }
  };

  // Filtragem das Baixas (Tab 1)
  const displayedBaixas = useMemo(() => {
    if (!baixaFilter.trim()) return baixas;
    const term = baixaFilter.toLowerCase();
    return baixas.filter(
      (b) =>
        (b.filamentMaterial && b.filamentMaterial.toLowerCase().includes(term)) ||
        (b.filamentBrand && b.filamentBrand.toLowerCase().includes(term)) ||
        (b.filamentColor && b.filamentColor.toLowerCase().includes(term)) ||
        (b.reason && b.reason.toLowerCase().includes(term)) ||
        (b.createdAt && b.createdAt.toLowerCase().includes(term))
    );
  }, [baixas, baixaFilter]);

  // Filtragem dos Saldos de Filamentos (Tab 2)
  const displayedFilaments = useMemo(() => {
    if (!stockFilter.trim()) return filaments;
    const term = stockFilter.toLowerCase();
    return filaments.filter(
      (f) =>
        f.material.toLowerCase().includes(term) ||
        f.brand.toLowerCase().includes(term) ||
        f.color.toLowerCase().includes(term)
    );
  }, [filaments, stockFilter]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Topo da Tela com Título e Seletor de Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', margin: 0 }}>
            Controle de Baixa de Filamentos
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0' }}>
            Gerencie o histórico de baixas manuais e acompanhe os saldos físicos em tempo real
          </p>
        </div>

        {/* Duas Tabs Views */}
        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '0.35rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('BAIXA')}
            className={`btn ${activeTab === 'BAIXA' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.88rem', padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Layers size={16} />
            <span>Baixa de Filamento</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SALDO')}
            className={`btn ${activeTab === 'SALDO' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.88rem', padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Boxes size={16} />
            <span>Saldo Filamento em Estoque</span>
          </button>
        </div>
      </div>

      {/* Alerta de Sucesso */}
      {successMsg && (
        <div
          style={{
            background: 'rgba(0, 255, 136, 0.12)',
            border: '1px solid var(--success)',
            color: 'var(--success)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            fontWeight: 600
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg('')}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Alerta de Erro */}
      {errorMsg && (
        <div
          style={{
            background: 'rgba(255, 68, 68, 0.12)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            fontWeight: 600
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg('')}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: BAIXA DE FILAMENTO (Histórico com Botão Nova Baixa e Editar Linha) */}
      {/* ========================================================================= */}
      {activeTab === 'BAIXA' && (
        <div>
          {/* Topo da Tab 1: Filtro do Histórico de Baixa e Botão de Nova Baixa */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.25rem'
            }}
          >
            <div style={{ position: 'relative', minWidth: '280px', flex: '1 1 320px', maxWidth: '480px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)'
                }}
              />
              <input
                type="text"
                placeholder="Filtrar histórico por material, cor, motivo..."
                value={baixaFilter}
                onChange={(e) => setBaixaFilter(e.target.value)}
                className="form-input"
                style={{ width: '100%', paddingLeft: '2.4rem', fontSize: '0.88rem' }}
              />
            </div>

            <button
              type="button"
              onClick={() => handleOpenNewBaixa()}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
            >
              <Plus size={16} />
              <span>Nova Baixa</span>
            </button>
          </div>

          {/* Listagem do Histórico de Baixas */}
          {loadingBaixas ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3.5rem' }}>
              <Loader className="animate-spin" size={28} style={{ color: 'var(--primary)' }} />
            </div>
          ) : displayedBaixas.length > 0 ? (
            <div className="table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th style={{ width: '170px' }}>Data / Hora</th>
                    <th>Filamento</th>
                    <th style={{ textAlign: 'center', width: '160px' }}>Quantidade Baixada</th>
                    <th>Motivo / Observação</th>
                    <th style={{ textAlign: 'right', width: '140px' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedBaixas.map((baixa) => {
                    const kg = (Number(baixa.quantityG || 0) / 1000).toFixed(3);
                    return (
                      <tr key={baixa.id}>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                          {baixa.createdAt || '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                            <span
                              style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: baixa.filamentColor ? baixa.filamentColor.toLowerCase() : '#ccc',
                                border: '1px solid var(--border-color)',
                                flexShrink: 0
                              }}
                            />
                            <div>
                              <strong style={{ color: '#fff' }}>{baixa.filamentMaterial}</strong>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: '0.35rem' }}>
                                - {baixa.filamentBrand} ({baixa.filamentColor})
                              </span>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.6rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(0, 240, 255, 0.08)',
                              color: 'var(--primary)',
                              fontWeight: 700,
                              fontSize: '0.9rem'
                            }}
                          >
                            {Number(baixa.quantityG).toFixed(1)}g ({kg} kg)
                          </span>
                        </td>
                        <td style={{ color: baixa.reason ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '0.88rem' }}>
                          {baixa.reason || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Sem observação</span>}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditBaixa(baixa)}
                              className="btn btn-secondary"
                              style={{
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.8rem',
                                borderRadius: 'var(--radius-sm)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                              }}
                              title="Editar baixa"
                            >
                              <Edit2 size={13} />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBaixa(baixa)}
                              className="btn btn-secondary"
                              style={{
                                padding: '0.35rem 0.6rem',
                                fontSize: '0.8rem',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--danger)',
                                borderColor: 'rgba(255, 68, 68, 0.25)'
                              }}
                              title="Cancelar baixa e devolver ao estoque"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '3.5rem',
                color: 'var(--text-secondary)',
                border: '1px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.01)'
              }}
            >
              <p style={{ margin: 0, fontSize: '0.95rem' }}>
                {baixaFilter
                  ? 'Nenhuma baixa encontrada para o filtro informado.'
                  : 'Nenhuma baixa de filamento registrada até o momento.'}
              </p>
              <button
                type="button"
                onClick={() => handleOpenNewBaixa()}
                className="btn btn-primary"
                style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={15} /> Realizar Primeira Baixa
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SALDO FILAMENTO EM ESTOQUE (Listagem de saldos com filtro no topo) */}
      {/* ========================================================================= */}
      {activeTab === 'SALDO' && (
        <div>
          {/* Topo da Tab 2: Barra de filtro do estoque */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>
              Saldos de Filamentos em Estoque
            </h3>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)'
                }}
              />
              <input
                type="text"
                placeholder="Filtrar filamentos..."
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="form-input"
                style={{ width: '100%', paddingLeft: '2.3rem', paddingRight: '0.75rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Listagem do Saldo de Filamento */}
          {loadingFilaments ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3.5rem' }}>
              <Loader className="animate-spin" size={28} style={{ color: 'var(--primary)' }} />
            </div>
          ) : displayedFilaments.length > 0 ? (
            <div className="table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Marca</th>
                    <th>Cor</th>
                    <th style={{ textAlign: 'center' }}>Saldo em Estoque</th>
                    <th style={{ textAlign: 'right' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedFilaments.map((fil) => {
                    const g = ((fil.quantityKg || 0) * 1000).toFixed(0);
                    return (
                      <tr key={fil.id}>
                        <td style={{ fontWeight: 600 }}>{fil.material}</td>
                        <td>{fil.brand}</td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span
                              style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: fil.color ? fil.color.toLowerCase() : '#ccc',
                                border: '1px solid var(--border-color)'
                              }}
                            />
                            {fil.color}
                          </span>
                        </td>
                        <td
                          style={{
                            textAlign: 'center',
                            fontWeight: 700,
                            color: (fil.quantityKg || 0) > 0 ? 'var(--success)' : 'var(--danger)'
                          }}
                        >
                          {fil.quantityKg != null ? Number(fil.quantityKg).toFixed(3) : '0.000'} kg ({g}g)
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('BAIXA');
                              handleOpenNewBaixa(fil.id);
                            }}
                            className="btn btn-primary"
                            style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                          >
                            Dar Baixa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem',
                color: 'var(--text-secondary)',
                border: '1px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              Nenhum filamento encontrado no estoque.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVA BAIXA / EDITAR BAIXA */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <ArrowDownCircle size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>
                  {isEditing ? 'Editar Baixa de Filamento' : 'Nova Baixa de Filamento'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBaixaSubmit} style={{ padding: '1.5rem' }}>
              {modalError && (
                <div
                  style={{
                    background: 'rgba(255, 68, 68, 0.12)',
                    border: '1px solid var(--danger)',
                    color: 'var(--danger)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1.25rem',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Filtros de Marca / Material / Cor no Modal */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600 }}>
                    <Filter size={13} style={{ color: 'var(--primary)' }} />
                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Filtro de Material / Marca / Cor
                    </span>
                  </div>
                  {(modalFilterMaterial || modalFilterBrand || modalFilterColor) && (
                    <button
                      type="button"
                      onClick={() => {
                        setModalFilterMaterial('');
                        setModalFilterBrand('');
                        setModalFilterColor('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem' }}>
                  {/* Filtro: Material */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                      Material
                    </label>
                    <select
                      value={modalFilterMaterial}
                      onChange={(e) => {
                        const val = e.target.value;
                        setModalFilterMaterial(val);
                        setSelectedFilamentId('');
                        setModalError('');
                      }}
                      className="form-input"
                      style={{ padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
                    >
                      <option value="">Todos os Materiais</option>
                      {uniqueMaterials.map((mat) => (
                        <option key={mat} value={mat}>
                          {mat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro: Marca */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                      Marca
                    </label>
                    <select
                      value={modalFilterBrand}
                      onChange={(e) => {
                        const val = e.target.value;
                        setModalFilterBrand(val);
                        setSelectedFilamentId('');
                        setModalError('');
                      }}
                      className="form-input"
                      style={{ padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
                    >
                      <option value="">Todas as Marcas</option>
                      {uniqueBrands.map((brand) => (
                        <option key={brand} value={brand}>
                          {brand}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro: Cor (Digitável com filtragem em tempo real conforme digita) */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                      Cor
                    </label>
                    <input
                      type="text"
                      placeholder="Digite a cor..."
                      value={modalFilterColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        setModalFilterColor(val);
                        setSelectedFilamentId('');
                        setModalError('');
                      }}
                      className="form-input"
                      style={{ padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
                      list="modal-filamento-cores-datalist"
                    />
                    <datalist id="modal-filamento-cores-datalist">
                      {uniqueColors.map((color) => (
                        <option key={color} value={color} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Seleção do Filamento filtrado */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">
                  Escolha o Filamento do Estoque ({modalFilteredFilaments.length} {modalFilteredFilaments.length === 1 ? 'disponível' : 'disponíveis'})
                </label>
                <select
                  value={selectedFilamentId}
                  onChange={(e) => {
                    const filId = e.target.value;
                    setSelectedFilamentId(filId);
                    setModalError('');
                    if (filId) {
                      const fil = filaments.find((f) => f.id === filId);
                      if (fil) {
                        setModalFilterMaterial(fil.material);
                        setModalFilterBrand(fil.brand);
                        setModalFilterColor(fil.color);
                      }
                    }
                  }}
                  className="form-input"
                  style={{ padding: '0.65rem 0.85rem' }}
                  required
                >
                  <option value="">-- Selecione um filamento --</option>
                  {modalFilteredFilaments.map((f) => {
                    const g = ((f.quantityKg || 0) * 1000).toFixed(0);
                    return (
                      <option key={f.id} value={f.id}>
                        {f.material} - {f.brand} ({f.color}) — Saldo: {Number(f.quantityKg).toFixed(3)} kg ({g}g)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Quantidade Usada em gramas */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Quantidade Usada (em gramas - g)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="Ex: 50"
                  value={quantityGInput}
                  onChange={(e) => {
                    setQuantityGInput(e.target.value);
                    setModalError('');
                  }}
                  className="form-input"
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderColor: isOverLimit ? 'var(--danger)' : undefined
                  }}
                  required
                  autoFocus
                />
              </div>

              {/* Motivo ou Observação da Baixa */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Motivo / Observação (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Impressão peça cliente #245, calibração, teste de bico..."
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="form-input"
                  style={{ padding: '0.65rem 0.85rem' }}
                />
              </div>

              {/* Card Visual de Saldo Atual e Previsto */}
              {modalSelectedFilament && (
                <div
                  style={{
                    padding: '1.2rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1.5rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: modalSelectedFilament.color ? modalSelectedFilament.color.toLowerCase() : '#ccc',
                            border: '1px solid var(--border-color)'
                          }}
                        />
                        <strong style={{ fontSize: '0.95rem', color: '#fff' }}>
                          {modalSelectedFilament.material} - {modalSelectedFilament.brand} ({modalSelectedFilament.color})
                        </strong>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Saldo físico em estoque:{' '}
                        <strong style={{ color: currentKg > 0 ? 'var(--success)' : 'var(--danger)' }}>
                          {currentG.toFixed(1)}g ({currentKg.toFixed(3)} kg)
                        </strong>
                      </div>
                      {isEditing && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          Quantidade original gravada: <strong>{originalBaixaG}g</strong>
                        </div>
                      )}
                    </div>

                    {typedG > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Saldo Previsto no Estoque:
                        </div>
                        <div
                          style={{
                            fontSize: '1.2rem',
                            fontWeight: 800,
                            color: isOverLimit ? 'var(--danger)' : 'var(--success)',
                            marginTop: '0.15rem'
                          }}
                        >
                          {projectedBalanceG.toFixed(1)}g ({projectedBalanceKg.toFixed(3)} kg)
                        </div>
                        {isOverLimit && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.2rem' }}>
                            ⚠️ Quantidade solicitada excede o estoque!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botões do Modal */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || isOverLimit || typedG <= 0}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  {submitting ? (
                    <>
                      <Loader size={15} className="animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownCircle size={15} />
                      <span>{isEditing ? 'Salvar Alterações' : 'Confirmar Baixa'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BaixaFilamento;
