'use client';

import {useState} from 'react';
import {DownloadSimple, ShareNetwork, PlusSquare, CheckCircle} from '@/components/ui/icons';
import {useExperience} from '@/components/ExperienceProvider';
import Dialog from '@/components/ui/Dialog';

export default function PWAInstallButton() {
  const {feedback, notify, pwa} = useExperience();
  const {isInstallable, isInstalled, isIOS, install} = pwa;
  const [guide, setGuide] = useState(false);
  const [pending, setPending] = useState(false);
  if (isInstalled) return <p className="install-status"><CheckCircle size={19} />Varda is at home on this device.</p>;
  async function handleInstall() {
    if (pending) return;
    feedback();
    if (!isInstallable) { setGuide(true); return; }
    setPending(true);
    try { if (await install()) notify('A little piece of home, on your home screen.'); }
    catch { notify('Installation couldn’t start. You can try from your browser menu.'); }
    finally { setPending(false); }
  }
  return <><button className="button button-green install-button" disabled={pending} onClick={handleInstall}><DownloadSimple size={19} />{pending ? 'Opening installer…' : 'Take Varda home'}<span>Install app</span></button><p className="form-note">Your own app icon, a full-screen home, and your saved plans offline.</p>{guide && <Dialog title="A little closer to home" onClose={() => setGuide(false)}><p className="dialog-intro">Install Varda for a little more room and a home screen shortcut.</p>{isIOS ? <ol className="install-steps"><li><ShareNetwork size={25} /><span>Open the browser’s Share menu.</span></li><li><PlusSquare size={25} /><span>Choose <strong>Add to Home Screen</strong>, then tap Add.</span></li></ol> : <ol className="install-steps"><li><DownloadSimple size={25} /><span>Look for the install icon in your address bar, or open the browser menu.</span></li><li><PlusSquare size={25} /><span>Choose <strong>Install Varda</strong> or <strong>Add to Home Screen</strong>.</span></li></ol>}<p className="form-note">If your browser doesn’t offer installation, Varda still works right here. An internet connection is needed for the first visit.</p><button className="button button-green" onClick={() => setGuide(false)}>Got it</button></Dialog>}</>;
}
