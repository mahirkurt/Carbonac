/**
 * AppHeader Component
 * 
 * Main application header with Carbon Design System.
 * Includes logo, navigation, global actions, and theme toggle.
 */

import React, { memo } from 'react';
import {
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
} from '@carbon/react';
import { Chat, Settings, Light, Asleep } from '@carbon/icons-react';
import { useTheme } from '../../contexts/ThemeContext';

function AppHeader({
  onToggleAdvisor,
  onToggleSettings,
  isAdvisorActive = false,
}) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <Header aria-label="Carbonac">
      <a href="/" className="header-logo-link">
        <img
          src="/logos/Carbonac-Color-Wide.png"
          alt="Carbonac"
          className="header-logo"
        />
      </a>

      <HeaderNavigation aria-label="Ana navigasyon">
        <HeaderMenuItem href="#editor">Editör</HeaderMenuItem>
        <HeaderMenuItem href="#templates">Şablonlar</HeaderMenuItem>
        <HeaderMenuItem href="#docs">Dokümanlar</HeaderMenuItem>
      </HeaderNavigation>

      <HeaderGlobalBar>
        <HeaderGlobalAction
          aria-label="AI Danışman"
          onClick={onToggleAdvisor}
          isActive={isAdvisorActive}
          tooltipAlignment="end"
        >
          <Chat size={20} />
        </HeaderGlobalAction>
        
        <HeaderGlobalAction
          aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
          onClick={toggleTheme}
          tooltipAlignment="end"
        >
          {isDark ? <Light size={20} /> : <Asleep size={20} />}
        </HeaderGlobalAction>
        
        <HeaderGlobalAction
          aria-label="Ayarlar"
          onClick={onToggleSettings}
          tooltipAlignment="end"
        >
          <Settings size={20} />
        </HeaderGlobalAction>
      </HeaderGlobalBar>
    </Header>
  );
}

export default memo(AppHeader);
