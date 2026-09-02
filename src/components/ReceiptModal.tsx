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

// Convert numbers to Telugu Words (అక్షరాలా)
export const numberToTeluguWords = (num: number): string => {
  if (!num || isNaN(num) || num === 0) return 'సున్నా రూపాయలు మాత్రమే';

  const ones = ['', 'ఒకటి', 'రెండు', 'మూడు', 'నాలుగు', 'ఐదు', 'ఆరు', 'ఏడు', 'ఎనిమిది', 'తొమ్మిది'];
  const teens = ['పది', 'పదకొండు', 'పన్నెండు', 'పదమూడు', 'పద్నాలుగు', 'పదిహేను', 'పదహారు', 'పదిహేడు', 'పద్దెనిమిది', 'పంతొమ్మిది'];
  const tens = ['', '', 'ఇరవై', 'ముప్పై', 'నలభై', 'యాభై', 'అరవై', 'డెబ్బై', 'ఎనభై', 'తొంబై'];

  const convertTwoDigits = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    const t = Math.floor(n / 10);
    const o = n % 10;
    if (o === 0) return tens[t];
    return tens[t] + ' ' + ones[o];
  };

  const convertThreeDigits = (n: number): string => {
    let res = '';
    const h = Math.floor(n / 100);
    const rest = n % 100;
    if (h > 0) {
      if (h === 1) res += (rest === 0 ? 'వంద ' : 'నూట ');
      else res += ones[h] + (rest === 0 ? ' వందలు ' : ' వందల ');
    }
    if (rest > 0) {
      res += convertTwoDigits(rest);
    }
    return res.trim();
  };

  let n = Math.floor(num);
  let result = '';

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;

  if (crore > 0) {
    if (crore === 1) result += 'ఒక కోటి ';
    else result += convertThreeDigits(crore) + ' కోట్ల ';
  }

  if (lakh > 0) {
    if (lakh === 1) result += 'ఒక లక్ష ';
    else result += convertThreeDigits(lakh) + ' లక్షల ';
  }

  if (thousand > 0) {
    if (thousand === 1) result += 'వెయ్యి ';
    else if (thousand === 2) result += 'రెండు వేల ';
    else result += convertThreeDigits(thousand) + ' వేల ';
  }

  if (n > 0) {
    result += convertThreeDigits(n);
  }

  return result.trim() + ' రూపాయలు మాత్రమే';
};

// Robust English to Telugu transliteration mapping
export const englishToTelugu = (text: string): string => {
  if (!text) return '';
  if (/[\u0C00-\u0C7F]/.test(text)) {
    return text;
  }

  const clean = text.toLowerCase().trim();

  // Known dictionary mappings
  const dict: Record<string, string> = {
    'surya': 'సూర్య',
    'surya teja': 'సూర్య తేజ',
    'suryateja': 'సూర్య తేజ',
    'teja': 'తేజ',
    'tejas': 'తేజస్',
    'razole': 'రాజోలు',
    'nagarjuna street': 'నాగార్జున స్ట్రీట్',
    'nagarjuna': 'నాగార్జున',
    'street': 'స్ట్రీట్',
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
    'palakollu': 'పాలకొల్లు',
    'srinivas': 'శ్రీనివాస్',
    'srinivasa': 'శ్రీనివాస',
    'prasad': 'ప్రసాద్',
    'sai': 'సాయి',
    'venkat': 'వెంకట్',
    'venkatesh': 'వెంకటేష్',
    'venkata': 'వెంకట',
    'raju': 'రాజు',
    'varma': 'వర్మ',
    'reddy': 'రెడ్డి',
    'chowdary': 'చౌదరి',
    'naidu': 'నాయుడు',
    'rao': 'రావు',
    'murthy': 'మూర్తి',
    'sharma': 'శర్మ',
    'sastry': 'శాస్త్రి',
    'lakshmi': 'లక్ష్మి',
    'sita': 'సీత',
    'durga': 'దుర్గ',
    'bhavani': 'భవాని',
    'manikanta': 'మణికంఠ',
    'subrahmanyam': 'సుబ్రహ్మణ్యం',
    'krishna': 'కృష్ణ',
    'rama': 'రామ',
    'ramu': 'రాము',
    'ravi': 'రవి',
    'kiran': 'కిరణ్',
    'ajay': 'అజయ్',
    'anand': 'ఆనంద్',
    'anil': 'అనిల్',
    'sunil': 'సునీల్',
    'mahesh': 'మహేష్',
    'suresh': 'సురేష్',
    'naresh': 'నరేష్',
    'harish': 'హరీష్',
    'mohan': 'మోహన్',
    'chaitanya': 'చైతన్య',
    'tarun': 'తరుణ్',
    'praveen': 'ప్రవీణ్',
    'vinay': 'వినయ్',
    'siva': 'శివ',
    'shiva': 'శివ',
    'sekhar': 'శేఖర్',
    'balu': 'బాలు',
    'babu': 'బాబు',
    'anna': 'అన్న',
    'annayya': 'అన్నయ్య',
    'garu': 'గారు',
    'cash': 'నగదు',
    'online': 'ఆన్‌లైన్',
    'upi': 'యూపీఐ',
    'phonepe': 'ఫోన్‌పే',
    'gpay': 'గూగుల్‌పే',
    'google pay': 'గూగుల్‌పే',
    'paytm': 'పేటీఎం'
  };

  if (dict[clean]) return dict[clean];

  const words = clean.split(/\s+/);
  const translatedWords = words.map(w => {
    if (dict[w]) return dict[w];
    return dict[w] || w.charAt(0).toUpperCase() + w.slice(1);
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (isOpen && token) {
      fetch(`${API_BASE_URL}/api/finance/receipt-settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setSettings(data))
        .catch(err => console.error('Error fetching receipt settings:', err));
    }
  }, [isOpen, token]);

  // Responsive scale computation for mobile screens
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.offsetWidth || window.innerWidth - 32;
        const targetWidth = 620;
        const computedScale = Math.min(1, Math.max(0.48, (availableWidth) / targetWidth));
        setScale(computedScale);
      }
    };
    if (isOpen) {
      updateScale();
      const timer = setTimeout(updateScale, 100);
      window.addEventListener('resize', updateScale);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateScale);
      };
    }
  }, [isOpen]);

  // Pre-generate and cache the receipt image file in background
  useEffect(() => {
    if (isOpen && contribution) {
      setReceiptFile(null);
      const timer = setTimeout(async () => {
        if (!receiptRef.current) return;
        try {
          const canvas = await html2canvas(receiptRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#FAF5E8',
            logging: false,
            windowWidth: 640
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

  // Values mapping
  const id = contribution.id;
  const displayId = receiptNumber !== undefined ? receiptNumber : id;
  const amount = Number(contribution.amount);
  const date = contribution.date;
  const paymentMethod = contribution.payment_method;
  const collectedBy = contribution.collected_by || '';

  // Format date display (DD/MM/YYYY)
  const formatDateDisplay = (dStr: string) => {
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch {
      // fallback
    }
    return dStr;
  };

  const formattedDate = formatDateDisplay(date);

  // Raw values & pure Telugu mappings
  const rawName = contribution.donor_name || contribution.contributor?.name || 'Anonymous';
  const rawPhone = contribution.donor_phone || contribution.contributor?.phone || '';
  const rawTown = contribution.notes ? contribution.notes : 'Razole';

  const nameTelugu = englishToTelugu(rawName);
  const townTelugu = englishToTelugu(rawTown);
  const paymentTelugu = englishToTelugu(paymentMethod);
  const collectedByTelugu = collectedBy ? englishToTelugu(collectedBy) : '';

  // Telugu Amount in words (అక్షరాలా)
  const amountInTeluguWords = numberToTeluguWords(amount);

  // Organization branding fallback values
  const orgName = settings?.org_name || 'వినాయక చవితి';
  const orgSubtitle = settings?.org_subtitle || 'నవరాత్రుల మహోత్సవములు';
  const orgAssociation = settings?.org_association || 'రాజోలు - నాగార్జున స్ట్రీట్';
  const receiptPrefix = (settings?.receipt_prefix || 'TG-CH').trim().replace(/-+$/, '');
  const signatureTitle = settings?.signature_title || 'సంతకం.';
  const logoUrl = settings?.logo_url || '/logo.png';

  const generateReceiptImage = async (): Promise<File | null> => {
    if (!receiptRef.current) return null;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FAF5E8',
        logging: false,
        windowWidth: 640
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

  // Generate and Share actual visual Receipt Image
  const handleShareImage = async () => {
    setSharingImage(true);
    setShareSuccessMessage('');
    try {
      const fileToShare = receiptFile || await generateReceiptImage();
      if (!fileToShare) {
        alert('Failed to generate receipt image.');
        return;
      }

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
        try {
          await navigator.share({
            files: [fileToShare],
            title: `${orgName} - Official Receipt`,
            text: `🚩 *${orgName} ${orgSubtitle}* - రశీదు #${displayId}\n*Team Garuda*`
          });
          setShareSuccessMessage('✓ Shared Successfully!');
          setTimeout(() => setShareSuccessMessage(''), 3000);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            return;
          }
        }
      }

      // Clipboard copy & download fallback
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

  // Generate and Share via WhatsApp Click-to-Chat (Pure Telugu text)
  const handleShareWhatsApp = () => {
    const message = `🚩 *${orgName} - ${orgSubtitle}* 🚩\n` +
      `*${orgAssociation}*\n` +
      `*TEAM GARUDA*\n\n` +
      `*రశీదు (OFFICIAL RECEIPT)*\n` +
      `---------------------------------------\n` +
      `*రశీదు నెం:* #${displayId}\n` +
      `*తేది:* ${formattedDate}\n` +
      `*పేరు:* ${nameTelugu}\n` +
      `*చిరునామా:* ${townTelugu}\n` +
      `*ఫోన్ నెం:* ${rawPhone || '—'}\n` +
      `*విరాళం మొత్తం:* ₹${amount.toLocaleString('en-IN')}/-\n` +
      `*అక్షరాలా:* ${amountInTeluguWords}\n` +
      `*చెల్లింపు విధానం:* ${paymentTelugu}\n` +
      (collectedByTelugu ? `*స్వీకరించినవారు:* ${collectedByTelugu}\n` : '') +
      `---------------------------------------\n` +
      `శ్రీ వినాయక స్వామి వారి దివ్య ఆశీస్సులు మీకు మరియు మీ కుటుంబ సభ్యులకు ఎల్లప్పుడూ ఉండాలని కోరుకుంటున్నాము. ధన్యవాదములు! 🙏\n\n` +
      `_టీమ్ గరుడ - అధికారిక రశీదు_`;

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

  // Generate and Download high-resolution PDF
  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    setPdfGenerating(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FAF5E8',
        logging: false,
        windowWidth: 640
      });

      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a5'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

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

  const CARD_WIDTH = 620;
  const CARD_HEIGHT = 485;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Official Contribution Receipt"
    >
      <div className="flex flex-col gap-3 select-text pb-4 w-full">
        
        {/* Scaled Preview Wrapper to prevent mobile layout squishing/wrapping */}
        <div 
          ref={containerRef} 
          className="w-full flex justify-center items-start overflow-hidden py-1"
          style={{ 
            height: `${CARD_HEIGHT * scale}px`,
            transition: 'height 0.2s ease'
          }}
        >
          <div
            style={{
              width: `${CARD_WIDTH}px`,
              height: `${CARD_HEIGHT}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              flexShrink: 0
            }}
          >
            {/* FIXED 620x485 PIXEL CANVAS - CAPTURED EXACTLY BY HTML2CANVAS */}
            <div 
              ref={receiptRef} 
              style={{
                width: `${CARD_WIDTH}px`,
                height: `${CARD_HEIGHT}px`,
                backgroundColor: '#FAF5E8',
                border: '3px solid #8C6527',
                borderRadius: '4px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'row',
                position: 'relative',
                boxSizing: 'border-box',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                fontFamily: "'Noto Serif Telugu', 'Ramabhadra', 'Suranna', Georgia, serif",
                WebkitFontSmoothing: 'antialiased'
              }}
            >

              {/* MAIN RECEIPT BODY (620px - 28px filigree = 592px) */}
              <div style={{ width: '586px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                
                {/* TOP BAR (Serial No, రశీదు, తేది) */}
                <div 
                  style={{
                    height: '38px',
                    backgroundColor: '#FAF5E8',
                    borderBottom: '1.5px solid #8C6527',
                    padding: '0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Red Serial Number */}
                  <div 
                    style={{
                      fontSize: '24px',
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
                      fontSize: '16px',
                      fontWeight: 900,
                      color: '#1A1A1A',
                      fontFamily: "'Noto Serif Telugu', 'Ramabhadra', serif",
                      letterSpacing: '0.5px'
                    }}
                  >
                    రశీదు
                  </div>

                  {/* Right "తేది" */}
                  <div 
                    style={{
                      fontSize: '13px',
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
                        borderBottom: '1.2px dotted #333',
                        minWidth: '95px',
                        display: 'inline-block',
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        fontSize: '12px',
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
                    height: '162px',
                    background: 'radial-gradient(ellipse at 75% 50%, #68050E 0%, #460207 65%, #2A0105 100%)',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    position: 'relative',
                    borderBottom: '2px solid #8C6527',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Left: Seated Lord Ganesha Icon */}
                  <div 
                    style={{
                      width: '96px',
                      height: '96px',
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
                        filter: 'drop-shadow(0 2px 6px rgba(255, 215, 0, 0.45))'
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo.png';
                      }}
                    />
                  </div>

                  {/* Header Center / Right Typography */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: 0 }}>
                    
                    {/* Main Heading: వినాయక చవితి */}
                    <h1 
                      style={{
                        margin: 0,
                        fontSize: '26px',
                        fontWeight: 900,
                        color: '#FFFFFF',
                        fontFamily: "'Noto Serif Telugu', 'Ramabhadra', serif",
                        letterSpacing: '0.8px',
                        lineHeight: '1.2',
                        textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,215,0,0.45)'
                      }}
                    >
                      {orgName}
                    </h1>

                    {/* Green Decorative Banner: నవరాత్రుల మహోత్సవములు */}
                    <div 
                      style={{
                        marginTop: '5px',
                        width: '360px',
                        backgroundColor: '#005026',
                        border: '1.5px solid #FFD700',
                        borderRadius: '6px',
                        padding: '3px 12px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                        boxSizing: 'border-box'
                      }}
                    >
                      <span 
                        style={{
                          display: 'block',
                          color: '#FFE87A',
                          fontSize: '14px',
                          fontWeight: 900,
                          fontFamily: "'Noto Serif Telugu', 'Ramabhadra', serif",
                          letterSpacing: '0.5px',
                          lineHeight: '1.2',
                          textShadow: '0 1px 2px rgba(0,0,0,0.9)'
                        }}
                      >
                        {orgSubtitle}
                      </span>
                    </div>

                    {/* Subtitle: రాజోలు - నాగార్జున స్ట్రీట్ */}
                    <div 
                      style={{
                        marginTop: '4px',
                        fontSize: '13.5px',
                        fontWeight: 900,
                        color: '#FFDF6D',
                        fontFamily: "'Noto Serif Telugu', 'Ramabhadra', serif",
                        letterSpacing: '0.4px',
                        textShadow: '0 1px 3px rgba(0,0,0,0.9)'
                      }}
                    >
                      {orgAssociation}
                    </div>

                    {/* Bottom Gold Crest Badge: Wings + TEAM GARUDA */}
                    <div 
                      style={{
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      {/* Left Golden Wing */}
                      <svg width="24" height="13" viewBox="0 0 40 20" fill="#E5C77D">
                        <path d="M40 18 C30 18 15 15 0 0 C12 6 25 10 40 12 Z" opacity="0.9" />
                        <path d="M40 12 C28 12 16 8 5 0 C15 4 28 8 40 8 Z" />
                        <path d="M40 6 C30 6 22 4 12 0 C20 2 30 4 40 4 Z" />
                      </svg>

                      {/* Plaque */}
                      <div 
                        style={{
                          border: '1.2px solid #E5C77D',
                          padding: '1px 12px',
                          borderRadius: '2px',
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          boxShadow: 'inset 0 0 3px rgba(229,199,125,0.3)'
                        }}
                      >
                        <span 
                          style={{
                            fontFamily: "'Cinzel', Georgia, serif",
                            fontWeight: 900,
                            fontSize: '11px',
                            color: '#F4D03F',
                            letterSpacing: '2px',
                            display: 'block',
                            lineHeight: '1.2'
                          }}
                        >
                          TEAM GARUDA
                        </span>
                      </div>

                      {/* Right Golden Wing */}
                      <svg width="24" height="13" viewBox="0 0 40 20" fill="#E5C77D" style={{ transform: 'scaleX(-1)' }}>
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
                    height: '280px',
                    backgroundColor: '#FAF5E8',
                    padding: '14px 18px 12px 18px',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
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
                      width: '150px',
                      height: '150px',
                      opacity: 0.07,
                      pointerEvents: 'none',
                      backgroundImage: `url(${logoUrl})`,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      zIndex: 0
                    }}
                  />

                  {/* Form Row 1: పేరు : ................................ */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', position: 'relative', zIndex: 1, height: '26px' }}>
                    <span 
                      style={{
                        fontSize: '13px',
                        fontWeight: 900,
                        color: '#111111',
                        fontFamily: "'Noto Serif Telugu', 'Ramabhadra', serif",
                        whiteSpace: 'nowrap',
                        width: '55px',
                        flexShrink: 0
                      }}
                    >
                      పేరు :
                    </span>
                    <div 
                      style={{
                        flex: 1,
                        borderBottom: '1.2px dotted #555555',
                        paddingBottom: '1px',
                        paddingLeft: '6px'
                      }}
                    >
                      <span 
                        style={{
                          fontSize: '14px',
                          fontWeight: 900,
                          color: '#0A2560',
                          fontFamily: "'Noto Serif Telugu', 'Ramabhadra', serif",
                          letterSpacing: '0.3px'
                        }}
                      >
                        {nameTelugu}
                      </span>
                    </div>
                  </div>

                  {/* Form Row 2: చిరునామా : ................................ */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', position: 'relative', zIndex: 1, height: '26px' }}>
                    <span 
                      style={{
                        fontSize: '13px',
                        fontWeight: 900,
                        color: '#111111',
                        fontFamily: "'Noto Serif Telugu', 'Ramabhadra', serif",
                        whiteSpace: 'nowrap',
                        width: '90px',
                        flexShrink: 0
                      }}
                    >
                      చిరునామా :
                    </span>
                    <div 
                      style={{
                        flex: 1,
                        borderBottom: '1.2px dotted #555555',
                        paddingBottom: '1px',
                        paddingLeft: '6px'
                      }}
                    >
                      <span 
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          color: '#0A2560',
                          fontFamily: "'Noto Serif Telugu', 'Ramabhadra', serif"
                        }}
                      >
                        {townTelugu}
                      </span>
                    </div>
                  </div>

                  {/* Form Row 3: Blank dotted line for extended address */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', position: 'relative', zIndex: 1, height: '20px' }}>
                    <div 
                      style={{
                        flex: 1,
                        borderBottom: '1.2px dotted #555555',
                        height: '100%',
                        paddingLeft: '6px'
                      }}
                    >
                      <span style={{ fontSize: '11px', color: '#555555', fontStyle: 'italic' }}>
                        {contribution.notes && contribution.notes !== rawTown ? contribution.notes : ''}
                      </span>
                    </div>
                  </div>

                  {/* Form Row 4: ఫోన్ నెం : ................................ */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', position: 'relative', zIndex: 1, height: '26px' }}>
                    <span 
                      style={{
                        fontSize: '13px',
                        fontWeight: 900,
                        color: '#111111',
                        fontFamily: "'Noto Serif Telugu', 'Ramabhadra', serif",
                        whiteSpace: 'nowrap',
                        width: '80px',
                        flexShrink: 0
                      }}
                    >
                      ఫోన్ నెం :
                    </span>
                    <div 
                      style={{
                        flex: 1,
                        borderBottom: '1.2px dotted #555555',
                        paddingBottom: '1px',
                        paddingLeft: '6px'
                      }}
                    >
                      <span 
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          color: '#0A2560',
                          fontFamily: 'monospace',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {rawPhone || '—'}
                      </span>
                    </div>
                  </div>

                  {/* Form Row 5: ఇతర వివరాలు : అక్షరాలా Telugu words */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', position: 'relative', zIndex: 1, height: '26px' }}>
                    <span 
                      style={{
                        fontSize: '13px',
                        fontWeight: 900,
                        color: '#111111',
                        fontFamily: "'Noto Serif Telugu', 'Ramabhadra', serif",
                        whiteSpace: 'nowrap',
                        width: '105px',
                        flexShrink: 0
                      }}
                    >
                      ఇతర వివరాలు :
                    </span>
                    <div 
                      style={{
                        flex: 1,
                        borderBottom: '1.2px dotted #555555',
                        paddingBottom: '1px',
                        paddingLeft: '6px'
                      }}
                    >
                      <span 
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#222222',
                          fontFamily: "'Noto Serif Telugu', 'Ramabhadra', serif"
                        }}
                      >
                        {amountInTeluguWords} ({paymentTelugu})
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
                      zIndex: 1,
                      height: '32px'
                    }}
                  >
                    {/* Left: రశీదు నెం */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', flexShrink: 0 }}>
                      <span 
                        style={{
                          fontSize: '13px',
                          fontWeight: 900,
                          color: '#111111',
                          fontFamily: "'Noto Serif Telugu', 'Ramabhadra', serif",
                          whiteSpace: 'nowrap'
                        }}
                      >
                        రశీదు నెం :
                      </span>
                      <span 
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 900,
                          fontSize: '12px',
                          color: '#B31414'
                        }}
                      >
                        #{receiptPrefix}-{displayId}
                      </span>
                    </div>

                    {/* Center-Left: రూ. Amount in Telugu & figures */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flex: 1, marginLeft: '16px', marginRight: '20px' }}>
                      <span 
                        style={{
                          fontSize: '13.5px',
                          fontWeight: 900,
                          color: '#111111',
                          fontFamily: "'Noto Serif Telugu', 'Ramabhadra', serif",
                          flexShrink: 0
                        }}
                      >
                        రూ.
                      </span>
                      <div 
                        style={{
                          borderBottom: '1.2px dotted #555555',
                          flex: 1,
                          paddingBottom: '1px',
                          paddingLeft: '6px'
                        }}
                      >
                        <span 
                          style={{
                            fontSize: '15px',
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
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '100px', flexShrink: 0 }}>
                      <div style={{ height: '14px', display: 'flex', alignItems: 'center' }}>
                        {collectedByTelugu && (
                          <span style={{ fontSize: '9.5px', color: '#0A2560', fontWeight: 800, fontFamily: "'Noto Serif Telugu', serif" }}>
                            {collectedByTelugu}
                          </span>
                        )}
                      </div>
                      <span 
                        style={{
                          fontSize: '13px',
                          fontWeight: 900,
                          color: '#111111',
                          fontFamily: "'Noto Serif Telugu', 'Ramabhadra', serif",
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {signatureTitle}
                      </span>
                    </div>

                  </div>

                </div>

              </div>

              {/* RIGHT ORNATE FLORAL FILIGREE BORDER STRIP (34px) */}
              <div 
                style={{
                  width: '34px',
                  backgroundColor: '#1E0E08',
                  borderLeft: '1.5px solid #8C6527',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  padding: '8px 0',
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
                    {/* Golden 8-petal mandala flower */}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="#E5C77D">
                      <circle cx="12" cy="12" r="3" fill="#FFE066" />
                      <path d="M12 2 C13 5 15 7 18 6 C17 9 19 11 22 12 C19 13 17 15 18 18 C15 17 13 19 12 22 C11 19 9 17 6 18 C7 15 5 13 2 12 C5 11 7 9 6 6 C9 7 11 5 12 2 Z" opacity="0.95" />
                    </svg>
                    {/* Small gold bead divider */}
                    <div style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#C99A4A' }} />
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 shrink-0 pt-1 w-full">
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
