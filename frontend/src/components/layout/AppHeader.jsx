/**
 * AppHeader Component
 *
 * Production application header with Carbon Design System.
 * Includes logo, navigation, global actions, user panel, and theme toggle.
 */

import React, { memo } from 'react';
import {
  Header,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  HeaderPanel,
  Switcher,
  SwitcherItem,
  SwitcherDivider,
  Button,
  Tag,
} from '@carbon/react';

import {
  Settings,
  Light,
  Asleep,
  User,
  Login,
  Logout,
  Currency,
  Close,
  Home,
} from '@carbon/icons-react';

import { useTheme } from '../../contexts/ThemeContext';

function AppHeader({
  canAccessWorkspace,
  activeWorkspace,
  onWorkspaceChange,
  onReset,
  isAuthenticated,
  user,
  onLogin,
  onLogout,
  showUserPanel,
  onToggleUserPanel,
  onCloseUserPanel,
  userPanelRef,
  onOpenSettings,
  credits,
  subscription,
  onOpenPricing,
  passwordGateMode,
}) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <Header aria-label="Carbonac" className={!canAccessWorkspace ? 'cds--header--landing' : ''}>
      <a
        href="/"
        className="app-header__logo-link"
        onClick={(e) => {
          e.preventDefault();
          onReset();
          onWorkspaceChange('workflow');
        }}
      >
        <img
          src={isDark ? '/logos/Carbonac-White.svg' : '/logos/Carbonac-Color.svg'}
          alt="Carbonac"
          className={`header-logo${!canAccessWorkspace ? ' header-logo--landing' : ''}`}
        />
      </a>

      {canAccessWorkspace && (
        <HeaderNavigation aria-label="Main navigation" className="app-header__nav">
          <HeaderMenuItem
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onReset();
              onWorkspaceChange('workflow');
            }}
          >
            <Home size={16} style={{ marginRight: '0.5rem' }} />
            Ana Sayfa
          </HeaderMenuItem>
          <HeaderMenuItem
            href="#documents"
            onClick={(e) => {
              e.preventDefault();
              onWorkspaceChange('documents');
            }}
          >
            Dokümanlarım
          </HeaderMenuItem>
        </HeaderNavigation>
      )}

      <HeaderGlobalBar>
        {/* Credits Display */}
        {!passwordGateMode && isAuthenticated && (
          <div className="app-header__credits" onClick={onOpenPricing}>
            <Tag type="blue" size="sm">
              <Currency size={14} style={{ marginRight: '0.25rem' }} />
              {credits} Kredi
            </Tag>
          </div>
        )}

        <HeaderGlobalAction
          aria-label="Tema Değiştir"
          onClick={toggleTheme}
          tooltipAlignment="end"
        >
          {theme === 'white' ? <Asleep size={20} /> : <Light size={20} />}
        </HeaderGlobalAction>

        <HeaderGlobalAction
          aria-label="Ayarlar"
          onClick={onOpenSettings}
          tooltipAlignment="end"
        >
          <Settings size={20} />
        </HeaderGlobalAction>

        {!passwordGateMode && (
          <HeaderGlobalAction
            aria-label={isAuthenticated ? 'Hesap' : 'Giriş Yap'}
            onClick={() => isAuthenticated ? onToggleUserPanel() : onLogin()}
            isActive={showUserPanel}
            aria-expanded={showUserPanel}
            aria-controls="user-panel"
            data-user-panel-toggle="true"
            tooltipAlignment="end"
          >
            {isAuthenticated ? <User size={20} /> : <Login size={20} />}
          </HeaderGlobalAction>
        )}
      </HeaderGlobalBar>

      {/* User Panel */}
      <HeaderPanel
        id="user-panel"
        aria-label="User panel"
        expanded={showUserPanel}
        onHeaderPanelFocus={() => {}}
      >
        {isAuthenticated && user && (
          <div className="app-header__user-panel" ref={userPanelRef}>
            <div className="app-header__user-panel-header">
              <Button
                kind="ghost"
                size="sm"
                hasIconOnly
                renderIcon={Close}
                iconDescription="Kapat"
                onClick={onCloseUserPanel}
              />
            </div>
            <div className="app-header__user-info">
              <div className="app-header__user-avatar">
                <User size={32} />
              </div>
              <div className="app-header__user-details">
                <span className="app-header__user-name">{user.name}</span>
                <span className="app-header__user-email">{user.email}</span>
              </div>
            </div>
            <Switcher aria-label="User menu">
              <SwitcherItem
                aria-label="Hesabım"
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  onCloseUserPanel();
                }}
              >
                Hesabım
              </SwitcherItem>
              <SwitcherItem
                aria-label="Abonelik"
                onClick={() => { onOpenPricing(); onCloseUserPanel(); }}
              >
                Abonelik ({subscription?.tier || 'Free'})
              </SwitcherItem>
              <SwitcherItem
                aria-label="Kredi Satın Al"
                onClick={() => { onOpenPricing(); onCloseUserPanel(); }}
              >
                Kredi Satın Al
              </SwitcherItem>
              <SwitcherDivider />
              <SwitcherItem
                aria-label="Çıkış Yap"
                onClick={() => { onLogout(); onCloseUserPanel(); }}
              >
                <Logout size={16} style={{ marginRight: '0.5rem' }} />
                Çıkış Yap
              </SwitcherItem>
            </Switcher>
          </div>
        )}
      </HeaderPanel>
    </Header>
  );
}

export default memo(AppHeader);
