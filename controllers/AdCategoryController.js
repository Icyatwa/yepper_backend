// // AdCategoryController.js
// const AdCategory = require('../models/AdCategoryModel');

// exports.createCategory = async (req, res) => {
//   try {
//     const { ownerId, websiteId, categoryName, description, price, customAttributes } = req.body;

//     if (!websiteId) {
//       return res.status(400).json({ message: 'Website ID is required' });
//     }

//     const newCategory = new AdCategory({
//       ownerId,
//       websiteId,  // Associate the category with the website
//       categoryName,
//       description,
//       price,
//       customAttributes: customAttributes || {}
//     });

//     const savedCategory = await newCategory.save();
//     res.status(201).json(savedCategory);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to create category', error });
//   }
// };

// AdCategoryController.js
const AdCategory = require('../models/AdCategoryModel');

const generateSecureScript = (categoryId) => {
  const baseCode = `
    (function(){
      const d=document,
            _i="${categoryId}",
            _b="${process.env.BASE_URL || 'http://localhost:5000'}/api", // Make URL configurable
            _t=5000;

      const _l=()=>{
        const c=d.createElement("div");
        c.id=_i+"-ad";
        c.style.width = "100%";
        c.style.minHeight = "100px";
        
        let s=d.currentScript;
        if(!s){
          const scripts=d.getElementsByTagName("script");
          for(let i=0;i<scripts.length;i++){
            if(scripts[i].textContent.includes("${categoryId}")){
              s=scripts[i];
              break;
            }
          }
        }
        
        if(s&&s.parentNode){
          s.parentNode.insertBefore(c,s);
        }else{
          d.body.appendChild(c);
        }
        c.innerHTML = '<div style="text-align: center; padding: 20px;">Loading ad...</div>';
        
        const l=d.createElement("script");
        const r="y"+Math.random().toString(36).substr(2,9);
        
        window[r]=h=>{
          if(!h||!h.html) {
            c.innerHTML = '<div style="text-align: center; padding: 20px;">No ads available</div>';
            return;
          }
          c.innerHTML=h.html;
          const a=[...c.getElementsByClassName("ad-container")];
          if(!a.length) {
            c.innerHTML = '<div style="text-align: center; padding: 20px;">Error loading ads</div>';
            return;
          }

          a.forEach(e=>e.style.display="none");
          a[0].style.display="block";
          
          a.forEach(e=>{
            const link=e.querySelector('a');
            if(!link)return;
            const i=link.dataset.adId;
            
            // Modified view tracking
            const viewTracker = () => {
              fetch(_b+"/ads/view/"+i, {
                method: 'POST',
                mode: 'cors',
                credentials: 'omit'
              }).catch(console.error);
            };
            
            if(e.style.display !== "none") {
              viewTracker();
            }
            
            // Modified click tracking
            link.onclick=ev=>{
              ev.preventDefault();
              fetch(_b+"/ads/click/"+i, {
                method: 'POST',
                mode: 'cors',
                credentials: 'omit'
              })
              .then(() => window.open(link.href,'_blank'))
              .catch(() => window.open(link.href,'_blank'));
              return false;
            };
          });

          if(a.length>1) {
            let x=0;
            setInterval(()=>{
              a[x].style.display="none";
              x=(x+1)%a.length;
              a[x].style.display="block";
              const link=a[x].querySelector('a');
              if(link) {
                const i=link.dataset.adId;
                fetch(_b+"/ads/view/"+i, {
                  method: 'POST',
                  mode: 'cors',
                  credentials: 'omit'
                }).catch(console.error);
              }
            },_t);
          }
          delete window[r];
        };
        
        l.src=_b+"/ads/display?categoryId="+_i+"&callback="+r;
        l.onerror = () => {
          c.innerHTML = '<div style="text-align: center; padding: 20px;">Failed to load ad content</div>';
        };
        d.body.appendChild(l);
      };

      if(d.readyState==="loading"){
        d.addEventListener("DOMContentLoaded",_l);
      }else{
        _l();
      }
    })();
  `;

  return baseCode;
};

exports.createCategory = async (req, res) => {
  try {
    const { 
      ownerId, 
      websiteId, 
      categoryName, 
      description, 
      price, 
      customAttributes,
      spaceType,
      userCount,
      instructions,
      webOwnerEmail 
    } = req.body;

    if (!ownerId || !websiteId || !categoryName || !price || !spaceType || !webOwnerEmail) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newCategory = new AdCategory({
      ownerId,
      websiteId,
      categoryName,
      description,
      price,
      spaceType,
      userCount: userCount || 0,
      instructions,
      customAttributes: customAttributes || {},
      webOwnerEmail,
      selectedAds: []
    });

    const savedCategory = await newCategory.save();
    const secureScript = generateSecureScript(savedCategory._id.toString());

    savedCategory.apiCodes = {
      HTML: `<script>\n${secureScript}\n</script>`,
      JavaScript: secureScript,
      PHP: `<?php echo '<script>\n${secureScript}\n</script>'; ?>`,
      Python: `print('<script>\n${secureScript}\n</script>')`
    };

    const finalCategory = await savedCategory.save();
    res.status(201).json(finalCategory);

  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ 
      message: 'Failed to create category', 
      error: error.message 
    });
  }
};

exports.getCategories = async (req, res) => {
  const { ownerId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    const categories = await AdCategory.find({ ownerId })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await AdCategory.countDocuments({ ownerId });

    res.status(200).json({
      categories,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories', error });
  }
};

exports.getCategoriesByWebsite = async (req, res) => {
  const { websiteId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    const categories = await AdCategory.find({ websiteId })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await AdCategory.countDocuments({ websiteId });

    res.status(200).json({
      categories,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories', error });
  }
};

exports.getCategoryById = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const category = await AdCategory.findById(categoryId);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch category', error });
  }
};