import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, Check, Bell } from 'lucide-react';
import { useWebPush } from '../hooks/useWebPush';
import { useAuth } from '../context/AuthContext';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallPwaButton: React.FC = () => {
  const { user } = useAuth();
  const { isSubscribed, subscribeToPush, loading: pushLoading } = useWebPush();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [showIosModal, setShowIosModal] = useState<boolean>(false);
  const [installedSuccessfully, setInstalledSuccessfully] = useState<boolean>(false);

  useEffect(() => {
    // Verifica se já está rodando instalado como App Standalone
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(checkStandalone);

    // Detecta se é dispositivo iOS (iPhone / iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isAppleMobile);

    // Captura o evento nativo do Chromium (Android / Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Escuta quando o app foi efetivamente instalado
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setInstalledSuccessfully(true);
      setTimeout(() => setInstalledSuccessfully(false), 5000);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosModal(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalledSuccessfully(true);
      }
      setDeferredPrompt(null);
    } else {
      // Caso o evento ainda não tenha sido disparado ou seja desktop genérico
      alert('Para instalar o aplicativo no seu navegador, clique no ícone de instalação (computador com seta) na barra de endereços do seu navegador.');
    }
  };

  // Se já estiver rodando como PWA instalado (Standalone), só exibe o botão de ativar push se o usuário estiver logado e ainda não for inscrito
  if (isStandalone) {
    if (user && !isSubscribed) {
      return (
        <button
          onClick={() => subscribeToPush()}
          disabled={pushLoading}
          className="pwa-install-pill push-enable-pill"
          title="Ativar Notificações no Celular"
        >
          <Bell size={16} className="text-cyan-400 animate-pulse" />
          <span>{pushLoading ? 'Ativando...' : 'Ativar Notificações'}</span>
        </button>
      );
    }
    return null;
  }

  // Se não puder instalar (nem iOS nem Chromium com prompt disponível), mantém botão disponível caso queira forçar modal/orientação
  const canPrompt = !!deferredPrompt || isIos;
  if (!canPrompt && !installedSuccessfully) {
    return null;
  }

  return (
    <>
      <div className="pwa-install-container">
        {installedSuccessfully ? (
          <div className="pwa-installed-badge">
            <Check size={16} />
            <span>App Instalado!</span>
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            className="pwa-install-pill"
            aria-label="Instalar Aplicativo 3DPrintPNG"
            title="Instale no celular para receber ofertas e acompanhar pedidos"
          >
            <Smartphone size={16} className="pwa-pill-icon" />
            <span className="pwa-pill-text">Baixar App</span>
            <Download size={14} className="pwa-pill-subicon" />
          </button>
        )}
      </div>

      {/* MODAL INSTRUTIVO PARA USUÁRIOS APPLE (iOS Safari) */}
      {showIosModal && (
        <div className="pwa-ios-modal-overlay" onClick={() => setShowIosModal(false)}>
          <div className="pwa-ios-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="pwa-ios-modal-header">
              <div className="pwa-ios-modal-title">
                <Smartphone size={20} className="text-cyan-400" />
                <h3>Instalar 3DPrintPNG no iPhone</h3>
              </div>
              <button
                className="pwa-ios-modal-close"
                onClick={() => setShowIosModal(false)}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <p className="pwa-ios-modal-subtitle">
              Siga os 3 passos simples abaixo para instalar o aplicativo direto da tela do Safari:
            </p>

            <div className="pwa-ios-steps">
              <div className="pwa-ios-step-item">
                <div className="pwa-step-number">1</div>
                <div className="pwa-step-content">
                  <div className="pwa-step-header">
                    <span>Toque no botão Compartilhar</span>
                    <Share size={18} className="text-cyan-400 inline ml-1" />
                  </div>
                  <p>Localizado na barra inferior do Safari (o quadrado com uma seta para cima).</p>
                </div>
              </div>

              <div className="pwa-ios-step-item">
                <div className="pwa-step-number">2</div>
                <div className="pwa-step-content">
                  <div className="pwa-step-header">
                    <span>Role para baixo e selecione</span>
                  </div>
                  <div className="pwa-ios-highlight-row">
                    <PlusSquare size={18} className="text-white" />
                    <strong>"Adicionar à Tela de Início"</strong>
                  </div>
                </div>
              </div>

              <div className="pwa-ios-step-item">
                <div className="pwa-step-number">3</div>
                <div className="pwa-step-content">
                  <div className="pwa-step-header">
                    <span>Confirme em "Adicionar"</span>
                  </div>
                  <p>Toque em <strong>Adicionar</strong> no canto superior direito da tela do iPhone.</p>
                </div>
              </div>
            </div>

            <div className="pwa-ios-modal-footer">
              <button
                className="pwa-ios-modal-btn"
                onClick={() => setShowIosModal(false)}
              >
                Entendi, vou instalar!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
