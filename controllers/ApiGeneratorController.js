// ApiGeneratorController.js
exports.generateApi = async (req, res) => {
  const { categoryId, selectedSpaces, language } = req.body;

  if (!categoryId || !selectedSpaces || !language) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Function to generate API for a specific space type and category
  const generateAdScriptForSpace = (spaceType, categoryId) => {
    return `<script src="https://example.com/api/ads?space=${spaceType}&category=${categoryId}"></script>`;
  };

  let apiCode = '';

  // Loop through all the selected spaces
  Object.keys(selectedSpaces).forEach((spaceType) => {
    if (selectedSpaces[spaceType]) {  // Only generate for selected spaces
      if (language === 'HTML') {
        apiCode += `<div id="${spaceType}-ad">\n${generateAdScriptForSpace(spaceType, categoryId)}\n</div>\n`;
      } else if (language === 'JavaScript') {
        apiCode += `<script>\n(function() {\n  var ad = document.createElement('script');\n  ad.src = "https://example.com/api/ads?space=${spaceType}&category=${categoryId}";\n  document.getElementById("${spaceType}-ad").appendChild(ad);\n})();\n</script>\n`;
      } else if (language === 'PHP') {
        apiCode += `<?php echo '<div id="${spaceType}-ad"><script src="https://example.com/api/ads?space=${spaceType}&category=${categoryId}"></script></div>'; ?>\n`;
      } else if (language === 'Python') {
        apiCode += `print('<div id="${spaceType}-ad"><script src="https://example.com/api/ads?space=${spaceType}&category=${categoryId}"></script></div>')\n`;
      } else {
        apiCode += `<div id="${spaceType}-ad">Language not supported</div>\n`;
      }
    }
  });

  res.status(200).json({ apiCode });
};