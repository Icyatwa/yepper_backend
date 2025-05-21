// AdScriptController.js

const AdCategory = require('../models/AdCategoryModel');

// exports.serveAdScript = async (req, res) => {
//   try {
//     const { scriptId } = req.params;
//     const adCategory = await AdCategory.findById(scriptId)
//       .populate('websiteId')
//       .lean();
    
//     if (!adCategory) {
//       return res.status(404).send('Ad category not found');
//     }
    
//     const categoryPrice = adCategory.price;
//     const defaultLanguage = adCategory.defaultLanguage || 'english';
//     const websiteId = adCategory.websiteId._id;
//     const websiteName = adCategory.websiteId.websiteName || 'This website';
//     const categoryName = adCategory.categoryName || 'this space';
    
//     // Verify this is a valid category ID and get the price immediately
//     if (!adCategory) {
//       return res.status(404).send('// Script not found');
//     }
    
//     // Set proper content type and cache headers
//     res.setHeader('Content-Type', 'application/javascript');
//     res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
//     res.setHeader('Pragma', 'no-cache');
//     res.setHeader('Expires', '0');
    
//     // Generate the complete ad script with all functionality
//     const adScript = `
    
//     (function() {
//       const d = document,
//         _i = "${scriptId}",
//         _w = "${websiteId}",
//         _wName = "${websiteName}",
//         _cName = "${categoryName}",
//         _b = "https://yepper-backend.onrender.com/api",
//         _t = 5000,
//         _p = ${categoryPrice},
//         _l = "${defaultLanguage}";
    
//       // Create and append styles
//       const styles = \`
//         .yepper-ad-wrapper {
//           font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
//           max-width: 100%;
//           overflow: hidden;
//           box-sizing: border-box;
//         }
//         .yepper-ad-container {
//           width: 100%;
//           margin: 0 auto;
//           border-radius: 8px;
//           overflow: hidden;
//         }
//         .yepper-ad-item {
//           display: block;
//           width: 100%;
//           text-decoration: none;
//           overflow: hidden;
//         }
//         .yepper-ad-link {
//           display: block;
//           color: inherit;
//           text-decoration: none;
//         }
//         .yepper-ad-image-wrapper {
//           width: 100%;
//           overflow: hidden;
//           position: relative;
//           border-radius: 6px;
//         }
//         .yepper-ad-image {
//           width: 100%;
//           height: auto;
//           display: block;
//           transition: transform 0.3s ease;
//         }
//         .yepper-ad-text {
          
//         }
//         .yepper-ad-empty {
//           padding: 20px;
//           text-align: center;
//           background-color: rgba(23, 23, 23, 0.4);
//           backdrop-filter: blur(8px);
//           -webkit-backdrop-filter: blur(8px);
//           border-radius: 16px;
//           border: 1px solid rgba(255, 255, 255, 0.1);
//           color: currentColor;
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           justify-content: center;
//           gap: 16px;
//           transition: all 0.5s;
//           box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
//         }
//         .yepper-ad-empty:hover {
//           box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
//         }
//         .yepper-ad-empty-title {
//           font-size: 18px;
//           font-weight: bold;
//           margin-bottom: 8px;
//           opacity: 0.9;
//           letter-spacing: 0.02em;
//         }
//         .yepper-ad-empty-text {
//           font-size: 16px;
//           font-weight: bold;
//           margin-bottom: 16px;
//           opacity: 0.7;
//         }
//         .yepper-ad-empty-link {
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           padding: 10px 24px;
//           background: rgba(80, 80, 80, 0.25);
//           color: inherit;
//           text-decoration: none;
//           border-radius: 12px;
//           font-size: 14px;
//           font-weight: 500;
//           letter-spacing: 0.05em;
//           transition: all 0.3s;
//           position: relative;
//           overflow: hidden;
//           text-transform: uppercase;
//           border: 1px solid rgba(255, 255, 255, 0.15);
//         }
//         .yepper-ad-empty-link:hover {
//           background: rgba(100, 100, 100, 0.35);
//           box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
//         }
//         .yepper-lang-btn {
//           cursor: pointer;
//           transition: all 0.2s;
//           opacity: 0.7;
//         }
//         .yepper-lang-btn:hover {
//           opacity: 1;
//         }
//         .yepper-lang-btn.yepper-active {
//           opacity: 1;
//           font-weight: bold;
//         }
        
//         /* Dark mode detection and adaptations */
//         @media (prefers-color-scheme: dark) {
//           .yepper-ad-empty {
//             background-color: rgba(30, 30, 30, 0.6);
//             border-color: rgba(255, 255, 255, 0.07);
//           }
//           .yepper-ad-empty-link {
//             background: rgba(255, 255, 255, 0.1);
//             border-color: rgba(255, 255, 255, 0.1);
//           }
//           .yepper-ad-empty-link:hover {
//             background: rgba(255, 255, 255, 0.15);
//           }
//         }
        
//         /* Light mode detection and adaptations */
//         @media (prefers-color-scheme: light) {
//           .yepper-ad-empty {
//             background-color: rgba(250, 250, 250, 0.7);
//             border-color: rgba(0, 0, 0, 0.05);
//             color: #333;
//           }
//           .yepper-ad-empty-link {
//             background: rgba(0, 0, 0, 0.05);
//             border-color: rgba(0, 0, 0, 0.08);
//           }
//           .yepper-ad-empty-link:hover {
//             background: rgba(0, 0, 0, 0.08);
//           }
//         }
//       \`;
      
//       const styleEl = d.createElement('style');
//       styleEl.textContent = styles;
//       d.head.appendChild(styleEl);
      
//       // Function to insert container after the current script
//       const insertContainer = () => {
//         // Get the current script
//         let scriptEl = d.currentScript;
        
//         // Fallback for browsers that don't support currentScript
//         if (!scriptEl) {
//           const scripts = d.getElementsByTagName('script');
//           for (let i = scripts.length - 1; i >= 0; i--) {
//             if (scripts[i].src && scripts[i].src.includes('/api/ads/script/' + _i)) {
//               scriptEl = scripts[i];
//               break;
//             }
//           }
//         }
        
//         // Create container
//         const container = d.createElement('div');
//         container.className = 'yepper-ad-wrapper';
//         container.setAttribute('data-script-id', _i);
        
//         // Insert after script
//         if (scriptEl && scriptEl.parentNode) {
//           scriptEl.parentNode.insertBefore(container, scriptEl.nextSibling);
//           return container;
//         }
        
//         // Fallback: Append to body
//         d.body.appendChild(container);
//         return container;
//       };
      
//       // Function to show empty state with multiple languages
//       const showEmptyState = (container) => {
//         // Define translations
//         const translations = {
//           english: {
//             title: "Available Advertising Space",
//             price: "Price",
//             action: "Advertise Here"
//           },
//           french: {
//             title: "Espace Publicitaire Disponible",
//             price: "Prix",
//             action: "Annoncez Ici"
//           },
//           kinyarwanda: {
//             title: "Kwamamaza",
//             price: "Igiciro cy'ukwezi",
//             action: "Kanda Hano"
//           },
//           kiswahili: {
//             title: "Nafasi ya Matangazo Inapatikana",
//             price: "Bei",
//             action: "Tangaza Hapa"
//           },
//           chinese: {
//             title: "可用广告空间",
//             price: "价格",
//             action: "在此广告"
//           },
//           spanish: {
//             title: "Espacio Publicitario Disponible",
//             price: "Precio",
//             action: "Anuncie Aquí"
//           }
//         };
        
//         // Use the default language from the database first
//         let currentLang = _l;
        
//         // If browser detection is still desired as a fallback (when _l is not valid)
//         if (!translations[currentLang]) {
//           // Language detection (simplified version)
//           let userLang = navigator.language || navigator.userLanguage;
//           userLang = userLang.toLowerCase().split('-')[0];
          
//           // Map browser language to our translations
//           currentLang = 'english'; // Default fallback
//           if (userLang === 'fr') currentLang = 'french';
//           if (userLang === 'rw') currentLang = 'kinyarwanda';
//           if (userLang === 'sw') currentLang = 'kiswahili';
//           if (userLang === 'zh') currentLang = 'chinese';
//           if (userLang === 'es') currentLang = 'spanish';
//         }
        
//         // Create HTML for the empty state
//         container.innerHTML = 
//           '<div class="yepper-ad-empty backdrop-blur-md bg-gradient-to-b from-gray-800/30 to-gray-900/10 rounded-xl overflow-hidden border border-gray-200/20 transition-all duration-300">' +
//             '<div class="yepper-ad-empty-title font-bold tracking-wide"><h3>' + translations[currentLang].title + '</h3></div>' +
//             '<div class="yepper-ad-empty-text"><p>' + translations[currentLang].price + ' $' + _p + '</p></div>' +
//             '<a href="https://yepper.cc/direct-ad?websiteId=' + _w + '&categoryId=' + _i + '" class="yepper-ad-empty-link group relative overflow-hidden transition-all duration-300">' +
//               '<div class="absolute inset-0 bg-gray-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>' +
//               '<span class="relative z-10 uppercase tracking-wider">' + translations[currentLang].action + '</span>' +
//             '</a>' +
            
//             // // Language selector
//             // '<div class="yepper-ad-language-selector" style="margin-top: 12px; display: flex; flex-wrap: wrap; justify-content: center; gap: 6px;">' +
//             //   Object.keys(translations).map(lang => 
//             //     '<button class="yepper-lang-btn' + (lang === currentLang ? ' yepper-active' : '') + '" ' +
//             //     'data-lang="' + lang + '" ' +
//             //     'style="font-size: 10px; padding: 3px 6px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); ' +
//             //     'background: ' + (lang === currentLang ? 'rgba(255,255,255,0.2)' : 'transparent') + ';">' +
//             //     lang.charAt(0).toUpperCase() + lang.slice(1) +
//             //     '</button>'
//             //   ).join('') +
//             // '</div>' +
//           '</div>';
        
//         // Add event listeners to language buttons
//         const langButtons = container.querySelectorAll('.yepper-lang-btn');
//         langButtons.forEach(btn => {
//           btn.addEventListener('click', (e) => {
//             const selectedLang = e.target.dataset.lang;
            
//             // Update title, price and action button
//             container.querySelector('.yepper-ad-empty-title h3').textContent = translations[selectedLang].title;
//             container.querySelector('.yepper-ad-empty-text p').textContent = translations[selectedLang].price + ' $' + _p;
//             container.querySelector('.yepper-ad-empty-link span').textContent = translations[selectedLang].action;
            
//             // Update active button styling
//             langButtons.forEach(b => {
//               b.style.background = 'transparent';
//               b.classList.remove('yepper-active');
//             });
//             e.target.style.background = 'rgba(255,255,255,0.2)';
//             e.target.classList.add('yepper-active');
//           });
//         });
//       };
      
//       // Insert container for ads
//       const container = insertContainer();
      
//       // Fetch ads
//       fetch(_b + "/ads/display?categoryId=" + _i)
//         .then(response => response.json())
//         .then(data => {
//           if (!data || !data.html) {
//             showEmptyState(container);
//             return;
//           }
//           container.innerHTML = data.html;
//           const items = Array.from(container.getElementsByClassName("yepper-ad-item"));
          
//           if (!items.length) {
//             showEmptyState(container);
//             return;
//           }
          
//           // Hide all items except first
//           items.forEach((e, index) => {
//             if (index !== 0) e.style.display = "none";
//           });
          
//           // Track views and handle clicks
//           items.forEach(e => {
//             const link = e.querySelector('.yepper-ad-link');
//             if (!link) return;
            
//             const i = e.dataset.adId;
            
//             // Track view for visible ad
//             if (e.style.display !== "none") {
//               fetch(_b + "/ads/view/" + i, {
//                 method: 'POST',
//                 mode: 'cors',
//                 credentials: 'omit'
//               }).catch(console.error);
//             }
            
//             // Handle click
//             link.onclick = ev => {
//               ev.preventDefault();
//               fetch(_b + "/ads/click/" + i, {
//                 method: 'POST',
//                 mode: 'cors',
//                 credentials: 'omit'
//               })
//               .then(() => window.open(link.href, '_blank'))
//               .catch(() => window.open(link.href, '_blank'));
//               return false;
//             };
//           });
          
//           // Rotate ads if multiple
//           if (items.length > 1) {
//             let x = 0;
//             setInterval(() => {
//               items[x].style.display = "none";
//               x = (x + 1) % items.length;
//               items[x].style.display = "block";
              
//               // Track view for newly visible ad
//               const i = items[x].dataset.adId;
//               if (i) {
//                 fetch(_b + "/ads/view/" + i, {
//                   method: 'POST',
//                   mode: 'cors',
//                   credentials: 'omit'
//                 }).catch(console.error);
//               }
//             }, _t);
//           }
//         })
//         .catch(() => {
//           showEmptyState(container);
//         });
//     })();
    
//     `;
    
//     res.send(adScript);
//   } catch (error) {
//     console.error('Error serving ad script:', error);
//     res.status(500).send('// Error serving ad script');
//   }
// };

exports.serveAdScript = async (req, res) => {
  try {
    const { scriptId } = req.params;
    const adCategory = await AdCategory.findById(scriptId)
      .populate('websiteId')
      .lean();
    
    if (!adCategory) {
      return res.status(404).send('Ad category not found');
    }
    
    const categoryPrice = adCategory.price;
    const defaultLanguage = adCategory.defaultLanguage || 'english';
    const websiteId = adCategory.websiteId._id;
    const websiteName = adCategory.websiteId.websiteName || 'This website';
    const categoryName = adCategory.categoryName || 'this space';
    
    // Verify this is a valid category ID and get the price immediately
    if (!adCategory) {
      return res.status(404).send('// Script not found');
    }
    
    // Set proper content type and cache headers
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Generate the complete ad script with all functionality
    const adScript = `
    
    (function() {
      const d = document,
        _i = "${scriptId}",
        _w = "${websiteId}",
        _wName = "${websiteName}",
        _cName = "${categoryName}",
        _b = "https://yepper-backend.onrender.com/api",
        _t = 5000,
        _p = ${categoryPrice},
        _l = "${defaultLanguage}";
    
      // Create and append styles
      const styles = \`
        .yepper-ad-wrapper {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          max-width: 100%;
          overflow: hidden;
          box-sizing: border-box;
          margin: 20px 0;
          line-height: 1.4;
        }
        .yepper-ad-container {
          width: 100%;
          margin: 0 auto;
          border-radius: 8px;
          overflow: hidden;
        }
        
        /* Modern Adaptive Ad Design */
        .yepper-ad-item {
          display: block;
          width: 100%;
          text-decoration: none;
          overflow: hidden;
          background: #fefefe;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          color: inherit;
        }
        
        .yepper-ad-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: rgba(0, 0, 0, 0.12);
        }
        
        .yepper-ad-link {
          display: block;
          color: inherit;
          text-decoration: none;
          height: 100%;
        }
        
        .yepper-ad-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 6px 14px;
          font-size: 11px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 28px;
          letter-spacing: 0.01em;
        }
        
        .yepper-ad-header-logo {
          font-weight: 600;
          font-size: 11px;
          opacity: 0.95;
        }
        
        .yepper-ad-header-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 9px;
          font-weight: 500;
          backdrop-filter: blur(10px);
        }
        
        .yepper-ad-content {
          padding: 16px;
          background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
        }
        
        .yepper-ad-image-wrapper {
          width: 100%;
          overflow: hidden;
          position: relative;
          border-radius: 6px;
          margin-bottom: 12px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 140px;
        }
        
        .yepper-ad-image {
          width: 100%;
          height: auto;
          min-height: 140px;
          max-height: 180px;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
          filter: saturate(1.1) contrast(1.02);
        }
        
        .yepper-ad-item:hover .yepper-ad-image {
          transform: scale(1.01);
          filter: saturate(1.15) contrast(1.05);
        }
        
        .yepper-ad-business-name {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 8px 0;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          letter-spacing: -0.01em;
        }
        
        .yepper-ad-description {
          font-size: 13px;
          color: #4a5568;
          line-height: 1.5;
          margin: 0 0 14px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          opacity: 0.9;
        }
        
        .yepper-ad-cta {
          display: inline-flex;
          align-items: center;
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.01em;
          transition: all 0.2s ease;
          border: none;
          box-shadow: 0 2px 4px rgba(79, 172, 254, 0.2);
        }
        
        .yepper-ad-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
          background: linear-gradient(135deg, #4facfe 0%, #00d4fe 100%);
        }
        
        .yepper-ad-footer {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          padding: 8px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10px;
          color: #64748b;
          min-height: 24px;
        }
        
        .yepper-ad-footer-brand {
          font-weight: 500;
          color: #475569;
          opacity: 0.8;
        }
        
        .yepper-ad-footer-business {
          font-style: italic;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
          opacity: 0.7;
        }
        
        /* Dark theme adaptation */
        @media (prefers-color-scheme: dark) {
          .yepper-ad-item {
            background: #1a202c;
            border-color: rgba(255, 255, 255, 0.1);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          }
          
          .yepper-ad-item:hover {
            border-color: rgba(255, 255, 255, 0.15);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          }
          
          .yepper-ad-content {
            background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
          }
          
          .yepper-ad-header {
            background: linear-gradient(135deg, #4c51bf 0%, #553c9a 100%);
          }
          
          .yepper-ad-business-name {
            color: #e2e8f0;
          }
          
          .yepper-ad-description {
            color: #a0aec0;
          }
          
          .yepper-ad-image-wrapper {
            background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
          }
          
          .yepper-ad-footer {
            background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
            border-color: rgba(255, 255, 255, 0.08);
          }
          
          .yepper-ad-footer-brand {
            color: #cbd5e1;
          }
          
          .yepper-ad-footer-business {
            color: #a0aec0;
          }
        }
        
        /* High contrast theme */
        @media (prefers-contrast: high) {
          .yepper-ad-item {
            border-width: 2px;
            border-color: #000;
          }
          
          .yepper-ad-business-name {
            color: #000;
            font-weight: 700;
          }
          
          .yepper-ad-description {
            color: #333;
          }
          
          .yepper-ad-cta {
            background: #0066cc;
            border: 2px solid #004499;
          }
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
          .yepper-ad-wrapper {
            margin: 16px 0;
          }
          
          .yepper-ad-content {
            padding: 14px;
          }
          
          .yepper-ad-business-name {
            font-size: 15px;
          }
          
          .yepper-ad-description {
            font-size: 12px;
          }
          
          .yepper-ad-header {
            padding: 5px 12px;
            font-size: 10px;
            min-height: 26px;
          }
          
          .yepper-ad-header-logo {
            font-size: 10px;
          }
          
          .yepper-ad-header-badge {
            font-size: 8px;
            padding: 2px 6px;
          }
          
          .yepper-ad-footer {
            padding: 6px 12px;
            font-size: 9px;
            min-height: 22px;
          }
          
          .yepper-ad-cta {
            padding: 7px 14px;
            font-size: 11px;
          }
          
          .yepper-ad-image {
            min-height: 120px;
            max-height: 150px;
          }
        }
        
        @media (max-width: 480px) {
          .yepper-ad-image {
            min-height: 100px;
            max-height: 130px;
          }
          
          .yepper-ad-business-name {
            font-size: 14px;
          }
          
          .yepper-ad-description {
            font-size: 11px;
          }
          
          .yepper-ad-header {
            padding: 4px 10px;
            font-size: 9px;
            min-height: 24px;
          }
          
          .yepper-ad-header-logo {
            font-size: 9px;
          }
          
          .yepper-ad-header-badge {
            font-size: 7px;
            padding: 1px 5px;
          }
          
          .yepper-ad-footer {
            padding: 5px 10px;
            font-size: 8px;
            min-height: 20px;
          }
          
          .yepper-ad-footer-business {
            max-width: 100px;
          }
        }
        
        @media (max-width: 320px) {
          .yepper-ad-wrapper {
            margin: 12px 0;
          }
          
          .yepper-ad-content {
            padding: 12px;
          }
          
          .yepper-ad-image {
            min-height: 80px;
            max-height: 110px;
          }
          
          .yepper-ad-business-name {
            font-size: 13px;
            -webkit-line-clamp: 1;
          }
          
          .yepper-ad-description {
            font-size: 10px;
            -webkit-line-clamp: 1;
          }
          
          .yepper-ad-header {
            padding: 3px 8px;
            font-size: 8px;
            min-height: 20px;
          }
          
          .yepper-ad-header-logo {
            font-size: 8px;
          }
          
          .yepper-ad-header-badge {
            display: none;
          }
          
          .yepper-ad-footer {
            padding: 4px 8px;
            font-size: 7px;
            min-height: 18px;
          }
          
          .yepper-ad-footer-business {
            max-width: 80px;
          }
          
          .yepper-ad-cta {
            padding: 6px 12px;
            font-size: 10px;
          }
        }
        
        /* Enhanced Empty State with Adaptive Colors */
        .yepper-ad-empty {
          padding: 24px 20px;
          text-align: center;
          background: linear-gradient(135deg, rgba(79, 172, 254, 0.08) 0%, rgba(0, 242, 254, 0.08) 100%);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(79, 172, 254, 0.2);
          color: currentColor;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(79, 172, 254, 0.1);
          position: relative;
          overflow: hidden;
        }
        
        .yepper-ad-empty::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.5s ease;
        }
        
        .yepper-ad-empty:hover::before {
          left: 100%;
        }
        
        .yepper-ad-empty:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(79, 172, 254, 0.15);
          border-color: rgba(79, 172, 254, 0.3);
        }
        
        .yepper-ad-empty-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 4px;
          opacity: 0.9;
          letter-spacing: -0.01em;
          color: #2d3748;
        }
        
        .yepper-ad-empty-text {
          font-size: 15px;
          font-weight: 500;
          margin-bottom: 16px;
          opacity: 0.7;
          color: #4a5568;
        }
        
        .yepper-ad-empty-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 24px;
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.01em;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          border: none;
          box-shadow: 0 2px 8px rgba(79, 172, 254, 0.3);
        }
        
        .yepper-ad-empty-link:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4);
          background: linear-gradient(135deg, #4facfe 0%, #00d4fe 100%);
        }
        
        /* Dark mode for empty state */
        @media (prefers-color-scheme: dark) {
          .yepper-ad-empty {
            background: linear-gradient(135deg, rgba(76, 81, 191, 0.15) 0%, rgba(85, 60, 154, 0.15) 100%);
            border-color: rgba(124, 58, 237, 0.3);
            box-shadow: 0 2px 8px rgba(124, 58, 237, 0.2);
          }
          
          .yepper-ad-empty:hover {
            border-color: rgba(124, 58, 237, 0.4);
            box-shadow: 0 8px 25px rgba(124, 58, 237, 0.25);
          }
          
          .yepper-ad-empty-title {
            color: #e2e8f0;
          }
          
          .yepper-ad-empty-text {
            color: #a0aec0;
          }
          
          .yepper-ad-empty-link {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
          }
          
          .yepper-ad-empty-link:hover {
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
          }
        }
        
        /* Reduced motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .yepper-ad-item,
          .yepper-ad-image,
          .yepper-ad-cta,
          .yepper-ad-empty,
          .yepper-ad-empty-link {
            transition: none;
          }
          
          .yepper-ad-item:hover,
          .yepper-ad-empty:hover {
            transform: none;
          }
          
          .yepper-ad-empty::before {
            display: none;
          }
        }
      \`;
      
      const styleEl = d.createElement('style');
      styleEl.textContent = styles;
      d.head.appendChild(styleEl);
      
      // Function to insert container after the current script
      const insertContainer = () => {
        // Get the current script
        let scriptEl = d.currentScript;
        
        // Fallback for browsers that don't support currentScript
        if (!scriptEl) {
          const scripts = d.getElementsByTagName('script');
          for (let i = scripts.length - 1; i >= 0; i--) {
            if (scripts[i].src && scripts[i].src.includes('/api/ads/script/' + _i)) {
              scriptEl = scripts[i];
              break;
            }
          }
        }
        
        // Create container
        const container = d.createElement('div');
        container.className = 'yepper-ad-wrapper';
        container.setAttribute('data-script-id', _i);
        
        // Insert after script
        if (scriptEl && scriptEl.parentNode) {
          scriptEl.parentNode.insertBefore(container, scriptEl.nextSibling);
          return container;
        }
        
        // Fallback: Append to body
        d.body.appendChild(container);
        return container;
      };
      
      // Function to show empty state with multiple languages
      const showEmptyState = (container) => {
        // Define translations
        const translations = {
          english: {
            title: "Available Advertising Space",
            price: "Price",
            action: "Advertise Here"
          },
          french: {
            title: "Espace Publicitaire Disponible",
            price: "Prix",
            action: "Annoncez Ici"
          },
          kinyarwanda: {
            title: "Kwamamaza",
            price: "Igiciro cy'ukwezi",
            action: "Kanda Hano"
          },
          kiswahili: {
            title: "Nafasi ya Matangazo Inapatikana",
            price: "Bei",
            action: "Tangaza Hapa"
          },
          chinese: {
            title: "可用广告空间",
            price: "价格",
            action: "在此广告"
          },
          spanish: {
            title: "Espacio Publicitario Disponible",
            price: "Precio",
            action: "Anuncie Aquí"
          }
        };
        
        // Use the default language from the database first
        let currentLang = _l;
        
        // If browser detection is still desired as a fallback (when _l is not valid)
        if (!translations[currentLang]) {
          // Language detection (simplified version)
          let userLang = navigator.language || navigator.userLanguage;
          userLang = userLang.toLowerCase().split('-')[0];
          
          // Map browser language to our translations
          currentLang = 'english'; // Default fallback
          if (userLang === 'fr') currentLang = 'french';
          if (userLang === 'rw') currentLang = 'kinyarwanda';
          if (userLang === 'sw') currentLang = 'kiswahili';
          if (userLang === 'zh') currentLang = 'chinese';
          if (userLang === 'es') currentLang = 'spanish';
        }
        
        // Create HTML for the empty state
        container.innerHTML = 
          '<div class="yepper-ad-empty">' +
            '<div class="yepper-ad-empty-title"><h3>' + translations[currentLang].title + '</h3></div>' +
            '<div class="yepper-ad-empty-text"><p>' + translations[currentLang].price + ' $' + _p + '</p></div>' +
            '<a href="https://yepper.cc/direct-ad?websiteId=' + _w + '&categoryId=' + _i + '" class="yepper-ad-empty-link">' +
              '<span>' + translations[currentLang].action + '</span>' +
            '</a>' +
          '</div>';
      };
      
      // Insert container for ads
      const container = insertContainer();
      
      // Fetch ads
      fetch(_b + "/ads/display?categoryId=" + _i)
        .then(response => response.json())
        .then(data => {
          if (!data || !data.html) {
            showEmptyState(container);
            return;
          }
          container.innerHTML = data.html;
          const items = Array.from(container.getElementsByClassName("yepper-ad-item"));
          
          if (!items.length) {
            showEmptyState(container);
            return;
          }
          
          // Hide all items except first
          items.forEach((e, index) => {
            if (index !== 0) e.style.display = "none";
          });
          
          // Track views and handle clicks
          items.forEach(e => {
            const link = e.querySelector('.yepper-ad-link');
            if (!link) return;
            
            const i = e.dataset.adId;
            
            // Track view for visible ad
            if (e.style.display !== "none") {
              fetch(_b + "/ads/view/" + i, {
                method: 'POST',
                mode: 'cors',
                credentials: 'omit'
              }).catch(console.error);
            }
            
            // Handle click
            link.onclick = ev => {
              ev.preventDefault();
              fetch(_b + "/ads/click/" + i, {
                method: 'POST',
                mode: 'cors',
                credentials: 'omit'
              })
              .then(() => window.open(link.href, '_blank'))
              .catch(() => window.open(link.href, '_blank'));
              return false;
            };
          });
          
          // Rotate ads if multiple
          if (items.length > 1) {
            let x = 0;
            setInterval(() => {
              items[x].style.display = "none";
              x = (x + 1) % items.length;
              items[x].style.display = "block";
              
              // Track view for newly visible ad
              const i = items[x].dataset.adId;
              if (i) {
                fetch(_b + "/ads/view/" + i, {
                  method: 'POST',
                  mode: 'cors',
                  credentials: 'omit'
                }).catch(console.error);
              }
            }, _t);
          }
        })
        .catch(() => {
          showEmptyState(container);
        });
    })();
    
    `;
    
    res.send(adScript);
  } catch (error) {
    console.error('Error serving ad script:', error);
    res.status(500).send('// Error serving ad script');
  }
};