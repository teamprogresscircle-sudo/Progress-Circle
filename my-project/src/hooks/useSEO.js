import { useEffect } from 'react';

/**
 * useSEO - Sets the document title for each page dynamically.
 * Also updates the og:title meta tag for SPA navigation.
 * @param {string} title - The page-specific title segment
 * @param {string} [description] - Optional meta description override
 */
export function useSEO(title, description) {
    useEffect(() => {
        // Update document title
        document.title = title
            ? `${title} — ProgressCircle`
            : 'ProgressCircle | AI-Powered Productivity & Habit Tracking System';

        // Update OG title tag for social sharing within SPA
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', document.title);

        // Optionally update description
        if (description) {
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', description);
        }

        // Restore default on unmount
        return () => {
            document.title = 'ProgressCircle | AI-Powered Productivity & Habit Tracking System';
        };
    }, [title, description]);
}
