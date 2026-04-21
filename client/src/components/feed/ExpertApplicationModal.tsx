import React, { useState, FormEvent, useRef } from 'react';
import { CATEGORIES } from '../../constants';

interface ExpertApplicationModalProps {
  token: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ExpertApplicationModal({ token, onClose, onSuccess }: ExpertApplicationModalProps) {
  const [localCategory, setLocalCategory] = useState(CATEGORIES[0].id);
  const [statement, setStatement] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !token) return;
    
    setIsUploading(true);
    try {
        const file = files[0];
        
        // 1. Get presigned URL
        const urlRes = await fetch(`/api/v1/storage/upload-url?filename=${encodeURIComponent(file.name)}&content_type=${encodeURIComponent(file.type)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!urlRes.ok) throw new Error("Failed to get upload URL");
        const { upload_url, public_url } = await urlRes.json();
        
        // 2. Upload directly to Cloudflare R2
        const uploadRes = await fetch(upload_url, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type
            },
            body: file
        });
        
        if (!uploadRes.ok) throw new Error("Failed to upload to R2");
        
        // 3. Store the public URL
        setUploadedUrls(prev => [...prev, public_url]);
    } catch (err) {
        console.error("Upload error", err);
        alert("Upload failed. Check console.");
    } finally {
        setIsUploading(false);
    }
  };

  const submitApplication = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (uploadedUrls.length === 0) {
        alert("Please upload at least one supporting document (e.g. CV or ID).");
        return;
    }
    
    const res = await fetch('/api/v1/users/expert-applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ category: localCategory, document_urls: uploadedUrls, statement })
    });
    
    if (res.ok) {
      alert("Application submitted successfully. A Moderator will review it shortly.");
      onSuccess();
    } else {
        const error = await res.json();
        alert(error.detail || "Failed to submit application");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-surface-container-low px-8 py-5 flex justify-between items-center border-b border-outline-variant/30">
          <h3 className="font-headline font-black text-2xl text-primary">Apply as an Expert Reviewer</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-highest rounded-full transition-colors text-outline">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form onSubmit={submitApplication} className="p-8 space-y-6">
          <div>
            <label className="block font-label text-xs font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-2">Area of Expertise (Subpanchayat)</label>
            <select 
              className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 appearance-none font-bold" 
              value={localCategory} 
              onChange={e => setLocalCategory(e.target.value)}
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-label text-xs font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-2">Statement of Qualifications</label>
            <textarea 
              className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 h-24 resize-none font-body leading-relaxed" 
              placeholder="Briefly explain your experience in this field..." 
              value={statement} 
              onChange={e => setStatement(e.target.value)} 
              required 
            />
          </div>
          
          <div>
            <label className="block font-label text-xs font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-2">Supporting Documents</label>
            <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 text-center">
                 <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload}
                    accept=".pdf,image/png,image/jpeg"
                 />
                 <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-surface-container-high text-primary px-4 py-2 rounded-full font-bold text-sm shadow-sm hover:bg-surface-container-highest transition-colors disabled:opacity-50"
                 >
                     {isUploading ? "Uploading to Cloudflare R2..." : "Select File (PDF, PNG, JPG)"}
                 </button>
            </div>
            
            {uploadedUrls.length > 0 && (
                <div className="mt-4 space-y-2">
                    <p className="text-xs font-bold text-secondary uppercase">Uploaded Files:</p>
                    {uploadedUrls.map((url, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-surface-container-low p-2 rounded-lg text-sm truncate">
                            <span className="material-symbols-outlined text-sm text-green-600">check_circle</span>
                            <a href={url} target="_blank" rel="noreferrer" className="hover:underline text-primary truncate block max-w-xs">{url.split('/').pop()}</a>
                        </div>
                    ))}
                </div>
            )}
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-surface-container">
            <button type="button" className="px-6 py-3 rounded-full font-bold text-outline hover:bg-surface-container transition-colors" onClick={onClose}>Cancel</button>
            <button type="submit" className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold shadow-md hover:bg-primary/90 transition-opacity flex items-center gap-2 disabled:opacity-50">
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
