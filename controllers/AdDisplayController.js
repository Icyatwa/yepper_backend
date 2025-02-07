// // AdDisplayController.js
// const AdCategory = require('../models/AdCategoryModel');
// const ImportAd = require('../models/ImportAdModel');

// exports.displayAd = async (req, res) => {
//   try {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
//     res.header('Access-Control-Allow-Headers', 'Content-Type');
    
//     const { categoryId, callback } = req.query;

//     const adCategory = await AdCategory.findById(categoryId);
//     if (!adCategory) {
//       return sendNoAdsResponse(res, callback);
//     }

//     const ads = await ImportAd.find({
//       _id: { $in: adCategory.selectedAds },
//       'websiteSelections': {
//         $elemMatch: {
//           websiteId: adCategory.websiteId,
//           categories: categoryId,
//           approved: true
//         }
//       },
//       'confirmed': true
//     });

//     if (!ads || ads.length === 0) {
//       return sendNoAdsResponse(res, callback);
//     }

//     const adsToShow = ads.slice(0, adCategory.userCount || ads.length);

//     const adsHtml = adsToShow
//       .map((ad) => {
//         if (!ad) return '';

//         try {
//           const websiteSelection = ad.websiteSelections.find(
//             sel => sel.websiteId.toString() === adCategory.websiteId.toString() &&
//                   sel.approved
//           );

//           if (!websiteSelection) {
//             return '';
//           }

//           const imageUrl = ad.imageUrl || 'https://via.placeholder.com/600x300';
//           const targetUrl = ad.businessLink.startsWith('http') ? 
//             ad.businessLink : `https://${ad.businessLink}`;

//           return `
//             <div class="ad-container" style="margin: 10px 0;">
//               <a href="${targetUrl}" class="ad" data-ad-id="${ad._id}" style="text-decoration: none; color: inherit; display: block;">
//                 <img src="${imageUrl}" alt="${ad.businessName}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;">
//                 <p style="margin: 5px 0; text-align: center;">Sponsored by ${ad.businessName}</p>
//               </a>
//             </div>
//           `;
//         } catch (err) {
//           console.error('[AdDisplay] Error generating HTML for ad:', ad._id, err);
//           return '';
//         }
//       })
//       .filter(html => html)
//       .join('');

//     if (!adsHtml) {
//       return sendNoAdsResponse(res, callback);
//     }

//     if (callback) {
//       res.set('Content-Type', 'application/javascript');
//       const response = `${callback}(${JSON.stringify({ html: adsHtml })})`;
//       return res.send(response);
//     }

//     return res.send(adsHtml);

//   } catch (error) {
//     console.error('[AdDisplay] Critical error:', error);
//     return sendNoAdsResponse(res, callback);
//   }
// };

// function sendNoAdsResponse(res, callback) {
//   const noAdsHtml = `
//     <div style="
//       border: 2px dashed #e2e8f0;
//       border-radius: 8px;
//       padding: 20px;
//       text-align: center;
//       background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
//       font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
//       max-width: 100%;
//       margin: 10px auto;
//       box-shadow: 0 2px 4px rgba(0,0,0,0.05);
//     ">
//       <div style="
//         font-size: 18px;
//         color: #475569;
//         margin-bottom: 12px;
//         font-weight: 600;
//       ">
//         Available Space for Advertising
//       </div>
//       <div style="
//         font-size: 14px;
//         color: #64748b;
//         margin-bottom: 16px;
//         line-height: 1.5;
//       ">
//         This space is available for your business advertisement
//       </div>
//       <a href="https://www.yepper.cc/select" 
//          target="_blank"
//          style="
//            display: inline-block;
//            background-color: #3b82f6;
//            color: white;
//            padding: 10px 24px;
//            border-radius: 6px;
//            text-decoration: none;
//            font-weight: 500;
//            font-size: 14px;
//            transition: background-color 0.2s;
//            box-shadow: 0 2px 4px rgba(59,130,246,0.2);
//          "
//          onmouseover="this.style.backgroundColor='#2563eb'"
//          onmouseout="this.style.backgroundColor='#3b82f6'"
//       >
//         Advertise Here
//       </a>
//     </div>
//   `;

//   if (callback) {
//     res.set('Content-Type', 'application/javascript');
//     const response = `${callback}(${JSON.stringify({ html: noAdsHtml })})`;
//     return res.send(response);
//   }

//   return res.send(noAdsHtml);
// }

// exports.incrementView = async (req, res) => {
//   try {
//     const { adId } = req.params;
    
//     if (!adId) {
//       return res.status(400).json({ error: 'Ad ID is required' });
//     }

//     const updatedAd = await ImportAd.findByIdAndUpdate(
//       adId, 
//       { $inc: { views: 1 } },
//       { new: true, select: 'views' }
//     );

//     if (!updatedAd) {
//       return res.status(404).json({ error: 'Ad not found' });
//     }

//     return res.status(200).json({ views: updatedAd.views });
//   } catch (error) {
//     console.error('Error recording view:', error);
//     return res.status(500).json({ error: 'Failed to record view' });
//   }
// };

// exports.incrementClick = async (req, res) => {
//   try {
//     const { adId } = req.params;
    
//     if (!adId) {
//       return res.status(400).json({ error: 'Ad ID is required' });
//     }

//     const updatedAd = await ImportAd.findByIdAndUpdate(
//       adId, 
//       { $inc: { clicks: 1 } },
//       { new: true, select: 'clicks' }
//     );

//     if (!updatedAd) {
//       return res.status(404).json({ error: 'Ad not found' });
//     }

//     return res.status(200).json({ clicks: updatedAd.clicks });
//   } catch (error) {
//     console.error('Error recording click:', error);
//     return res.status(500).json({ error: 'Failed to record click' });
//   }
// };




// AdDisplayController.js
const AdCategory = require('../models/AdCategoryModel');
const ImportAd = require('../models/ImportAdModel');
const PaymentTracker = require('../models/PaymentTracker');

exports.displayAd = async (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    const { categoryId, callback } = req.query;
    
    const adCategory = await AdCategory.findById(categoryId);
    if (!adCategory) {
      return sendNoAdsResponse(res, callback);
    }

    // Base styles that will be injected with each ad
    const styles = `
      .yepper-ad-wrapper {
        width: 100%;
        max-width: 300px;
        background: #ffffff;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, sans-serif;
      }

      .yepper-ad-container {
        width: 100%;
      }

      .yepper-ad-item {
        width: 100%;
        padding: 12px;
        transition: all 0.3s ease;
      }

      .yepper-ad-link {
        text-decoration: none;
        color: inherit;
        display: block;
      }

      .yepper-ad-image-wrapper {
        width: 100%;
        position: relative;
        padding-top: 56.25%;
        overflow: hidden;
        border-radius: 6px;
        background: #f8f8f8;
      }

      .yepper-ad-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }

      .yepper-ad-link:hover .yepper-ad-image {
        transform: scale(1.05);
      }

      .yepper-ad-text {
        margin-top: 10px;
        font-size: 14px;
        color: #333;
        line-height: 1.4;
        text-align: left;
        font-weight: 500;
      }

      .yepper-ad-empty {
        padding: 2rem;
        text-align: center;
        background: linear-gradient(145deg, #ffffff, #f8f9fa);
        min-height: 200px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 1rem;
      }

      .yepper-ad-empty-title {
        font-size: clamp(1.125rem, 4vw, 1.25rem);
        font-weight: 700;
        color: #2d3748;
        margin: 0;
        line-height: 1.2;
      }

      .yepper-ad-empty-text {
        font-size: clamp(0.875rem, 3vw, 1rem);
        color: #718096;
        margin: 0;
        line-height: 1.5;
        max-width: 24ch;
      }

      .yepper-ad-empty-link {
        display: inline-block;
        padding: 0.75rem 1.5rem;
        background: orangered;
        color: #fff;
        border-radius: 8px;
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 600;
        transition: all 0.2s ease;
        border: none;
        cursor: pointer;
        margin-top: 0.5rem;
      }

      .yepper-ad-empty-link:hover {
        background: #e63e00;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(255, 69, 0, 0.2);
      }

      .yepper-ad-empty-link:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(255, 69, 0, 0.2);
      }

      @media (max-width: 320px) {
        .yepper-ad-empty {
          padding: 1.5rem;
          min-height: 180px;
        }
        
        .yepper-ad-empty-link {
          padding: 0.625rem 1.25rem;
        }
      }
    `;

    const styleTag = `<style>${styles}</style>`;

    const ads = await ImportAd.find({
      _id: { $in: adCategory.selectedAds },
      'websiteSelections': {
        $elemMatch: {
          websiteId: adCategory.websiteId,
          categories: categoryId,
          approved: true
        }
      },
      'confirmed': true
    });

    if (!ads || ads.length === 0) {
      return sendNoAdsResponse(res, callback);
    }

    const adsToShow = ads.slice(0, adCategory.userCount || ads.length);

    const adsHtml = adsToShow
      .map((ad) => {
        if (!ad) return '';

        try {
          const websiteSelection = ad.websiteSelections.find(
            sel => sel.websiteId.toString() === adCategory.websiteId.toString() &&
                  sel.approved
          );

          if (!websiteSelection) return '';

          const imageUrl = ad.imageUrl || 'https://via.placeholder.com/600x300';
          const targetUrl = ad.businessLink.startsWith('http') ? 
            ad.businessLink : `https://${ad.businessLink}`;

          return `
            <div class="yepper-ad-item" data-ad-id="${ad._id}">
              <a href="${targetUrl}" class="yepper-ad-link" target="_blank" rel="noopener">
                <div class="yepper-ad-image-wrapper">
                  <img class="yepper-ad-image" src="${imageUrl}" alt="${ad.businessName}" loading="lazy">
                </div>
                <p class="yepper-ad-text">${ad.businessName}</p>
              </a>
            </div>
          `;
        } catch (err) {
          console.error('[AdDisplay] Error generating HTML for ad:', ad._id, err);
          return '';
        }
      })
      .filter(html => html)
      .join('');

    if (!adsHtml) {
      return sendNoAdsResponse(res, callback);
    }

    const finalHtml = `${styleTag}<div class="yepper-ad-container">${adsHtml}</div>`;

    if (callback) {
      res.set('Content-Type', 'application/javascript');
      const response = `${callback}(${JSON.stringify({ html: finalHtml })})`;
      return res.send(response);
    }

    return res.send(finalHtml);

  } catch (error) {
    console.error('[AdDisplay] Critical error:', error);
    return sendNoAdsResponse(res, callback);
  }
};

function sendNoAdsResponse(res, callback) {
  const noAdsHtml = `
    <div class="yepper-ad-container">
      <div class="yepper-ad-empty">
        <div class="yepper-ad-empty-title">Available Advertising Space</div>
        <div class="yepper-ad-empty-text">Premium spot for your business advertisement</div>
        <a href="https://yepper.cc/select" class="yepper-ad-empty-link">Advertise Here</a>
      </div>
    </div>
  `;

  if (callback) {
    res.set('Content-Type', 'application/javascript');
    const response = `${callback}(${JSON.stringify({ html: noAdsHtml })})`;
    return res.send(response);
  }

  return res.send(noAdsHtml);
}

exports.incrementView = async (req, res) => {
  try {
    const { adId } = req.params;
    
    if (!adId) {
      return res.status(400).json({ error: 'Ad ID is required' });
    }

    // Increment views on the ad
    const updatedAd = await ImportAd.findByIdAndUpdate(
      adId, 
      { $inc: { views: 1 } },
      { new: true, select: 'views' }
    )

    // Update the payment tracker's view count
    await PaymentTracker.updateOne(
      { adId },
      { $inc: { currentViews: 1 } }
    )

    if (!updatedAd) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    return res.status(200).json({ views: updatedAd.views });

  } catch (error) {
    return res.status(500).json({ error: 'Failed to increment view count' });
  }
};

exports.incrementClick = async (req, res) => {
  try {
    const { adId } = req.params;
    
    if (!adId) {
      return res.status(400).json({ error: 'Ad ID is required' });
    }

    const updatedAd = await ImportAd.findByIdAndUpdate(
      adId, 
      { $inc: { clicks: 1 } },
      { new: true, select: 'clicks' }
    );

    if (!updatedAd) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    return res.status(200).json({ clicks: updatedAd.clicks });
  } catch (error) {
    console.error('Error recording click:', error);
    return res.status(500).json({ error: 'Failed to record click' });
  }
};