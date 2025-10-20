
import React, { useState, useCallback } from 'react';
import { UploadIcon, FileIcon, CheckCircleIcon } from './icons';

interface FileUploaderProps {
  id: string;
  label: string;
  expectedFilename: string;
  onFileSelect: (file: File | null) => void;
  disabled: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ id, label, expectedFilename, onFileSelect, disabled }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    onFileSelect(file);
  }, [onFileSelect]);

  const borderColor = selectedFile ? 'border-green-500' : 'border-gray-600';

  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className={`relative flex flex-col items-center justify-center w-full h-48 border-2 ${borderColor} border-dashed rounded-lg cursor-pointer bg-gray-700/50 hover:bg-gray-700/80 transition-colors`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none">
          {selectedFile ? (
            <>
              <CheckCircleIcon className="w-10 h-10 text-green-400 mb-2" />
              <div className="flex items-center text-center">
                <FileIcon className="w-5 h-5 mr-2 text-gray-400" />
                <p className="text-sm text-gray-200 font-semibold truncate">{selectedFile.name}</p>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </>
          ) : (
            <>
              <UploadIcon className="w-10 h-10 text-gray-400 mb-2" />
              <p className="mb-2 text-sm text-gray-400">
                <span className="font-semibold text-sky-400">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">{expectedFilename}</p>
            </>
          )}
        </div>
        <input
          id={id}
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          disabled={disabled}
        />
      </div>
    </div>
  );
};
