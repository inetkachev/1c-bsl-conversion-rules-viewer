
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Rule, RuleGroup } from '../types';
import { ChevronRightIcon, ChevronDownIcon, StandardHierarchyIcon, SourceIcon, ReceiverIcon, FlatListIcon } from './icons';

type HierarchyMode = 'standard' | 'source' | 'receiver' | 'flat';

interface HierarchyModeSelectorProps {
  mode: HierarchyMode;
  onModeChange: (mode: HierarchyMode) => void;
}

const HierarchyModeSelector: React.FC<HierarchyModeSelectorProps> = ({ mode, onModeChange }) => {
  const modes: { key: HierarchyMode, label: string, icon: React.FC<{className?: string}> }[] = [
    { key: 'standard', label: 'Стандартный', icon: StandardHierarchyIcon },
    { key: 'source', label: 'По источнику', icon: SourceIcon },
    { key: 'receiver', label: 'По приемнику', icon: ReceiverIcon },
    { key: 'flat', label: 'Плоский', icon: FlatListIcon },
  ];

  return (
    <div className="flex space-x-1 bg-gray-700/50 p-1 rounded-lg mt-2">
      {modes.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onModeChange(key)}
          title={label}
          aria-label={label}
          className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors w-full flex justify-center items-center ${
            mode === key
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-600/50'
          }`}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
};


interface ListViewProps {
  groups: RuleGroup[];
  selectedItem: Rule | null;
  onSelectItem: (item: Rule) => void;
  title: string;
  showHierarchySelector?: boolean;
  hierarchyMode?: HierarchyMode;
  onHierarchyModeChange?: (mode: HierarchyMode) => void;
}

const typeColorMap: Record<Rule['type'], string> = {
    'ПКО': 'border-l-blue-500',
    'ПВД': 'border-l-purple-500',
    'Алгоритм': 'border-l-emerald-500',
    'Запрос': 'border-l-emerald-500',
    'Параметр': 'border-l-orange-500'
};

const RuleItem: React.FC<{ item: Rule, isSelected: boolean, onSelect: () => void }> = React.memo(({ item, isSelected, onSelect }) => (
    <li>
        <button
            onClick={onSelect}
            className={`w-full text-left p-4 border-b border-gray-700/50 hover:bg-gray-700/50 focus:outline-none focus:bg-gray-700/70 transition-colors duration-150 ${
                isSelected ? 'bg-blue-900/30' : ''
            }`}
        >
            <div className={`pl-3 border-l-2 ${typeColorMap[item.type] || 'border-l-gray-500'}`}>
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-gray-100 truncate">{item.name}</span>
                </div>
                <p className="text-xs text-gray-400 font-mono mt-1">{item.id}</p>
            </div>
        </button>
    </li>
));

const countRulesInGroup = (group: RuleGroup): number => {
    let count = group.rules?.length || 0;
    if (group.subGroups) {
        count += group.subGroups.reduce((acc, subGroup) => acc + countRulesInGroup(subGroup), 0);
    }
    return count;
};

interface GroupItemProps {
    group: RuleGroup;
    level: number;
    selectedItem: Rule | null;
    onSelectItem: (item: Rule) => void;
    collapsedState: Record<string, boolean>;
    toggleCollapse: (path: string) => void;
}

const GroupItem: React.FC<GroupItemProps> = React.memo(({ group, level, selectedItem, onSelectItem, collapsedState, toggleCollapse }) => {
    const path = group.path || group.name;
    const isCollapsed = collapsedState[path] ?? true;
    
    const ruleCount = useMemo(() => countRulesInGroup(group), [group]);
    
    if (ruleCount === 0) {
        return null;
    }

    const hasSubGroups = group.subGroups && group.subGroups.length > 0;

    return (
        <div className={level > 0 ? 'bg-gray-900/10' : ''}>
            <div
                onClick={() => toggleCollapse(path)}
                className="flex items-center justify-between px-4 py-2 bg-gray-900/40 hover:bg-gray-900/60 cursor-pointer sticky top-0 z-10 border-b border-t border-gray-700/50"
                style={{ paddingLeft: `${1 + level * 1.5}rem` }}
            >
                <div className="flex items-center space-x-2 truncate">
                    <div className="w-4">
                        {hasSubGroups || (group.rules && group.rules.length > 0) ? (
                             isCollapsed ? <ChevronRightIcon className="w-4 h-4 text-gray-500 flex-shrink-0" /> : <ChevronDownIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        ) : null}
                    </div>
                    <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase truncate">
                        {group.name}
                    </h3>
                </div>
                <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded-full flex-shrink-0">{ruleCount}</span>
            </div>

            {!isCollapsed && (
                 <ul>
                    {group.rules?.map(item => (
                        <div key={item.id} style={{ paddingLeft: `${hasSubGroups ? 1.5 : 0}rem` }}>
                             <RuleItem item={item} isSelected={selectedItem?.id === item.id} onSelect={() => onSelectItem(item)} />
                        </div>
                    ))}
                    {group.subGroups?.map(subGroup => (
                        <GroupItem 
                            key={subGroup.path || subGroup.name}
                            group={subGroup} 
                            level={level + 1}
                            selectedItem={selectedItem}
                            onSelectItem={onSelectItem}
                            collapsedState={collapsedState}
                            toggleCollapse={toggleCollapse}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
});

const ListView: React.FC<ListViewProps> = ({ groups, selectedItem, onSelectItem, title, showHierarchySelector = false, hierarchyMode, onHierarchyModeChange }) => {
    
    const [collapsedState, setCollapsedState] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setCollapsedState({});
    }, [groups]);

    const toggleCollapse = useCallback((path: string) => {
        setCollapsedState(prev => ({...prev, [path]: !(prev[path] ?? true)}));
    }, []);

    const totalItems = useMemo(() => {
        return groups.reduce((acc, group) => acc + countRulesInGroup(group), 0);
    }, [groups]);

    return (
    <div className="w-1/3 max-w-sm flex flex-col bg-gray-800/50 border-r border-gray-700">
      <div className="p-4 border-b border-gray-700 sticky top-0 z-20 bg-gray-800/80 backdrop-blur-sm">
        <h2 className="text-xl font-semibold text-gray-200">{title}</h2>
        <p className="text-xs text-gray-400">{totalItems} items</p>
        {showHierarchySelector && hierarchyMode && onHierarchyModeChange && (
          <HierarchyModeSelector mode={hierarchyMode} onModeChange={onHierarchyModeChange} />
        )}
      </div>
      <div className="overflow-y-auto flex-1">
        {totalItems > 0 ? (
          groups.map(group => (
              <GroupItem 
                key={group.path || group.name}
                group={group} 
                level={0}
                selectedItem={selectedItem}
                onSelectItem={onSelectItem}
                collapsedState={collapsedState}
                toggleCollapse={toggleCollapse}
              />
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            No items match your filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default ListView;
