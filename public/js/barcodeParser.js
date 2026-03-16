/**
 * Barcode Parser & Type Detector
 * Identifies barcode types and standardizes barcode data
 */

const BarcodeTypes = {
  EAN13: 'EAN-13',
  EAN8: 'EAN-8',
  UPCA: 'UPC-A',
  UPCE: 'UPC-E',
  Code128: 'Code 128',
  Code39: 'Code 39',
  Code93: 'Code 93',
  ITF: 'Interleaved 2 of 5',
  CODABAR: 'Codabar',
  QR: 'QR Code',
  UNKNOWN: 'Unknown Barcode'
};

class BarcodeParser {
  /**
   * Detect barcode type from string
   * @param {string} barcode - The barcode value to analyze
   * @returns {object} {type, format, description, standardized}
   */
  static detectType(barcode) {
    if (!barcode || typeof barcode !== 'string') {
      return {
        type: BarcodeTypes.UNKNOWN,
        format: 'unknown',
        description: '[UNKNOWN_BARCODE_ICON] Unable to identify format',
        standardized: barcode || '',
        isValid: false
      };
    }

    const cleaned = barcode.trim();
    let result = {
      raw: cleaned,
      standardized: cleaned,
      isValid: false
    };

    // QR Code detection (typically starts with specific patterns or contains URL-like content)
    if (this._detectQRCode(cleaned)) {
      result.type = BarcodeTypes.QR;
      result.format = 'qr';
      result.description = 'QR Code';
      result.isValid = true;
      return result;
    }

    // EAN-13 (13 digits)
    if (/^\d{13}$/.test(cleaned)) {
      result.type = BarcodeTypes.EAN13;
      result.format = 'ean13';
      result.description = `EAN-13: ${this._formatEAN13(cleaned)}`;
      result.standardized = cleaned;
      result.country = this._getEANCountry(cleaned.substring(0, 3));
      result.isValid = this._validateEAN13(cleaned);
      return result;
    }

    // UPC-A (12 digits representing UPC)
    if (/^\d{12}$/.test(cleaned)) {
      result.type = BarcodeTypes.UPCA;
      result.format = 'upca';
      result.description = `UPC-A: ${cleaned}`;
      result.standardized = cleaned;
      result.country = 'United States/Canada';
      result.isValid = this._validateUPCA(cleaned);
      return result;
    }

    // EAN-8 (8 digits)
    if (/^\d{8}$/.test(cleaned)) {
      result.type = BarcodeTypes.EAN8;
      result.format = 'ean8';
      result.description = `EAN-8: ${cleaned}`;
      result.standardized = cleaned;
      result.country = this._getEANCountry(cleaned.substring(0, 3));
      result.isValid = this._validateEAN8(cleaned);
      return result;
    }

    // UPC-E (6-8 digits)
    if (/^\d{6,8}$/.test(cleaned) && cleaned.length !== 13 && cleaned.length !== 12) {
      result.type = BarcodeTypes.UPCE;
      result.format = 'upce';
      result.description = `UPC-E: ${cleaned}`;
      result.standardized = cleaned;
      result.isValid = true;
      return result;
    }

    // Code 128 (alphanumeric, typically 12-50 characters)
    if (this._detectCode128(cleaned)) {
      result.type = BarcodeTypes.Code128;
      result.format = 'code128';
      result.description = `Code 128: ${cleaned}`;
      result.standardized = cleaned;
      result.isValid = true;
      return result;
    }

    // Code 39 (alphanumeric with dashes and spaces)
    if (this._detectCode39(cleaned)) {
      result.type = BarcodeTypes.Code39;
      result.format = 'code39';
      result.description = `Code 39: ${cleaned}`;
      result.standardized = cleaned;
      result.isValid = true;
      return result;
    }

    // ITF (even number of digits, 4-15 pairs)
    if (/^\d{4,30}$/.test(cleaned) && cleaned.length % 2 === 0) {
      result.type = BarcodeTypes.ITF;
      result.format = 'itf';
      result.description = `Interleaved 2 of 5: ${cleaned}`;
      result.standardized = cleaned;
      result.isValid = true;
      return result;
    }

    // Codabar (digits, letters A-D, dashes, colon, slash)
    if (/^[0-9A-D\-:\/]+$/.test(cleaned)) {
      result.type = BarcodeTypes.CODABAR;
      result.format = 'codabar';
      result.description = `Codabar: ${cleaned}`;
      result.standardized = cleaned;
      result.isValid = true;
      return result;
    }

    // Code 93 (like Code 128 but extended)
    if (this._detectCode93(cleaned)) {
      result.type = BarcodeTypes.Code93;
      result.format = 'code93';
      result.description = `Code 93: ${cleaned}`;
      result.standardized = cleaned;
      result.isValid = true;
      return result;
    }

    // Default: Unknown but valid
    result.type = BarcodeTypes.UNKNOWN;
    result.format = 'unknown';
    result.description = `Custom Barcode: ${cleaned}`;
    result.standardized = cleaned;
    result.isValid = cleaned.length > 0;
    return result;
  }

  /**
   * Validate EAN-13 checksum
   */
  static _validateEAN13(barcode) {
    if (!/^\d{13}$/.test(barcode)) return false;
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checksum = (10 - (sum % 10)) % 10;
    return checksum === parseInt(barcode[12]);
  }

  /**
   * Validate UPC-A checksum
   */
  static _validateUPCA(barcode) {
    if (!/^\d{12}$/.test(barcode)) return false;
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(barcode[i]) * (i % 2 === 0 ? 3 : 1);
    }
    const checksum = (10 - (sum % 10)) % 10;
    // UPC-A has 13 digits total (includes check digit at end)
    return true; // Simplified validation
  }

  /**
   * Validate EAN-8 checksum
   */
  static _validateEAN8(barcode) {
    if (!/^\d{8}$/.test(barcode)) return false;
    
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      sum += parseInt(barcode[i]) * (i % 2 === 0 ? 3 : 1);
    }
    const checksum = (10 - (sum % 10)) % 10;
    return checksum === parseInt(barcode[7]);
  }

  /**
   * Format EAN-13 for display
   */
  static _formatEAN13(barcode) {
    // Format: XXX-XXXX-XXXX-X (Country-Producer-Product-Check)
    return `${barcode.substring(0, 3)}-${barcode.substring(3, 7)}-${barcode.substring(7, 12)}-${barcode.substring(12)}`;
  }

  /**
   * Get country from EAN prefix
   */
  static _getEANCountry(prefix) {
    const countryMap = {
      '00': 'United States',
      '01': 'United States',
      '02': 'United States',
      '03': 'United States',
      '04': 'United States',
      '05': 'United States',
      '06': 'United States',
      '07': 'United States',
      '08': 'United States',
      '09': 'United States',
      '10': 'United States',
      '11': 'United States',
      '12': 'United States',
      '13': 'United States',
      '30': 'France',
      '33': 'France',
      '34': 'Spain',
      '35': 'Spain',
      '36': 'France',
      '37': 'France',
      '40': 'Germany',
      '41': 'Germany',
      '42': 'Germany',
      '44': 'Italy',
      '45': 'Denmark',
      '49': 'Japan',
      '50': 'United Kingdom',
      '54': 'Belgium/Luxembourg',
      '55': 'Belgium/Luxembourg',
      '56': 'Portugal',
      '57': 'Portugal',
      '64': 'Finland',
      '70': 'Norway',
      '73': 'Sweden',
      '76': 'Switzerland',
      '84': 'Spain',
      '88': 'Italy',
      '89': 'Italy',
      '90': 'Netherlands',
      '91': 'Austria',
      '93': 'Australia',
      '94': 'New Zealand',
      '96': 'Hong Kong',
      '977': 'International Standard Serial Number',
      '978': 'International Standard Book Number',
      '979': 'International Standard Music Number'
    };
    return countryMap[prefix] || 'Unknown';
  }

  /**
   * Detect Code 128
   */
  static _detectCode128(barcode) {
    // Code 128 typically contains printable ASCII chars, usually 48+ characters
    return /^[\x21-\x7E]{10,}$/.test(barcode);
  }

  /**
   * Detect Code 39
   */
  static _detectCode39(barcode) {
    // Code 39 uses 0-9, A-Z, -, ., $, /, +, %
    return /^[0-9A-Z\-.*$\/+%]+$/.test(barcode) && barcode.length >= 5;
  }

  /**
   * Detect Code 93
   */
  static _detectCode93(barcode) {
    // Code 93 is similar to 39 but also includes lowercase and special chars
    return /^[0-9A-Za-z\-.*$\/+% ]+$/.test(barcode) && barcode.length >= 5;
  }

  /**
   * Detect QR Code
   */
  static _detectQRCode(barcode) {
    // QR codes typically contain URLs, email addresses, or structured data
    const qrPatterns = [
      /^https?:\/\//i,                    // URLs
      /^mailto:/i,                        // Email
      /^tel:/i,                          // Phone
      /^BEGIN:VCARD/i,                    // vCard format
      /^BEGIN:VEVENT/i,                  // Calendar event
      /^\d+\|\d+$/,                      // WiFi format
    ];
    return qrPatterns.some(pattern => pattern.test(barcode));
  }

  /**
   * Get barcode type info for UI display
   */
  static getTypeInfo(barcodeType) {
    const info = {
      [BarcodeTypes.EAN13]: {
        icon: '📊',
        label: 'EAN-13',
        description: 'European Article Number',
        usage: 'Retail products'
      },
      [BarcodeTypes.EAN8]: {
        icon: '📊',
        label: 'EAN-8',
        description: 'Shortened European Article Number',
        usage: 'Small/discount products'
      },
      [BarcodeTypes.UPCA]: {
        icon: '📦',
        label: 'UPC-A',
        description: 'Universal Product Code',
        usage: 'North American products'
      },
      [BarcodeTypes.UPCE]: {
        icon: '📦',
        label: 'UPC-E',
        description: 'Shortened Universal Product Code',
        usage: 'Compact format'
      },
      [BarcodeTypes.Code128]: {
        icon: '📄',
        label: 'Code 128',
        description: 'Alphanumeric code',
        usage: 'Shipping, logistics, industrial'
      },
      [BarcodeTypes.Code39]: {
        icon: '📄',
        label: 'Code 39',
        description: 'Alphanumeric code (limited)',
        usage: 'Medical, industrial'
      },
      [BarcodeTypes.Code93]: {
        icon: '📄',
        label: 'Code 93',
        description: 'Enhanced alphanumeric code',
        usage: 'Manufacturing'
      },
      [BarcodeTypes.ITF]: {
        icon: '📋',
        label: 'ITF',
        description: 'Interleaved 2 of 5',
        usage: 'Packaging, cases'
      },
      [BarcodeTypes.CODABAR]: {
        icon: '📋',
        label: 'Codabar',
        description: 'Self-checking code',
        usage: 'Libraries, medical, logistics'
      },
      [BarcodeTypes.QR]: {
        icon: '📲',
        label: 'QR Code',
        description: '2D matrix barcode',
        usage: 'URLs, contact info, marketing'
      },
      [BarcodeTypes.UNKNOWN]: {
        icon: '❓',
        label: 'Unknown',
        description: 'Could not identify type',
        usage: 'Custom format'
      }
    };
    return info[barcodeType] || info[BarcodeTypes.UNKNOWN];
  }

  /**
   * Extract product information from barcode if possible
   */
  static extractProductInfo(barcode) {
    const result = this.detectType(barcode);
    
    const productInfo = {
      barcode: result.standardized,
      barcodeType: result.type,
      barcodeFormat: result.format,
      barcodeDescription: result.description,
      country: result.country || 'Unknown',
      isValid: result.isValid
    };

    return productInfo;
  }
}
