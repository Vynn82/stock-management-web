"use client";

import React from 'react';
import { Tooltip } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useTheme } from '@/providers/ThemeProvider';

export default function QuickThemeToggle(){
  const { theme, setTheme } = useTheme();
  const next = theme === 'light' ? 'dark' : 'light';
  const icon = next === 'dark' ? <MoonOutlined /> : <SunOutlined />;
  return (
    <Tooltip title={`Switch to ${next} mode`}>
      <button className="theme-quick-toggle" onClick={() => setTheme(next)} aria-label="Toggle theme">
        {icon}
      </button>
    </Tooltip>
  );
}
