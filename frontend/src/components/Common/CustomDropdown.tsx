import { useState, useRef, useEffect } from 'react';

interface Option {
    value: string;
    label: string;
}

interface CustomDropdownProps {
    label: string;
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function CustomDropdown({ label, options, value, onChange, placeholder = "Select..." }: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="block text-gray-400 text-[10px] font-mono uppercase tracking-widest mb-2 px-1">
                {label}
            </label>

            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`
          w-full px-4 py-3 bg-[#16162d] border cursor-pointer rounded-xl flex items-center justify-between transition-all duration-300
          ${isOpen ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-purple-500/20 hover:border-purple-500/40'}
        `}
            >
                <span className={`${selectedOption ? 'text-white' : 'text-gray-500'} text-sm font-medium`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>

                <svg
                    className={`w-4 h-4 text-purple-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-[#1a1a35] border border-purple-500/30 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {options.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`
                  px-4 py-3 text-sm cursor-pointer transition-colors
                  ${value === option.value
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:bg-purple-600/20 hover:text-white'}
                `}
                            >
                                {option.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
