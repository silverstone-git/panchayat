import React, { useState, FormEvent, useRef } from 'react';
import { CATEGORIES } from '../../constants';
import { toaster } from '../../utils/toaster';

interface UploadedImage {
  id: string;
  file: File;
  caption: string;
  url?: string;
}

interface CreatePostModalProps {
  token: string | null;
  activeCategory: string | null;
  onClose: () => void;
  onSuccess: (newIdea: any) => void;
}

export function CreatePostModal({ token, activeCategory, onClose, onSuccess }: CreatePostModalProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [localCategory, setLocalCategory] = useState(activeCategory || 'general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showImageDropdown, setShowImageDropdown] = useState(false);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newImages = Array.from(files).filter(file => {
        if (file.size > 100 * 1024) {
            toaster.error(`File "${file.name}" exceeds 100KB.`);
            return false;
        }
        return true;
    });

    if (uploadedImages.length + newImages.length > 4) {
        toaster.error("Maximum 4 images allowed.");
        return;
    }

    setUploadedImages(prev => [...prev, ...newImages.map(file => ({ 
        id: crypto.randomUUID(), 
        file, 
        caption: '' 
    }))]);
  };
  
  const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewDesc(e.target.value);
    setShowImageDropdown(e.target.value.endsWith('!'));
  };

  const insertImageMarkdown = (image: UploadedImage) => {
    if (descRef.current) {
        const { selectionStart, value } = descRef.current;
        const markdown = `![${image.caption || image.file.name}](${image.id} "${image.caption || ''}")`;
        const newValue = value.slice(0, selectionStart - 1) + markdown + value.slice(selectionStart);
        setNewDesc(newValue);
        setShowImageDropdown(false);
        descRef.current.focus();
    }
  };

  const postIdea = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const uploadedData = [];
      for (const img of uploadedImages) {
        const urlRes = await fetch(`/api/v1/storage/upload-url?filename=${encodeURIComponent(img.file.name)}&content_type=${encodeURIComponent(img.file.type)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!urlRes.ok) throw new Error("Failed to get upload URL");
        const { upload_url, public_url } = await urlRes.json();
        
        await fetch(upload_url, { method: 'PUT', headers: { 'Content-Type': img.file.type }, body: img.file });
        uploadedData.push({ url: public_url, caption: img.caption });
      }

      const finalDesc = uploadedImages.reduce((acc, img) => 
        acc.replace(new RegExp(img.id, 'g'), img.url || ''), newDesc);

      const newIdeaData = {
        id: `optimistic-${Date.now()}`,
        title: newTitle,
        description: finalDesc,
        category: localCategory,
        author_id: 'You',
        vote_count: 1,
        upvote_count: 1,
        downvote_count: 0,
        status: 'APPROVED',
        created_at: new Date().toISOString(),
        isOptimistic: true
      };
      
      onSuccess(newIdeaData);
      onClose();

      const res = await fetch('/api/v1/threads/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle, description: finalDesc, category: localCategory, images: uploadedData })
      });
      
      if (!res.ok) throw new Error('Server error');
      toaster.success("Idea posted successfully!");

    } catch (err) {
      toaster.error("Failed to post idea. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-surface-container-low px-8 py-5 flex justify-between items-center border-b border-outline-variant/30">
          <h3 className="font-headline font-black text-2xl text-primary">Propose a Policy</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-highest rounded-full transition-colors text-outline">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form onSubmit={postIdea} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block font-label text-xs font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-2">Policy Title</label>
            <input className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-headline font-bold text-lg" placeholder="e.g., Decentralized Solar Grid for Old Town" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
          </div>

          <div className="relative">
            <label className="block font-label text-xs font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-2">Description & Rationale</label>
            <textarea 
              ref={descRef}
              className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 h-40 resize-none font-body leading-relaxed" 
              placeholder="Detail your proposal. Use markdown for formatting. Type '!' to insert an uploaded image." 
              value={newDesc} 
              onChange={handleDescChange} 
              required 
            />
            {showImageDropdown && uploadedImages.length > 0 && (
                <div className="absolute z-10 bg-surface-container-high rounded-lg shadow-xl border border-outline-variant mt-1 w-64 max-h-40 overflow-y-auto">
                    {uploadedImages.map(img => (
                        <div key={img.id} onClick={() => insertImageMarkdown(img)} className="p-2 hover:bg-surface-container-highest cursor-pointer text-sm font-bold text-primary border-b border-surface-container">
                            {img.file.name}
                        </div>
                    ))}
                </div>
            )}
          </div>
          
          <div>
            <label className="block font-label text-xs font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-2">Attach Images</label>
            <div className="border-2 border-dashed border-outline-variant rounded-xl p-4 text-center">
                 <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileSelect} accept="image/png,image/jpeg" multiple />
                 <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadedImages.length >= 4} className="bg-surface-container-high text-primary px-4 py-2 rounded-full font-bold text-sm shadow-sm hover:bg-surface-container-highest transition-colors disabled:opacity-50">
                     Select Files (max 4, 100KB each)
                 </button>
            </div>
            
            {uploadedImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                    {uploadedImages.map((img) => (
                        <div key={img.id} className="flex items-start gap-2 bg-surface-container-low p-2 rounded-lg">
                            <img src={URL.createObjectURL(img.file)} className="w-16 h-16 rounded-md object-cover" />
                            <input 
                                className="flex-1 bg-surface border border-outline-variant rounded-md px-2 py-1 text-xs" 
                                placeholder="Add caption..."
                                value={img.caption}
                                onChange={(e) => setUploadedImages(prev => prev.map(i => i.id === img.id ? {...i, caption: e.target.value} : i))}
                            />
                            <button type="button" onClick={() => setUploadedImages(prev => prev.filter(i => i.id !== img.id))} className="text-error text-xs font-bold">Delete</button>
                        </div>
                    ))}
                </div>
            )}
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-surface-container">
            <button type="button" className="px-6 py-3 rounded-full font-bold text-outline hover:bg-surface-container transition-colors" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={isSubmitting} className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold shadow-md hover:bg-primary/90 transition-opacity flex items-center gap-2 disabled:opacity-50">
              {isSubmitting ? 'Posting...' : 'Submit Proposal'}
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
