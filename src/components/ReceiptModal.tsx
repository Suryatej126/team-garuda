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
  
  // Transliteration dictionary for custom names/cities
  const dict: Record<string, string> = {
    'surya': 'సూర్య',
    'surya teja': 'సూర్య తేజ',
    'suryateja': 'సూర్య తేజ',
    'razole': 'రాజోలు',
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
    'satyababu': 'సత్యబాబు'
  };

  if (dict[clean]) return dict[clean];

  // Word-by-word fallback matching
  const words = clean.split(/\s+/);
  const translatedWords = words.map(w => {
    if (dict[w]) return dict[w];
    return w.charAt(0).toUpperCase() + w.slice(1); // Keep as capitalized English if not found
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
            scale: 2,
            useCORS: true,
            backgroundColor: '#FAF7F2'
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
      }, 600); // 600ms delay to ensure the DOM is fully loaded and fonts are rendered
      return () => clearTimeout(timer);
    }
  }, [isOpen, contribution, settings, receiptRef]);

  if (!isOpen || !contribution) return null;

  // Map values robustly from either Chandha or Contribution shape
  const id = contribution.id;
  const displayId = receiptNumber !== undefined ? receiptNumber : id;
  const amount = Number(contribution.amount);
  const date = contribution.date;
  const paymentMethod = contribution.payment_method;
  const collectedBy = contribution.collected_by || 'N/A';

  // Get raw values for PDF rendering (high compatibility) and translated for UI/WhatsApp
  const rawName = contribution.donor_name || contribution.contributor?.name || 'Anonymous';
  const rawTown = contribution.donor_phone ? (contribution as any).notes || 'Razole' : 'Razole';

  const name = englishToTelugu(rawName);
  const town = englishToTelugu(rawTown);


  // Organization branding fallback values
  const orgName = settings?.org_name || 'వినాయక చవితి';
  const orgSubtitle = settings?.org_subtitle || 'నవరాత్రుల మహోత్సవములు';
  const orgAssociation = settings?.org_association || 'శ్రీ బాల బాలాజీ యువజన సంఘం';
  const receiptPrefix = (settings?.receipt_prefix || 'TG-CH').trim().replace(/-+$/, '');
  const defaultPurpose = settings?.default_purpose || 'Ganapathi Utsav Contributions';
  const signatureTitle = settings?.signature_title || 'Signature of Authorized Person';
  const logoUrl = settings?.logo_url || '/logo.png';

  // Helper to convert number to English Words
  const numberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if ((num = Math.floor(num)) === 0) return 'Zero';
    
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
        scale: 2,
        useCORS: true,
        backgroundColor: '#FAF7F2'
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
            text: `🚩 *${orgName}* - Official Receipt #${receiptPrefix}-${displayId}`
          });
          setShareSuccessMessage('✓ Shared Successfully!');
          setTimeout(() => setShareSuccessMessage(''), 3000);
          return;
        } catch (shareErr: any) {
          console.log('Native share error:', shareErr);
          // If the user cancelled/aborted, do not proceed with fallback download
          if (shareErr.name === 'AbortError') {
            return;
          }
        }
      }

      // Desktop/Unsupported Mobile Fallback: Copy to clipboard and download image
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
    const cleanPhone = phone.replace(/\D/g, ''); // keep digits only
    if (cleanPhone.length === 10) {
      return `91${cleanPhone}`;
    }
    return cleanPhone;
  };

  // Generate and Share via WhatsApp Click-to-Chat (Text version)
  const handleShareWhatsApp = () => {
    const message = `🚩 *${orgName} ${orgSubtitle}* 🚩\n` +
      `*${orgAssociation}*\n\n` +
      `*OFFICIAL DONATION RECEIPT*\n` +
      `---------------------------------------\n` +
      `*Receipt No:* #${receiptPrefix}-${displayId}\n` +
      `*Date:* ${date}\n` +
      `*Received with thanks from:* ${rawName}\n` +
      `*Town / Village:* ${rawTown}\n` +
      `*Sum of Rupees:* ${amountInWords}\n` +
      `*Donation Amount:* ₹${amount.toLocaleString('en-IN')}/-\n` +
      `*Payment Mode:* ${paymentMethod}\n` +
      `*Collected By:* ${collectedBy}\n` +
      `---------------------------------------\n` +
      `Thank you for your generous contribution! Your support is highly appreciated. 🙏\n\n` +
      `_This is a digitally generated official receipt._`;

    const donorPhone = contribution.donor_phone || contribution.contributor?.phone || '';
    const cleanedPhone = formatWhatsAppPhone(donorPhone);
    const shareUrl = cleanedPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    // Device-specific routing for popup blocker bypass
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = shareUrl;
    } else {
      const newWindow = window.open(shareUrl, '_blank');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Fallback for desktop popup blockers
        window.location.href = shareUrl;
      }
    }
  };

  // Generate and Download PDF using jsPDF (A5 Portrait style)
  const handleDownloadPDF = () => {
    setPdfGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5' // A5 is perfect for printable receipts
      });

      const pgW = 148;
      const pgH = 210;

      // Draw red/pink outer double borders
      doc.setDrawColor(196, 30, 58); // Maroon
      doc.setLineWidth(1.2);
      doc.rect(5, 5, pgW - 10, pgH - 10);

      doc.setDrawColor(201, 154, 74); // Gold
      doc.setLineWidth(0.4);
      doc.rect(6.5, 6.5, pgW - 13, pgH - 13);

      // Pink header block
      doc.setFillColor(196, 30, 58);
      doc.rect(7, 7, pgW - 14, 34, 'F');

      // Green banner block under header
      doc.setFillColor(0, 90, 54);
      doc.rect(7, 41, pgW - 14, 8, 'F');

      // Draw vertical gold border lines on the right side to match mockup
      doc.setDrawColor(201, 154, 74);
      doc.setLineWidth(1.5);
      doc.line(pgW - 10, 7, pgW - 10, pgH - 7);

      // Load Logo
      const img = new Image();
      img.src = logoUrl;
      img.onload = () => {
        try {
          doc.addImage(img, 'PNG', 12, 11, 24, 24);
        } catch (e) {
          console.error("Failed to add image to PDF", e);
        }
        continueGeneratingPDF();
      };
      img.onerror = () => {
        continueGeneratingPDF();
      };

      const continueGeneratingPDF = () => {
        // Render Header Texts (English fallback if Telugu fails, but standard fonts will render basic text.
        // We will output clean bilingual text where possible)
        doc.setTextColor(255, 255, 255);
        doc.setFont('times', 'bold');
        doc.setFontSize(20);
        doc.text(orgName, pgW / 2 + 10, 18, { align: 'center' });

        doc.setFontSize(11);
        doc.setFont('times', 'italic');
        doc.text(orgSubtitle, pgW / 2 + 10, 26, { align: 'center' });

        // Yellow text on green banner
        doc.setTextColor(244, 196, 48); // Gold Yellow
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(orgAssociation, pgW / 2, 46.5, { align: 'center' });

        // Body Labels in English (Standard High-Compatibility Layout)
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.text(`Receipt No: #${receiptPrefix}-${displayId}`, 15, 62);
        doc.text(`Date: ${date}`, pgW - 18, 62, { align: 'right' });

        // Details lines
        const drawFieldLine = (label: string, value: string, y: number) => {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(80, 80, 80);
          doc.text(label, 15, y);

          doc.setFont('times', 'italic');
          doc.setFontSize(11);
          doc.setTextColor(30, 41, 99); // Navy blue for value
          doc.text(value, 58, y);

          // Divider dots
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.2);
          doc.line(58, y + 1.5, pgW - 18, y + 1.5);
          doc.setFontSize(9.5);
        };

        drawFieldLine('Received with thanks from:', rawName, 76);
        drawFieldLine('Town / Village:', rawTown, 88);
        drawFieldLine('Sum of Rupees:', amountInWords, 100);
        drawFieldLine('On account of:', defaultPurpose, 112);
        drawFieldLine('Payment Mode:', paymentMethod, 124);

        // Large bold Amount Box
        doc.setFillColor(250, 247, 242);
        doc.setDrawColor(201, 154, 74);
        doc.setLineWidth(0.5);
        doc.roundedRect(15, 136, pgW - 30, 14, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(196, 30, 58); // Maroon
        doc.text(`Donation Amount:   Rs. ${amount.toLocaleString('en-IN')}/-`, pgW / 2, 145, { align: 'center' });

        // Verified Circle Stamp
        doc.setDrawColor(196, 30, 58);
        doc.setLineWidth(0.5);
        doc.circle(40, 172, 12);
        
        doc.setFont('times', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(196, 30, 58);
        doc.text('TEAM GARUDA', 40, 169.5, { align: 'center' });
        doc.setFontSize(6.5);
        doc.text('VERIFIED', 40, 173, { align: 'center' });
        doc.setFontSize(5);
        doc.text('OFFICIAL RECORD', 40, 176, { align: 'center' });

        // Signature lines
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const signatureText = collectedBy && collectedBy !== 'N/A' ? `Signature of ${collectedBy}` : signatureTitle;
        doc.text(signatureText, pgW - 18, 180, { align: 'right' });
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.2);
        doc.line(pgW - 60, 176, pgW - 18, 176);

        // Save PDF
        doc.save(`Receipt_${receiptPrefix}_${displayId}.pdf`);
        setPdfGenerating(false);
      };
    } catch (e) {
      console.error('Error generating PDF:', e);
      alert('Failed to generate PDF receipt.');
      setPdfGenerating(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Receipt Preview"
    >
      <div className="flex flex-col gap-5 select-text pb-4">
        
        {/* Visual Receipt Card layout matching the custom Telugu mockup */}
        <div 
          ref={receiptRef} 
          style={{
            width: '100%',
            maxWidth: '380px',
            margin: '0 auto',
            backgroundColor: '#FAF7F2',
            border: '3px solid #C99A4A',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            boxSizing: 'border-box',
            paddingRight: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
          }}
        >
          
          {/* Filigree right border graphic */}
          <div 
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '10px',
              background: 'linear-gradient(to bottom, rgba(201, 154, 74, 0.4), rgba(201, 154, 74, 0.2))',
              borderLeft: '1px solid rgba(201, 154, 74, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '8px 0',
              boxSizing: 'border-box',
              zIndex: 2
            }}
          >
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: '#C99A4A'
                }} 
              />
            ))}
          </div>

          {/* Ganesha Watermark Background */}
          <div 
            style={{
              position: 'absolute',
              left: '50%',
              top: '55%',
              transform: 'translate(-50%, -50%)',
              width: '180px',
              height: '180px',
              opacity: 0.05,
              pointerEvents: 'none',
              backgroundImage: `url(${logoUrl})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              zIndex: 0
            }}
          />

          {/* Pink Header Block */}
          <div 
            style={{
              backgroundColor: '#C41E3A',
              padding: '16px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              borderBottom: '1.5px solid #C99A4A',
              boxSizing: 'border-box',
              zIndex: 1
            }}
          >
            <img 
              src={logoUrl} 
              alt="Logo" 
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '1.5px solid #FFD700',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                objectFit: 'contain',
                flexShrink: 0
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <h1 
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  fontFamily: 'Georgia, serif',
                  letterSpacing: '0.5px',
                  lineHeight: '1.3',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                {orgName}
              </h1>
              <p 
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '10px',
                  color: '#FFD700',
                  fontStyle: 'italic',
                  fontFamily: 'Georgia, serif',
                  lineHeight: '1.3'
                }}
              >
                {orgSubtitle}
              </p>
            </div>
          </div>

          {/* Green Association Banner */}
          <div 
            style={{
              backgroundColor: '#005A36',
              padding: '6px 16px',
              borderBottom: '1px solid rgba(201, 154, 74, 0.4)',
              textAlign: 'center',
              boxSizing: 'border-box',
              zIndex: 1
            }}
          >
            <h2 
              style={{
                margin: 0,
                fontSize: '11px',
                fontWeight: 900,
                color: '#FFD700',
                letterSpacing: '1px',
                fontFamily: 'Georgia, serif',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              {orgAssociation}
            </h2>
          </div>

          {/* Inner Golden Border Box (Glassmorphic) */}
          <div 
            style={{
              margin: '10px 12px 14px 12px',
              border: '1px dashed rgba(201, 154, 74, 0.65)',
              borderRadius: '12px',
              padding: '14px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(6px)',
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxSizing: 'border-box',
              boxShadow: 'inset 0 0 20px rgba(201, 154, 74, 0.02)'
            }}
          >
            
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '10px',
                color: '#9A7B44',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.8px'
              }}
            >
              <span>Receipt No: <span style={{ fontFamily: 'monospace', color: '#111111', fontSize: '11px', fontWeight: 'bold' }}>#{receiptPrefix}-{displayId}</span></span>
              <span>Date: <span style={{ fontFamily: 'monospace', color: '#111111', fontSize: '11px', fontWeight: 'bold' }}>{date}</span></span>
            </div>

            <hr style={{ border: 0, borderTop: '1px solid rgba(201,154,74,0.2)', margin: 0 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontSize: '9px', color: '#9A7B44', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Received with thanks from:</span>
                <span 
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    fontWeight: 900,
                    color: '#1e3a8a',
                    fontSize: '13px',
                    letterSpacing: '0.5px',
                    backgroundColor: 'rgba(219, 234, 254, 0.45)',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(30, 58, 138, 0.15)',
                    display: 'block'
                  }}
                >
                  {name}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontSize: '9px', color: '#9A7B44', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Town / Village:</span>
                <span 
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    fontWeight: 'bold',
                    color: '#1e3a8a',
                    fontSize: '12px',
                    letterSpacing: '0.5px',
                    backgroundColor: 'rgba(219, 234, 254, 0.45)',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(30, 58, 138, 0.15)',
                    display: 'block'
                  }}
                >
                  {town}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontSize: '9px', color: '#9A7B44', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Sum of Rupees:</span>
                <span 
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#111111',
                    backgroundColor: '#FFFFFF',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(201,154,74,0.15)',
                    display: 'block'
                  }}
                >
                  {amountInWords}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{ fontSize: '9px', color: '#9A7B44', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Payment Mode:</span>
                  <span 
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '9px',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      backgroundColor: '#FAF7F2',
                      border: '1px solid rgba(201,154,74,0.2)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      width: 'fit-content',
                      display: 'block'
                    }}
                  >
                    {paymentMethod}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{ fontSize: '9px', color: '#9A7B44', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Collected By:</span>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#111111', display: 'block' }}>
                    {collectedBy}
                  </span>
                </div>
              </div>
            </div>

            {/* Figures Amount Box */}
            <div 
              style={{
                backgroundColor: 'rgba(201, 154, 74, 0.07)',
                border: '1.5px solid #C99A4A',
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '10px',
                boxShadow: '0 2px 4px rgba(201,154,74,0.05)',
                boxSizing: 'border-box'
              }}
            >
              <span style={{ fontSize: '9px', fontWeight: 900, color: '#9A7B44', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Amount:</span>
              <span style={{ fontSize: '14px', fontWeight: 900, color: '#C41E3A', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                ₹{amount.toLocaleString('en-IN')}/-
              </span>
            </div>

            {/* Stamp and signature placeholders */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
              {/* Seal stamp */}
              <div 
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  border: '2px dashed #C41E3A',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#C41E3A',
                  fontFamily: 'serif',
                  transform: 'rotate(-10deg)',
                  marginLeft: '8px',
                  userSelect: 'none',
                  flexShrink: 0,
                  opacity: 0.85,
                  boxSizing: 'border-box',
                  backgroundColor: 'rgba(196, 30, 58, 0.03)',
                  boxShadow: '0 0 8px rgba(196, 30, 58, 0.05)'
                }}
              >
                <span style={{ fontSize: '5.5px', fontWeight: 900, letterSpacing: '0.6px' }}>TEAM GARUDA</span>
                <CheckCircle2 style={{ width: '15px', height: '15px', margin: '2px 0', color: '#005A36' }} />
                <span style={{ fontSize: '5.5px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>VERIFIED</span>
              </div>

              {/* Signature label */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ width: '120px', borderBottom: '1px solid rgba(0,0,0,0.15)', height: '24px' }} />
                <span 
                  style={{
                    fontSize: '8px',
                    color: '#666666',
                    fontWeight: 900,
                    marginTop: '4px',
                    textAlign: 'right',
                    maxWidth: '150px',
                    lineHeight: '1.2'
                  }}
                >
                  {collectedBy && collectedBy !== 'N/A' ? `Signature of ${collectedBy}` : signatureTitle}
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 shrink-0">
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
                ? 'Preparing Receipt Image...' 
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
              <span>{pdfGenerating ? 'Generating...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>

      </div>
    </BottomSheet>
  );
};
