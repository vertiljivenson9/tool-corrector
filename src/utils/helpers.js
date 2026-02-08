/**
 * Utility functions for the Code Editor Tool
 */

// Debounce function
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
export function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Deep clone object
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            clonedObj[key] = deepClone(obj[key]);
        }
        return clonedObj;
    }
    return obj;
}

// Generate unique ID
export function generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Format file size
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format date
export function formatDate(date, format = 'relative') {
    if (!date) return 'Unknown';
    
    const d = new Date(date);
    
    if (format === 'relative') {
        const now = new Date();
        const diff = now - d;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
        
        return d.toLocaleDateString();
    }
    
    return d.toLocaleString();
}

// Sanitize HTML
export function sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

// Create data URL from string
export function createDataURL(content, type = 'text/plain') {
    const blob = new Blob([content], { type });
    return URL.createObjectURL(blob);
}

// Download file
export function downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
}

// Parse query parameters
export function parseQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    
    for (const [key, value] of params) {
        result[key] = value;
    }
    
    return result;
}

// Update query parameters
export function updateQueryParams(params) {
    const url = new URL(window.location);
    
    Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined) {
            url.searchParams.delete(key);
        } else {
            url.searchParams.set(key, value);
        }
    });
    
    window.history.pushState({}, '', url);
}

// Validate email
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Capitalize first letter
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Truncate text
export function truncate(text, length = 100) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

// Group array by key
export function groupBy(array, key) {
    return array.reduce((groups, item) => {
        const groupKey = item[key];
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(item);
        return groups;
    }, {});
}

// Flatten nested array
export function flatten(array) {
    return array.reduce((flat, item) => {
        return flat.concat(Array.isArray(item) ? flatten(item) : item);
    }, []);
}

// Sleep/pause execution
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Measure execution time
export function measureTime(label, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${label}: ${(end - start).toFixed(2)}ms`);
    return result;
}

// Retry function with exponential backoff
export async function retry(fn, retries = 3, delay = 1000) {
    try {
        return await fn();
    } catch (error) {
        if (retries === 0) throw error;
        await sleep(delay);
        return retry(fn, retries - 1, delay * 2);
    }
}

// Create element with attributes
export function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.substring(2).toLowerCase(), value);
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else {
            element.setAttribute(key, value);
        }
    });
    
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    });
    
    return element;
}

// Remove element from DOM
export function removeElement(element) {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}

// Toggle class on element
export function toggleClass(element, className, force) {
    if (force !== undefined) {
        element.classList.toggle(className, force);
    } else {
        element.classList.toggle(className);
    }
}

// Check if element is in viewport
export function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Scroll to element smoothly
export function scrollToElement(element, offset = 0) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

// Copy text to clipboard
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        } catch (error) {
            document.body.removeChild(textarea);
            return false;
        }
    }
}

// Generate random color
export function getRandomColor() {
    const colors = [
        '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
        '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Format number with commas
export function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Create UUID
export function createUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Detect mobile device
export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Detect touch device
export function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Store data in localStorage with expiration
export function setLocalStorage(key, value, ttl = null) {
    const item = {
        value,
        expires: ttl ? Date.now() + ttl : null
    };
    localStorage.setItem(key, JSON.stringify(item));
}

// Get data from localStorage
export function getLocalStorage(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;
    
    const item = JSON.parse(itemStr);
    
    if (item.expires && Date.now() > item.expires) {
        localStorage.removeItem(key);
        return null;
    }
    
    return item.value;
}

// Remove data from localStorage
export function removeLocalStorage(key) {
    localStorage.removeItem(key);
}

// Clear all localStorage
export function clearLocalStorage() {
    localStorage.clear();
}

// Export all utilities
export default {
    debounce,
    throttle,
    deepClone,
    generateId,
    formatFileSize,
    formatDate,
    sanitizeHTML,
    createDataURL,
    downloadFile,
    parseQueryParams,
    updateQueryParams,
    validateEmail,
    capitalize,
    truncate,
    groupBy,
    flatten,
    sleep,
    measureTime,
    retry,
    createElement,
    removeElement,
    toggleClass,
    isInViewport,
    scrollToElement,
    copyToClipboard,
    getRandomColor,
    formatNumber,
    createUUID,
    isMobile,
    isTouchDevice,
    setLocalStorage,
    getLocalStorage,
    removeLocalStorage,
    clearLocalStorage
};
