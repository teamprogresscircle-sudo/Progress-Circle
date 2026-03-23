const axios = require('axios');

// @desc    Resolve a short link (like open.anghami.com or spotify.link) to its final URL
// @route   GET /api/integration/resolve-url
// @access  Private
exports.resolveUrl = async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ success: false, message: 'URL is required' });
    }

    try {
        // Follow redirects to get the final URL
        const response = await axios.get(url, {
            maxRedirects: 10,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        const finalUrl = response.request.res.responseUrl || url;

        res.status(200).json({
            success: true,
            data: {
                originalUrl: url,
                resolvedUrl: finalUrl
            }
        });
    } catch (error) {
        // Even if it fails, it might be due to CORS on the redirect or similar, 
        // but often response.request.res.responseUrl is available in the error if it's a redirect-related error.
        const finalUrl = error.request?.res?.responseUrl || url;
        
        res.status(200).json({
            success: true,
            data: {
                originalUrl: url,
                resolvedUrl: finalUrl
            }
        });
    }
};
