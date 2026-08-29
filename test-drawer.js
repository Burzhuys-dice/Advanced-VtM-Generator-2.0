window.openV6InfoDrawer = function(title, content) {
    const overlay = document.getElementById('v6-info-drawer-overlay');
    const drawer = document.getElementById('v6-info-drawer');
    const titleEl = document.getElementById('v6-info-drawer-title');
    const contentEl = document.getElementById('v6-info-drawer-content');
    
    if (overlay && drawer && titleEl && contentEl) {
        titleEl.innerHTML = title;
        contentEl.innerHTML = content;
        
        overlay.classList.remove('hidden');
        // trigger reflow
        void overlay.offsetWidth;
        overlay.classList.remove('opacity-0');
        overlay.classList.add('opacity-100');
        
        drawer.classList.remove('translate-x-full');
    }
}

window.closeV6InfoDrawer = function() {
    const overlay = document.getElementById('v6-info-drawer-overlay');
    const drawer = document.getElementById('v6-info-drawer');
    
    if (overlay && drawer) {
        overlay.classList.remove('opacity-100');
        overlay.classList.add('opacity-0');
        drawer.classList.add('translate-x-full');
        
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 300);
    }
}
