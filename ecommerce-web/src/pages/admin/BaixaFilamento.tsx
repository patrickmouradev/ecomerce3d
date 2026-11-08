import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import {
  Loader,
  CheckCircle2,
  AlertTriangle,
  ArrowDownCircle
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

export const BaixaFilamento: React.FC = () => {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilamentId, setSelectedFilamentId] = useState('');
  const [quantityGInput, setQuantityGInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtro da tabela de consulta
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    fetchFilaments();
  }, []);

  const fetchFilaments = async () => {
    setLoading(true);
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
      setErrorMsg('Falha ao carregar lista de filamentos.');
    } finally {
      setLoading(false);
    }
  };

  const selectedFilament = useMemo(() => {
    return filaments.find((f) => f.id === selectedFilamentId) || null;
  }, [filaments, selectedFilamentId]);

  // Cálculos de saldo disponível e novo saldo previsto
  const currentKg = selectedFilament?.quantityKg ?? 0;
  const currentG = currentKg * 1000;
  const typedG = parseFloat(quantityGInput) || 0;
  const newBalanceG = currentG - typedG;
  const newBalanceKg = (currentKg - typedG / 1000);
  const isOverLimit = typedG > 0 && newBalanceG < 0;

  const handleDeductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedFilamentId) {
      setErrorMsg('Selecione um filamento para realizar a baixa.');
      return;
    }

    if (isNaN(typedG) || typedG <= 0) {
      setErrorMsg('Digite uma quantidade válida em gramas (maior que zero).');
      return;
    }

    if (isOverLimit) {
      setErrorMsg(`A quantidade solicitada (${typedG}g) é maior que o saldo em estoque (${currentG.toFixed(1)}g).`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/api/admin/filaments/${selectedFilamentId}/baixa`, {
        quantityG: typedG
      });

      const updatedFilament: Filament = res.data;
      const updatedG = (updatedFilament.quantityKg || 0) * 1000;

      setSuccessMsg(
        `Baixa de ${typedG}g confirmada com sucesso para ${selectedFilament?.material} ${selectedFilament?.color}! Novo saldo: ${updatedG.toFixed(1)}g (${updatedFilament.quantityKg.toFixed(3)} kg).`
      );

      setQuantityGInput('');
      // Atualiza na lista local e busca dados atualizados
      setFilaments((prev) =>
        prev.map((f) => (f.id === updatedFilament.id ? updatedFilament : f))
      );
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Falha ao realizar baixa no filamento.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayedFilaments = useMemo(() => {
    if (!searchFilter.trim()) return filaments;
    const term = searchFilter.toLowerCase();
    return filaments.filter(
      (f) =>
        f.material.toLowerCase().includes(term) ||
        f.brand.toLowerCase().includes(term) ||
        f.color.toLowerCase().includes(term)
    );
  }, [filaments, searchFilter]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Topo da Tela */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', margin: 0 }}>
          Baixa Filamento
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0' }}>
          Selecione o filamento do estoque, informe a quantidade usada e confirme a baixa manual no estoque físico
        </p>
      </div>

      {/* Alerta de Sucesso */}
      {successMsg && (
        <div
          style={{
            background: 'rgba(0, 255, 136, 0.12)',
            border: '1px solid var(--success)',
            color: 'var(--success)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: 600
          }}
        >
          <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Alerta de Erro */}
      {errorMsg && (
        <div
          style={{
            background: 'rgba(255, 68, 68, 0.12)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: 600
          }}
        >
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Card Principal de Formulário de Baixa (glass-panel) */}
      <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: 'var(--radius-md)', marginBottom: '2.5rem' }}>
        <form onSubmit={handleDeductSubmit}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            
            {/* Campo 1: Seleção do Filamento */}
            <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label className="form-label">Escolha o Filamento do Estoque</label>
              <select
                value={selectedFilamentId}
                onChange={(e) => {
                  setSelectedFilamentId(e.target.value);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="form-input"
                style={{ padding: '0.65rem 0.85rem' }}
                required
              >
                <option value="">-- Selecione um filamento --</option>
                {filaments.map((f) => {
                  const g = ((f.quantityKg || 0) * 1000).toFixed(0);
                  return (
                    <option key={f.id} value={f.id}>
                      {f.material} - {f.brand} ({f.color}) — Saldo: {f.quantityKg.toFixed(3)} kg ({g}g)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Campo 2: Quantidade Usada (Abre assim que o filamento é selecionado) */}
            {selectedFilament && (
              <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label className="form-label">Quantidade Usada (em gramas - g)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={currentG}
                  placeholder="Ex: 50"
                  value={quantityGInput}
                  onChange={(e) => setQuantityGInput(e.target.value)}
                  className="form-input"
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderColor: isOverLimit ? 'var(--danger)' : undefined
                  }}
                  required
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Detalhes do Filamento Selecionado e Prévia do Novo Saldo */}
          {selectedFilament && (
            <div
              style={{
                marginTop: '1.5rem',
                padding: '1.25rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: selectedFilament.color ? selectedFilament.color.toLowerCase() : '#ccc',
                        border: '1px solid var(--border-color)'
                      }}
                    ></span>
                    <strong style={{ fontSize: '1rem', color: '#fff' }}>
                      {selectedFilament.material} - {selectedFilament.brand} ({selectedFilament.color})
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Saldo físico atual em estoque:{' '}
                    <strong style={{ color: currentKg > 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {currentG.toFixed(1)}g ({currentKg.toFixed(3)} kg)
                    </strong>
                  </div>
                </div>

                {typedG > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Novo Saldo Previsto Após Baixa:
                    </div>
                    <div
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: isOverLimit ? 'var(--danger)' : 'var(--success)',
                        marginTop: '0.2rem'
                      }}
                    >
                      {newBalanceG.toFixed(1)}g ({newBalanceKg.toFixed(3)} kg)
                    </div>
                    {isOverLimit && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--danger)', marginTop: '0.15rem' }}>
                        ⚠️ A quantidade digitada excede o estoque disponível!
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedFilamentId('');
                    setQuantityGInput('');
                    setErrorMsg('');
                  }}
                >
                  Limpar
                </button>
                <button
                  type="submit"
                  disabled={submitting || isOverLimit || typedG <= 0}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <ArrowDownCircle size={16} />
                  {submitting ? 'Confirmando...' : 'Confirmar Baixa no Estoque'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Tabela de Consulta do Estoque de Filamentos */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>
          Saldos de Filamentos em Estoque
        </h3>
        <input
          type="text"
          placeholder="Filtrar filamentos..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="form-input"
          style={{ width: '240px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader className="animate-spin" size={24} style={{ color: 'var(--primary)' }} />
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
                const isSelected = selectedFilamentId === fil.id;
                const g = ((fil.quantityKg || 0) * 1000).toFixed(0);
                return (
                  <tr
                    key={fil.id}
                    style={{
                      background: isSelected ? 'rgba(0, 240, 255, 0.05)' : undefined
                    }}
                  >
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
                        ></span>
                        {fil.color}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: (fil.quantityKg || 0) > 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {fil.quantityKg != null ? Number(fil.quantityKg).toFixed(3) : '0.000'} kg ({g}g)
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setSelectedFilamentId(fil.id);
                          setQuantityGInput('');
                          setErrorMsg('');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={isSelected ? 'btn btn-primary' : 'btn btn-secondary'}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                      >
                        {isSelected ? 'Selecionado' : 'Dar Baixa'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          Nenhum filamento encontrado.
        </div>
      )}
    </div>
  );
};

export default BaixaFilamento;
