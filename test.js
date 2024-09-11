import React, { useState } from 'react';
import './style.css';

function Banner() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('<script src="https://domain.com/ad"></script>');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Hide the "Copied!" message after 2 seconds
  };

  return (
    <div className='mail-container'>
      <div className='all-apis'>
        <div className='api'>
          <div className='left'>
            <h3>Banner</h3>
            <p>
              A banner ad's appearance on a website or app can be static, scrolling, 
              or pop-up, impacting user attention and interaction.
            </p>
          </div>
          <div className='right'>
            <div className='code-ctn'>
              <div className='head'>
                <label>Page</label>
                <div className='copy-container'>
                  {copied && <span className='copied-message'>Copied!</span>}
                  <img 
                    src='https://cdn-icons-png.flaticon.com/128/1828/1828249.png' 
                    alt='Copy Icon' 
                    onClick={handleCopy}
                    className='copy-icon'
                  />
                </div>
              </div>
              <div className='codes'>
                <code>&lt;script src="https://domain.com/ad"&gt;&lt;/script&gt;</code>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Banner;


.all-apis {
  font-family: 'Poppins', sans-serif;
  color: black;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  margin: 50px auto;
}

.all-apis .api {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 30px;
}

.all-apis .left {
  width: 60%;
}

.all-apis .right {
  width: 40%;
}

.all-apis h3 {
  font-size: 24px;
  font-weight: 600;
  color: black;
  margin-bottom: 15px;
}

.all-apis p {
  font-size: 16px;
  line-height: 1.6;
  color: #555;
}

.all-apis .code-ctn {
  background: #2d3748;
  color: #ffffff;
  padding: 20px;
  border-radius: 10px;
  position: relative;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.all-apis .head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #4a5568;
  margin-bottom: 10px;
}

.all-apis .copy-container {
  position: relative;
}

.all-apis .copy-icon {
  width: 24px;
  height: 24px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.all-apis .copy-icon:hover {
  transform: scale(1.1);
}

.all-apis .copied-message {
  position: absolute;
  top: -30px;
  right: 0;
  background: #38a169;
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: bold;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.all-apis .copy-container:hover .copied-message {
  opacity: 1;
  transform: translateY(0);
}

.all-apis .codes {
  font-family: 'Courier New', Courier, monospace;
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 5px;
  font-size: 14px;
  color: #e2e8f0;
}

.all-apis .api:hover .code-ctn {
  transform: translateY(-5px);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
}

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/adTestApi.css'

const AdTestApi = () => {
    const { adId } = useParams();  // Get the adId from the route parameters
    const [ad, setAd] = useState({});
    const [embedCode, setEmbedCode] = useState('');  // Initialize embedCode as an empty string

    useEffect(() => {
        const fetchAd = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/importAds/ad/${adId}`);
                const adData = response.data;

                if (adData) {
                    setAd(adData);

                    const apiUrl = `http://localhost:5000/api/importAds/${adData._id}`;
                    const code = `
                        <script type="text/javascript">
                            (function() {
                                var script = document.createElement('script');
                                script.src = '${apiUrl}';
                                script.async = true;
                                document.body.appendChild(script);
                            })();
                        </script>
                    `;
                    // Set the generated embed code in state
                    setEmbedCode(code);
                }
            } catch (error) {
                console.error('Error fetching ad:', error);
            }
        };

        fetchAd();
    }, [adId]);  // Dependency array to trigger the effect when adId changes

    return (
        <div>
            <h1>Your Ad Embed Code</h1>
            <p>Copy and paste the following code into your website's HTML where you want the ad to appear:</p>
            <pre>
                <code>{embedCode}</code>
            </pre>
        </div>
    );
};

export default AdTestApi;
design this page AdTestApi by taking an idea from Banner's css, but they should not look the same for AdTestApi use only two colors "white color" and "black color"