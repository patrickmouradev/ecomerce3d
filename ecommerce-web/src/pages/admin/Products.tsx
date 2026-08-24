import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Search, Edit, Trash2, ArrowUpDown, X, Loader, Upload, Copy } from 'lucide-react';

interface ProductFilament {
  filamentId: string;
  filamentLabel: string;
  weightG: number;
  pricePerKg?: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  weightG: number;
  printingHours: number;
  filaments: ProductFilament[];
  suggestedPrice: number;
  suggestedPriceShoppe: number;
  suggestedPriceParticular: number;
  productionCost: number;
  netProfit: number;
  netProfitShoppe: number;
  profitMargin: number;
  salePriceParticular: number;
  salePriceShoppe: number;
  active: boolean;
  imagesVideosPaths: string[];
  energyCostTotal: number;
  printerWearTotal: number;
  packagingCost: number;
  shopeeCostsTotal: number;
  productionCostWithoutShoppe: number;
}

interface Filament {
  id: string;
  material: string;
  brand: string;
  color: string;
  pricePerKg: number;
}

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtros e ordenação
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [direction, setDirection] = useState('asc');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [printingHours, setPrintingHours] = useState('');
  const [productFilaments, setProductFilaments] = useState<{ filamentId: string; weightG: string }[]>([
    { filamentId: '', weightG: '' }
  ]);
  const [profitMargin, setProfitMargin] = useState('');
  const [salePriceParticular, setSalePriceParticular] = useState('');
  const [salePriceShoppe, setSalePriceShoppe] = useState('');
  const [active, setActive] = useState(true);
  const [imagesVideosPaths, setImagesVideosPaths] = useState<string[]>([]);

  // Calculadora
  const [suggestedPriceShoppe, setSuggestedPriceShoppe] = useState<number | null>(null);
  const [suggestedPriceParticular, setSuggestedPriceParticular] = useState<number | null>(null);
  const [productionCost, setProductionCost] = useState<number | null>(null);
  const [netProfit, setNetProfit] = useState<number | null>(null);
  const [netProfitShoppe, setNetProfitShoppe] = useState<number | null>(null);
  const [energyCostTotal, setEnergyCostTotal] = useState<number | null>(null);
  const [printerWearTotal, setPrinterWearTotal] = useState<number | null>(null);
  const [packagingCost, setPackagingCost] = useState<number | null>(null);
  const [shopeeCostsTotal, setShopeeCostsTotal] = useState<number | null>(null);
  const [productionCostWithoutShoppe, setProductionCostWithoutShoppe] = useState<number | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  
  const [formError, setFormError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchFilaments();
  }, [searchQuery, sortBy, direction]);

  // Executa o preview do preço sugerido em tempo real ao alterar peso, horas, filamento ou margem
  useEffect(() => {
    const hasValidFilaments = productFilaments.length > 0 && productFilaments.every(f => f.filamentId && parseFloat(f.weightG) > 0);
    if (hasValidFilaments && printingHours) {
      calculateSuggestedPricePreview();
    } else {
      setSuggestedPriceShoppe(null);
      setSuggestedPriceParticular(null);
      setProductionCost(null);
      setNetProfit(null);
      setNetProfitShoppe(null);
      setEnergyCostTotal(null);
      setPrinterWearTotal(null);
      setPackagingCost(null);
      setShopeeCostsTotal(null);
      setProductionCostWithoutShoppe(null);
    }
  }, [JSON.stringify(productFilaments), printingHours, profitMargin]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/products', {
        params: {
          query: searchQuery,
          sortBy: sortBy,
          direction: direction
        }
      });
      setProducts(response.data);
    } catch (e) {
      console.error("Erro ao buscar produtos", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilaments = async () => {
    try {
      const response = await api.get('/api/admin/filaments');
      setFilaments(response.data);
    } catch (e) {
      console.error("Erro ao buscar filamentos", e);
    }
  };

  const calculateSuggestedPricePreview = async () => {
    setLoadingSuggestion(true);
    try {
      const validFilaments = productFilaments.filter(f => f.filamentId && parseFloat(f.weightG) > 0);
      const response = await api.post('/api/admin/products/pricing-preview', {
        printingHours: parseFloat(printingHours),
        profitMargin: parseFloat(profitMargin || '0'),
        filaments: validFilaments.map(f => ({
          filamentId: f.filamentId,
          weightG: parseFloat(f.weightG)
        }))
      });
      setSuggestedPriceShoppe(response.data.suggestedPriceShoppe);
      setSuggestedPriceParticular(response.data.suggestedPriceParticular);
      setProductionCost(response.data.productionCost);
      setNetProfit(response.data.netProfit);
      setNetProfitShoppe(response.data.netProfitShoppe);
      setEnergyCostTotal(response.data.energyCostTotal);
      setPrinterWearTotal(response.data.printerWearTotal);
      setPackagingCost(response.data.packagingCost);
      setShopeeCostsTotal(response.data.shopeeCostsTotal);
      setProductionCostWithoutShoppe(response.data.productionCostWithoutShoppe);
    } catch (e) {
      console.error("Erro ao calcular precificação", e);
    } finally {
      setLoadingSuggestion(false);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const response = await api.post('/api/admin/products/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const fileUrl = response.data.fileUrl;
      setImagesVideosPaths((prev) => [...prev, fileUrl]);
    } catch (err) {
      console.error("Erro ao enviar arquivo", err);
      alert("Falha ao fazer upload do arquivo");
    } finally {
      setUploading(false);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setName('');
    setDescription('');
    setProductFilaments([{ filamentId: '', weightG: '' }]);
    setPrintingHours('');
    setProfitMargin('');
    setSalePriceParticular('');
    setSalePriceShoppe('');
    setActive(true);
    setImagesVideosPaths([]);
    setSuggestedPriceShoppe(null);
    setSuggestedPriceParticular(null);
    setProductionCost(null);
    setNetProfit(null);
    setNetProfitShoppe(null);
    setEnergyCostTotal(null);
    setPrinterWearTotal(null);
    setPackagingCost(null);
    setShopeeCostsTotal(null);
    setProductionCostWithoutShoppe(null);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setIsEditing(true);
    setSelectedId(prod.id);
    setName(prod.name);
    setDescription(prod.description);
    setProductFilaments(
      prod.filaments?.map(pf => ({
        filamentId: pf.filamentId,
        weightG: pf.weightG.toString()
      })) || [{ filamentId: '', weightG: '' }]
    );
    setPrintingHours(prod.printingHours.toString());
    setProfitMargin(prod.profitMargin.toString());
    setSalePriceParticular(prod.salePriceParticular.toString());
    setSalePriceShoppe(prod.salePriceShoppe.toString());
    setActive(prod.active);
    setImagesVideosPaths(prod.imagesVideosPaths || []);
    setSuggestedPriceShoppe(prod.suggestedPriceShoppe);
    setSuggestedPriceParticular(prod.suggestedPriceParticular);
    setProductionCost(prod.productionCost);
    setNetProfit(prod.netProfit);
    setNetProfitShoppe(prod.netProfitShoppe);
    setEnergyCostTotal(prod.energyCostTotal);
    setPrinterWearTotal(prod.printerWearTotal);
    setPackagingCost(prod.packagingCost);
    setShopeeCostsTotal(prod.shopeeCostsTotal);
    setProductionCostWithoutShoppe(prod.productionCostWithoutShoppe);
    setFormError('');
    setModalOpen(true);
  };

  const openDuplicateModal = (prod: Product) => {
    setIsEditing(false);
    setSelectedId(null);
    setName(prod.name + ' (Cópia)');
    setDescription(prod.description);
    setProductFilaments(
      prod.filaments?.map(pf => ({
        filamentId: pf.filamentId,
        weightG: pf.weightG.toString()
      })) || [{ filamentId: '', weightG: '' }]
    );
    setPrintingHours(prod.printingHours.toString());
    setProfitMargin(prod.profitMargin.toString());
    setSalePriceParticular(prod.salePriceParticular.toString());
    setSalePriceShoppe(prod.salePriceShoppe.toString());
    setActive(prod.active);
    setImagesVideosPaths(prod.imagesVideosPaths || []);
    setSuggestedPriceShoppe(prod.suggestedPriceShoppe);
    setSuggestedPriceParticular(prod.suggestedPriceParticular);
    setProductionCost(prod.productionCost);
    setNetProfit(prod.netProfit);
    setNetProfitShoppe(prod.netProfitShoppe);
    setEnergyCostTotal(prod.energyCostTotal);
    setPrinterWearTotal(prod.printerWearTotal);
    setPackagingCost(prod.packagingCost);
    setShopeeCostsTotal(prod.shopeeCostsTotal);
    setProductionCostWithoutShoppe(prod.productionCostWithoutShoppe);
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const hasValidFilaments = productFilaments.length > 0 && productFilaments.every(f => f.filamentId && parseFloat(f.weightG) > 0);
    if (!name.trim() || !printingHours.trim() || !hasValidFilaments || !salePriceParticular.trim() || !salePriceShoppe.trim() || !profitMargin.trim()) {
      setFormError('Preencha todos os campos obrigatórios e garanta que todos os filamentos possuem peso válido');
      return;
    }

    const priceParticular = parseFloat(salePriceParticular);
    if (isNaN(priceParticular) || priceParticular <= 0) {
      setFormError('O preço de venda particular deve ser maior que zero');
      return;
    }

    const priceShoppe = parseFloat(salePriceShoppe);
    if (isNaN(priceShoppe) || priceShoppe <= 0) {
      setFormError('O preço de venda Shoppe deve ser maior que zero');
      return;
    }

    const margin = parseFloat(profitMargin);
    if (isNaN(margin) || margin < 0) {
      setFormError('A margem de lucro deve ser no mínimo zero');
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      printingHours: parseFloat(printingHours),
      filaments: productFilaments.map(f => ({
        filamentId: f.filamentId,
        weightG: parseFloat(f.weightG)
      })),
      profitMargin: margin,
      salePriceParticular: priceParticular,
      salePriceShoppe: priceShoppe,
      active: active,
      imagesVideosPaths: imagesVideosPaths
    };

    try {
      if (isEditing && selectedId) {
        await api.put(`/api/admin/products/${selectedId}`, payload);
      } else {
        await api.post('/api/admin/products', payload);
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Falha ao salvar dados do produto');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja inativar o produto "${name}"?`)) {
      try {
        await api.delete(`/api/admin/products/${id}`);
        fetchProducts();
      } catch (err) {
        console.error("Erro ao inativar produto", err);
      }
    }
  };

  const removeMedia = (indexToRemove: number) => {
    setImagesVideosPaths((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Topo da Tela */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)' }}>Catálogo de Peças (Admin)</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Cadastre suas impressões 3D com calculadora inteligente e fotos/vídeos</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} />
          Adicionar Novo Produto
        </button>
      </div>

      {/* Barra de Filtro */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2.5rem', display: 'flex', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input 
            type="text" 
            placeholder="Filtrar por nome ou descrição..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* Tabela de Listagem de Produtos */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader className="animate-spin" size={24} style={{ color: 'var(--primary)' }} />
        </div>
      ) : products.length > 0 ? (
        <div className="table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')}>
                  Nome <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                </th>
                <th>Material</th>
                <th onClick={() => handleSort('weightG')}>
                  Peso (g) <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                </th>
                <th onClick={() => handleSort('printingHours')}>
                  Horas <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                </th>
                <th>Custo Produção</th>
                <th>Preço Sugerido</th>
                <th onClick={() => handleSort('salePriceParticular')}>
                  Venda Particular <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                </th>
                <th onClick={() => handleSort('salePriceShoppe')}>
                  Venda Shoppe <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                </th>
                <th>Lucro Líquido</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr key={prod.id} style={{ opacity: prod.active ? 1 : 0.5 }}>
                  <td style={{ fontWeight: 600 }}>{prod.name}</td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {prod.filaments?.map(f => f.filamentLabel).join(', ') || 'Sem filamentos'}
                  </td>
                  <td>{prod.weightG} g</td>
                  <td>{prod.printingHours} h</td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {prod.productionCost?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A'}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {prod.suggestedPrice?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A'}
                  </td>
                  <td style={{ color: 'var(--success)', fontWeight: 700 }}>
                    {prod.salePriceParticular?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A'}
                  </td>
                  <td style={{ color: 'var(--success)', fontWeight: 700 }}>
                    {prod.salePriceShoppe?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A'}
                  </td>
                  <td style={{ color: prod.netProfit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                    {prod.netProfit?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A'}
                  </td>
                  <td>
                    <span style={{
                      padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                      background: prod.active ? 'var(--success-glow)' : 'rgba(255,59,48,0.1)',
                      color: prod.active ? 'var(--success)' : 'var(--danger)',
                      border: `1px solid ${prod.active ? 'rgba(0,255,136,0.2)' : 'rgba(255,59,48,0.2)'}`
                    }}>
                      {prod.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem', float: 'right' }}>
                      <button 
                        onClick={() => openDuplicateModal(prod)}
                        className="btn btn-secondary" 
                        title="Duplicar Produto"
                        style={{ padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}
                      >
                        <Copy size={14} />
                      </button>
                      <button 
                        onClick={() => openEditModal(prod)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(prod.id, prod.name)}
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
          Nenhum produto cadastrado correspondente aos filtros.
        </div>
      )}

      {/* Modal de Cadastro / Edição */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>
                {isEditing ? 'Editar Produto' : 'Cadastrar Novo Modelo'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem', maxHeight: '80vh', overflowY: 'auto' }}>
              <div className="form-group">
                <label className="form-label">Nome da Peça (Título de Venda)</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="form-input" 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descrição / Detalhes do Modelo</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="form-input" 
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Filamentos Utilizados</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {productFilaments.map((pf, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <select 
                        value={pf.filamentId} 
                        onChange={(e) => {
                          const newFils = [...productFilaments];
                          newFils[index].filamentId = e.target.value;
                          setProductFilaments(newFils);
                        }} 
                        className="form-input"
                        style={{ flex: 2 }}
                        required
                      >
                        <option value="">Selecione o Filamento...</option>
                        {filaments.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.material} - {f.brand} ({f.color}) - R$ {f.pricePerKg}/Kg
                          </option>
                        ))}
                      </select>
                      
                      <input 
                        type="number" 
                        step="0.001" 
                        placeholder="Peso (g)"
                        value={pf.weightG} 
                        onChange={(e) => {
                          const newFils = [...productFilaments];
                          newFils[index].weightG = e.target.value;
                          setProductFilaments(newFils);
                        }} 
                        className="form-input"
                        style={{ flex: 1 }}
                        required 
                      />

                      {productFilaments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setProductFilaments(productFilaments.filter((_, i) => i !== index));
                          }}
                          className="btn btn-danger"
                          style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setProductFilaments([...productFilaments, { filamentId: '', weightG: '' }])}
                    className="btn btn-secondary"
                    style={{ alignSelf: 'flex-start', marginTop: '0.5rem', fontSize: '0.85rem' }}
                  >
                    + Adicionar Filamento
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Horas de Impressão (h)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={printingHours} 
                    onChange={(e) => setPrintingHours(e.target.value)} 
                    className="form-input" 
                    required 
                  />
                </div>
                <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Peso Total Calculado</span>
                  <span style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 600, marginTop: '0.25rem' }}>
                    {productFilaments.reduce((acc, f) => acc + (parseFloat(f.weightG) || 0), 0).toFixed(2)} g
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Margem de Lucro (%)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={profitMargin} 
                  onChange={(e) => setProfitMargin(e.target.value)} 
                  className="form-input" 
                  placeholder="Ex: 50"
                  required 
                />
              </div>

              {/* Box de Cálculo Inteligente em Tempo Real */}
              {(productFilaments.length > 0 && productFilaments.every(f => f.filamentId && parseFloat(f.weightG) > 0) && printingHours) && (
                <div style={{
                  background: 'rgba(0,240,255,0.03)',
                  border: '1px solid var(--primary-glow-strong)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Valor Custo Energia:</span>
                    <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                      {loadingSuggestion ? 'Calculando...' : energyCostTotal?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Valor Embalagem:</span>
                    <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                      {loadingSuggestion ? 'Calculando...' : packagingCost?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Valor Desgaste Impressão:</span>
                    <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                      {loadingSuggestion ? 'Calculando...' : printerWearTotal?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Valor Taxas Shoppe:</span>
                    <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                      {loadingSuggestion ? 'Calculando...' : shopeeCostsTotal?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Valor Custos Particular:</span>
                    <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                      {loadingSuggestion ? 'Calculando...' : productionCostWithoutShoppe?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Valor Com Custos Shoppe:</span>
                    <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                      {loadingSuggestion ? 'Calculando...' : productionCost?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sugestão de Preço Particular:</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700 }}>
                      {loadingSuggestion ? 'Calculando...' : suggestedPriceParticular?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sugestão de Preço Shoppe:</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700 }}>
                      {loadingSuggestion ? 'Calculando...' : suggestedPriceShoppe?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estimativa de Lucro Líquido Particular:</span>
                    <span style={{ fontSize: '0.9rem', color: (netProfit && netProfit >= 0) ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                      {loadingSuggestion ? 'Calculando...' : netProfit?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estimativa de Lucro Líquido Shoppe:</span>
                    <span style={{ fontSize: '0.9rem', color: (netProfitShoppe && netProfitShoppe >= 0) ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                      {loadingSuggestion ? 'Calculando...' : netProfitShoppe?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Preço Venda Particular (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={salePriceParticular} 
                    onChange={(e) => setSalePriceParticular(e.target.value)} 
                    className="form-input" 
                    required 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Preço Venda Shoppe (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={salePriceShoppe} 
                    onChange={(e) => setSalePriceShoppe(e.target.value)} 
                    className="form-input" 
                    required 
                  />
                </div>
                
                <div className="form-group" style={{ flex: 0.5, justifyContent: 'center', alignItems: 'flex-start', paddingTop: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                    <input 
                      type="checkbox" 
                      checked={active} 
                      onChange={(e) => setActive(e.target.checked)} 
                      style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Ativo</span>
                  </label>
                </div>
              </div>

              {/* Upload de Imagens / Mídia */}
              <div className="form-group" style={{ marginTop: '0.75rem' }}>
                <label className="form-label">Fotos e Vídeos da Peça</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <label className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <Upload size={14} />
                    {uploading ? 'Enviando...' : 'Fazer Upload'}
                    <input 
                      type="file" 
                      accept="image/*,video/*" 
                      onChange={handleFileUpload} 
                      style={{ display: 'none' }}
                      disabled={uploading}
                    />
                  </label>
                  {uploading && <Loader className="animate-spin" size={14} style={{ color: 'var(--primary)' }} />}
                </div>

                {/* Grid de Previsualização de Mídias Carregadas */}
                {imagesVideosPaths.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    {imagesVideosPaths.map((path, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        {path.toLowerCase().endsWith('.mp4') ? (
                          <video src={path} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <img src={path} alt="Upload preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                        <button 
                          type="button" 
                          onClick={() => removeMedia(idx)}
                          style={{
                            position: 'absolute', top: 2, right: 2,
                            background: 'rgba(255,59,48,0.8)', border: 'none', color: '#fff',
                            borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {formError && (
                <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>{formError}</p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Salvar Alterações' : 'Adicionar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Products;
// Adicionando um pequeno css inline para spins de loading
const styleTag = document.createElement('style');
styleTag.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .animate-spin {
    animation: spin 1s linear infinite;
  }
`;
document.head.appendChild(styleTag);
