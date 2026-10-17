import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { getAccessories, createAccessory, type Accessory } from '../../services/accessoryService';
import { Plus, Search, Edit, Trash2, ArrowUpDown, X, Loader, Upload, Copy, ChevronLeft, ChevronRight, Star, Paperclip, Check, Sparkles } from 'lucide-react';

interface ProductFilament {
  filamentId: string;
  filamentLabel: string;
  weightG: number;
  pricePerKg?: number;
}

interface ProductAccessory {
  accessoryId: string;
  description: string;
  price: number;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  weightG: number;
  printingHours: number;
  filaments: ProductFilament[];
  accessories?: ProductAccessory[];
  accessoryCostTotal?: number;
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
  bannerImagesPaths?: string[];
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

  // Modal de Produto
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Modal de Seleção de Filamentos
  const [isFilamentModalOpen, setIsFilamentModalOpen] = useState(false);
  const [filamentSearchQuery, setFilamentSearchQuery] = useState('');
  const [filamentMaterialFilter, setFilamentMaterialFilter] = useState('');
  const [selectedFilamentId, setSelectedFilamentId] = useState<string | null>(null);
  const [selectedFilamentWeight, setSelectedFilamentWeight] = useState('');
  const [filamentModalError, setFilamentModalError] = useState('');

  // Acessórios
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [isAccessoryModalOpen, setIsAccessoryModalOpen] = useState(false);
  const [accessoryTab, setAccessoryTab] = useState<'select' | 'create'>('select');
  const [accessorySearchQuery, setAccessorySearchQuery] = useState('');
  const [selectedAccessoryId, setSelectedAccessoryId] = useState<string | null>(null);
  const [selectedAccessoryQuantity, setSelectedAccessoryQuantity] = useState('1');
  const [newAccessoryDesc, setNewAccessoryDesc] = useState('');
  const [newAccessoryPrice, setNewAccessoryPrice] = useState('');
  const [newAccessoryQuantity, setNewAccessoryQuantity] = useState('1');
  const [accessoryModalError, setAccessoryModalError] = useState('');
  const [savingNewAccessory, setSavingNewAccessory] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [printingHours, setPrintingHours] = useState('');
  const [productFilaments, setProductFilaments] = useState<{ filamentId: string; weightG: string }[]>([]);
  const [productAccessories, setProductAccessories] = useState<{ accessoryId: string; description: string; price: number; quantity: number }[]>([]);
  const [profitMargin, setProfitMargin] = useState('');
  const [salePriceParticular, setSalePriceParticular] = useState('');
  const [salePriceShoppe, setSalePriceShoppe] = useState('');
  const [active, setActive] = useState(true);
  const [imagesVideosPaths, setImagesVideosPaths] = useState<string[]>([]);
  const [bannerImagesPaths, setBannerImagesPaths] = useState<string[]>([]);

  // Calculadora
  const [suggestedPriceShoppe, setSuggestedPriceShoppe] = useState<number | null>(null);
  const [suggestedPriceParticular, setSuggestedPriceParticular] = useState<number | null>(null);
  const [, setProductionCost] = useState<number | null>(null);
  const [netProfit, setNetProfit] = useState<number | null>(null);
  const [netProfitShoppe, setNetProfitShoppe] = useState<number | null>(null);
  const [energyCostTotal, setEnergyCostTotal] = useState<number | null>(null);
  const [printerWearTotal, setPrinterWearTotal] = useState<number | null>(null);
  const [packagingCost, setPackagingCost] = useState<number | null>(null);
  const [accessoryCostTotal, setAccessoryCostTotal] = useState<number | null>(null);
  const [, setShopeeCostsTotal] = useState<number | null>(null);
  const [productionCostWithoutShoppe, setProductionCostWithoutShoppe] = useState<number | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  
  const [formError, setFormError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [draggedMediaIndex, setDraggedMediaIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchFilaments();
    fetchAccessories();
  }, [searchQuery, sortBy, direction]);

  // Executa o preview do preço sugerido em tempo real ao alterar peso, horas, filamento, margem ou acessórios
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
      setAccessoryCostTotal(null);
      setShopeeCostsTotal(null);
      setProductionCostWithoutShoppe(null);
    }
  }, [JSON.stringify(productFilaments), JSON.stringify(productAccessories), printingHours, profitMargin]);

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

  const fetchAccessories = async () => {
    try {
      const data = await getAccessories();
      setAccessories(data);
    } catch (e) {
      console.error("Erro ao buscar acessórios", e);
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
        })),
        accessories: productAccessories.map(a => ({
          accessoryId: a.accessoryId,
          quantity: a.quantity
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
      setAccessoryCostTotal(response.data.accessoryCostTotal);
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

    const fileList = Array.from(files);
    setUploading(true);
    setUploadProgress(`Enviando ${fileList.length} arquivo(s)...`);

    try {
      const uploadPromises = fileList.map(async (file, index) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/api/admin/products/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return { index, fileUrl: response.data.fileUrl as string };
      });

      const results = await Promise.all(uploadPromises);
      results.sort((a, b) => a.index - b.index);
      const newUrls = results.map(r => r.fileUrl);

      setImagesVideosPaths((prev) => [...prev, ...newUrls]);
    } catch (err) {
      console.error("Erro ao enviar arquivos", err);
      alert("Falha ao fazer upload de um ou mais arquivos");
    } finally {
      setUploading(false);
      setUploadProgress('');
      e.target.value = '';
    }
  };

  const moveMedia = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= imagesVideosPaths.length) return;
    const newPaths = [...imagesVideosPaths];
    const temp = newPaths[index];
    newPaths[index] = newPaths[targetIndex];
    newPaths[targetIndex] = temp;
    setImagesVideosPaths(newPaths);
  };

  const setAsCover = (index: number) => {
    const newPaths = [...imagesVideosPaths];
    const [selected] = newPaths.splice(index, 1);
    newPaths.unshift(selected);
    setImagesVideosPaths(newPaths);
  };

  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setUploading(true);
    setUploadProgress(`Enviando ${fileList.length} banner(s)...`);

    try {
      const uploadPromises = fileList.map(async (file, index) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/api/admin/products/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return { index, fileUrl: response.data.fileUrl as string };
      });

      const results = await Promise.all(uploadPromises);
      results.sort((a, b) => a.index - b.index);
      const newUrls = results.map(r => r.fileUrl);

      setImagesVideosPaths((prev) => [...prev, ...newUrls]);
      setBannerImagesPaths((prev) => [...prev, ...newUrls]);
    } catch (err) {
      console.error("Erro ao enviar arquivos de banner", err);
      alert("Falha ao fazer upload de banner(s)");
    } finally {
      setUploading(false);
      setUploadProgress('');
      e.target.value = '';
    }
  };

  const toggleBanner = (path: string) => {
    setBannerImagesPaths((prev) => {
      if (prev.includes(path)) {
        return prev.filter((p) => p !== path);
      } else {
        return [...prev, path];
      }
    });
  };

  const handleMediaDragStart = (e: React.DragEvent, index: number) => {
    setDraggedMediaIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleMediaDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleMediaDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedMediaIndex === null || draggedMediaIndex === targetIndex) return;
    const newPaths = [...imagesVideosPaths];
    const [draggedItem] = newPaths.splice(draggedMediaIndex, 1);
    newPaths.splice(targetIndex, 0, draggedItem);
    setImagesVideosPaths(newPaths);
    setDraggedMediaIndex(null);
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setName('');
    setDescription('');
    setProductFilaments([]);
    setProductAccessories([]);
    setPrintingHours('');
    setProfitMargin('');
    setSalePriceParticular('');
    setSalePriceShoppe('');
    setActive(true);
    setImagesVideosPaths([]);
    setBannerImagesPaths([]);
    setSuggestedPriceShoppe(null);
    setSuggestedPriceParticular(null);
    setProductionCost(null);
    setNetProfit(null);
    setNetProfitShoppe(null);
    setEnergyCostTotal(null);
    setPrinterWearTotal(null);
    setPackagingCost(null);
    setAccessoryCostTotal(null);
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
      })) || []
    );
    setProductAccessories(
      prod.accessories?.map(pa => ({
        accessoryId: pa.accessoryId,
        description: pa.description,
        price: pa.price,
        quantity: pa.quantity
      })) || []
    );
    setPrintingHours(prod.printingHours.toString());
    setProfitMargin(prod.profitMargin.toString());
    setSalePriceParticular(prod.salePriceParticular.toString());
    setSalePriceShoppe(prod.salePriceShoppe.toString());
    setActive(prod.active);
    setImagesVideosPaths(prod.imagesVideosPaths || []);
    setBannerImagesPaths(prod.bannerImagesPaths || []);
    setSuggestedPriceShoppe(prod.suggestedPriceShoppe);
    setSuggestedPriceParticular(prod.suggestedPriceParticular);
    setProductionCost(prod.productionCost);
    setNetProfit(prod.netProfit);
    setNetProfitShoppe(prod.netProfitShoppe);
    setEnergyCostTotal(prod.energyCostTotal);
    setPrinterWearTotal(prod.printerWearTotal);
    setPackagingCost(prod.packagingCost);
    setAccessoryCostTotal(prod.accessoryCostTotal || null);
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
      })) || []
    );
    setProductAccessories(
      prod.accessories?.map(pa => ({
        accessoryId: pa.accessoryId,
        description: pa.description,
        price: pa.price,
        quantity: pa.quantity
      })) || []
    );
    setPrintingHours(prod.printingHours.toString());
    setProfitMargin(prod.profitMargin.toString());
    setSalePriceParticular(prod.salePriceParticular.toString());
    setSalePriceShoppe(prod.salePriceShoppe.toString());
    setActive(prod.active);
    setImagesVideosPaths(prod.imagesVideosPaths || []);
    setBannerImagesPaths(prod.bannerImagesPaths || []);
    setSuggestedPriceShoppe(prod.suggestedPriceShoppe);
    setSuggestedPriceParticular(prod.suggestedPriceParticular);
    setProductionCost(prod.productionCost);
    setNetProfit(prod.netProfit);
    setNetProfitShoppe(prod.netProfitShoppe);
    setEnergyCostTotal(prod.energyCostTotal);
    setPrinterWearTotal(prod.printerWearTotal);
    setPackagingCost(prod.packagingCost);
    setAccessoryCostTotal(prod.accessoryCostTotal || null);
    setShopeeCostsTotal(prod.shopeeCostsTotal);
    setProductionCostWithoutShoppe(prod.productionCostWithoutShoppe);
    setFormError('');
    setModalOpen(true);
  };

  // Funções do Modal de Seleção de Filamentos
  const openFilamentModal = () => {
    setFilamentSearchQuery('');
    setFilamentMaterialFilter('');
    setSelectedFilamentId(null);
    setSelectedFilamentWeight('');
    setFilamentModalError('');
    setIsFilamentModalOpen(true);
  };

  const handleAddFilamentFromModal = () => {
    if (!selectedFilamentId) {
      setFilamentModalError('Por favor, selecione um filamento na tabela.');
      return;
    }
    const weight = parseFloat(selectedFilamentWeight);
    if (isNaN(weight) || weight <= 0) {
      setFilamentModalError('Informe um peso (g) válido maior que zero.');
      return;
    }

    const existingIdx = productFilaments.findIndex(pf => pf.filamentId === selectedFilamentId);
    if (existingIdx >= 0) {
      const updated = [...productFilaments];
      updated[existingIdx] = { filamentId: selectedFilamentId, weightG: selectedFilamentWeight };
      setProductFilaments(updated);
    } else {
      setProductFilaments([
        ...productFilaments.filter(pf => pf.filamentId),
        { filamentId: selectedFilamentId, weightG: selectedFilamentWeight }
      ]);
    }

    setIsFilamentModalOpen(false);
  };

  const filteredFilamentsInModal = filaments.filter(f => {
    const query = filamentSearchQuery.toLowerCase();
    const matchesSearch = 
      f.material.toLowerCase().includes(query) ||
      f.brand.toLowerCase().includes(query) ||
      f.color.toLowerCase().includes(query);
    
    const matchesMaterial = !filamentMaterialFilter || f.material === filamentMaterialFilter;

    return matchesSearch && matchesMaterial;
  });

  // Funções do Modal de Acessórios
  const openAccessoryModal = () => {
    setAccessoryTab('select');
    setAccessorySearchQuery('');
    setSelectedAccessoryId(null);
    setSelectedAccessoryQuantity('1');
    setNewAccessoryDesc('');
    setNewAccessoryPrice('');
    setNewAccessoryQuantity('1');
    setAccessoryModalError('');
    setIsAccessoryModalOpen(true);
  };

  const handleAddAccessoryFromModal = () => {
    if (!selectedAccessoryId) {
      setAccessoryModalError('Por favor, selecione um acessório na tabela.');
      return;
    }
    const qty = parseInt(selectedAccessoryQuantity, 10);
    if (isNaN(qty) || qty < 1) {
      setAccessoryModalError('Informe uma quantidade inteira válida maior que zero.');
      return;
    }

    const acc = accessories.find(a => a.id === selectedAccessoryId);
    if (!acc) {
      setAccessoryModalError('Acessório não encontrado.');
      return;
    }

    const existingIdx = productAccessories.findIndex(pa => pa.accessoryId === selectedAccessoryId);
    if (existingIdx >= 0) {
      const updated = [...productAccessories];
      updated[existingIdx] = {
        ...updated[existingIdx],
        quantity: qty
      };
      setProductAccessories(updated);
    } else {
      setProductAccessories([
        ...productAccessories,
        {
          accessoryId: acc.id,
          description: acc.description,
          price: acc.price,
          quantity: qty
        }
      ]);
    }

    setIsAccessoryModalOpen(false);
  };

  const handleCreateAndAddAccessory = async () => {
    if (!newAccessoryDesc.trim()) {
      setAccessoryModalError('Informe a descrição do novo acessório.');
      return;
    }
    const price = parseFloat(newAccessoryPrice.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      setAccessoryModalError('Informe um valor unitário em Reais válido maior que zero.');
      return;
    }
    const qty = parseInt(newAccessoryQuantity, 10);
    if (isNaN(qty) || qty < 1) {
      setAccessoryModalError('Informe uma quantidade inteira válida maior que zero.');
      return;
    }

    setSavingNewAccessory(true);
    setAccessoryModalError('');
    try {
      const created = await createAccessory({
        description: newAccessoryDesc.trim(),
        price: price
      });

      // Atualiza catálogo global localmente
      setAccessories(prev => [...prev, created]);

      // Adiciona ao produto
      setProductAccessories(prev => [
        ...prev,
        {
          accessoryId: created.id,
          description: created.description,
          price: created.price,
          quantity: qty
        }
      ]);

      setIsAccessoryModalOpen(false);
    } catch (err: any) {
      console.error("Erro ao cadastrar acessório", err);
      setAccessoryModalError(err.response?.data?.message || 'Falha ao cadastrar o acessório no catálogo global.');
    } finally {
      setSavingNewAccessory(false);
    }
  };

  const handleRemoveAccessory = (accessoryId: string) => {
    setProductAccessories(prev => prev.filter(pa => pa.accessoryId !== accessoryId));
  };

  const handleUpdateAccessoryQuantity = (accessoryId: string, quantity: number) => {
    const validQty = Math.max(1, quantity);
    setProductAccessories(prev => prev.map(pa => pa.accessoryId === accessoryId ? { ...pa, quantity: validQty } : pa));
  };

  const filteredAccessoriesInModal = accessories.filter(a => {
    const query = accessorySearchQuery.toLowerCase();
    return a.description.toLowerCase().includes(query);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const hasValidFilaments = productFilaments.length > 0 && productFilaments.every(f => f.filamentId && parseFloat(f.weightG) > 0);
    if (!name.trim() || !printingHours.trim() || !hasValidFilaments || !salePriceParticular.trim() || !salePriceShoppe.trim() || !profitMargin.trim()) {
      setFormError('Preencha todos os campos obrigatórios e adicione ao menos um filamento com peso válido');
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
      accessories: productAccessories.map(a => ({
        accessoryId: a.accessoryId,
        quantity: a.quantity
      })),
      profitMargin: margin,
      salePriceParticular: priceParticular,
      salePriceShoppe: priceShoppe,
      active: active,
      imagesVideosPaths: imagesVideosPaths,
      bannerImagesPaths: bannerImagesPaths
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
    const pathToRemove = imagesVideosPaths[indexToRemove];
    setImagesVideosPaths((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (pathToRemove) {
      setBannerImagesPaths((prev) => prev.filter((p) => p !== pathToRemove));
    }
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
        <div className="table-container" style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')}>
                  Nome <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                </th>
                <th onClick={() => handleSort('weightG')}>
                  Filamento e Peso <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                </th>
                <th onClick={() => handleSort('salePriceParticular')}>
                  Venda Particular <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                </th>
                <th onClick={() => handleSort('salePriceShoppe')}>
                  Venda Shoppe <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                </th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr key={prod.id} style={{ opacity: prod.active ? 1 : 0.5 }}>
                  <td style={{ fontWeight: 600 }}>{prod.name}</td>
                  <td>
                    {prod.filaments && prod.filaments.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {prod.filaments.map((f, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{f.filamentLabel}</span>
                            <span style={{
                              fontWeight: 600,
                              color: 'var(--primary)',
                              background: 'rgba(0, 240, 255, 0.08)',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              whiteSpace: 'nowrap',
                              fontSize: '0.8rem'
                            }}>
                              {f.weightG} g
                            </span>
                          </div>
                        ))}
                        {prod.filaments.length > 1 && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            borderTop: '1px dashed var(--border-color)',
                            paddingTop: '0.25rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span>Total:</span>
                            <strong style={{ color: 'var(--text-secondary)' }}>{prod.weightG} g</strong>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {prod.weightG ? `${prod.weightG} g` : 'Sem filamentos'}
                      </span>
                    )}
                  </td>
                  <td style={{ color: 'var(--success)', fontWeight: 700 }}>
                    {prod.salePriceParticular?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A'}
                  </td>
                  <td style={{ color: 'var(--success)', fontWeight: 700 }}>
                    {prod.salePriceShoppe?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A'}
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
                  {productFilaments.filter(pf => pf.filamentId).length === 0 ? (
                    <div style={{
                      padding: '1rem',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px dashed var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem'
                    }}>
                      Nenhum filamento adicionado ainda. Clique no botão abaixo para selecionar.
                    </div>
                  ) : (
                    productFilaments.filter(pf => pf.filamentId).map((pf, index) => {
                      const fil = filaments.find(f => f.id === pf.filamentId);
                      const weightNum = parseFloat(pf.weightG) || 0;
                      const calculatedCost = fil ? (weightNum * fil.pricePerKg / 1000) : 0;

                      return (
                        <div key={index} style={{
                          display: 'flex',
                          gap: '0.75rem',
                          alignItems: 'center',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.6rem 0.8rem'
                        }}>
                          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff' }}>
                              {fil ? `${fil.material} - ${fil.brand}` : 'Filamento Selecionado'}
                            </span>
                            <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                              {fil ? `${fil.color} (R$ ${fil.pricePerKg}/Kg)` : ''}
                            </span>
                          </div>

                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <input 
                              type="number" 
                              step="0.001" 
                              placeholder="Peso (g)"
                              value={pf.weightG} 
                              onChange={(e) => {
                                const newFils = [...productFilaments];
                                const realIdx = productFilaments.findIndex(item => item.filamentId === pf.filamentId);
                                if (realIdx >= 0) {
                                  newFils[realIdx].weightG = e.target.value;
                                  setProductFilaments(newFils);
                                }
                              }} 
                              className="form-input"
                              style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                              required 
                            />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>g</span>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, minWidth: '70px', textAlign: 'right' }}>
                            R$ {calculatedCost.toFixed(2)}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setProductFilaments(productFilaments.filter(item => item.filamentId !== pf.filamentId));
                            }}
                            className="btn btn-danger"
                            style={{ padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Remover filamento"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })
                  )}

                  <button
                    type="button"
                    onClick={openFilamentModal}
                    className="btn btn-secondary"
                    style={{ alignSelf: 'flex-start', marginTop: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Plus size={14} />
                    Adicionar Filamento
                  </button>
                </div>
              </div>

              {/* Seção de Acessórios do Produto */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    Acessórios do Produto
                  </label>
                  {productAccessories.length > 0 && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                      Total Acessórios: R$ {productAccessories.reduce((acc, a) => acc + (a.price * a.quantity), 0).toFixed(2)}
                    </span>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem'
                }}>
                  {productAccessories.length === 0 ? (
                    <div style={{
                      padding: '1rem',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px dashed var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem'
                    }}>
                      Nenhum acessório vinculado ainda (ex: argolas, parafusos, ímãs).
                    </div>
                  ) : (
                    productAccessories.map((pa) => {
                      const itemSubtotal = pa.price * pa.quantity;
                      return (
                        <div key={pa.accessoryId} style={{
                          display: 'flex',
                          gap: '0.75rem',
                          alignItems: 'center',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.6rem 0.8rem'
                        }}>
                          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff' }}>
                              {pa.description}
                            </span>
                            <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                              Unitário: R$ {pa.price.toFixed(2)}
                            </span>
                          </div>

                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <input 
                              type="number" 
                              min="1"
                              step="1"
                              placeholder="Qtd"
                              value={pa.quantity} 
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                handleUpdateAccessoryQuantity(pa.accessoryId, isNaN(val) ? 1 : val);
                              }} 
                              className="form-input"
                              style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                              required 
                            />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>un</span>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, minWidth: '70px', textAlign: 'right' }}>
                            R$ {itemSubtotal.toFixed(2)}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveAccessory(pa.accessoryId)}
                            className="btn btn-danger"
                            style={{ padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Remover acessório"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })
                  )}

                  <button
                    type="button"
                    onClick={openAccessoryModal}
                    className="btn btn-secondary"
                    style={{ alignSelf: 'flex-start', marginTop: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Plus size={14} />
                    Adicionar Acessório
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
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Custo Energia:</span>
                    <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                      {loadingSuggestion ? 'Calculando...' : energyCostTotal?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Custo Embalagem:</span>
                    <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                      {loadingSuggestion ? 'Calculando...' : packagingCost?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Desgaste Impressão:</span>
                    <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                      {loadingSuggestion ? 'Calculando...' : printerWearTotal?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Custo Acessórios:</span>
                    <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                      {loadingSuggestion ? 'Calculando...' : (accessoryCostTotal !== null ? accessoryCostTotal : productAccessories.reduce((acc, a) => acc + (a.price * a.quantity), 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Custo Total Produção:</span>
                    <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                      {loadingSuggestion ? 'Calculando...' : productionCostWithoutShoppe?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Sugestão de Preço Particular:</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700 }}>
                      {loadingSuggestion ? 'Calculando...' : suggestedPriceParticular?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Sugestão de Preço Shoppe:</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700 }}>
                      {loadingSuggestion ? 'Calculando...' : suggestedPriceShoppe?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: (netProfit && netProfit >= 0) ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>Estimativa de Lucro Líquido Particular:</span>
                    <span style={{ fontSize: '0.9rem', color: (netProfit && netProfit >= 0) ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                      {loadingSuggestion ? 'Calculando...' : netProfit?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', color: (netProfitShoppe && netProfitShoppe >= 0) ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>Estimativa de Lucro Líquido Shoppe:</span>
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

              {/* Upload de Imagens / Mídia e Ordem do Carrossel */}
              <div className="form-group" style={{ marginTop: '0.75rem' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span>Fotos e Vídeos da Peça ({imagesVideosPaths.length})</span>
                    {bannerImagesPaths.length > 0 && (
                      <span
                        style={{
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: '#000',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <Sparkles size={11} fill="#000" />
                        {bannerImagesPaths.length} no Banner
                      </span>
                    )}
                  </div>
                  {imagesVideosPaths.length > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400 }}>
                      A 1ª foto é a capa do carrossel
                    </span>
                  )}
                </label>
                
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label className="btn btn-secondary" style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem', cursor: uploading ? 'not-allowed' : 'pointer' }}>
                    <Upload size={15} />
                    {uploading ? (uploadProgress || 'Enviando...') : 'Escolher Várias Fotos / Vídeos'}
                    <input 
                      type="file" 
                      multiple
                      accept="image/*,video/*" 
                      onChange={handleFileUpload} 
                      style={{ display: 'none' }}
                      disabled={uploading}
                    />
                  </label>

                  <label 
                    className="btn btn-secondary" 
                    style={{ 
                      padding: '0.6rem 1.1rem', 
                      fontSize: '0.85rem', 
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      background: 'rgba(245, 158, 11, 0.08)',
                      color: '#f59e0b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                    title="Faz upload e já adiciona automaticamente as fotos na seleção do Banner de Destaque"
                  >
                    <Sparkles size={14} />
                    Upload Direto para Banner
                    <input 
                      type="file" 
                      multiple
                      accept="image/*" 
                      onChange={handleBannerFileUpload} 
                      style={{ display: 'none' }}
                      disabled={uploading}
                    />
                  </label>

                  {bannerImagesPaths.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setBannerImagesPaths([])}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-muted)',
                        padding: '0.45rem 0.8rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                      title="Desmarca todas as fotos do banner"
                    >
                      Limpar Banners ({bannerImagesPaths.length})
                    </button>
                  )}

                  {uploading && <Loader className="animate-spin" size={16} style={{ color: 'var(--primary)' }} />}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Pressione Ctrl ou Shift para selecionar múltiplos arquivos de uma vez.
                  </span>
                </div>

                {/* Grid e Reordenação do Carrossel */}
                {imagesVideosPaths.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                        Arraste as fotos para ordenar e clique no botão <strong>Escolher Banner</strong> para enviar ao carrossel de destaque:
                      </p>
                      <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
                        {bannerImagesPaths.length} de {imagesVideosPaths.length} foto(s) no Banner
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {imagesVideosPaths.map((path, idx) => {
                        const isCover = idx === 0;
                        const isBanner = bannerImagesPaths.includes(path);
                        const isVideo = path.toLowerCase().endsWith('.mp4');
                        const isDragging = draggedMediaIndex === idx;

                        return (
                          <div
                            key={idx}
                            draggable
                            onDragStart={(e) => handleMediaDragStart(e, idx)}
                            onDragOver={handleMediaDragOver}
                            onDrop={(e) => handleMediaDrop(e, idx)}
                            style={{
                              position: 'relative',
                              width: '125px',
                              borderRadius: 'var(--radius-sm)',
                              overflow: 'hidden',
                              border: isBanner ? '2px solid #f59e0b' : (isCover ? '2px solid var(--primary)' : '1px solid var(--border-color)'),
                              background: 'var(--bg-surface-1)',
                              boxShadow: isBanner ? '0 0 12px rgba(245, 158, 11, 0.25)' : (isCover ? '0 0 10px var(--primary-glow)' : 'none'),
                              opacity: isDragging ? 0.4 : 1,
                              cursor: 'grab',
                              transition: 'var(--transition-fast)'
                            }}
                          >
                            {/* Badge de Ordem / Capa */}
                            <div
                              style={{
                                position: 'absolute',
                                top: 4,
                                left: 4,
                                zIndex: 2,
                                background: isCover ? 'var(--primary)' : 'rgba(0, 0, 0, 0.75)',
                                color: isCover ? '#000' : '#fff',
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.2rem'
                              }}
                            >
                              {isCover && <Star size={10} fill="#000" />}
                              {isCover ? 'Capa' : `${idx + 1}º`}
                            </div>

                            {/* Badge Indicativo se está no Banner */}
                            {isBanner && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 26,
                                  left: 4,
                                  zIndex: 2,
                                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                  color: '#000',
                                  padding: '0.12rem 0.35rem',
                                  borderRadius: '3px',
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
                                }}
                              >
                                <Sparkles size={9} fill="#000" /> Banner
                              </div>
                            )}

                            {/* Botão de Excluir Foto */}
                            <button
                              type="button"
                              onClick={() => removeMedia(idx)}
                              title="Remover foto"
                              style={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                zIndex: 2,
                                background: 'rgba(255, 59, 48, 0.85)',
                                border: 'none',
                                color: '#fff',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <X size={11} />
                            </button>

                            {/* Mídia */}
                            <div style={{ height: '85px', width: '100%', background: '#0a0c10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isVideo ? (
                                <video src={path} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <img src={path} alt={`Mídia ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              )}
                            </div>

                            {/* Controles de Ordem (Setas e Capa) */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.25rem 0.4rem',
                                background: 'rgba(255, 255, 255, 0.03)',
                                borderTop: '1px solid var(--border-color)'
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => moveMedia(idx, 'left')}
                                disabled={idx === 0}
                                title="Mover para esquerda"
                                style={{
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  border: 'none',
                                  color: idx === 0 ? 'var(--text-muted)' : '#fff',
                                  borderRadius: '3px',
                                  width: '22px',
                                  height: '22px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: idx === 0 ? 'not-allowed' : 'pointer'
                                }}
                              >
                                <ChevronLeft size={13} />
                              </button>

                              {!isCover && (
                                <button
                                  type="button"
                                  onClick={() => setAsCover(idx)}
                                  title="Tornar esta a Capa (1º)"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary)',
                                    cursor: 'pointer',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    padding: '0 0.2rem'
                                  }}
                                >
                                  Capa
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => moveMedia(idx, 'right')}
                                disabled={idx === imagesVideosPaths.length - 1}
                                title="Mover para direita"
                                style={{
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  border: 'none',
                                  color: idx === imagesVideosPaths.length - 1 ? 'var(--text-muted)' : '#fff',
                                  borderRadius: '3px',
                                  width: '22px',
                                  height: '22px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: idx === imagesVideosPaths.length - 1 ? 'not-allowed' : 'pointer',
                                  marginLeft: isCover ? 'auto' : undefined
                                }}
                              >
                                <ChevronRight size={13} />
                              </button>
                            </div>

                            {/* Botão Dedicado para Escolher / Remover do Banner */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBanner(path);
                              }}
                              title={isBanner ? "Remover imagem do Banner de Destaque" : "Escolher imagem para o Banner de Destaque"}
                              style={{
                                width: '100%',
                                padding: '0.35rem 0.2rem',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.3rem',
                                border: 'none',
                                borderTop: '1px solid var(--border-color)',
                                cursor: 'pointer',
                                background: isBanner ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255, 255, 255, 0.06)',
                                color: isBanner ? '#000' : 'var(--text-secondary)',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Sparkles size={11} fill={isBanner ? "#000" : "none"} />
                              {isBanner ? '★ No Banner' : '☆ Escolher Banner'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
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

      {/* Modal de Seleção de Filamento */}
      {isFilamentModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--primary-glow-strong)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Plus size={18} style={{ color: 'var(--primary)' }} />
                Selecionar Filamento
              </h3>
              <button 
                onClick={() => setIsFilamentModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Filtros */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 2, minWidth: '200px' }}>
                  <input 
                    type="text" 
                    placeholder="Buscar por marca, material ou cor..." 
                    value={filamentSearchQuery}
                    onChange={(e) => setFilamentSearchQuery(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2.25rem', fontSize: '0.875rem' }}
                  />
                  <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>

                <div style={{ flex: 1, minWidth: '140px' }}>
                  <select
                    value={filamentMaterialFilter}
                    onChange={(e) => setFilamentMaterialFilter(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '0.875rem' }}
                  >
                    <option value="">Todos os Materiais</option>
                    {Array.from(new Set(filaments.map(f => f.material))).map(mat => (
                      <option key={mat} value={mat}>{mat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tabela de Filamentos */}
              <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                <table className="premium-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Material</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Marca</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Cor</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Preço/Kg</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>Selecionar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFilamentsInModal.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          Nenhum filamento encontrado com os filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filteredFilamentsInModal.map((f) => {
                        const isSelected = selectedFilamentId === f.id;
                        return (
                          <tr 
                            key={f.id} 
                            onClick={() => {
                              setSelectedFilamentId(f.id);
                              setFilamentModalError('');
                            }}
                            style={{ 
                              cursor: 'pointer',
                              background: isSelected ? 'rgba(0, 240, 255, 0.1)' : undefined,
                              borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent'
                            }}
                          >
                            <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{f.material}</td>
                            <td style={{ padding: '0.6rem 0.75rem' }}>{f.brand}</td>
                            <td style={{ padding: '0.6rem 0.75rem' }}>{f.color}</td>
                            <td style={{ padding: '0.6rem 0.75rem', color: 'var(--primary)', fontWeight: 600 }}>R$ {f.pricePerKg}/Kg</td>
                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                              <div style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                border: isSelected ? '5px solid var(--primary)' : '2px solid var(--border-color)',
                                margin: '0 auto',
                                transition: 'all 0.2s'
                              }} />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Painel do Filamento Selecionado & Entrada de Peso */}
              {selectedFilamentId && (
                <div style={{
                  background: 'rgba(0, 240, 255, 0.04)',
                  border: '1px solid var(--primary-glow-strong)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  {(() => {
                    const sel = filaments.find(f => f.id === selectedFilamentId);
                    if (!sel) return null;
                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
                            {sel.material} - {sel.brand} ({sel.color})
                          </span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                            R$ {sel.pricePerKg}/Kg
                          </span>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>
                            Quantidade / Peso Utilizado na Peça (g):
                          </label>
                          <input 
                            type="number"
                            step="0.001"
                            placeholder="Ex: 150"
                            value={selectedFilamentWeight}
                            onChange={(e) => {
                              setSelectedFilamentWeight(e.target.value);
                              setFilamentModalError('');
                            }}
                            className="form-input"
                            style={{ fontSize: '0.9rem' }}
                            autoFocus
                          />
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {filamentModalError && (
                <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: 0 }}>{filamentModalError}</p>
              )}

            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              background: 'rgba(0,0,0,0.2)'
            }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setIsFilamentModalOpen(false)}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleAddFilamentFromModal}
              >
                Salvar e Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seleção e Cadastro de Acessórios */}
      {isAccessoryModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '560px',
            background: '#0d1117',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-glow)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Paperclip size={18} style={{ color: 'var(--primary)' }} />
                Acessórios do Produto
              </h3>
              <button 
                onClick={() => setIsAccessoryModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Abas: Selecionar do Catálogo vs Novo Acessório */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
              <button
                type="button"
                onClick={() => { setAccessoryTab('select'); setAccessoryModalError(''); }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: accessoryTab === 'select' ? '2px solid var(--primary)' : '2px solid transparent',
                  color: accessoryTab === 'select' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Selecionar do Catálogo
              </button>
              <button
                type="button"
                onClick={() => { setAccessoryTab('create'); setAccessoryModalError(''); }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: accessoryTab === 'create' ? '2px solid var(--primary)' : '2px solid transparent',
                  color: accessoryTab === 'create' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                + Cadastrar Novo Acessório
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {accessoryTab === 'select' ? (
                <>
                  {/* Busca */}
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text"
                      placeholder="Buscar acessório no catálogo..."
                      value={accessorySearchQuery}
                      onChange={(e) => setAccessorySearchQuery(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '2.25rem', fontSize: '0.875rem' }}
                    />
                  </div>

                  {/* Tabela de Acessórios Existentes */}
                  <div className="table-container" style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                    <table className="premium-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '0.6rem 0.75rem' }}>Descrição</th>
                          <th style={{ padding: '0.6rem 0.75rem' }}>Valor Unitário</th>
                          <th style={{ padding: '0.6rem 0.75rem', width: '50px', textAlign: 'center' }}>Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAccessoriesInModal.length === 0 ? (
                          <tr>
                            <td colSpan={3} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                              Nenhum acessório encontrado. Alterne para a aba "Cadastrar Novo" para criar.
                            </td>
                          </tr>
                        ) : (
                          filteredAccessoriesInModal.map((a) => {
                            const isSelected = selectedAccessoryId === a.id;
                            return (
                              <tr
                                key={a.id}
                                onClick={() => {
                                  setSelectedAccessoryId(a.id);
                                  setAccessoryModalError('');
                                }}
                                style={{
                                  cursor: 'pointer',
                                  background: isSelected ? 'rgba(0, 240, 255, 0.1)' : undefined,
                                  borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent'
                                }}
                              >
                                <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{a.description}</td>
                                <td style={{ padding: '0.6rem 0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                                  R$ {a.price.toFixed(2)}
                                </td>
                                <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                                  <div style={{
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    border: isSelected ? '5px solid var(--primary)' : '2px solid var(--border-color)',
                                    margin: '0 auto',
                                    transition: 'all 0.2s'
                                  }} />
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Painel do Acessório Selecionado */}
                  {selectedAccessoryId && (
                    <div style={{
                      background: 'rgba(0, 240, 255, 0.04)',
                      border: '1px solid var(--primary-glow-strong)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      {(() => {
                        const sel = accessories.find(a => a.id === selectedAccessoryId);
                        if (!sel) return null;
                        return (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
                                {sel.description}
                              </span>
                              <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                                R$ {sel.price.toFixed(2)} / un
                              </span>
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.8rem' }}>
                                Quantidade Utilizada neste Produto (unidades inteiras):
                              </label>
                              <input 
                                type="number"
                                min="1"
                                step="1"
                                placeholder="Ex: 1"
                                value={selectedAccessoryQuantity}
                                onChange={(e) => {
                                  setSelectedAccessoryQuantity(e.target.value);
                                  setAccessoryModalError('');
                                }}
                                className="form-input"
                                style={{ fontSize: '0.9rem' }}
                                autoFocus
                              />
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </>
              ) : (
                /* Aba: Cadastrar Novo Acessório */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    O acessório será cadastrado no catálogo geral do sistema e vinculado automaticamente a este produto.
                  </p>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Descrição do Acessório</label>
                    <input 
                      type="text"
                      placeholder="Ex: Argola Chaveiro 25mm, Ímã de Neodímio 10x2mm..."
                      value={newAccessoryDesc}
                      onChange={(e) => setNewAccessoryDesc(e.target.value)}
                      className="form-input"
                      required
                      autoFocus
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label className="form-label">Valor Unitário (R$)</label>
                      <input 
                        type="text"
                        placeholder="Ex: 0.50"
                        value={newAccessoryPrice}
                        onChange={(e) => setNewAccessoryPrice(e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label className="form-label">Quantidade no Produto</label>
                      <input 
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Ex: 1"
                        value={newAccessoryQuantity}
                        onChange={(e) => setNewAccessoryQuantity(e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {accessoryModalError && (
                <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: 0 }}>{accessoryModalError}</p>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              background: 'rgba(0,0,0,0.2)'
            }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setIsAccessoryModalOpen(false)}
              >
                Cancelar
              </button>
              {accessoryTab === 'select' ? (
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleAddAccessoryFromModal}
                >
                  Adicionar ao Produto
                </button>
              ) : (
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleCreateAndAddAccessory}
                  disabled={savingNewAccessory}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {savingNewAccessory ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
                  Cadastrar e Vincular
                </button>
              )}
            </div>
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
