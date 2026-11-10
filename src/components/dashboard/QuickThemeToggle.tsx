"use client";

import React from 'react';
import { Tooltip } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useTheme } from '@/providers/ThemeProvider';
import { useT } from '@/lib/i18n';

export default function QuickThemeToggle(){
  const { theme, setTheme } = useTheme();
  const t = useT();
  const next = theme === 'light' ? 'dark' : 'light';
  const icon = next === 'dark' ? <MoonOutlined /> : <SunOutlined />;
  return (
    <Tooltip title={next === 'dark' ? t('theme.switchDark') : t('theme.switchLight')}>
      <button className="theme-quick-toggle" onClick={() => setTheme(next)} aria-label={t('theme.toggle')}>
        {icon}
      </button>
    </Tooltip>
  );
}
