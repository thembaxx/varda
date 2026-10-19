'use client';

import {useEffect, useId, useRef} from 'react';
import {motion} from 'motion/react';
import {X} from '@/components/ui/icons';

export default function Dialog({title, children, onClose, wide = false}: {title: string; children: React.ReactNode; onClose: () => void; wide?: boolean}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = previous; };
  }, []);
  return <dialog ref={ref} aria-labelledby={titleId} className={`app-dialog ${wide ? 'dialog-wide' : ''}`} onCancel={onClose} onClick={event => { if (event.target === ref.current) onClose(); }}>
    <motion.div initial={{opacity: 0, y: 20, scale: 0.98}} animate={{opacity: 1, y: 0, scale: 1}} className="dialog-content">
      <motion.button type="button" className="sheet-handle" aria-label={`Swipe down or tap to close ${title}`} drag="y" dragConstraints={{top: 0, bottom: 0}} dragElastic={0.25} onDragEnd={(_, info) => { if (info.offset.y > 60 || info.velocity.y > 500) onClose(); }} onClick={onClose}><span /></motion.button>
      <div className="dialog-header"><h2 id={titleId}>{title}</h2><button type="button" className="icon-button" aria-label={`Close ${title}`} onClick={onClose}><X size={21} /></button></div>
      {children}
    </motion.div>
  </dialog>;
}
