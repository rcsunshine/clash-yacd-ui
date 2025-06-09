import { Tooltip } from '@reach/tooltip';
import cx from 'clsx';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { ThemeSwitcher } from './shared/ThemeSwitcher';
import s from './SideBar.module.scss';

// Tabler icons mapping
const TablerIcon = ({ name, size = 20 }: { name: string; size?: number }) => (
  <i className={`ti ti-${name}`} style={{ fontSize: `${size}px` }} />
);

// 优化的Logo组件
const Logo = React.memo(function Logo() {
  const [isHovered, setIsHovered] = React.useState(false);
  const [iconError, setIconError] = React.useState(false);
  const [isClicked, setIsClicked] = React.useState(false);
  
  // 检测图标是否可用
  React.useEffect(() => {
    const testIcon = document.createElement('i');
    testIcon.className = 'ti ti-brand-clash';
    testIcon.style.position = 'absolute';
    testIcon.style.visibility = 'hidden';
    document.body.appendChild(testIcon);
    
    const computedStyle = window.getComputedStyle(testIcon, '::before');
    const content = computedStyle.getPropertyValue('content');
    
    // 如果图标不存在，content会是'none'或空
    if (!content || content === 'none' || content === '""') {
      setIconError(true);
    }
    
    document.body.removeChild(testIcon);
  }, []);
  
  // 点击彩蛋效果
  const handleClick = React.useCallback(() => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 600);
  }, []);
  
  return (
    <div 
      className={cx(s.logo, { 
        [s.logoHovered]: isHovered,
        [s.logoClicked]: isClicked 
      })}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      title="YACD - Yet Another Clash Dashboard"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* 背景装饰圆圈 */}
      <div className={s.logoBackground}>
        <div className={s.logoCircle1} />
        <div className={s.logoCircle2} />
        <div className={s.logoCircle3} />
      </div>
      
      {/* 主图标 */}
      <div className={s.logoIcon}>
        {iconError ? (
          <TablerIcon name="shield-check" size={28} />
        ) : (
          <TablerIcon name="brand-clash" size={28} />
        )}
      </div>
      
      {/* 装饰性小图标 */}
      <div className={s.logoDecorations}>
        <div className={s.logoDot1} />
        <div className={s.logoDot2} />
        <div className={s.logoDot3} />
      </div>
      
      {/* 光泽效果 */}
      <div className={s.logoShine} />
    </div>
  );
});

const SideBarRow = React.memo(function SideBarRow({
  isActive,
  to,
  iconName,
  labelText,
}: SideBarRowProps) {
  return (
    <Link to={to} className={cx(s.navLink, { [s.active]: isActive })}>
      <div className={s.navIcon}>
        <TablerIcon name={iconName} size={20} />
      </div>
      <span className={s.navLabel}>{labelText}</span>
      {isActive && <div className={s.activeIndicator} />}
    </Link>
  );
});

interface SideBarRowProps {
  isActive: boolean;
  to: string;
  iconName: string;
  labelText: string;
}

const pages = [
  { to: '/', iconName: 'dashboard', labelText: 'Overview' },
  { to: '/proxies', iconName: 'world', labelText: 'Proxies' },
  { to: '/rules', iconName: 'ruler-2', labelText: 'Rules' },
  { to: '/connections', iconName: 'link', labelText: 'Conns' },
  { to: '/configs', iconName: 'settings', labelText: 'Config' },
  { to: '/logs', iconName: 'file-text', labelText: 'Logs' },
];

export default function SideBar() {
  const { t } = useTranslation();
  const location = useLocation();
  
  return (
    <div className={cx(s.root, 'tabler-sidebar')}>
      {/* Logo/Brand Section */}
      <div className={s.brand}>
        <div className={s.brandContent}>
          <Logo />
          <div className={s.brandText}>
            <span className={s.brandName}>YACD</span>
            <span className={s.brandSubtitle}>{t('Clash Dashboard')}</span>
          </div>
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className={s.navigation}>
        <div className={s.navSection}>
          <div className={s.navSectionTitle}>{t('Navigation')}</div>
          <div className={s.navList}>
            {pages.map(({ to, iconName, labelText }) => (
              <SideBarRow
                key={to}
                to={to}
                isActive={location.pathname === to}
                iconName={iconName}
                labelText={t(labelText)}
              />
            ))}
          </div>
        </div>
      </nav>
      
      {/* Footer Section */}
      <div className={s.footer}>
        <div className={s.footerContent}>
          <div className={s.themeSection}>
            <ThemeSwitcher />
          </div>
          <Tooltip label={t('about')}>
            <Link to="/about" className={s.aboutButton}>
              <TablerIcon name="info-circle" size={18} />
            </Link>
          </Tooltip>
        </div>
        <div className={s.footerDivider} />
        <div className={s.footerInfo}>
          <span className={s.version}>v0.3.8</span>
        </div>
      </div>
    </div>
  );
}
