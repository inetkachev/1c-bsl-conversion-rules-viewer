import React, { useState, useEffect, useRef } from 'react';
import type { Rule, Property } from '../types';
import CodeBlock from './CodeBlock';
import { ArrowRightIcon, LinkIcon, CodeIcon, XIcon, SearchIcon } from './icons';

declare const hljs: any;

interface DetailViewProps {
  item: Rule | null;
  onNavigate: (ruleCode: string) => void;
}

const PropertyView: React.FC<{ property: Property, onNavigate: (ruleCode: string) => void; level?: number }> = ({ property, onNavigate, level = 0 }) => {
    const [isHandlerModalOpen, setHandlerModalOpen] = useState(false);
    const codeRef = useRef<HTMLElement>(null);
    const [copyButtonText, setCopyButtonText] = useState('Copy');
    
    useEffect(() => {
        if (isHandlerModalOpen && property.handler && codeRef.current) {
            hljs.highlightElement(codeRef.current);
            setCopyButtonText('Copy');
        }
    }, [isHandlerModalOpen, property.handler]);

    const handleCopy = () => {
        if (codeRef.current?.textContent) {
          navigator.clipboard.writeText(codeRef.current.textContent);
          setCopyButtonText('Copied!');
          setTimeout(() => setCopyButtonText('Copy'), 2000);
        }
    };
    
    const handlerModal = () => (
        <>
        {isHandlerModalOpen && property.handler && (
            <div 
              className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setHandlerModalOpen(false)}
            >
              <div 
                className="bg-gray-800/90 rounded-lg shadow-xl w-full max-w-4xl h-[70vh] flex flex-col border border-gray-600"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                  <h3 className="text-lg font-semibold text-gray-200 truncate pr-4">Обработчик: {property.name}</h3>
                  <div className="flex items-center space-x-2">
                     <button
                        onClick={handleCopy}
                        className="px-3 py-1 text-xs font-semibold text-gray-300 bg-gray-700/50 hover:bg-gray-700 rounded-md transition-colors w-16"
                    >
                        {copyButtonText}
                    </button>
                    <button 
                      onClick={() => setHandlerModalOpen(false)}
                      className="p-1 rounded-full hover:bg-gray-700 text-gray-400"
                      aria-label="Close modal"
                    >
                      <XIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-1">
                  <pre className="p-4 text-sm"><code ref={codeRef} className="language-1c whitespace-pre">{property.handler.trim()}</code></pre>
                </div>
              </div>
            </div>
        )}
        </>
    );

    const renderSource = () => {
        if (property.source) {
            return (
                <div className="flex items-baseline">
                    <span className="font-mono text-gray-300">{property.source}</span>
                    {property.sourceType && <span className="text-xs text-gray-500 ml-1.5">({property.sourceType})</span>}
                </div>
            );
        }
        if (property.getFromIncomingData) {
            return <span className="italic text-gray-500">Входящие данные</span>;
        }
        if (property.properties.length > 0 && !property.receiver) {
             return null;
        }
        return <span className="font-mono italic text-gray-500">--</span>;
    };

    const isStructuralGroup = property.properties.length > 0 && !property.receiver && !property.source && !property.getFromIncomingData;

    return (
        <div className={`ml-${level * 4} border-l border-gray-700/50 my-1`}>
            <div className="bg-gray-800/40 hover:bg-gray-800/80 rounded-md mb-2 relative group">
                <div className="p-3">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-2">
                        <p className="font-mono text-sm text-amber-400 font-semibold pr-8">{property.name}</p>
                        <span className="text-xs text-gray-600 font-mono bg-gray-900/50 px-1.5 py-0.5 rounded absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity">#{property.code}</span>
                    </div>

                    {!isStructuralGroup && (
                        <div className="grid grid-cols-[1rem_1fr] gap-y-1.5 gap-x-2 items-center text-sm">
                            {/* Source */}
                            <div/>
                            <div className="flex items-baseline min-h-[1.25rem]">
                                {renderSource()}
                            </div>

                            {/* Flow Line */}
                            <div className="text-gray-500 text-center font-semibold text-lg leading-none">↓</div>
                            <div className="flex items-center space-x-2 bg-gray-900/30 px-2 py-1 rounded-md text-xs">
                                {/* PKS */}
                                {property.conversionRuleCode ? (
                                    <button onClick={() => onNavigate(property.conversionRuleCode!)} className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 hover:underline" title="Правило конвертации свойства (ПКС)">
                                        <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="truncate">{property.conversionRuleCode.trim()}</span>
                                    </button>
                                ) : <span className="italic text-gray-600 flex items-center space-x-1"><LinkIcon className="w-3.5 h-3.5" /> <span>нет ПКС</span></span>}
                                
                                {(property.handler || property.isSearch) && <span className="text-gray-600">|</span>}
                                
                                {/* Handler */}
                                {property.handler && (
                                    <button onClick={() => setHandlerModalOpen(true)} className="text-gray-400 hover:text-white" title="Показать обработчик (алгоритм)">
                                        <CodeIcon className="w-4 h-4" />
                                    </button>
                                )}
                                
                                {property.handler && property.isSearch && <span className="text-gray-600">|</span>}

                                {/* Search */}
                                {property.isSearch && (
                                    <div title="Поле поиска">
                                        <SearchIcon className="w-4 h-4 text-sky-400" />
                                    </div>
                                )}
                            </div>

                            {/* Receiver */}
                            <div className="text-gray-500 text-center font-semibold text-lg leading-none">→</div>
                            <div className="flex items-baseline">
                                <span className="font-mono text-gray-300">{property.receiver || <span className="italic text-gray-500">--</span>}</span>
                                {property.receiverType && <span className="text-xs text-gray-500 ml-1.5">({property.receiverType})</span>}
                            </div>
                        </div>
                    )}
                </div>

                {handlerModal()}
            </div>
            {property.properties && property.properties.length > 0 && (
                 <div className="pt-1">
                    {property.properties.map((childProp, index) => (
                        <PropertyView key={`${childProp.code}-${index}`} property={childProp} onNavigate={onNavigate} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};


const DetailView: React.FC<DetailViewProps> = ({ item, onNavigate }) => {
  const [isSourceModalOpen, setSourceModalOpen] = useState(false);
  const [formattedXml, setFormattedXml] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('Copy');
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setSourceModalOpen(false);
  }, [item]);

  useEffect(() => {
    if (isSourceModalOpen && item?.rawXml) {
       try {
        const beautify = (window as any).vkbeautify;
        if (beautify && typeof beautify.xml === 'function') {
            const formatted = beautify.xml(item.rawXml);
            setFormattedXml(formatted);
        } else {
            console.error("vkbeautify library not found or xml method is missing.");
            setFormattedXml(item.rawXml);
        }
        setCopyButtonText('Copy'); // Reset copy button text when content changes
      } catch (e) {
          console.error("Error formatting XML with vkbeautify:", e);
          // Fallback to raw XML if formatting fails
          setFormattedXml(item.rawXml);
      }
    }
  }, [isSourceModalOpen, item]);

  useEffect(() => {
    if (formattedXml && codeRef.current) {
        hljs.highlightElement(codeRef.current);
    }
  }, [formattedXml]);

  const handleCopy = () => {
    if (codeRef.current?.textContent) {
      navigator.clipboard.writeText(codeRef.current.textContent);
      setCopyButtonText('Copied!');
      setTimeout(() => setCopyButtonText('Copy'), 2000);
    }
  };


  if (!item) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center text-gray-500">
        Select an item to view its details
      </div>
    );
  }

  const renderHeader = (rule: Rule, titleColor: string) => (
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <h2 className={`text-2xl font-bold ${titleColor}`}>{rule.name}</h2>
        <span className="font-mono text-sm text-gray-500">#{rule.id}</span>
      </div>
      {rule.rawXml && (
        <button
          onClick={() => setSourceModalOpen(true)}
          title="View XML Source"
          className="ml-4 p-2 text-gray-400 hover:bg-gray-700 rounded-md transition-colors"
        >
          <CodeIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );

  const renderPKO = (rule: Rule) => (
    <>
      {renderHeader(rule, 'text-blue-400')}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-gray-400 text-xs mb-1">Источник (Source)</div>
            <div className="font-mono text-green-400">{rule.source || 'N/A'}</div>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-gray-400 text-xs mb-1">Приемник (Receiver)</div>
            <div className="font-mono text-cyan-400">{rule.receiver || 'N/A'}</div>
        </div>
      </div>
      <CodeBlock code={rule.onLoad || ''} title="ПриЗагрузке (On Load)" />
      <CodeBlock code={rule.afterLoad || ''} title="ПослеЗагрузки (After Load)" />
      <CodeBlock code={rule.beforeConvert || ''} title="ПередКонвертациейОбъекта (Before Convert)" />
      <CodeBlock code={rule.afterLoadParams || ''} title="ПослеЗагрузкиПараметров (After Load Params)" />

      {rule.properties && rule.properties.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-300">Свойства (Properties)</h3>
            <div className="space-y-2">
                {rule.properties.map((prop, index) => <PropertyView key={`${prop.code}-${index}`} property={prop} onNavigate={onNavigate} />)}
            </div>
          </div>
      )}
    </>
  );

  const renderPVD = (rule: Rule) => (
     <>
      {renderHeader(rule, 'text-purple-400')}
       <div className="mt-4 grid grid-cols-1 gap-4 text-sm">
         <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-gray-400 text-xs mb-1">Способ отбора данных</div>
            <div className="font-mono text-gray-200">{rule.dataSelectionMethod || 'N/A'}</div>
        </div>
        {rule.conversionRuleCode && (
            <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-gray-400 text-xs mb-1">Правило конвертации</div>
                <button
                    onClick={() => onNavigate(rule.conversionRuleCode!)}
                    className="font-mono text-blue-400 hover:text-blue-300 hover:underline flex items-center space-x-2"
                >
                    <LinkIcon className="w-4 h-4" />
                    <span>{rule.conversionRuleCode}</span>
                </button>
            </div>
        )}
       </div>
      <CodeBlock code={rule.beforeRuleProcessing || ''} title="ПередОбработкойПравила (Before Rule Processing)" />
    </>
  );

  const renderAlgorithmOrRequest = (rule: Rule) => (
     <>
      {renderHeader(rule, 'text-emerald-400')}
      <CodeBlock code={rule.code || ''} title="Код" />
    </>
  );
  
  const renderParameter = (rule: Rule) => (
     <>
      {renderHeader(rule, 'text-orange-400')}
       <div className="mt-4 grid grid-cols-1 gap-4 text-sm">
         <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-gray-400 text-xs mb-1">Тип значения</div>
            <div className="font-mono text-gray-200">{rule.source || 'N/A'}</div>
        </div>
       </div>
    </>
  );

  const renderContent = () => {
    switch (item.type) {
      case 'ПКО':
        return renderPKO(item);
      case 'ПВД':
        return renderPVD(item);
      case 'Алгоритм':
      case 'Запрос':
        return renderAlgorithmOrRequest(item);
      case 'Параметр':
        return renderParameter(item);
      default:
        return <p>Unsupported rule type.</p>;
    }
  };

  const renderModal = () => (
    <>
      {isSourceModalOpen && item?.rawXml && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSourceModalOpen(false)}
        >
          <div 
            className="bg-gray-800/90 rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col border border-gray-600"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-200 truncate pr-4">XML Source: {item.name}</h3>
              <div className="flex items-center space-x-2">
                 <button
                    onClick={handleCopy}
                    className="px-3 py-1 text-xs font-semibold text-gray-300 bg-gray-700/50 hover:bg-gray-700 rounded-md transition-colors w-16"
                >
                    {copyButtonText}
                </button>
                <button 
                  onClick={() => setSourceModalOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-700 text-gray-400"
                  aria-label="Close modal"
                >
                  <XIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-1">
              <pre className="p-4"><code ref={codeRef} className="language-xml whitespace-pre">{formattedXml}</code></pre>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-gray-900/50">
      {renderContent()}
      {renderModal()}
    </div>
  );
};

export default DetailView;