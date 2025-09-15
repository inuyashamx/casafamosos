"use client";
import { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: string;
  content: React.ReactNode;
}

interface TabComponentProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

export default function TabComponent({ tabs, defaultTab, className = "" }: TabComponentProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Tab Buttons */}
      <div className="flex space-x-1 bg-muted/30 p-1 rounded-xl border border-border/20">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-lg transform scale-105'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="transition-all duration-300">
        {activeTabContent}
      </div>
    </div>
  );
}