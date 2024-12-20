let lastManualScrollTime = 0;
const MANUAL_SCROLL_TIMEOUT = 1000;
const BASE_SCROLL_AMOUNT = 1;

export function handleScroll(container, scrollAccumulator, scrollSpeed, isAutoScrolling) {

    if (!container || !isAutoScrolling) {
        return { shouldStop: true, newAccumulator: scrollAccumulator };
    }

    if (Date.now() - lastManualScrollTime < MANUAL_SCROLL_TIMEOUT) {
        return { 
            shouldStop: false, 
            newAccumulator: scrollAccumulator,
            shouldSkipScroll: true 
        };
    }

    // Calculate new scroll amount
    const pixelsThisInterval = scrollSpeed * BASE_SCROLL_AMOUNT;
    const newAccumulator = scrollAccumulator + pixelsThisInterval;
    
    if (newAccumulator >= 1) {
        const pixelsToScroll = Math.floor(newAccumulator);
        const previousScrollTop = container.scrollTop;
        
        container.scrollTop += pixelsToScroll;
        
        const actualScroll = container.scrollTop - previousScrollTop;

        // Check if we've reached the bottom
        const bottomThreshold = container.scrollHeight - container.clientHeight;
        if (container.scrollTop >= bottomThreshold - 1) {
            return { shouldStop: true, newAccumulator: 0 };
        }

        return { 
            shouldStop: false, 
            newAccumulator: newAccumulator - pixelsToScroll 
        };
    }

    return { 
        shouldStop: false, 
        newAccumulator 
    };
}


export function setupScrollableContainer(cardBody, container) {
    if (!cardBody || !container) return;
    
    cardBody.style.display = 'block';
    cardBody.style.overflowY = 'auto';
    cardBody.style.height = 'calc(100vh - 60px)';
    cardBody.style.position = 'relative';
    
    container.style.minHeight = 'min-content';
    container.style.height = 'auto';
    container.style.position = 'relative';
}

export function handleManualScroll() {
    lastManualScrollTime = Date.now();
}

export function addScrollListener(container, callback) {
    if (!container) return;
    
    const handleWheel = (event) => {
        if (event.deltaY !== 0) {
            handleManualScroll();
            callback?.();
        }
    };

    const handleTouchMove = () => {
        handleManualScroll();
        callback?.();
    };

    container.addEventListener('wheel', handleWheel, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('touchmove', handleTouchMove);
    };
}