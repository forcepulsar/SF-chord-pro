/**
 * Utility functions for handling web links
 */
export function parseWebLinks(webLinksString) {
    const webLinks = {
        spotify: null,
        youtube: null,
        google: null
    };

    if (!webLinksString) return webLinks;
    
    try {
        // Create a temporary div to parse the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = webLinksString;
        
        // Find all links
        const links = tempDiv.getElementsByTagName('a');
        
        Array.from(links).forEach(link => {
            const href = link.getAttribute('href');
            if (href.includes('spotify')) {
                webLinks.spotify = href;
            } else if (href.includes('youtube')) {
                webLinks.youtube = href;
            } else if (href.includes('google')) {
                webLinks.google = href;
            }
        });
    } catch (error) {
        console.error('Error parsing web links:', error);
    }

    return webLinks;
}

export function handleWebLinkClick(linkType, existingLink, songName = '', artistName = '') {
    // If an existing link is provided, use it
    if (existingLink) {
        openLink(linkType, existingLink);
        return;
    }

    // If no existing link, generate a search URL
    const searchQuery = encodeURIComponent(`${artistName} ${songName}`.trim());
    
    const searchUrls = {
        spotify: `https://open.spotify.com/search/${searchQuery}`,
        youtube: `https://www.youtube.com/results?search_query=${searchQuery}`,
        google: `https://www.google.com/search?q=${searchQuery}`
    };

    const url = searchUrls[linkType];
    
    if (url) {
        openLink(linkType, url);
    }
}

function openLink(linkType, link) {
    // Check if we're on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    const openLinkInBrowser = (url) => {
        if (isMobile) {
            // Try to open in app first
            const appUrls = {
                spotify: `spotify://search/${encodeURIComponent(url)}`,
                youtube: `youtube://results?search_query=${encodeURIComponent(url)}`,
                google: null
            };

            const appUrl = appUrls[linkType];
            
            if (appUrl) {
                window.location.href = appUrl;
                
                // Fallback to web URL after a short delay if app doesn't open
                setTimeout(() => {
                    window.open(link, '_blank');
                }, 500);
            } else {
                window.open(link, '_blank');
            }
        } else {
            // On desktop, open in new tab
            window.open(link, '_blank');
        }
    };

    openLinkInBrowser(link);
}
