

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { ParsedData, Rule, Property, RuleGroup } from './types';
import { parseXML } from './services/xmlParser';
import Sidebar from './components/Sidebar';
import ListView from './components/ListView';
import DetailView from './components/DetailView';
import CodeBlock from './components/CodeBlock';

type CategoryKey = 'pko' | 'pvd' | 'algorithms' | 'parameters' | 'requests' | 'beforeExport' | 'afterLoad';
type HierarchyMode = 'standard' | 'source' | 'receiver' | 'flat';

const fuzzyMatch = (needle: string, haystack: string): boolean => {
    if (!haystack) return false;
    const h = haystack.toLowerCase();
    const n = needle.toLowerCase();
    
    if (!n) return true;

    return h.includes(n);
};


const getRuleSearchableText = (rule: Rule): string => {
    let content = [
        rule.id,
        rule.name,
        rule.source,
        rule.receiver,
        rule.afterLoad,
        rule.onLoad,
        rule.beforeConvert,
        rule.afterLoadParams,
        rule.conversionRuleCode,
        rule.dataSelectionMethod,
        rule.beforeRuleProcessing,
        rule.code,
    ].filter(Boolean).join(' ');

    const getPropertiesText = (properties: Property[]): string => {
        let text = '';
        for (const prop of properties) {
            text += ' ' + [
                prop.name,
                prop.source,
                prop.receiver,
                prop.conversionRuleCode,
                prop.code,
                prop.handler
            ].filter(Boolean).join(' ');
            
            if (prop.properties && prop.properties.length > 0) {
                text += ' ' + getPropertiesText(prop.properties);
            }
        }
        return text;
    }

    if (rule.properties) {
        content += ' ' + getPropertiesText(rule.properties);
    }

    return content;
};

const App: React.FC = () => {
    const [data, setData] = useState<ParsedData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('pko');
    const [selectedItem, setSelectedItem] = useState<Rule | null>(null);
    const [filterText, setFilterText] = useState<string>('');
    const [fileName, setFileName] = useState<string>('default.xml');
    const [hierarchyMode, setHierarchyMode] = useState<HierarchyMode>('standard');

    const loadAndParseXml = useCallback(async (xmlSource: string | File) => {
        setLoading(true);
        setError(null);
        setSelectedItem(null);
        
        try {
            let xmlString: string;
            let name: string;

            if (typeof xmlSource === 'string') {
                const response = await fetch(xmlSource);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${xmlSource}: ${response.statusText}`);
                }
                xmlString = await response.text();
                name = xmlSource.split('/').pop() || 'default.xml';
            } else {
                xmlString = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = () => reject(reader.error);
                    reader.readAsText(xmlSource);
                });
                name = xmlSource.name;
            }

            const parsed = parseXML(xmlString);
            if(parsed) {
                setData(parsed);
                setFileName(name);
                setSelectedCategory('pko');
            } else {
                setError("Failed to parse XML data. The structure might be invalid or the file is not a valid rules exchange file.");
                setData(null);
            }
        } catch (e: any) {
            setError(`An error occurred: ${e.message}`);
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAndParseXml('default.xml');
    }, [loadAndParseXml]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            loadAndParseXml(file);
        }
        if(event.target){
            event.target.value = '';
        }
    };

    const handleSelectCategory = useCallback((category: string) => {
        setSelectedCategory(category as CategoryKey);
        setSelectedItem(null);
    }, []);

    const handleSelectItem = useCallback((item: Rule) => {
        setSelectedItem(item);
    }, []);
    
    const handleNavigate = useCallback((ruleCode: string) => {
        if (!data) return;
        let targetRule: Rule | undefined;
        
        const findRuleRecursive = (groups: RuleGroup[]): Rule | undefined => {
            for (const group of groups) {
                const foundRule = group.rules?.find(rule => rule.id.trim() === ruleCode.trim());
                if (foundRule) return foundRule;
                if (group.subGroups) {
                    const foundInSub = findRuleRecursive(group.subGroups);
                    if (foundInSub) return foundInSub;
                }
            }
            return undefined;
        };

        targetRule = findRuleRecursive(data.pko);

        if(targetRule) {
            setSelectedCategory('pko');
            setSelectedItem(targetRule);
        } else {
            alert(`Rule with code "${ruleCode}" not found.`);
        }
    }, [data]);

    const getFilteredRules = useCallback((rules: Rule[]) => {
        if (!filterText.trim()) {
            return rules;
        }
        return rules.filter(item => fuzzyMatch(filterText, getRuleSearchableText(item)));
    }, [filterText]);

    const flatPkoRules = useMemo(() => {
        if (!data) return [];
        const allRules: Rule[] = [];
        const flatten = (groups: RuleGroup[]) => {
            for (const group of groups) {
                if (group.rules) allRules.push(...group.rules);
                if (group.subGroups) flatten(group.subGroups);
            }
        };
        flatten(data.pko);
        return allRules;
    }, [data]);

    const filteredPkoRules = useMemo(() => getFilteredRules(flatPkoRules), [flatPkoRules, getFilteredRules]);

    const pkoViewGroups = useMemo((): RuleGroup[] => {
        if (!data || !data.pko) return [];
        
        const addPaths = (groups: RuleGroup[], parentPath = ''): RuleGroup[] => {
            return groups.map(g => {
                const currentPath = `${parentPath}/${g.name}`;
                return {
                    ...g,
                    path: currentPath,
                    subGroups: g.subGroups ? addPaths(g.subGroups, currentPath) : g.subGroups,
                };
            });
        };

        switch (hierarchyMode) {
            case 'standard':
                const filteredIds = new Set(filteredPkoRules.map(r => r.id));
                const filterNestedGroups = (groups: RuleGroup[]): RuleGroup[] => {
                    return groups.map((group): RuleGroup | null => {
                        const filteredSubGroups = group.subGroups ? filterNestedGroups(group.subGroups) : [];
                        const filteredRules = group.rules?.filter(rule => filteredIds.has(rule.id));

                        if ((filteredRules && filteredRules.length > 0) || (filteredSubGroups && filteredSubGroups.length > 0)) {
                            return { ...group, rules: filteredRules, subGroups: filteredSubGroups };
                        }
                        return null;
                    }).filter((g): g is RuleGroup => g !== null);
                };
                return addPaths(filterNestedGroups(data.pko));

            case 'flat':
                return [{ name: 'Все правила конвертации', rules: filteredPkoRules, path: '/flat' }];

            case 'source':
            case 'receiver':
                const groupedByMainType: Record<string, Rule[]> = {};
                for (const rule of filteredPkoRules) {
                    const typeString = rule[hierarchyMode] || 'Не указан';
                    let mainGroup = 'Не указан';
                    
                    if (typeString.includes('.')) {
                        mainGroup = typeString.split('.')[0].replace("Ссылка", "").replace("Запись", "");
                    } else if (typeString !== 'Не указан' && typeString.trim() !== '') {
                        mainGroup = typeString.replace("Ссылка", "").replace("Запись", "");
                    }
                    
                    if (!groupedByMainType[mainGroup]) {
                        groupedByMainType[mainGroup] = [];
                    }
                    groupedByMainType[mainGroup].push(rule);
                }

                const nestedGroups: RuleGroup[] = Object.entries(groupedByMainType)
                    .map(([mainGroupName, rulesInMainGroup]) => {
                        const groupedBySubType: Record<string, Rule[]> = {};
                        for (const rule of rulesInMainGroup) {
                            const typeString = rule[hierarchyMode] || 'Не указан';
                            let subGroup = '(Общее)';
                            if (typeString.includes('.')) {
                                subGroup = typeString.split('.').slice(1).join('.');
                            }
                            if (!subGroup) subGroup = '(Общее)';

                            if (!groupedBySubType[subGroup]) {
                                groupedBySubType[subGroup] = [];
                            }
                            groupedBySubType[subGroup].push(rule);
                        }
                        
                        return {
                            name: mainGroupName,
                            subGroups: Object.entries(groupedBySubType)
                                .map(([subGroupName, rulesInSubGroup]) => ({
                                    name: subGroupName,
                                    rules: rulesInSubGroup,
                                }))
                                .sort((a, b) => a.name.localeCompare(b.name)),
                        };
                    })
                    .sort((a, b) => a.name.localeCompare(b.name));
                
                return addPaths(nestedGroups);

            default:
                return [];
        }
    }, [data, hierarchyMode, filteredPkoRules]);

    const allPkoRulesCount = useMemo(() => {
        if (!data) return 0;
        let count = 0;
        const countRules = (groups: RuleGroup[]) => {
             for (const group of groups) {
                if(group.rules) count += group.rules.length;
                if(group.subGroups) countRules(group.subGroups);
            }
        }
        countRules(data.pko);
        return count;
    }, [data]);
    
    const categories = useMemo(() => {
        if (!data) return [];
        
        const globalHandlersCount = (): number => {
            if (!filterText.trim()) {
                return (data.beforeExport ? 1 : 0) + (data.afterLoad ? 1 : 0);
            }
            let count = 0;
            if (data.beforeExport && fuzzyMatch(filterText, data.beforeExport)) count++;
            if (data.afterLoad && fuzzyMatch(filterText, data.afterLoad)) count++;
            return count;
        };

        return [
            { key: 'pko', name: 'Правила конвертации', count: getFilteredRules(flatPkoRules).length },
            { key: 'pvd', name: 'Правила выгрузки', count: getFilteredRules(data.pvd).length },
            { key: 'algorithms', name: 'Алгоритмы', count: getFilteredRules(data.algorithms).length },
            { key: 'parameters', name: 'Параметры', count: getFilteredRules(data.parameters).length },
            { key: 'requests', name: 'Запросы', count: getFilteredRules(data.requests).length },
            { key: 'beforeExport', name: 'Глобальные обработчики', count: globalHandlersCount() },
        ].filter(c => c.count > 0 || (c.key === 'pko' && allPkoRulesCount > 0));
    }, [data, filterText, getFilteredRules, flatPkoRules, allPkoRulesCount]);
    
    const isGlobalHandlerView = selectedCategory === 'beforeExport' || selectedCategory === 'afterLoad';
    const currentListTitle = categories.find(c => c.key === selectedCategory)?.name || 'Items';
    
    const listGroups = useMemo((): RuleGroup[] => {
        if (!data || isGlobalHandlerView) return [];
        
        if (selectedCategory === 'pko') {
            return pkoViewGroups;
        }

        const categoryKey = selectedCategory as Exclude<CategoryKey, 'pko' | 'beforeExport' | 'afterLoad'>;
        const items = data[categoryKey] as Rule[] || [];
        
        const filtered = getFilteredRules(items);
        if (filtered.length === 0) return [];
        return [{ name: currentListTitle, rules: filtered, path: `/${categoryKey}` }];
    }, [data, isGlobalHandlerView, selectedCategory, pkoViewGroups, getFilteredRules, currentListTitle]);


    return (
        <div className="flex h-screen font-sans">
            <Sidebar
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
                filterText={filterText}
                onFilterTextChange={setFilterText}
                onFileChange={handleFileChange}
                fileName={fileName}
            />
            <main className="flex flex-1 overflow-hidden">
                 {loading && <div className="flex-1 p-8 flex items-center justify-center text-gray-400">Loading & Parsing XML...</div>}
                 {error && <div className="flex-1 p-8 flex items-center justify-center text-red-400">{error}</div>}
                 {!loading && !error && data && (
                    isGlobalHandlerView ? (
                        <div className="flex-1 p-6 overflow-y-auto bg-gray-900/50">
                            <h2 className="text-2xl font-bold text-gray-200 mb-4">Глобальные обработчики</h2>
                            {(!filterText.trim() || fuzzyMatch(filterText, data.beforeExport)) &&
                                <CodeBlock code={data.beforeExport} title="ПередВыгрузкойДанных (Before Data Export)" />
                            }
                            {(!filterText.trim() || fuzzyMatch(filterText, data.afterLoad)) &&
                                <CodeBlock code={data.afterLoad} title="ПослеЗагрузкиДанных (After Data Load)" />
                            }
                        </div>
                     ) : (
                        <>
                            <ListView
                                groups={listGroups}
                                selectedItem={selectedItem}
                                onSelectItem={handleSelectItem}
                                title={currentListTitle}
                                showHierarchySelector={selectedCategory === 'pko'}
                                hierarchyMode={hierarchyMode}
                                onHierarchyModeChange={setHierarchyMode}
                            />
                            <DetailView item={selectedItem} onNavigate={handleNavigate} />
                        </>
                     )
                 )}
            </main>
        </div>
    );
};

export default App;
