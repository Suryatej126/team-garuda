import React, { useEffect, useState, useRef } from 'react';
import { Download, CheckCircle2, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReceiptSetting {
  id: number;
  org_name: string;
  org_subtitle: string;
  org_association: string;
  receipt_prefix: string;
  default_purpose: string;
  signature_title: string;
  logo_url: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  contribution: {
    id: number;
    amount: number;
    date: string;
    payment_method: string;
    collected_by?: string | null;
    donor_name?: string;
    donor_phone?: string;
    notes?: string;
    contributor?: {
      name: string;
      phone: string | null;
    };
  } | null;
  receiptNumber?: number;
}

const englishToTelugu = (text: string): string => {
  if (!text) return '';
  // Check if already contains Telugu unicode block (0C00-0C7F)
  if (/[\u0C00-\u0C7F]/.test(text)) {
    return text;
  }

  const clean = text.toLowerCase().trim();
  
  // Transliteration dictionary for names & locations
  const dict: Record<string, string> = {
    'surya': 'సూర్య',
    'surya teja': 'సూర్య తేజ',
    'suryateja': 'సూర్య తేజ',
    'teja': 'తేజ',
    'razole': 'రాజోలు',
    'nagarjuna street': 'నాగార్జున స్ట్రీట్',
    'aditya': 'ఆదిత్య',
    'narendra': 'నరేంద్ర',
    'hemaraj': 'హేమరాజ్',
    'hema raj': 'హేమరాజ్',
    'bheemesh': 'భీమేష్',
    'bhimeesh': 'భీమేష్',
    'ram ganesh': 'రామ్ గణేష్',
    'ramganesh': 'రామ్ గణేష్',
    'ganesh': 'గణేష్',
    'prakash': 'ప్రకాష్',
    'loku tn': 'లోకేష్',
    'lokesh': 'లోకేష్',
    'vijay': 'విజయ్',
    'kalyan': 'కళ్యాణ్',
    'sandeep': 'సందీప్',
    'ramesh': 'రమేష్',
    'kumar': 'కుమార్',
    'naveen': 'నవీన్',
    'aditya annaya': 'ఆదిత్య అన్నయ్య',
    'lokesh annaya': 'లోకేష్ అన్నయ్య',
    'satya': 'సత్య',
    'satyanaarayana': 'సత్యనారాయణ',
    'satyababu': 'సత్యబాబు',
    'sri bal balaji yuvajana sangham': 'శ్రీ బాల బాలాజీ యువజన సంఘం',
    'team garuda': 'టీమ్ గరుడ',
    'garuda': 'గరుడ',
    'hyderabad': 'హైదరాబాద్',
    'vijayawada': 'విజయవాడ',
    'rajahmundry': 'రాజమండ్రి',
    'amalapuram': 'అమలాపురం',
    'bhimavaram': 'భీమవరం',
    'tatipaka': 'తాటిపాక',
    'malkipuram': 'మలికిపురం',
    'palakollu': 'పాలకొల్లు'
  };

  if (dict[clean]) return dict[clean];

  // Word-by-word fallback matching
  const words = clean.split(/\s+/);
  const translatedWords = words.map(w => {
    if (dict[w]) return dict[w];
    return w.charAt(0).toUpperCase() + w.slice(1);
  });

  return translatedWords.join(' ');
};

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, contribution, receiptNumber }) => {
  const { token } = useAuth();
  const [settings, setSettings] = useState<ReceiptSetting | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [sharingImage, setSharingImage] = useState(false);
  const [shareSuccessMessage, setShareSuccessMessage] = useState('');
  const receiptRef = useRef<HTMLDivElement>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen && token) {
      // Fetch dynamic receipt settings from API
      fetch(`${API_BASE_URL}/api/finance/receipt-settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setSettings(data))
        .catch(err => console.error('Error fetching receipt settings:', err));
    }
  }, [isOpen, token]);

  // Pre-generate and cache the receipt image file in the background
  useEffect(() => {
    if (isOpen && contribution) {
      setReceiptFile(null);
      const timer = setTimeout(async () => {
        if (!receiptRef.current) return;
        try {
          const canvas = await html2canvas(receiptRef.current, {
            scale: 3,
            useCORS: true,
            backgroundColor: '#FAF5E8',
            logging: false
          });
          canvas.toBlob((blob) => {
            if (blob) {
              const prefix = settings?.receipt_prefix || 'TG-CH';
              const fileName = `Receipt_${prefix}_${contribution.id}.png`;
              const file = new File([blob], fileName, { type: 'image/png' });
              setReceiptFile(file);
            }
          }, 'image/png');
        } catch (err) {
          console.error('Error pre-generating receipt image:', err);
        }
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isOpen, contribution, settings]);

  if (!isOpen || !contribution) return null;

  // Map values robustly from either Chandha or Contribution shape
  const id = contribution.id;
  const displayId = receiptNumber !== undefined ? receiptNumber : id;
  const amount = Number(contribution.amount);
  const date = contribution.date;
  const paymentMethod = contribution.payment_method;
  const collectedBy = contribution.collected_by || 'N/A';

  // Format date display (e.g. DD/MM/YYYY)
  const formatDateDisplay = (dStr: string) => {
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch {
      // fallback to original
    }
    return dStr;
  };

  const formattedDate = formatDateDisplay(date);

  // Raw values & Telugu translations
  const rawName = contribution.donor_name || contribution.contributor?.name || 'Anonymous';
  const rawPhone = contribution.donor_phone || contribution.contributor?.phone || '';
  const rawTown = contribution.notes ? contribution.notes : 'Razole';

  const nameTelugu = englishToTelugu(rawName);
  const townTelugu = englishToTelugu(rawTown);

  // Organization branding fallback values matching reference image
  const orgName = settings?.org_name || 'వినాయక చవితి';
  const orgSubtitle = settings?.org_subtitle || 'నవరాత్రుల మహోత్సవములు';
  const orgAssociation = settings?.org_association || 'రాజోలు - నాగార్జున స్ట్రీట్';
  const receiptPrefix = (settings?.receipt_prefix || 'TG-CH').trim().replace(/-+$/, '');
  const signatureTitle = settings?.signature_title || 'సంతకం.';
  const logoUrl = settings?.logo_url || '/logo.png';

  // Helper to convert number to English Words
  const numberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if ((num = Math.floor(num)) === 0) return 'Zero Rupees Only';
    
    const translate = (n: number): string => {
      let word = '';
      if (n >= 100) {
        word += a[Math.floor(n / 100)] + 'Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        word += b[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        word += a[n];
      }
      return word;
    };

    let result = '';
    if (num >= 10000000) {
      result += translate(Math.floor(num / 10000000)) + 'Crore ';
      num %= 10000000;
    }
    if (num >= 100000) {
      result += translate(Math.floor(num / 100000)) + 'Lakh ';
      num %= 100000;
    }
    if (num >= 1000) {
      result += translate(Math.floor(num / 1000)) + 'Thousand ';
      num %= 1000;
    }
    result += translate(num);
    return result.trim() + ' Rupees Only';
  };

  const amountInWords = numberToWords(amount);

  const generateReceiptImage = async (): Promise<File | null> => {
    if (!receiptRef.current) return null;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#FAF5E8',
        logging: false
      });
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const prefix = settings?.receipt_prefix || 'TG-CH';
            const fileName = `Receipt_${prefix}_${contribution.id}.png`;
            const file = new File([blob], fileName, { type: 'image/png' });
            setReceiptFile(file);
            resolve(file);
          } else {
            resolve(null);
          }
        }, 'image/png');
      });
    } catch (err) {
      console.error('Error generating receipt image on demand:', err);
      return null;
    }
  };

  // Generate and Share actual visual Receipt Image via Web Share API or download & WhatsApp
  const handleShareImage = async () => {
    setSharingImage(true);
    setShareSuccessMessage('');
    try {
      const fileToShare = receiptFile || await generateReceiptImage();
      if (!fileToShare) {
        alert('Failed to generate receipt image.');
        return;
      }

      // If mobile / browser Web Share API supports file sharing, open WhatsApp directly with the image!
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
        try {
          await navigator.share({
            files: [fileToShare],
            title: `${orgName} - Official Receipt`,
            text: `🚩 *${orgName} ${orgSubtitle}* - Official Receipt #${displayId}\n*Team Garuda*`
          });
          setShareSuccessMessage('✓ Shared Successfully!');
          setTimeout(() => setShareSuccessMessage(''), 3000);
          return;
        } catch (shareErr: any) {
          console.log('Native share error:', shareErr);
          if (shareErr.name === 'AbortError') {
            return;
          }
        }
      }

      // Fallback: Copy to clipboard and download image
      let copied = false;
      if (navigator.clipboard && navigator.clipboard.write) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              [fileToShare.type]: fileToShare
            })
          ]);
          copied = true;
        } catch (clipErr) {
          console.log('Clipboard copy failed:', clipErr);
        }
      }

      const url = URL.createObjectURL(fileToShare);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileToShare.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (copied) {
        setShareSuccessMessage('✓ Copied & Downloaded! Paste in WhatsApp.');
      } else {
        setShareSuccessMessage('✓ Image Downloaded! Share from gallery.');
      }
      setTimeout(() => setShareSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Error sharing image:', err);
    } finally {
      setSharingImage(false);
    }
  };

  const formatWhatsAppPhone = (phone: string | null | undefined): string => {
    if (!phone) return '';
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      return `91${cleanPhone}`;
    }
    return cleanPhone;
  };

  // Generate and Share via WhatsApp Click-to-Chat (Text version)
  const handleShareWhatsApp = () => {
    const message = `🚩 *${orgName} - ${orgSubtitle}* 🚩\n` +
      `*${orgAssociation}*\n` +
      `*TEAM GARUDA*\n\n` +
      `*రశీదు / OFFICIAL RECEIPT*\n` +
      `---------------------------------------\n` +
      `*రశీదు నెం (Receipt No):* #${displayId} (${receiptPrefix}-${displayId})\n` +
      `*తేది (Date):* ${formattedDate}\n` +
      `*పేరు (Name):* ${nameTelugu} (${rawName})\n` +
      `*చిరునామా (Address):* ${townTelugu}\n` +
      `*ఫోన్ నెం (Phone):* ${rawPhone || 'N/A'}\n` +
      `*విరాళం మొత్తం (Amount):* ₹${amount.toLocaleString('en-IN')}/-\n` +
      `*అక్షరాలా (In Words):* ${amountInWords}\n` +
      `*చెల్లింపు విధానం (Payment):* ${paymentMethod}\n` +
      `*స్వీకరించినవారు (Collected By):* ${collectedBy}\n` +
      `---------------------------------------\n` +
      `శ్రీ వినాయక స్వామి వారి కృపా కటాక్షములు మీకు మరియు మీ కుటుంబ సభ్యులకు ఎల్లప్పుడూ ఉండాలని కోరుకుంటున్నాము. ధన్యవాదములు! 🙏\n\n` +
      `_Team Garuda - Official Digital Receipt_`;

    const donorPhone = contribution.donor_phone || contribution.contributor?.phone || '';
    const cleanedPhone = formatWhatsAppPhone(donorPhone);
    const shareUrl = cleanedPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = shareUrl;
    } else {
      const newWindow = window.open(shareUrl, '_blank');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        window.location.href = shareUrl;
      }
    }
  };

  // Generate and Download high-resolution visual PDF using canvas
  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    setPdfGenerating(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#FAF5E8',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a5'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Maintain aspect ratio and center on A5 landscape
      const imgProps = doc.getImageProperties(imgData);
      const imgRatio = imgProps.width / imgProps.height;

      let renderWidth = pageWidth - 14;
      let renderHeight = renderWidth / imgRatio;

      if (renderHeight > pageHeight - 14) {
        renderHeight = pageHeight - 14;
        renderWidth = renderHeight * imgRatio;
      }

      const x = (pageWidth - renderWidth) / 2;
      const y = (pageHeight - renderHeight) / 2;

      doc.addImage(imgData, 'PNG', x, y, renderWidth, renderHeight);
      doc.save(`Receipt_${receiptPrefix}_${displayId}.pdf`);
    } catch (e) {
      console.error('Error generating PDF:', e);
      alert('Failed to generate PDF receipt.');
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Official Contribution Receipt"
    >
      <div className="flex flex-col gap-4 select-text pb-4">
        
        {/* Visual Receipt Card layout matching the exact reference image */}
        <div 
          ref={receiptRef} 
          style={{
            width: '100%',
            maxWidth: '540px',
            margin: '0 auto',
            backgroundColor: '#FAF5E8',
            border: '3.5px solid #8C6527',
            borderRadius: '6px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'row',
            position: 'relative',
            boxSizing: 'border-box',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)',
            fontFamily: "'Noto Serif Telugu', 'Ramabhadra', 'Suranna', Georgia, serif"
          }}
        >

          {/* MAIN CONTENT AREA */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
            
            {/* TOP BAR (Serial No, రశీదు, తేది) */}
            <div 
              style={{
                backgroundColor: '#FAF5E8',
                borderBottom: '1.5px solid #8C6527',
                padding: '6px 14px 4px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxSizing: 'border-box'
              }}
            >
              {/* Red Serial Number */}
              <div 
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  color: '#B31414',
                  fontFamily: "'Cinzel', Georgia, serif",
                  lineHeight: '1',
                  letterSpacing: '0.5px'
                }}
              >
                {displayId}
              </div>

              {/* Center "రశీదు" */}
              <div 
                style={{
                  fontSize: '15px',
                  fontWeight: 900,
                  color: '#1A1A1A',
                  fontFamily: "'Ramabhadra', 'Noto Serif Telugu', serif",
                  letterSpacing: '0.5px'
                }}
              >
                రశీదు
              </div>

              {/* Right "తేది" with dotted fill */}
              <div 
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#1A1A1A',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '4px'
                }}
              >
                <span>తేది:</span>
                <span 
                  style={{
                    borderBottom: '1px dotted #444',
                    minWidth: '85px',
                    display: 'inline-block',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '11px',
                    color: '#000000',
                    paddingBottom: '1px'
                  }}
                >
                  {formattedDate}
                </span>
              </div>
            </div>

            {/* MAROON HEADER SECTION */}
            <div 
              style={{
                background: 'radial-gradient(ellipse at 75% 50%, #68050E 0%, #460207 60%, #2A0105 100%)',
                padding: '10px 12px 10px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                position: 'relative',
                borderBottom: '2px solid #8C6527',
                boxSizing: 'border-box'
              }}
            >
              {/* Left Side: Lord Ganesha on Lotus */}
              <div 
                style={{
                  width: '92px',
                  height: '92px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                <img 
                  src={logoUrl} 
                  alt="Lord Ganesha" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 2px 8px rgba(255, 215, 0, 0.45))'
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.png';
                  }}
                />
              </div>

              {/* Right Side: Header Texts & Badges */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: 0 }}>
                
                {/* Main Heading: వినాయక చవితి with 3D embossed look */}
                <h1 
                  style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: 900,
                    color: '#FFFFFF',
                    fontFamily: "'Ramabhadra', 'Noto Serif Telugu', serif",
                    letterSpacing: '0.8px',
                    lineHeight: '1.2',
                    textShadow: '0 1px 0 #FFD700, 0 2px 0 #D4AF37, 0 3px 0 #8C6527, 0 4px 6px rgba(0,0,0,0.9)',
                    WebkitTextStroke: '0.3px #FFE57F'
                  }}
                >
                  {orgName}
                </h1>

                {/* Green Decorative Banner: నవరాత్రుల మహోత్సవములు */}
                <div 
                  style={{
                    marginTop: '4px',
                    width: '94%',
                    backgroundColor: '#004D25',
                    border: '1.5px solid #FFD700',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 0 4px rgba(255,215,0,0.3)',
                    position: 'relative',
                    boxSizing: 'border-box'
                  }}
                >
                  <span 
                    style={{
                      display: 'block',
                      color: '#FFE066',
                      fontSize: '13px',
                      fontWeight: 900,
                      fontFamily: "'Ramabhadra', 'Noto Serif Telugu', serif",
                      letterSpacing: '0.5px',
                      lineHeight: '1.2',
                      textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                    }}
                  >
                    {orgSubtitle}
                  </span>
                </div>

                {/* Subtitle: రాజోలు - నాగార్జున స్ట్రీట్ */}
                <div 
                  style={{
                    marginTop: '3px',
                    fontSize: '12.5px',
                    fontWeight: 900,
                    color: '#FFDF6D',
                    fontFamily: "'Ramabhadra', 'Noto Serif Telugu', serif",
                    letterSpacing: '0.5px',
                    textShadow: '0 1px 3px rgba(0,0,0,0.9)'
                  }}
                >
                  {orgAssociation}
                </div>

                {/* Bottom Gold Crest Badge: Golden Wings + TEAM GARUDA */}
                <div 
                  style={{
                    marginTop: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  {/* Left Golden Wing SVG */}
                  <svg width="22" height="12" viewBox="0 0 40 20" fill="#E5C77D">
                    <path d="M40 18 C30 18 15 15 0 0 C12 6 25 10 40 12 Z" opacity="0.9" />
                    <path d="M40 12 C28 12 16 8 5 0 C15 4 28 8 40 8 Z" />
                    <path d="M40 6 C30 6 22 4 12 0 C20 2 30 4 40 4 Z" />
                  </svg>

                  {/* Frame Plaque */}
                  <div 
                    style={{
                      border: '1px solid #E5C77D',
                      padding: '1px 8px',
                      borderRadius: '2px',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      boxShadow: 'inset 0 0 3px rgba(229,199,125,0.3)'
                    }}
                  >
                    <span 
                      style={{
                        fontFamily: "'Cinzel', 'Times New Roman', serif",
                        fontWeight: 900,
                        fontSize: '10.5px',
                        color: '#F4D03F',
                        letterSpacing: '1.8px',
                        display: 'block',
                        lineHeight: '1.2'
                      }}
                    >
                      TEAM GARUDA
                    </span>
                  </div>

                  {/* Right Golden Wing SVG */}
                  <svg width="22" height="12" viewBox="0 0 40 20" fill="#E5C77D" style={{ transform: 'scaleX(-1)' }}>
                    <path d="M40 18 C30 18 15 15 0 0 C12 6 25 10 40 12 Z" opacity="0.9" />
                    <path d="M40 12 C28 12 16 8 5 0 C15 4 28 8 40 8 Z" />
                    <path d="M40 6 C30 6 22 4 12 0 C20 2 30 4 40 4 Z" />
                  </svg>
                </div>

              </div>

            </div>

            {/* LOWER CREAM RECEIPT FORM BODY */}
            <div 
              style={{
                backgroundColor: '#FAF5E8',
                padding: '12px 14px 10px 14px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxSizing: 'border-box'
              }}
            >
              
              {/* Central Ganesha Watermark */}
              <div 
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '140px',
                  height: '140px',
                  opacity: 0.08,
                  pointerEvents: 'none',
                  backgroundImage: `url(${logoUrl})`,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  zIndex: 0
                }}
              />

              {/* Form Row 1: పేరు : ................................ */}
              <div style={{ display: 'flex', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
                <span 
                  style={{
                    fontSize: '12px',
                    fontWeight: 900,
                    color: '#111111',
                    fontFamily: "'Ramabhadra', 'Noto Serif Telugu', serif",
                    whiteSpace: 'nowrap',
                    paddingRight: '6px'
                  }}
                >
                  పేరు :
                </span>
                <div 
                  style={{
                    flex: 1,
                    borderBottom: '1.2px dotted #444444',
                    paddingBottom: '1px',
                    paddingLeft: '6px'
                  }}
                >
                  <span 
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 900,
                      color: '#0E2A6A',
                      fontFamily: "'Noto Serif Telugu', 'Ramabhadra', serif"
                    }}
                  >
                    {nameTelugu}
                  </span>
                  {rawName && rawName.toLowerCase() !== nameTelugu.toLowerCase() && (
                    <span style={{ fontSize: '10.5px', color: '#555555', marginLeft: '6px', fontWeight: 600 }}>
                      ({rawName})
                    </span>
                  )}
                </div>
              </div>

              {/* Form Row 2: చిరునామా : ................................ */}
              <div style={{ display: 'flex', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
                <span 
                  style={{
                    fontSize: '12px',
                    fontWeight: 900,
                    color: '#111111',
                    fontFamily: "'Ramabhadra', 'Noto Serif Telugu', serif",
                    whiteSpace: 'nowrap',
                    paddingRight: '6px'
                  }}
                >
                  చిరునామా :
                </span>
                <div 
                  style={{
                    flex: 1,
                    borderBottom: '1.2px dotted #444444',
                    paddingBottom: '1px',
                    paddingLeft: '6px'
                  }}
                >
                  <span 
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#0E2A6A',
                      fontFamily: "'Noto Serif Telugu', 'Ramabhadra', serif"
                    }}
                  >
                    {townTelugu}
                  </span>
                </div>
              </div>

              {/* Form Row 3: Blank dotted line for extended address */}
              <div style={{ display: 'flex', alignItems: 'flex-end', position: 'relative', zIndex: 1, height: '14px' }}>
                <div 
                  style={{
                    flex: 1,
                    borderBottom: '1.2px dotted #444444',
                    height: '100%',
                    paddingLeft: '6px'
                  }}
                >
                  <span style={{ fontSize: '10px', color: '#666666', fontStyle: 'italic' }}>
                    {contribution.notes && contribution.notes !== rawTown ? contribution.notes : ''}
                  </span>
                </div>
              </div>

              {/* Form Row 4: ఫోన్ నెం : ................................ */}
              <div style={{ display: 'flex', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
                <span 
                  style={{
                    fontSize: '12px',
                    fontWeight: 900,
                    color: '#111111',
                    fontFamily: "'Ramabhadra', 'Noto Serif Telugu', serif",
                    whiteSpace: 'nowrap',
                    paddingRight: '6px'
                  }}
                >
                  ఫోన్ నెం :
                </span>
                <div 
                  style={{
                    flex: 1,
                    borderBottom: '1.2px dotted #444444',
                    paddingBottom: '1px',
                    paddingLeft: '6px'
                  }}
                >
                  <span 
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#0E2A6A',
                      fontFamily: 'monospace',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {rawPhone || '—'}
                  </span>
                </div>
              </div>

              {/* Form Row 5: ఇతర వివరాలు : ................................ */}
              <div style={{ display: 'flex', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
                <span 
                  style={{
                    fontSize: '12px',
                    fontWeight: 900,
                    color: '#111111',
                    fontFamily: "'Ramabhadra', 'Noto Serif Telugu', serif",
                    whiteSpace: 'nowrap',
                    paddingRight: '6px'
                  }}
                >
                  ఇతర వివరాలు :
                </span>
                <div 
                  style={{
                    flex: 1,
                    borderBottom: '1.2px dotted #444444',
                    paddingBottom: '1px',
                    paddingLeft: '6px'
                  }}
                >
                  <span 
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 600,
                      color: '#333333',
                      fontStyle: 'italic'
                    }}
                  >
                    {amountInWords} • ({paymentMethod})
                  </span>
                </div>
              </div>

              {/* Form Row 6 (Bottom Row): రశీదు నెం : రూ................ సంతకం. */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  marginTop: '6px',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                {/* Left: రశీదు నెం */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span 
                    style={{
                      fontSize: '12px',
                      fontWeight: 900,
                      color: '#111111',
                      fontFamily: "'Ramabhadra', 'Noto Serif Telugu', serif"
                    }}
                  >
                    రశీదు నెం :
                  </span>
                  <span 
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 900,
                      fontSize: '11px',
                      color: '#B31414'
                    }}
                  >
                    #{receiptPrefix}-{displayId}
                  </span>
                </div>

                {/* Center-Left: రూ. Amount */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flex: 1, marginLeft: '12px', marginRight: '16px' }}>
                  <span 
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 900,
                      color: '#111111',
                      fontFamily: "'Ramabhadra', 'Noto Serif Telugu', serif"
                    }}
                  >
                    రూ.
                  </span>
                  <div 
                    style={{
                      borderBottom: '1.2px dotted #444444',
                      flex: 1,
                      paddingBottom: '1px',
                      paddingLeft: '4px'
                    }}
                  >
                    <span 
                      style={{
                        fontSize: '14px',
                        fontWeight: 900,
                        color: '#B31414',
                        fontFamily: 'monospace'
                      }}
                    >
                      {amount.toLocaleString('en-IN')}/-
                    </span>
                  </div>
                </div>

                {/* Right: సంతకం. (Signature) */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px' }}>
                  <div style={{ height: '14px', display: 'flex', alignItems: 'center' }}>
                    {collectedBy && collectedBy !== 'N/A' && (
                      <span style={{ fontSize: '8.5px', color: '#0E2A6A', fontWeight: 700, fontStyle: 'italic' }}>
                        {collectedBy}
                      </span>
                    )}
                  </div>
                  <span 
                    style={{
                      fontSize: '12px',
                      fontWeight: 900,
                      color: '#111111',
                      fontFamily: "'Ramabhadra', 'Noto Serif Telugu', serif"
                    }}
                  >
                    {signatureTitle}
                  </span>
                </div>

              </div>

            </div>

          </div>

          {/* RIGHT ORNATE FLORAL FILIGREE BORDER STRIP */}
          <div 
            style={{
              width: '26px',
              backgroundColor: '#1E0E08',
              borderLeft: '1.5px solid #8C6527',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '6px 0',
              boxSizing: 'border-box',
              flexShrink: 0
            }}
          >
            {[...Array(9)].map((_, i) => (
              <div 
                key={i} 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                {/* Golden 8-petal mandala flower icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#E5C77D">
                  <circle cx="12" cy="12" r="3" fill="#FFE066" />
                  <path d="M12 2 C13 5 15 7 18 6 C17 9 19 11 22 12 C19 13 17 15 18 18 C15 17 13 19 12 22 C11 19 9 17 6 18 C7 15 5 13 2 12 C5 11 7 9 6 6 C9 7 11 5 12 2 Z" opacity="0.95" />
                </svg>
                {/* Small gold bead divider */}
                <div style={{ width: '2.5px', height: '2.5px', borderRadius: '50%', backgroundColor: '#C99A4A' }} />
              </div>
            ))}
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 shrink-0 pt-1">
          <button
            onClick={handleShareImage}
            disabled={sharingImage}
            className={`w-full text-white py-3.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-60 ${
              shareSuccessMessage ? 'bg-success hover:bg-success-dark animate-pulse' : 'bg-[#25D366] hover:bg-[#20ba5a]'
            }`}
          >
            {sharingImage ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : shareSuccessMessage ? (
              <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
            <span>
              {sharingImage 
                ? 'Preparing High-Res Receipt...' 
                : shareSuccessMessage 
                  ? shareSuccessMessage 
                  : 'Share Receipt Image (WhatsApp / Groups)'}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Share Formatted Text */}
            <button
              onClick={handleShareWhatsApp}
              className="bg-white border border-[#25D366] text-[#25D366] hover:bg-[#25D366]/5 py-3 rounded-xl font-extrabold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Share Text Only</span>
            </button>
            
            {/* Download PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={pdfGenerating}
              className="bg-primary-maroon hover:bg-dark-maroon text-white py-3 rounded-xl font-extrabold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm disabled:opacity-55 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{pdfGenerating ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>

      </div>
    </BottomSheet>
  );
};
