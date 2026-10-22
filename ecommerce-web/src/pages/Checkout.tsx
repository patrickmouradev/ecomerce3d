import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Truck,
  MapPin,
  CreditCard,
  QrCode,
  CheckCircle,
  Copy,
  Check,
  ArrowLeft,
  ArrowRight,
  Loader,
  AlertCircle,
  User as UserIcon,
  Phone,
  FileText,
  Sparkles,
  RefreshCw
} from 'lucide-react';

declare global {
  interface Window {
    MercadoPago?: any;
  }
}

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

interface OrderResult {
  id: string;
  status: string;
  paymentMethod: string;
  paymentStatusDetail: string;
  shippingCost: number;
  totalAmount: number;
  mercadoPagoPaymentId: string;
  pixQrCode?: string;
  pixQrCodeBase64?: string;
  simulatedPayment?: boolean;
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

  // Etapas: 1 = Carrinho & Frete, 2 = Dados do Cliente & Endereço, 3 = Pagamento (Payment Brick), 4 = Conclusão / PIX
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Carrinho
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Dados do Cliente (Opção A: coletados no checkout e salvos no perfil)
  const [customerName, setCustomerName] = useState('');
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

  // Frete
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [shippingDays, setShippingDays] = useState<number | null>(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  // Configuração Mercado Pago
  const [mpPublicKey, setMpPublicKey] = useState<string>('');
  const [realMpConfigured, setRealMpConfigured] = useState<boolean>(false);
  const [brickReady, setBrickReady] = useState<boolean>(false);
  const brickControllerRef = useRef<any>(null);

  // Estado do Modo Simulador (quando chaves são TEST-XXXX)
  const [simSelectedMethod, setSimSelectedMethod] = useState<'pix' | 'credit_card'>('pix');
  const [simInstallments, setSimInstallments] = useState<number>(1);

  // Processamento e Pedido Concluído
  const [processingPayment, setProcessingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [pollingStatus, setPollingStatus] = useState(false);

  // 1. Carrega itens do carrinho e configuração do Mercado Pago
  useEffect(() => {
    loadCart();
    fetchMpConfig();
  }, []);

  // 2. Se o usuário estiver logado, busca dados salvos no perfil (CPF, Telefone, Endereço)
  useEffect(() => {
    if (user) {
      setCustomerName(user.name || '');
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

  const fetchMpConfig = async () => {
    try {
      const res = await api.get('/api/checkout/config');
      setMpPublicKey(res.data.publicKey || '');
      setRealMpConfigured(Boolean(res.data.realCredentialsConfigured));
    } catch (e) {
      console.error('Erro ao carregar configuração de checkout', e);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/api/user/profile');
      const data = res.data;
      if (data.name) setCustomerName(data.name);
      if (data.cpf) setCpf(formatCpf(data.cpf));
      if (data.phone) setPhone(formatPhone(data.phone));
      if (data.address) {
        const zip = data.address.zipCode || '';
        setAddress({
          zipCode: formatCep(zip),
          streetName: data.address.streetName || '',
          streetNumber: data.address.streetNumber || '',
          complement: data.address.complement || '',
          neighborhood: data.address.neighborhood || '',
          city: data.address.city || '',
          federalUnit: data.address.federalUnit || ''
        });
        if (zip.replace(/\D/g, '').length === 8) {
          handleCalculateShipping(zip);
        }
      }
    } catch (e) {
      console.error('Erro ao buscar perfil salvo do cliente', e);
    }
  };

  // Formatadores de máscara
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

  // Cálculo de Frete
  const handleCalculateShipping = async (zipCodeInput?: string, itemsOverride?: CartItem[]) => {
    const targetZip = (zipCodeInput ?? address.zipCode).replace(/\D/g, '');
    const itemsToUse = itemsOverride ?? cartItems;
    if (targetZip.length !== 8 || itemsToUse.length === 0) {
      setErrorMessage('Informe um CEP válido de 8 dígitos para calcular o frete.');
      return;
    }

    setCalculatingShipping(true);
    setErrorMessage(null);
    try {
      const res = await api.post('/api/checkout/shipping', {
        zipCode: targetZip,
        items: itemsToUse.map((i) => ({ productId: i.id, quantity: i.quantity }))
      });
      setShippingCost(res.data.valorFrete);
      setShippingDays(res.data.prazoEntregaDias);
    } catch (e: any) {
      setErrorMessage(e.response?.data?.message || 'Não foi possível calcular o frete para este CEP.');
    } finally {
      setCalculatingShipping(false);
    }
  };

  // Busca automática de endereço via ViaCEP ao preencher 8 dígitos
  const handleCepChange = async (rawVal: string) => {
    const formatted = formatCep(rawVal);
    setAddress((prev) => ({ ...prev, zipCode: formatted }));

    const digits = rawVal.replace(/\D/g, '');
    if (digits.length === 8) {
      setLoadingCep(true);
      handleCalculateShipping(digits);
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

  // Validação da Etapa 1 -> Etapa 2
  const handleProceedToStep2 = () => {
    if (cartItems.length === 0) return;
    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }
    if (shippingCost === null) {
      if (address.zipCode.replace(/\D/g, '').length === 8) {
        handleCalculateShipping(address.zipCode);
      } else {
        setErrorMessage('Informe seu CEP e calcule o frete antes de avançar.');
        return;
      }
    }
    setErrorMessage(null);
    setStep(2);
  };

  // Validação da Etapa 2 -> Etapa 3 (Salva dados do cliente e abre o Payment Brick)
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
      // Salva no perfil do usuário para que nas próximas compras já venha preenchido
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

  // 3. Monta o Mercado Pago Payment Brick oficial na Etapa 3 (somente PIX e Cartão de Crédito)
  useEffect(() => {
    if (step !== 3 || !realMpConfigured || !mpPublicKey) {
      return;
    }

    let isMounted = true;
    setBrickReady(false);

    const initBrick = async () => {
      // Garante que o script do SDK v2 do Mercado Pago está carregado
      if (!window.MercadoPago) {
        await new Promise<void>((resolve, reject) => {
          const existingScript = document.querySelector('script[src="https://sdk.mercadopago.com/js/v2"]');
          if (existingScript) {
            existingScript.addEventListener('load', () => resolve());
            existingScript.addEventListener('error', () => reject(new Error('Falha ao carregar SDK Mercado Pago')));
          } else {
            const script = document.createElement('script');
            script.src = 'https://sdk.mercadopago.com/js/v2';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Falha ao carregar SDK Mercado Pago'));
            document.body.appendChild(script);
          }
        });
      }

      if (!isMounted || !window.MercadoPago) return;

      if (brickControllerRef.current) {
        try {
          brickControllerRef.current.unmount();
        } catch {
          // Ignore unmount errors
        }
      }

      const mp = new window.MercadoPago(mpPublicKey, { locale: 'pt-BR' });
      const bricksBuilder = mp.bricks();

      const nameParts = customerName.trim().split(' ');
      const firstName = nameParts[0] || customerName.trim();
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Cliente';
      const cleanCpf = cpf.replace(/\D/g, '');

      const settings = {
        initialization: {
          amount: Number(totalAmount.toFixed(2)),
          payer: {
            firstName,
            lastName,
            email: user?.email || '',
            identification: {
              type: cleanCpf.length > 11 ? 'CNPJ' : 'CPF',
              number: cleanCpf
            },
            address: {
              zipCode: address.zipCode.replace(/\D/g, ''),
              streetName: address.streetName,
              streetNumber: address.streetNumber,
              neighborhood: address.neighborhood,
              city: address.city,
              federalUnit: address.federalUnit
            }
          }
        },
        customization: {
          visual: {
            style: {
              theme: 'dark'
            }
          },
          paymentMethods: {
            creditCard: 'all',
            bankTransfer: 'all', // PIX habilitado
            maxInstallments: 12
          }
        },
        callbacks: {
          onReady: () => {
            if (isMounted) setBrickReady(true);
          },
          onSubmit: ({ formData }: any) => {
            return new Promise<void>((resolve, reject) => {
              submitOrderToBackend({
                paymentMethodId: formData.payment_method_id,
                token: formData.token,
                issuerId: formData.issuer_id ? String(formData.issuer_id) : undefined,
                installments: formData.installments || 1,
                payerEmail: formData.payer?.email || user?.email,
                payerIdentificationType: formData.payer?.identification?.type || 'CPF',
                payerIdentificationNumber: formData.payer?.identification?.number || cleanCpf
              })
                .then(() => resolve())
                .catch((err) => reject(err));
            });
          },
          onError: (error: any) => {
            console.error('Erro no Payment Brick:', error);
            setErrorMessage('Ocorreu um erro ao carregar ou validar o formulário do Mercado Pago.');
          }
        }
      };

      brickControllerRef.current = await bricksBuilder.create('payment', 'paymentBrick_container', settings);
    };

    initBrick().catch((err) => {
      console.error(err);
      setErrorMessage('Não foi possível inicializar o componente do Mercado Pago. Verifique sua Public Key.');
    });

    return () => {
      isMounted = false;
      if (brickControllerRef.current) {
        try {
          brickControllerRef.current.unmount();
        } catch {
          // Ignore
        }
      }
    };
  }, [step, realMpConfigured, mpPublicKey]);

  // Envia o pedido e os dados de pagamento para o Back-end
  const submitOrderToBackend = async (paymentPayload: {
    paymentMethodId: string;
    token?: string;
    issuerId?: string;
    installments?: number;
    payerEmail?: string;
    payerIdentificationType?: string;
    payerIdentificationNumber?: string;
  }) => {
    setProcessingPayment(true);
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
        ...paymentPayload
      });

      const createdOrder: OrderResult = response.data;
      setOrderResult(createdOrder);

      // Limpa o carrinho após registrar o pedido com sucesso
      saveCart([]);
      setStep(4);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Falha ao processar o pagamento. Verifique os dados informados.';
      setErrorMessage(msg);
      throw err;
    } finally {
      setProcessingPayment(false);
    }
  };

  // Polling automático a cada 5 segundos quando o pedido está PENDENTE via PIX
  useEffect(() => {
    if (step !== 4 || !orderResult || orderResult.status !== 'PENDENTE') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        setPollingStatus(true);
        const res = await api.get(`/api/checkout/orders/${orderResult.id}/status`);
        if (res.data && res.data.status !== orderResult.status) {
          setOrderResult(res.data);
        }
      } catch (e) {
        console.warn('Polling de status PIX falhou:', e);
      } finally {
        setPollingStatus(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [step, orderResult]);

  const handleCopyPix = () => {
    if (!orderResult?.pixQrCode) return;
    navigator.clipboard.writeText(orderResult.pixQrCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleSimulatePixApproval = async () => {
    if (!orderResult) return;
    try {
      setPollingStatus(true);
      const res = await api.post(`/api/checkout/orders/${orderResult.id}/simulate-approve`);
      setOrderResult(res.data);
    } catch (e) {
      console.error('Erro ao simular aprovação PIX', e);
    } finally {
      setPollingStatus(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
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

        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', color: '#fff', marginBottom: '1.25rem' }}>
          Finalizar Compra
        </h1>

        {/* Barra de Progresso das Etapas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.75rem'
          }}
        >
          {[
            { num: 1, label: '1. Carrinho & Frete' },
            { num: 2, label: '2. Dados & Entrega' },
            { num: 3, label: '3. Pagamento (MP)' },
            { num: 4, label: '4. Confirmação' }
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
          ETAPA 1: REVISÃO DO CARRINHO E CÁLCULO DE FRETE
         ========================================================================= */}
      {step === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Lista de Produtos */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
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
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      padding: '1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)'
                    }}
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

          {/* Resumo & Simulador de Frete */}
          {cartItems.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', height: 'fit-content' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={20} style={{ color: 'var(--primary)' }} />
                Entrega e Resumo
              </h3>

              {/* Simulador de CEP */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  Calcular Frete (CEP de Destino)
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
                {shippingCost !== null && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0, 240, 255, 0.07)',
                      border: '1px solid rgba(0, 240, 255, 0.25)',
                      fontSize: '0.85rem',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>Correios (Prazo: até {shippingDays} dias úteis)</span>
                    <strong style={{ color: 'var(--primary)' }}>
                      {shippingCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </strong>
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
                  <span>Frete Estimado:</span>
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
                  <span>Total:</span>
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
        <form onSubmit={handleProceedToStep3} className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={20} style={{ color: 'var(--primary)' }} />
            Dados do Comprador e Endereço de Entrega
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
            Esses dados são exigidos pelo Mercado Pago para segurança antifraude (PIX e Cartão) e para o envio da sua encomenda 3D. Eles ficarão salvos para suas próximas compras.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
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
                <FileText size={14} style={{ color: 'var(--primary)' }} /> CPF ou CNPJ (Obrigatório Mercado Pago) *
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

            <div style={{ gridColumn: 'span 2' }}>
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
              Ir para o Pagamento ({totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      )}

      {/* =========================================================================
          ETAPA 3: PAGAMENTO (MERCADO PAGO PAYMENT BRICK - PIX & CARTÃO DE CRÉDITO)
         ========================================================================= */}
      {step === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={20} style={{ color: 'var(--primary)' }} />
                Pagamento Seguro — Mercado Pago
              </h3>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '12px',
                  background: 'rgba(0, 240, 255, 0.1)',
                  color: 'var(--primary)',
                  fontWeight: 700
                }}
              >
                PIX ou Cartão de Crédito
              </span>
            </div>

            {realMpConfigured ? (
              <>
                {!brickReady && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', gap: '1rem', color: 'var(--text-secondary)' }}>
                    <Loader className="animate-spin" size={28} style={{ color: 'var(--primary)' }} />
                    <span>Carregando Checkout Bricks oficial do Mercado Pago...</span>
                  </div>
                )}
                {/* Contêiner oficial onde o Mercado Pago Payment Brick é renderizado */}
                <div id="paymentBrick_container" />
              </>
            ) : (
              /* Interface de Homologação Local quando MERCADO_PAGO_PUBLIC_KEY ainda está com placeholder TEST-XXXX */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 183, 0, 0.1)',
                    border: '1px solid rgba(255, 183, 0, 0.35)',
                    fontSize: '0.82rem',
                    color: '#ffd166'
                  }}
                >
                  <strong>Modo Homologação Ativo:</strong> Assim que você inserir sua <code>MERCADO_PAGO_PUBLIC_KEY</code> e <code>MERCADO_PAGO_ACCESS_TOKEN</code> reais no arquivo <code>.env</code>, o formulário oficial do Mercado Pago Payment Brick será carregado aqui automaticamente.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setSimSelectedMethod('pix')}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: simSelectedMethod === 'pix' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      background: simSelectedMethod === 'pix' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 700
                    }}
                  >
                    <QrCode size={24} style={{ color: 'var(--primary)' }} />
                    PIX (Aprovação Imediata)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSimSelectedMethod('credit_card')}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: simSelectedMethod === 'credit_card' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      background: simSelectedMethod === 'credit_card' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 700
                    }}
                  >
                    <CreditCard size={24} style={{ color: 'var(--primary)' }} />
                    Cartão de Crédito
                  </button>
                </div>

                {simSelectedMethod === 'credit_card' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1rem', background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-sm)' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Parcelamento no Cartão
                    </label>
                    <select
                      className="form-input"
                      value={simInstallments}
                      onChange={(e) => setSimInstallments(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n}x de {(totalAmount / n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} sem juros
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={processingPayment}
                  onClick={() =>
                    submitOrderToBackend({
                      paymentMethodId: simSelectedMethod === 'pix' ? 'pix' : 'master',
                      token: simSelectedMethod === 'credit_card' ? 'sim-card-token' : undefined,
                      installments: simSelectedMethod === 'credit_card' ? simInstallments : 1,
                      payerEmail: user?.email,
                      payerIdentificationType: cpf.replace(/\D/g, '').length > 11 ? 'CNPJ' : 'CPF',
                      payerIdentificationNumber: cpf.replace(/\D/g, '')
                    })
                  }
                  style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', fontWeight: 700 }}
                >
                  {processingPayment
                    ? 'Processando Pagamento...'
                    : simSelectedMethod === 'pix'
                    ? `Gerar QR Code PIX (${totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`
                    : `Pagar com Cartão (${totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`}
                </button>
              </div>
            )}
          </div>

          {/* Resumo Lateral de Conferência */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', height: 'fit-content' }}>
            <h4 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Resumo do Pedido</h4>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
              <div><strong>Cliente:</strong> {customerName}</div>
              <div><strong>CPF/CNPJ:</strong> {cpf}</div>
              <div><strong>Entrega:</strong> {address.streetName}, {address.streetNumber} - {address.neighborhood}, {address.city}/{address.federalUnit} (CEP: {address.zipCode})</div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {cartItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>{item.quantity}x {item.name}</span>
                  <span>{(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                <span>Frete (Correios):</span>
                <span>{(shippingCost ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <span>Total a Pagar:</span>
                <span>{totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ETAPA 4: CONFIRMAÇÃO DO PEDIDO / TELA DE QR CODE PIX COM POLLING
         ========================================================================= */}
      {step === 4 && orderResult && (
        <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)', maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          {orderResult.status === 'PAGO' ? (
            <>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'var(--success-glow)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem'
                }}
              >
                <CheckCircle size={40} />
              </div>
              <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '0.5rem' }}>
                Pagamento Aprovado!
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Seu pedido <strong>#{orderResult.id.substring(0, 8)}</strong> foi confirmado e já entrou na fila de impressão 3D.
              </p>
            </>
          ) : (
            <>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: 'rgba(0, 240, 255, 0.12)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem'
                }}
              >
                <QrCode size={36} />
              </div>
              <h2 style={{ fontSize: '1.65rem', color: '#fff', marginBottom: '0.5rem' }}>
                Escaneie o QR Code PIX para Pagar
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Pedido <strong>#{orderResult.id.substring(0, 8)}</strong> • Valor:{' '}
                <strong style={{ color: 'var(--success)' }}>
                  {orderResult.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </strong>
              </p>

              {/* Imagem do QR Code PIX */}
              <div
                style={{
                  background: '#fff',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'inline-block',
                  marginBottom: '1.25rem'
                }}
              >
                {orderResult.pixQrCodeBase64 ? (
                  <img
                    src={`data:image/png;base64,${orderResult.pixQrCodeBase64}`}
                    alt="QR Code PIX Mercado Pago"
                    style={{ width: '220px', height: '220px', display: 'block' }}
                  />
                ) : (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(orderResult.pixQrCode || '3DPrintPNG')}`}
                    alt="QR Code PIX"
                    style={{ width: '220px', height: '220px', display: 'block' }}
                  />
                )}
              </div>

              {/* PIX Copia e Cola */}
              {orderResult.pixQrCode && (
                <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                    Código PIX Copia e Cola:
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      readOnly
                      value={orderResult.pixQrCode}
                      className="form-input"
                      style={{ flex: 1, fontSize: '0.8rem', fontFamily: 'monospace' }}
                    />
                    <button type="button" className="btn btn-primary" onClick={handleCopyPix} style={{ whiteSpace: 'nowrap' }}>
                      {copiedPix ? <Check size={16} /> : <Copy size={16} />}
                      {copiedPix ? 'Copiado!' : 'Copiar PIX'}
                    </button>
                  </div>
                </div>
              )}

              {/* Indicador de Polling em Tempo Real */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  color: 'var(--primary)',
                  marginBottom: '1.25rem'
                }}
              >
                <RefreshCw size={15} className={pollingStatus ? 'animate-spin' : ''} />
                <span>Aguardando pagamento... A tela atualizará sozinha assim que você pagar o PIX!</span>
              </div>

              {/* Botão auxiliar para aprovar PIX quando estiver em modo simulado */}
              {orderResult.simulatedPayment && (
                <button
                  type="button"
                  onClick={handleSimulatePixApproval}
                  className="btn btn-secondary"
                  style={{ marginBottom: '1.25rem', borderColor: 'var(--success)', color: 'var(--success)' }}
                >
                  <Sparkles size={16} /> Simular Confirmação de Pagamento PIX (Modo Homologação)
                </button>
              )}
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
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
