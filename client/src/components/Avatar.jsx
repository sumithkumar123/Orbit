import React from 'react';
import { API_BASE_URL } from '../lib/apiBase';

export default function Avatar({ src, name, className }) {
    // 1. If src is a local upload (starts with /uploads), prepend the API base
    let finalSrc = src;
    if (src && src.startsWith('/uploads')) {
        finalSrc = `${API_BASE_URL}${src}`;
    }

    // 2. If we have a valid image source, try to render it
    //    (We effectively rely on the img tag's onerror to fallback, 
    //     but for simplicity, we can just check if finalSrc exists)
    if (finalSrc) {
        return (
            <img
                src={finalSrc}
                alt={name || 'User'}
                className={`${className} object-cover`}
                onError={(e) => {
                    e.currentTarget.style.display = 'none'; // Hide broken image
                    e.currentTarget.nextSibling.style.display = 'flex'; // Show fallback
                }}
            />
        );
    }

    // 3. Fallback to Initials (Offline Friendly)
    const initials = (name || 'U').slice(0, 2).toUpperCase();
    // Generate a consistent color based on the name string
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
        hash = (name || '').charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = colors[Math.abs(hash) % colors.length];

    return (
        <div className={`${className} ${color} flex items-center justify-center text-white font-bold tracking-wide`}>
            {initials}
        </div>
    );
}
