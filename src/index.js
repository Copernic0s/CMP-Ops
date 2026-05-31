const boot = () => {
  const mode = String(process.env.HERMES_MODE || 'dev').trim();
  console.log(`[Hermes] booting in ${mode} mode`);
  console.log('[Hermes] portfolio source: Zoho sheet "Client BY agent"');
  console.log('[Hermes] workers: portfolio loader, CMP access, CMP card status, audit writer');
  console.log('[Hermes] ready for the first orchestration layer');
};

boot();
