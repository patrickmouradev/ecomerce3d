import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import OrderChatBox from '../components/OrderChatBox';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Truck,
  MapPin,
  QrCode,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  User as UserIcon,
  Mail,
  Phone,
  FileText,
  MessageSquare
} from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
}

interface AddressData {
  zipCode: string;
  streetName: string;
  streetNumber: string;
  complement: string;
  neighborhood: string;
  city: string;
  federalUnit: string;
  phone?: string;
}

interface ShippingOption {
  id: number;
  nome: string;
  transportadora: string;
  logoUrl?: string;
  valor: number;
  prazoDias: number;
}

interface OrderResult {
  id: string;
  orderNumber?: number;
  clientName?: string;
  status: string;
  paymentMethod: string;
  paymentStatusDetail: string;
  shippingCost: number;
  totalAmount: number;
  createdAt: string;
  items: {
    id: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
}

export const Checkout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Etapas: 1 = Carrinho & Frete (Correios), 2 = Dados & Endereço, 3 = Revisão & PIX, 4 = Chat do Pedido (PIX)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Carrinho
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Dados do Cliente
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState<AddressData>({
    zipCode: '',
    streetName: '',
    streetNumber: '',
    complement: '',
    neighborhood: '',
    city: '',
    federalUnit: ''
  });

  // Frete (Melhor Envio - somente Correios ou Retirar com Comprador)
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [shippingServiceId, setShippingServiceId] = useState<number | null>(null);
  const [shippingServiceName, setShippingServiceName] = useState<string>('Correios');
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  // WhatsApp opcional da loja
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');

  // Processamento e Pedido Concluído
  const [processingOrder, setProcessingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  useEffect(() => {
    loadCart();
    fetchCheckoutConfig();
  }, []);

  useEffect(() => {
    if (user) {
      if (user.name) setCustomerName(user.name);
      if (user.email) setCustomerEmail(user.email);
      fetchUserProfile();
    }
  }, [user]);

  const loadCart = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('3dprintpng_cart') || '[]');
      setCartItems(saved);
    } catch {
      setCartItems([]);
    }
  };

  const saveCart = (updated: CartItem[]) => {
    setCartItems(updated);
    localStorage.setItem('3dprintpng_cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart_updated'));
  };

  const fetchCheckoutConfig = async () => {
    try {
      const res = await api.get('/api/checkout/config');
      if (res.data?.whatsappNumber) {
        setWhatsappNumber(res.data.whatsappNumber);
      }
    } catch (e) {
      console.error('Erro ao carregar configuração de checkout', e);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/api/user/profile');
      const data = res.data;
      if (data.name) setCustomerName(data.name);
      if (data.email) setCustomerEmail(data.email);
      if (data.cpf) setCpf(formatCpf(data.cpf));
      if (data.phone) setPhone(formatPhone(data.phone));
      if (data.address && data.address.zipCode && data.address.zipCode.replace(/\D/g, '').length === 8) {
        const zip = data.address.zipCode.replace(/\D/g, '');
        setAddress({
          zipCode: formatCep(zip),
          streetName: data.address.streetName || '',
          streetNumber: data.address.streetNumber || '',
          complement: data.address.complement || '',
          neighborhood: data.address.neighborhood || '',
          city: data.address.city || '',
          federalUnit: data.address.federalUnit || ''
        });
        const savedCart: CartItem[] = JSON.parse(localStorage.getItem('3dprintpng_cart') || '[]');
        if (savedCart.length > 0) {
          handleCalculateShipping(zip, savedCart, true);
        }
      } else {
        setAddress({
          zipCode: '',
          streetName: '',
          streetNumber: '',
          complement: '',
          neighborhood: '',
          city: '',
          federalUnit: ''
        });
      }
    } catch (e) {
      console.error('Erro ao buscar perfil salvo do cliente', e);
    }
  };

  const formatCpf = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return digits;
  };

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    }
    return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
  };

  const formatCep = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    if (digits.length > 5) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    return digits;
  };

  const updateQuantity = (id: string, delta: number) => {
    const updated = cartItems
      .map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];
    saveCart(updated);
    if (address.zipCode.replace(/\D/g, '').length === 8 && updated.length > 0) {
      handleCalculateShipping(address.zipCode, updated);
    }
  };

  const removeItem = (id: string) => {
    const updated = cartItems.filter((item) => item.id !== id);
    saveCart(updated);
  };

  // Cálculo de Frete via Melhor Envio (exibindo somente Correios + Retirar com Comprador)
  const handleCalculateShipping = async (
    zipCodeInput?: string,
    itemsOverride?: CartItem[],
    silentValidation = false
  ) => {
    const targetZip = (zipCodeInput ?? address.zipCode).replace(/\D/g, '');
    const itemsToUse: CartItem[] =
      itemsOverride ??
      (cartItems.length > 0
        ? cartItems
        : JSON.parse(localStorage.getItem('3dprintpng_cart') || '[]'));

    if (itemsToUse.length === 0) {
      return;
    }

    if (targetZip.length !== 8) {
      if (!silentValidation) {
        setErrorMessage('Informe um CEP válido de 8 dígitos para calcular o frete dos Correios.');
      }
      return;
    }

    setCalculatingShipping(true);
    setErrorMessage(null);
    try {
      const res = await api.post('/api/checkout/shipping', {
        zipCode: targetZip,
        shippingServiceId: shippingServiceId ?? undefined,
        items: itemsToUse.map((i) => ({ productId: i.id, quantity: i.quantity }))
      });

      const allOptions: ShippingOption[] = Array.isArray(res.data.opcoes) ? res.data.opcoes : [];
      const correiosAndPickupOptions = allOptions.filter(
        (opt) =>
          (opt.transportadora || '').toLowerCase().includes('correios') ||
          opt.id === 0 ||
          (opt.nome || '').toLowerCase().includes('retirar')
      );
      const finalOptions = correiosAndPickupOptions.length > 0 ? correiosAndPickupOptions : allOptions;

      setShippingOptions(finalOptions);

      if (finalOptions.length > 0) {
        const chosen =
          finalOptions.find((o) => o.id === shippingServiceId) || finalOptions[0];
        setShippingCost(chosen.valor);
        setShippingServiceId(chosen.id);
        setShippingServiceName(
          chosen.id === 0 ? chosen.nome : `${chosen.transportadora} (${chosen.nome})`
        );
      } else {
        setShippingCost(res.data.valorFrete);
        setShippingServiceId(res.data.servicoId ?? null);
        setShippingServiceName(res.data.servicoNome || 'Correios');
      }
    } catch (e: any) {
      setErrorMessage(e.response?.data?.message || 'Não foi possível calcular o frete para este CEP.');
    } finally {
      setCalculatingShipping(false);
    }
  };

  const handleSelectShippingOption = (option: ShippingOption) => {
    setErrorMessage(null);
    setShippingServiceId(option.id);
    setShippingServiceName(
      option.id === 0 ? option.nome : `${option.transportadora} (${option.nome})`
    );
    setShippingCost(option.valor);
  };

  const handleCepChange = async (rawVal: string) => {
    const formatted = formatCep(rawVal);
    setAddress((prev) => ({ ...prev, zipCode: formatted }));
    setErrorMessage(null);

    const digits = rawVal.replace(/\D/g, '');
    if (digits.length === 8) {
      setLoadingCep(true);
      handleCalculateShipping(digits, undefined, true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setAddress((prev) => ({
            ...prev,
            zipCode: formatted,
            streetName: data.logradouro || prev.streetName,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            federalUnit: data.uf || prev.federalUnit
          }));
        }
      } catch (e) {
        console.warn('Falha ao consultar ViaCEP', e);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalAmount = subtotal + (shippingCost ?? 0);

  const handleProceedToStep2 = async () => {
    if (cartItems.length === 0) return;
    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }
    if (shippingCost === null) {
      if (address.zipCode.replace(/\D/g, '').length === 8) {
        await handleCalculateShipping(address.zipCode, cartItems, false);
      } else {
        setErrorMessage('Informe seu CEP e calcule o frete dos Correios (ou selecione Retirar com Comprador) antes de avançar.');
        return;
      }
    }
    setErrorMessage(null);
    setStep(2);
  };

  const handleProceedToStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCpf = cpf.replace(/\D/g, '');
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanZip = address.zipCode.replace(/\D/g, '');

    if (!customerName.trim() || customerName.trim().length < 3) {
      setErrorMessage('Informe seu nome completo.');
      return;
    }
    const resolvedEmail = (customerEmail || user?.email || '').trim();
    if (!resolvedEmail || !resolvedEmail.includes('@')) {
      setErrorMessage('Informe um e-mail válido para acompanhamento do pedido.');
      return;
    }
    if (cleanCpf.length !== 11 && cleanCpf.length !== 14) {
      setErrorMessage('Informe um CPF válido (11 dígitos) ou CNPJ (14 dígitos).');
      return;
    }
    if (cleanPhone.length < 10) {
      setErrorMessage('Informe um telefone/WhatsApp válido com DDD.');
      return;
    }
    if (
      cleanZip.length !== 8 ||
      !address.streetName.trim() ||
      !address.streetNumber.trim() ||
      !address.neighborhood.trim() ||
      !address.city.trim() ||
      address.federalUnit.trim().length !== 2
    ) {
      setErrorMessage('Preencha todos os campos obrigatórios do endereço de entrega.');
      return;
    }

    try {
      await api.put('/api/user/profile', {
        name: customerName.trim(),
        cpf: cleanCpf,
        phone: phone.trim(),
        address: {
          ...address,
          zipCode: cleanZip,
          federalUnit: address.federalUnit.trim().toUpperCase()
        }
      });

      if (shippingCost === null) {
        await handleCalculateShipping(cleanZip);
      }

      setStep(3);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Erro ao validar dados de entrega.');
    }
  };

  // Finaliza o Pedido (somente PIX via Chat com o Vendedor)
  const handleFinalizeOrderPixChat = async () => {
    setProcessingOrder(true);
    setErrorMessage(null);
    try {
      const response = await api.post('/api/checkout/process', {
        items: cartItems.map((i) => ({ productId: i.id, quantity: i.quantity })),
        customerName: customerName.trim(),
        cpf: cpf.replace(/\D/g, ''),
        phone: phone.trim(),
        address: {
          ...address,
          zipCode: address.zipCode.replace(/\D/g, ''),
          federalUnit: address.federalUnit.trim().toUpperCase()
        },
        shippingServiceId: shippingServiceId ?? undefined,
        paymentMethodId: 'pix_chat',
        payerEmail: customerEmail || user?.email
      });

      const createdOrder: OrderResult = response.data;
      setOrderResult(createdOrder);

      // Limpa o carrinho e abre o Chat com o Vendedor na Etapa 4
      saveCart([]);
      setStep(4);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Falha ao registrar o pedido. Verifique os dados informados.';
      setErrorMessage(msg);
    } finally {
      setProcessingOrder(false);
    }
  };

  // Polling leve do status do pedido na Etapa 4 (caso o vendedor marque como PAGO enquanto o cliente está no chat)
  useEffect(() => {
    if (step !== 4 || !orderResult || orderResult.status !== 'PENDENTE') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/api/checkout/orders/${orderResult.id}/status`);
        if (res.data && res.data.status !== orderResult.status) {
          setOrderResult(res.data);
        }
      } catch {
        // Ignora falha silenciosa
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [step, orderResult]);

  return (
    <div className="page-container" style={{ maxWidth: '1100px' }}>
      {/* Cabeçalho do Checkout e Stepper */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => (step > 1 && step < 4 ? setStep((s) => (s - 1) as 1 | 2 | 3) : navigate('/'))}
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
          {step > 1 && step < 4 ? 'Voltar para etapa anterior' : 'Voltar ao Catálogo'}
        </button>

        <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontFamily: 'var(--font-display)', color: '#fff', marginBottom: '1.25rem' }}>
          Finalizar Compra
        </h1>

        {/* Barra de Progresso das Etapas */}
        <div className="checkout-stepper">
          {[
            { num: 1, label: '1. Carrinho & Frete' },
            { num: 2, label: '2. Dados & Entrega' },
            { num: 3, label: '3. Pagamento (PIX)' },
            { num: 4, label: '4. Chat & PIX' }
          ].map((item) => {
            const active = step === item.num;
            const completed = step > item.num;
            return (
              <div
                key={item.num}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: active
                    ? 'rgba(0, 240, 255, 0.12)'
                    : completed
                    ? 'rgba(0, 255, 136, 0.08)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${
                    active ? 'var(--primary)' : completed ? 'var(--success)' : 'var(--border-color)'
                  }`,
                  color: active ? 'var(--primary)' : completed ? 'var(--success)' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textAlign: 'center'
                }}
              >
                {item.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Alerta de Erro Geral */}
      {errorMessage && (
        <div
          style={{
            background: 'rgba(255, 71, 87, 0.12)',
            border: '1px solid var(--danger)',
            color: '#fff',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <AlertCircle size={20} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.9rem' }}>{errorMessage}</span>
        </div>
      )}

      {/* =========================================================================
          ETAPA 1: REVISÃO DO CARRINHO E CÁLCULO DE FRETE (CORREIOS VIA MELHOR ENVIO)
         ========================================================================= */}
      {step === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
          {/* Lista de Produtos */}
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingCart size={20} style={{ color: 'var(--primary)' }} />
              Peças Selecionadas ({cartItems.reduce((a, b) => a + b.quantity, 0)})
            </h3>

            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                <ShoppingCart size={48} style={{ opacity: 0.25, marginBottom: '1rem' }} />
                <p>Seu carrinho está vazio no momento.</p>
                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/')}>
                  Explorar Catálogo 3D
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="cart-item-row"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                      {item.image && !item.image.toLowerCase().endsWith('.mp4') ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '8px',
                            background: '#111',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)'
                          }}
                        >
                          3D
                        </div>
                      )}
                      <div>
                        <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '0.25rem' }}>{item.name}</h4>
                        <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 700 }}>
                          {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / un.
                        </span>
                      </div>
                    </div>

                    {/* Controle de Quantidade */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-surface-1)',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 700 }}>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-surface-1)',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Subtotal do Item & Remover */}
                    <div style={{ textAlign: 'right', minWidth: '95px' }}>
                      <div style={{ fontWeight: 800, color: '#fff' }}>
                        {(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--danger)',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          marginTop: '0.25rem'
                        }}
                      >
                        <Trash2 size={12} /> Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resumo & Simulador de Frete Correios (Melhor Envio) */}
          {cartItems.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', height: 'fit-content' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={20} style={{ color: 'var(--primary)' }} />
                Frete Correios & Resumo
              </h3>

              {/* Simulador de CEP */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  Calcular Frete Correios (CEP de Destino)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="00000-000"
                    value={address.zipCode}
                    onChange={(e) => handleCepChange(e.target.value)}
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleCalculateShipping()}
                    disabled={calculatingShipping}
                  >
                    {calculatingShipping ? 'Calculando...' : 'Calcular'}
                  </button>
                </div>

                {shippingOptions.length > 0 ? (
                  <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Opções de Envio disponíveis:
                    </span>
                    {shippingOptions.map((opt) => {
                      const isSelected = shippingServiceId === opt.id;
                      const isPickup = opt.id === 0;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectShippingOption(opt)}
                          style={{
                            padding: '0.65rem 0.85rem',
                            borderRadius: 'var(--radius-sm)',
                            background: isSelected ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                            border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                            color: '#fff',
                            fontSize: '0.85rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, color: isSelected ? 'var(--primary)' : '#fff' }}>
                              {isPickup ? opt.nome : `${opt.transportadora} — ${opt.nome}`}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {isPickup
                                ? 'Retirada direta sem custo de envio'
                                : `Prazo estimado: até ${opt.prazoDias} dias úteis`}
                            </div>
                          </div>
                          <strong style={{ color: isSelected ? 'var(--primary)' : 'var(--success)' }}>
                            {opt.valor === 0
                              ? 'Grátis (R$ 0,00)'
                              : opt.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </strong>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Ou selecione retirada direta:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectShippingOption({
                          id: 0,
                          transportadora: 'Retirada',
                          nome: 'Retirar com Comprador',
                          valor: 0,
                          prazoDias: 1
                        })
                      }
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        background: shippingServiceId === 0 ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                        border: shippingServiceId === 0 ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        color: '#fff',
                        fontSize: '0.85rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: shippingServiceId === 0 ? 'var(--primary)' : '#fff' }}>
                          Retirar com Comprador
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Retirada direta sem custo de envio
                        </div>
                      </div>
                      <strong style={{ color: shippingServiceId === 0 ? 'var(--primary)' : 'var(--success)' }}>
                        Grátis (R$ 0,00)
                      </strong>
                    </button>
                  </div>
                )}
              </div>

              {/* Valores */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <span>Subtotal das Peças:</span>
                  <span>{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <span>Frete Correios:</span>
                  <span>
                    {shippingCost !== null
                      ? shippingCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : 'Informe o CEP acima'}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    color: 'var(--success)',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '0.75rem',
                    marginTop: '0.4rem'
                  }}
                >
                  <span>Total (PIX):</span>
                  <span>{totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleProceedToStep2}
                style={{ width: '100%', padding: '0.9rem', marginTop: '1.5rem', fontWeight: 700, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
              >
                {user ? (
                  <>
                    Continuar para Dados de Entrega
                    <ArrowRight size={18} />
                  </>
                ) : (
                  <>
                    Fazer Login para Finalizar Compra
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          ETAPA 2: DADOS DO CLIENTE (CPF, TELEFONE) E ENDEREÇO DE ENTREGA
         ========================================================================= */}
      {step === 2 && (
        <form onSubmit={handleProceedToStep3} className="glass-panel" style={{ padding: 'clamp(1.25rem, 3vw, 2rem)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={20} style={{ color: 'var(--primary)' }} />
            Dados do Comprador e Endereço de Entrega (Correios)
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
            Esses dados são utilizados para a emissão da etiqueta de envio pelos Correios e ficarão salvos para suas próximas compras.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                <UserIcon size={14} style={{ color: 'var(--primary)' }} /> Nome Completo *
              </label>
              <input
                type="text"
                className="form-input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nome e Sobrenome"
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                <Mail size={14} style={{ color: 'var(--primary)' }} /> E-mail do Comprador *
              </label>
              <input
                type="email"
                className="form-input"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="cliente@email.com"
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                <FileText size={14} style={{ color: 'var(--primary)' }} /> CPF ou CNPJ *
              </label>
              <input
                type="text"
                className="form-input"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                <Phone size={14} style={{ color: 'var(--primary)' }} /> Telefone / WhatsApp com DDD *
              </label>
              <input
                type="text"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                CEP * {loadingCep && <span style={{ color: 'var(--primary)', fontSize: '0.75rem' }}>(Buscando...)</span>}
              </label>
              <input
                type="text"
                className="form-input"
                value={address.zipCode}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="00000-000"
                required
              />
            </div>

            <div className="address-street-col">
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Rua / Logradouro *
              </label>
              <input
                type="text"
                className="form-input"
                value={address.streetName}
                onChange={(e) => setAddress({ ...address, streetName: e.target.value })}
                placeholder="Av. Brasil, Rua das Flores..."
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Número *
              </label>
              <input
                type="text"
                className="form-input"
                value={address.streetNumber}
                onChange={(e) => setAddress({ ...address, streetNumber: e.target.value })}
                placeholder="123"
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Complemento
              </label>
              <input
                type="text"
                className="form-input"
                value={address.complement}
                onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                placeholder="Apto, Bloco, Casa..."
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Bairro *
              </label>
              <input
                type="text"
                className="form-input"
                value={address.neighborhood}
                onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                placeholder="Centro"
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Cidade *
              </label>
              <input
                type="text"
                className="form-input"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                placeholder="São Paulo"
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Estado (UF) *
              </label>
              <input
                type="text"
                maxLength={2}
                className="form-input"
                value={address.federalUnit}
                onChange={(e) => setAddress({ ...address, federalUnit: e.target.value.toUpperCase() })}
                placeholder="SP"
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
              Voltar ao Carrinho
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Revisar e Ir para Pagamento PIX ({totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      )}

      {/* =========================================================================
          ETAPA 3: PAGAMENTO SOMENTE PIX (ATENDIMENTO E ENVIO DO PIX PELO CHAT)
         ========================================================================= */}
      {step === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <QrCode size={22} style={{ color: 'var(--primary)' }} />
                Pagamento via PIX
              </h3>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '12px',
                  background: 'rgba(0, 255, 136, 0.12)',
                  color: 'var(--success)',
                  border: '1px solid rgba(0, 255, 136, 0.3)',
                  fontWeight: 700
                }}
              >
                Somente PIX
              </span>
            </div>

            <div
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0, 240, 255, 0.06)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                marginBottom: '1.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <MessageSquare size={24} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
                  Atendimento Direto com o Vendedor (Caixa de Diálogo no Site)
                </div>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Ao clicar em <strong>Finalizar Pedido</strong> abaixo, seu pedido será registrado com a opção de envio{' '}
                <strong>{shippingServiceName}</strong> e abrirá imediatamente uma{' '}
                <strong>caixa de diálogo (chat)</strong> direta com o vendedor para o envio da chave/código PIX.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              disabled={processingOrder}
              onClick={handleFinalizeOrderPixChat}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.05rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem'
              }}
            >
              <MessageSquare size={18} />
              {processingOrder
                ? 'Registrando Pedido...'
                : `Finalizar Pedido e Abrir Chat PIX (${totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`}
            </button>
          </div>

          {/* Resumo Lateral de Conferência */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', height: 'fit-content' }}>
            <h4 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Resumo do Pedido</h4>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
              <div><strong>Cliente:</strong> {customerName}</div>
              <div><strong>CPF/CNPJ:</strong> {cpf}</div>
              <div><strong>Telefone:</strong> {phone}</div>
              <div><strong>Entrega (Correios):</strong> {address.streetName}, {address.streetNumber} - {address.neighborhood}, {address.city}/{address.federalUnit} (CEP: {address.zipCode})</div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {cartItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>{item.quantity}x {item.name}</span>
                  <span>{(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                <span>Frete ({shippingServiceName}):</span>
                <span>{(shippingCost ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <span>Total via PIX:</span>
                <span>{totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ETAPA 4: CONFIRMAÇÃO DO PEDIDO + CAIXA DE DIÁLOGO (CHAT PIX COM VENDEDOR)
         ========================================================================= */}
      {step === 4 && orderResult && (
        <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: orderResult.status === 'PAGO' ? 'var(--success-glow)' : 'rgba(0, 240, 255, 0.12)',
                color: orderResult.status === 'PAGO' ? 'var(--success)' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}
            >
              {orderResult.status === 'PAGO' ? <CheckCircle size={34} /> : <QrCode size={32} />}
            </div>

            <h2 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '0.35rem' }}>
              {orderResult.status === 'PAGO'
                ? 'Pagamento PIX Confirmado!'
                : `Pedido #${orderResult.orderNumber || orderResult.id.substring(0, 8)} Registrado!`}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Valor Total:{' '}
              <strong style={{ color: 'var(--success)', fontSize: '1.05rem' }}>
                {orderResult.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </strong>
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
              Utilize a caixa de mensagens abaixo para receber a chave PIX do vendedor.
            </p>
          </div>

          {/* Caixa de Diálogo / Chat entre Comprador e Vendedor */}
          <OrderChatBox
            orderId={orderResult.id}
            orderNumber={orderResult.orderNumber}
            orderTotal={orderResult.totalAmount}
            orderStatus={orderResult.status}
            shippingCost={orderResult.shippingCost}
            itemsSummary={orderResult.items?.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
            clientName={orderResult.clientName || customerName || user?.name}
            whatsappNumber={whatsappNumber}
            mode="buyer"
          />

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/my-orders')}>
              Acompanhar em Meus Pedidos
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
              Voltar para a Loja
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
