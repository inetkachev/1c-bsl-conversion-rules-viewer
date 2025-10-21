import React, { useRef } from 'react';
import { SearchIcon } from './icons';

interface SidebarProps {
  categories: { key: string, name: string, count: number }[];
  selectedCategory: string | null;
  onSelectCategory: (category: string) => void;
  filterText: string;
  onFilterTextChange: (text: string) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileName: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  filterText,
  onFilterTextChange,
  onFileChange,
  fileName,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-64 bg-gray-900/70 border-r border-gray-700/50 flex flex-col">
      <div className="p-4 border-b border-gray-700/50">
        <h1 className="text-lg font-bold text-white">XML Rules Viewer</h1>
      </div>
      <div className="p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Filter rules..."
            value={filterText}
            onChange={(e) => onFilterTextChange(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onSelectCategory(cat.key)}
            className={`w-full flex justify-between items-center px-3 py-2 text-sm font-medium rounded-md text-left transition-colors duration-150 ${
              selectedCategory === cat.key
                ? 'bg-blue-600/30 text-white'
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }`}
          >
            <span className="truncate">{cat.name}</span>
            <span className={`flex-shrink-0 px-2 py-0.5 text-xs rounded-full ${
                selectedCategory === cat.key ? 'bg-blue-500/50 text-blue-100' : 'bg-gray-700 text-gray-300'
            }`}>{cat.count}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700/50">
        <p className="text-xs text-gray-500 mb-1">Loaded file:</p>
        <p className="text-sm text-gray-300 font-mono truncate" title={fileName}>{fileName}</p>
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onFileChange} 
            className="hidden" 
            accept=".xml" 
        />
        <button 
            onClick={handleUploadClick} 
            className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-md transition-colors duration-150"
        >
          Upload New File
        </button>
        <button 
            onClick={() => onFileChange({ target: { files: [new File([], 'default.xml')] } } as any)}
            className="w-full mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
            Load Default
        </button>
      </div>
      <div className="p-4 border-t border-gray-700/50 text-xs text-gray-500">
        <p>&copy; 2024 Rule Viewer</p>
      </div>
    </div>
  );
};

export default Sidebar;
