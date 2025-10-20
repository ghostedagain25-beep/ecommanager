import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon } from './icons';

interface DropdownOption {
    value: string;
    label: string;
}

interface SearchableDropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({ options, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const handleSelect = (option: DropdownOption) => {
        onChange(option.value);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="mt-1 w-full flex justify-between items-center py-2 px-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
                <span>{selectedOption ? selectedOption.label : 'Select a currency...'}</span>
                 <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
            </button>

            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 sticky top-0 bg-gray-800">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <SearchIcon className="w-5 h-5 text-gray-400" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search currencies..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
                            />
                        </div>
                    </div>
                    <ul className="py-1">
                        {filteredOptions.length > 0 ? filteredOptions.map(option => (
                            <li
                                key={option.value}
                                onClick={() => handleSelect(option)}
                                className={`px-4 py-2 cursor-pointer hover:bg-sky-600 ${value === option.value ? 'bg-sky-700' : ''}`}
                            >
                                {option.label}
                            </li>
                        )) : (
                            <li className="px-4 py-2 text-gray-500">No results found</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchableDropdown;